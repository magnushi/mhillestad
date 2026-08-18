// Turns the homepage's command registry into what the terminal needs. Shared by
// the live page and the draft preview so the two can never render differently.

import { renderBody } from './render';
import type { BodyBlock, EntryKind, SiteContent } from './sanity';

export interface TerminalData {
  /** Command (and alias) name -> rendered HTML, for text commands. */
  outputs: Record<string, string>;
  /** Command (and alias) name -> the builtin it runs, plus any config it needs. */
  builtins: Record<string, { id: string; url?: string }>;
  notFoundMessage: string;
}

const DEFAULT_NOT_FOUND = 'command not found: {cmd} — try `help`';

// Flags that narrow a listing to one kind, e.g. `blog -talks`. Any command
// whose body prints a blog listing gets these for free — they are generated
// here rather than authored, so a new command with a listing in it cannot
// forget them, and they never need a document of their own.
//
// They stay out of `help` because help is built from the homepage registry,
// and these are not registry entries. Hidden, but typeable.
const KIND_FLAGS: Record<string, EntryKind> = {
  '-post': 'post',
  '-posts': 'post',
  '-blog': 'post',
  '-blogs': 'post',
  '-writing': 'post',
  '-talk': 'talk',
  '-talks': 'talk',
  '-video': 'talk',
  '-videos': 'talk',
  '-press': 'press',
  '-interview': 'press',
  '-interviews': 'press',
};

/** Force every blog listing in a body to one kind, for a `-flag` variant. */
function bodyForKind(body: BodyBlock[], kind: EntryKind): BodyBlock[] {
  return body.map((block) => (block._type === 'entryList' ? { ...block, kind } : block));
}

export function buildTerminalData(content: SiteContent): TerminalData {
  const groups = content.homepage?.investmentGroups ?? [];
  const slots = content.homepage?.commands ?? [];
  const entries = content.entries ?? [];
  const books = content.books ?? [];

  const outputs: Record<string, string> = {};
  const builtins: Record<string, { id: string; url?: string }> = {};

  for (const { command } of slots) {
    const names = [command.name, ...(command.aliases ?? [])];
    if (command.kind === 'builtin') {
      if (!command.builtinId) {
        // A builtin with nothing wired to it would silently do nothing.
        console.warn(`Command "${command.name}" is a builtin with no builtinId; skipping.`);
        continue;
      }
      for (const n of names) builtins[n] = { id: command.builtinId, url: command.url };
    } else {
      const html = renderBody(command.body, groups, entries, books);
      for (const n of names) outputs[n] = html;

      // `blog -talks` and friends, for any command that prints a listing.
      const body = command.body ?? [];
      if (body.some((block) => block._type === 'entryList')) {
        for (const [flag, kind] of Object.entries(KIND_FLAGS)) {
          const filtered = renderBody(bodyForKind(body, kind), groups, entries, books);
          for (const n of names) outputs[`${n} ${flag}`] = filtered;
        }
      }
    }
  }

  // The help listing is the registry filtered to the advertised entries, in the
  // order they were dragged. `help` itself is generated, not authored.
  const intro = content.settings?.helpIntro ?? 'available commands:';
  const rows = slots
    .filter((s) => s.listed)
    .map(
      ({ command }) =>
        `  <button class="cmd" data-cmd="${command.name}">${command.name}</button>\t${command.description ?? ''}`,
    )
    .join('\n');
  outputs.help = `${intro}\n\n${rows}`;

  // Any alias of the help builtin should print the same thing.
  for (const [name, b] of Object.entries(builtins)) {
    if (b.id === 'help') outputs[name] = outputs.help;
  }

  return {
    outputs,
    builtins,
    notFoundMessage: content.settings?.notFoundMessage ?? DEFAULT_NOT_FOUND,
  };
}
