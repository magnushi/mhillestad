// The schema for mhillestad.com. This directory is the single source of truth:
// it is deployed with `npm run schema:deploy`, which is what the MCP tools and
// any agent read. Do not register schema through other channels — a workspace
// can only be managed by one source, and two records drift apart silently.

import { command } from './command';
import { homepage } from './homepage';
import { investment } from './investment';
import { investmentGroup } from './investmentGroup';
import { investmentTable } from './investmentTable';
import { landingPage } from './landingPage';
import { runCommand } from './runCommand';
import { siteSettings } from './siteSettings';
import { source } from './source';
import { terminalLink } from './terminalLink';

export const schemaTypes = [
  // documents
  homepage,
  landingPage,
  command,
  investment,
  siteSettings,
  source,
  // objects
  investmentGroup,
  investmentTable,
  terminalLink,
  runCommand,
];
