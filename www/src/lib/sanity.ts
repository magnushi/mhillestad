// Content lives in Sanity project 301op25o, dataset `production`, which is
// public — so the build reads it straight off the CDN with no token. Nothing
// here is secret, and nothing needs to be configured on Netlify.

const PROJECT_ID = '301op25o';
const DATASET = 'production';
const API_VERSION = 'v2021-06-07';

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
  category: string;
  heading?: string;
}

export type BodyBlock = TextBlock | InvestmentTable;

export interface Command {
  name: string;
  aliases?: string[];
  description?: string;
  order?: number;
  hideFromHelp?: boolean;
  body?: BodyBlock[];
}

export interface Investment {
  name: string;
  url: string;
  category: string;
  order?: number;
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
  bootCommand?: string;
}

export interface SiteContent {
  settings: SiteSettings | null;
  commands: Command[];
  investments: Investment[];
  pages: LandingPage[];
}

const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{siteTitle, metaDescription, prompt, bootCommand},
  "commands": *[_type == "command"] | order(order asc, name asc){
    name, aliases, description, order, hideFromHelp, body
  },
  "investments": *[_type == "investment"] | order(order asc, name asc){
    name, url, category, order
  },
  "pages": *[_type == "landingPage" && defined(slug.current)]{
    title, "slug": slug.current, metaDescription, body
  }
}`;

export async function getSiteContent(): Promise<SiteContent> {
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(QUERY)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sanity query failed (${res.status}). Cannot build without content.`);
  }
  const { result } = (await res.json()) as { result: SiteContent };
  return {
    settings: result?.settings ?? null,
    commands: result?.commands ?? [],
    investments: result?.investments ?? [],
    pages: result?.pages ?? [],
  };
}
