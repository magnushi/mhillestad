// Turns Sanity block content into the terminal's output markup, at build time.
// The result is plain HTML held in a JS object, so the terminal stays instant
// and offline — no runtime request to Sanity.

import type { BodyBlock, InvestmentGroup, TextBlock, InvestmentTable } from './sanity';

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

/** Render a command or page body to an HTML string. */
export function renderBody(body: BodyBlock[] | undefined, groups: InvestmentGroup[]): string {
  if (!body?.length) return '';
  return body
    .map((block) =>
      block._type === 'investmentTable'
        ? renderInvestmentTable(block, groups)
        : renderTextBlock(block as TextBlock),
    )
    .join('\n');
}
