// @ts-check
import { defineConfig } from 'astro/config';

// Static output: content is pulled from Sanity at build time, so the deployed
// site is plain files with no server and no runtime dependency on Sanity.
export default defineConfig({
  output: 'static',
  site: 'https://www.mhillestad.com',
});
