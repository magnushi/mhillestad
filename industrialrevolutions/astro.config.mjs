// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// One codebase powers multiple chat deployments. Each Netlify site supplies
// its own base path; the original remains the safe default.
export default defineConfig({
  output: 'server',
  base: process.env.SITE_BASE_PATH || '/IndustrialRevolutions',
  // The Netlify adapter probes the user's global Netlify configuration in dev.
  // Skip it for isolated local smoke tests; production builds always include it.
  adapter: process.env.LOCAL_SMOKE_TEST === 'true' ? undefined : netlify(),
});
