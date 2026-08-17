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
});
