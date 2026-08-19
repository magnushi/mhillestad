import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool, defineDocuments, defineLocations } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { contactMessage } from './schemaTypes/contactMessage';

const SITE_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'https://www.mhillestad.com';

// Which document belongs to which URL, so selecting a page in Presentation
// opens the right document and vice versa.
const mainDocuments = defineDocuments([
  { route: '/', type: 'homepage' },
  { route: '/blog/:slug', filter: '_type == "blogPost" && slug.current == $slug' },
  { route: '/:slug', filter: '_type == "landingPage" && slug.current == $slug' },
]);

// "Used on" links. Commands and investments have no page of their own — they
// surface inside the terminal — so they point at the home page.
const locations = {
  landingPage: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [{ title: doc?.title || 'Untitled', href: `/${doc?.slug}` }],
    }),
  }),
  command: defineLocations({
    select: { name: 'name' },
    resolve: (doc) => ({
      locations: [{ title: `Terminal — ${doc?.name ?? 'command'}`, href: '/' }],
    }),
  }),
  blogPost: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [{ title: doc?.title || 'Untitled', href: `/blog/${doc?.slug}` }],
    }),
  }),
  podcast: defineLocations({
    message: 'Appears in the `podcasts` list in the terminal.',
    tone: 'caution',
  }),
  book: defineLocations({
    message: 'Appears in the `books` reading list in the terminal.',
    tone: 'caution',
  }),
  entry: defineLocations({
    message: 'Appears in the `blog` listing in the terminal, ordered by date.',
    tone: 'caution',
  }),
  investment: defineLocations({
    message: 'Appears in whichever investment group lists it, on the Home page.',
    tone: 'caution',
  }),
  homepage: defineLocations({
    resolve: () => ({ locations: [{ title: 'Home', href: '/' }] }),
  }),
  siteSettings: defineLocations({
    message: 'Used on every page.',
    tone: 'caution',
  }),
};

// Two workspaces, because the two datasets have opposite access rules.
//
// Sanity requires every workspace basePath to have the same number of segments,
// so adding `inbox` moves the main workspace off `/` and onto `/content`. The
// Studio root now shows a picker between the two.
// `production` is public-read and holds the site. `inbox` is private and holds
// what visitors send through the contact form — names and email addresses that
// must not be readable without a token. Mixing them would publish personal data.
export default defineConfig([
  {
  name: 'default',
  title: 'mhillestad.com',
  basePath: '/content',
  projectId: '301op25o',
  dataset: 'production',
  plugins: [
    presentationTool({
      previewUrl: {
        initial: SITE_URL,
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      resolve: { mainDocuments, locations },
      allowOrigins: ['http://localhost:*', 'https://www.mhillestad.com'],
    }),
    structureTool({
      // Singletons are shown as single entries rather than lists you can add
      // to, so nobody creates a second Home page and wonders why the site
      // ignores it.
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Home page')
              .id('homepage')
              .child(S.document().schemaType('homepage').documentId('homepage')),
            S.documentTypeListItem('landingPage').title('Landing pages'),
            S.divider(),
            S.documentTypeListItem('command').title('CLI commands'),
            S.listItem()
              .title('Blog posts')
              .id('blogPosts')
              .child(
                S.documentList()
                  .title('Blog posts')
                  .filter('_type == "blogPost"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
                  .apiVersion('2021-06-07'),
              ),
            S.listItem()
              .title('Blog entries (elsewhere)')
              .id('entries')
              .child(
                S.documentList()
                  .title('Blog entries')
                  .filter('_type == "entry"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
                  .apiVersion('2021-06-07'),
              ),
            S.listItem()
              .title('Podcasts')
              .id('podcasts')
              .child(
                S.documentList()
                  .title('Podcasts')
                  .filter('_type == "podcast"')
                  .defaultOrdering([{ field: 'title', direction: 'asc' }])
                  .apiVersion('2021-06-07'),
              ),
            S.listItem()
              .title('Books')
              .id('books')
              .child(
                S.documentList()
                  .title('Books')
                  .filter('_type == "book"')
                  .defaultOrdering([
                    { field: 'author', direction: 'asc' },
                    { field: 'title', direction: 'asc' },
                  ])
                  .apiVersion('2021-06-07'),
              ),
            S.documentTypeListItem('investment').title('Investments'),
            S.divider(),
            S.documentTypeListItem('source').title('Sources'),
            S.divider(),
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(
                S.documentList()
                  .title('Site settings')
                  .filter('_type == "siteSettings"')
                  .apiVersion('2021-06-07'),
              ),
            ...S.documentTypeListItems().filter(
              (item) =>
                ![
                  'homepage',
                  'landingPage',
                  'command',
                  'blogPost',
                  'entry',
                  'book',
                  'podcast',
                  'investment',
                  'source',
                  'siteSettings',
                ].includes(item.getId() ?? ''),
            ),
          ]),
    }),
    visionTool({ defaultApiVersion: '2021-06-07' }),
  ],
  schema: {
    types: schemaTypes,
    // Home page is a singleton at a fixed id; hide it from "create new".
    templates: (prev) => prev.filter((t) => t.schemaType !== 'homepage'),
  },
  },
  {
    name: 'inbox',
    title: 'Inbox',
    basePath: '/inbox',
    projectId: '301op25o',
    dataset: 'inbox',
    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Inbox')
            .items([
              S.listItem()
                .title('Unhandled')
                .id('unhandled')
                .child(
                  S.documentList()
                    .title('Unhandled')
                    .filter('_type == "contactMessage" && handled != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                    .apiVersion('2021-06-07'),
                ),
              S.listItem()
                .title('All messages')
                .id('all')
                .child(
                  S.documentList()
                    .title('All messages')
                    .filter('_type == "contactMessage"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                    .apiVersion('2021-06-07'),
                ),
            ]),
      }),
      visionTool({ defaultApiVersion: '2021-06-07' }),
    ],
    schema: {
      types: [contactMessage],
      // Messages arrive from the site; creating one by hand would be noise.
      templates: [],
    },
  },
]);
