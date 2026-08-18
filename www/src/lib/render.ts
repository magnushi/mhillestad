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
  TextBlock,
  InvestmentTable,
} from './sanity';

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
  // `books` arrives sorted by author from the query.
  const rows = books
    .map((b) => {
      const title = escapeHtml(b.title);
      const linked = b.url
        ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener">${title}</a>`
        : title;
      const by = [b.author, b.year].filter(Boolean).join(', ');
      const note =
        block.showNotes && b.note
          ? `<tr><td></td><td class="dim note">${escapeHtml(b.note)}</td></tr>`
          : '';
      return `<tr><td>${linked}</td><td class="dim">${escapeHtml(by)}</td></tr>${note}`;
    })
    .join('');
  if (!rows) {
    console.warn('Reading list has no books; skipping.');
    return '';
  }
  return `<table class="inv books">${rows}</table>`;
}

/** Render a command or page body to an HTML string. */
export function renderBody(
  body: BodyBlock[] | undefined,
  groups: InvestmentGroup[],
  entries: Entry[],
  books: Book[],
): string {
  if (!body?.length) return '';
  return body
    .map((block) => {
      if (block._type === 'investmentTable') return renderInvestmentTable(block, groups);
      if (block._type === 'entryList') return renderEntryList(block, entries);
      if (block._type === 'bookList') return renderBookList(block, books);
      return renderTextBlock(block as TextBlock);
    })
    .join('\n');
}
