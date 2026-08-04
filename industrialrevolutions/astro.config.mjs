// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// base is set so the site can be served at www.mhillestad.com/IndustrialRevolutions
// via a Netlify proxy rewrite. Locally: http://localhost:4321/IndustrialRevolutions
export default defineConfig({
  output: 'server',
  base: '/IndustrialRevolutions',
  adapter: netlify(),
});
