import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool, defineDocuments, defineLocations } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

const SITE_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'https://www.mhillestad.com';

// Which document belongs to which URL, so selecting a page in Presentation
// opens the right document and vice versa.
const mainDocuments = defineDocuments([
  { route: '/', type: 'homepage' },
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

export default defineConfig({
  name: 'default',
  title: 'mhillestad.com',
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
                !['homepage', 'landingPage', 'command', 'investment', 'source', 'siteSettings'].includes(
                  item.getId() ?? '',
                ),
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
});
