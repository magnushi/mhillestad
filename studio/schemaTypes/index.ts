// The schema for mhillestad.com. This directory is the single source of truth:
// it is deployed with `npm run schema:deploy`, which is what the MCP tools and
// any agent read. Do not register schema through other channels — a workspace
// can only be managed by one source, and two records drift apart silently.

import { blogPost } from './blogPost';
import { book } from './book';
import { bookList } from './bookList';
import { command } from './command';
import { commandSlot } from './commandSlot';
import { entry } from './entry';
import { entryList } from './entryList';
import { homepage } from './homepage';
import { investment } from './investment';
import { investmentGroup } from './investmentGroup';
import { investmentTable } from './investmentTable';
import { landingPage } from './landingPage';
import { podcast } from './podcast';
import { podcastList } from './podcastList';
import { runCommand } from './runCommand';
import { siteSettings } from './siteSettings';
import { source } from './source';
import { terminalLink } from './terminalLink';

export const schemaTypes = [
  // documents
  homepage,
  landingPage,
  command,
  blogPost,
  entry,
  book,
  podcast,
  investment,
  siteSettings,
  source,
  // objects
  commandSlot,
  entryList,
  bookList,
  podcastList,
  investmentGroup,
  investmentTable,
  terminalLink,
  runCommand,
];
