// Content lives in Sanity project 301op25o, dataset `production`, which is
// public — so the build reads it with no token. Nothing here is secret, and
// nothing needs to be configured on Netlify.
//
// Deliberately the uncached endpoint (api, not apicdn): the Sanity webhook
// fires the moment something is published and Netlify starts building seconds
// later, which is inside the CDN's propagation window. Building off apicdn
// reproducibly baked the previous version of a reorder. This is one query per
// build, so paying ~300ms for a guaranteed-fresh read is the right trade.

export const PROJECT_ID = '301op25o';
export const DATASET = 'production';
export const API_VERSION = 'v2021-06-07';

export interface Span {
  _type: 'span';
  _key?: string;
  text: string;
  marks?: string[];
}

export interface MarkDef {
  _type: 'terminalLink' | 'runCommand';
  _key: string;
  href?: string;
  command?: string;
}

export interface TextBlock {
  _type: 'block';
  _key?: string;
  children?: Span[];
  markDefs?: MarkDef[];
}

export interface InvestmentTable {
  _type: 'investmentTable';
  _key?: string;
  /** Matches the `key` of an investment group on the homepage document. */
  group: string;
}

export type BodyBlock = TextBlock | InvestmentTable;

export interface Command {
  name: string;
  aliases?: string[];
  description?: string;
  /** `builtin` commands run code in the site; `content` commands print `body`. */
  kind?: 'content' | 'builtin';
  builtinId?: string;
  /** Target for the `open` builtin. */
  url?: string;
  body?: BodyBlock[];
}

/** A command as the homepage places it: in order, and advertised or hidden. */
export interface CommandSlot {
  listed: boolean;
  command: Command;
}

export interface Investment {
  name: string;
  url: string;
}

/** A named, ordered list of investments, as arranged on the homepage. */
export interface InvestmentGroup {
  key: string;
  heading?: string;
  investments?: Investment[];
}

export interface LandingPage {
  title: string;
  slug: string;
  metaDescription?: string;
  body?: BodyBlock[];
}

export interface SiteSettings {
  siteTitle: string;
  metaDescription?: string;
  prompt: string;
  helpIntro?: string;
  notFoundMessage?: string;
  backLinkLabel?: string;
}

/** The homepage document: the command registry, plus investment grouping. */
export interface Homepage {
  metaDescription?: string;
  bootCommand?: string;
  /**
   * Every command the site has, in help order, each flagged listed or hidden.
   * This array is the whole command surface — nothing outside it exists.
   */
  commands: CommandSlot[];
  investmentGroups: InvestmentGroup[];
}

export interface SiteContent {
  settings: SiteSettings | null;
  homepage: Homepage | null;
  pages: LandingPage[];
}

// Ordering lives in the homepage's reference arrays, so the projections below
// resolve those references in place rather than sorting by a field. Sanity
// preserves array order, which is exactly the order dragged in the Studio.
const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    siteTitle, metaDescription, prompt, helpIntro, notFoundMessage, backLinkLabel
  },
  "homepage": *[_type == "homepage"][0]{
    metaDescription,
    "bootCommand": bootCommand->name,
    "commands": commands[]{
      "listed": coalesce(listed, true),
      "command": command->{name, aliases, description, kind, builtinId, url, body}
    },
    "investmentGroups": investmentGroups[]{
      key,
      heading,
      "investments": investments[]->{name, url}
    }
  },
  "pages": *[_type == "landingPage" && defined(slug.current)]{
    title, "slug": slug.current, metaDescription, body
  }
}`;

/**
 * Fetch site content.
 *
 * `drafts` switches to unpublished content and requires a token — drafts are
 * not public even though this dataset is (verified: 0 drafts visible without
 * one). Only the preview routes pass it, and only server-side.
 */
export async function getSiteContent(
  opts: { perspective?: 'published' | 'drafts'; token?: string } = {},
): Promise<SiteContent> {
  const params = new URLSearchParams({ query: QUERY });
  if (opts.perspective === 'drafts') params.set('perspective', 'drafts');

  const url =
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}` +
    `?${params.toString()}`;

  const res = await fetch(url, {
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Sanity query failed (${res.status}). Cannot build without content.`);
  }
  const { result } = (await res.json()) as { result: SiteContent };
  const homepage = result?.homepage
    ? {
        ...result.homepage,
        // A slot whose reference was deleted resolves to null; drop those
        // rather than crashing the build on someone else's tidy-up.
        commands: (result.homepage.commands ?? []).filter((s) => s?.command?.name),
        investmentGroups: (result.homepage.investmentGroups ?? []).filter(Boolean),
      }
    : null;
  return {
    settings: result?.settings ?? null,
    homepage,
    pages: result?.pages ?? [],
  };
}
