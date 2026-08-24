import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: '301op25o',
    dataset: 'production',
  },
  // Hosted at https://mhillestad-com.sanity.studio
  studioHost: 'mhillestad-com',
  // Pinned so deploys never prompt for an application id.
  deployment: {
    appId: 'xhsiiqb0chv2f2ptsnqy6gcp',
  },
  // Serving the Studio from a subpath of another domain is a build-time
  // decision: it changes where the built HTML looks for its assets. Set
  // SANITY_STUDIO_BASE_PATH and the Studio is built for that prefix — which is
  // how it reaches www.mhillestad.com/admin (`npm run deploy:admin`).
  //
  // Workspace basePaths are *prepended* with it, so `/content` becomes
  // `/admin/content` and the Studio root picker sits at `/admin`.
  //
  // Left unset for `npm run deploy`, because mhillestad-com.sanity.studio
  // serves from the root and would 404 on /admin/static/*.
  ...(process.env.SANITY_STUDIO_BASE_PATH
    ? { project: { basePath: process.env.SANITY_STUDIO_BASE_PATH } }
    : {}),
});
