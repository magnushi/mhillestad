// Builds the terminal's command lookup table. Shared by the live page and the
// draft preview so the two can never render differently.

import { renderBody } from './render';
import type { SiteContent } from './sanity';

export function buildOutputs(content: SiteContent): Record<string, string> {
  const groups = content.homepage?.investmentGroups ?? [];
  const outputs: Record<string, string> = {};

  // Every command is runnable, listed or not — so an unlisted command still
  // works when typed rather than silently not existing.
  for (const c of content.commands) {
    const html = renderBody(c.body, groups);
    outputs[c.name] = html;
    for (const alias of c.aliases ?? []) outputs[alias] = html;
  }

  // `help` is generated from the homepage's ordered array, so its sequence is
  // whatever was dragged in the Studio.
  const rows = (content.homepage?.listedCommands ?? [])
    .map(
      (c) =>
        `  <button class="cmd" data-cmd="${c.name}">${c.name}</button>\t${c.description ?? ''}`,
    )
    .join('\n');
  outputs.help = `available commands:\n\n${rows}\n  <button class="cmd" data-cmd="clear">clear</button>\tclear the screen`;
  outputs.ls = outputs.help;

  return outputs;
}
