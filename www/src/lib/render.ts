// Turns Sanity block content into the terminal's output markup, at build time.
// The result is plain HTML held in a JS object, so the terminal stays instant
// and offline — no runtime request to Sanity.

import type {
  BodyBlock,
  Book,
  BookList,
  Entry,
  EntryList,
  InvestmentGroup,
  Podcast,
  PodcastList,
  TextBlock,
  InvestmentTable,
} from './sanity';

/**
 * Everything a body might need to print. Passed as one object rather than a
 * growing parameter list, so adding a new kind of listing does not mean editing
 * every call site again.
 */
export interface RenderContext {
  groups: InvestmentGroup[];
  entries: Entry[];
  books: Book[];
  podcasts: Podcast[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Strip scheme and trailing slash, the way the old hardcoded table did. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function renderTextBlock(block: TextBlock): string {
  const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
  return (block.children ?? [])
    .map((span) => {
      const text = escapeHtml(span.text ?? '');
      const def = (span.marks ?? []).map((m) => defs.get(m)).find(Boolean);
      if (def?._type === 'terminalLink' && def.href) {
        return `<a href="${escapeHtml(def.href)}" target="_blank" rel="noopener">${text}</a>`;
      }
      if (def?._type === 'runCommand' && def.command) {
        // Wired up by delegation in the page script, so markup stays inert.
        return `<button class="cmd" data-cmd="${escapeHtml(def.command)}">${text}</button>`;
      }
      return text;
    })
    .join('');
}

function renderInvestmentTable(block: InvestmentTable, groups: InvestmentGroup[]): string {
  const group = groups.find((g) => g.key === block.group);
  if (!group) {
    // An editor renamed or deleted a group but left the block behind. Say so in
    // the build rather than printing an empty table nobody notices.
    console.warn(`No investment group "${block.group}" on the homepage; skipping table.`);
    return '';
  }
  const rows = (group.investments ?? [])
    .map(
      (i) =>
        `<tr><td><a href="${escapeHtml(i.url)}" target="_blank" rel="noopener">` +
        `${escapeHtml(i.name)}</a></td>` +
        `<td class="dim">${escapeHtml(displayUrl(i.url))}</td></tr>`,
    )
    .join('');
  const heading = group.heading ? `${escapeHtml(group.heading)}\n` : '';
  return `${heading}<table class="inv">${rows}</table>`;
}

function renderEntryList(block: EntryList, entries: Entry[]): string {
  // `entries` arrives sorted newest first from the query, so this only filters.
  const rows = entries
    .filter((e) => !block.kind || e.kind === block.kind)
    .slice(0, block.limit && block.limit > 0 ? block.limit : undefined)
    .map((e) => {
      // Posts written here stay in the terminal; external ones open a new tab.
      const href = e.url ?? e.path ?? '';
      const target = e.url ? ' target="_blank" rel="noopener"' : '';
      return (
        `<tr><td class="dim">${escapeHtml(e.date)}</td>` +
        `<td class="dim">${escapeHtml(e.kind)}</td>` +
        `<td><a href="${escapeHtml(href)}"${target}>${escapeHtml(e.title)}</a></td>` +
        `<td class="dim">${escapeHtml(e.outlet ?? '')}</td></tr>`
      );
    })
    .join('');
  if (!rows) {
    console.warn(`Blog listing matched no entries (kind: ${block.kind ?? 'any'}).`);
    return '';
  }
  return `<table class="inv entries">${rows}</table>`;
}

function renderBookList(block: BookList, books: Book[]): string {
  // `books` arrives sorted by author, already filtered to the ones switched on
  // for the site — so this only narrows by category.
  const rows = books
    .filter((b) => !block.category || b.category === block.category)
    .map((b) => {
      const title = escapeHtml(b.title);
      const linked = b.url
        ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${title}</a>`
        : title;
      const by = [b.author, b.year].filter(Boolean).join(', ');
      // "non-fiction" reads better than the stored "nonfiction".
      const cat = b.category === 'nonfiction' ? 'non-fiction' : (b.category ?? '');
      const note =
        block.showNotes && b.note
          ? `<tr><td></td><td class="dim note" colspan="2">${escapeHtml(b.note)}</td></tr>`
          : '';
      return (
        `<tr><td>${linked}</td><td class="dim">${escapeHtml(by)}</td>` +
        `<td class="dim">${escapeHtml(cat)}</td></tr>${note}`
      );
    })
    .join('');
  if (!rows) {
    console.warn(`Reading list matched no books (category: ${block.category ?? 'any'}).`);
    return '';
  }
  return `<table class="inv books">${rows}</table>`;
}

function renderPodcastList(block: PodcastList, podcasts: Podcast[]): string {
  // `podcasts` arrives sorted by title from the query.
  const rows = podcasts
    .map((p) => {
      const title = escapeHtml(p.title);
      const linked = p.url
        ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${title}</a>`
        : title;
      const note =
        block.showNotes && p.note
          ? `<tr><td></td><td class="dim note">${escapeHtml(p.note)}</td></tr>`
          : '';
      return `<tr><td>${linked}</td><td class="dim">${escapeHtml(p.host ?? '')}</td></tr>${note}`;
    })
    .join('');
  if (!rows) {
    console.warn('Podcast list has no podcasts; skipping.');
    return '';
  }
  return `<table class="inv podcasts">${rows}</table>`;
}

/** Render a command or page body to an HTML string. */
export function renderBody(body: BodyBlock[] | undefined, ctx: RenderContext): string {
  if (!body?.length) return '';
  return body
    .map((block) => {
      if (block._type === 'investmentTable') return renderInvestmentTable(block, ctx.groups);
      if (block._type === 'entryList') return renderEntryList(block, ctx.entries);
      if (block._type === 'bookList') return renderBookList(block, ctx.books);
      if (block._type === 'podcastList') return renderPodcastList(block, ctx.podcasts);
      return renderTextBlock(block as TextBlock);
    })
    .join('\n');
}
