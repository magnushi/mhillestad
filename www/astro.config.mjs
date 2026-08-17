// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// The public pages are prerendered (see `export const prerender = true` in each
// page), so visitors still get static files off the CDN. The adapter exists only
// for the preview routes, which must run server-side: draft content needs a
// token, and a token cannot be shipped to the browser.
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  site: 'https://www.mhillestad.com',
});
