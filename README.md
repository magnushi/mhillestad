# mhillestad.com

Monorepo for Magnus Hillestad's websites, deployed as three Netlify sites, all
reading one Sanity project (`301op25o`).

| Folder | Netlify site | What it is |
|---|---|---|
| `www/` | `mhillestad` — www.mhillestad.com | CLI-style personal site. Astro; the public pages are prerendered from Sanity at build time. |
| `industrialrevolutions/` | `mhillestad-indrev` — served at www.mhillestad.com/IndustrialRevolutions | "Canal Mania & the Philosophers Stone" — AI chat about the industrial revolutions and the AI revolution. Astro SSR + Anthropic API + Sanity knowledge base. See its own README. |
| `studio/` | `mhillestad-studio` — also at mhillestad-com.sanity.studio | Sanity Studio. One workspace per dataset. |

`SYSTEM-ARCHITECTURE.md` explains how the pieces fit together and why, in more
depth than this file — start there for anything non-obvious.

All three pin Node 22.12.0 (`.node-version`).

## Datasets

| Dataset | Access | Holds |
|---|---|---|
| `production` | **public** | The site: commands, pages, entries, books, podcasts, investments, KB sources. Read with no token. |
| `inbox` | **private** | Contact form submissions — names and email addresses. |

The split is deliberate and load-bearing. `production` is public-read, so
anything written there is published, not stored. Visitor details therefore go to
`inbox`, which needs a token to read. **Never add `contactMessage` to the
default workspace**, and never write a submission to `production`.

The Studio has one workspace per dataset (`/content` and `/inbox`); its root
shows a picker between them.

## Netlify setup

**Site 1 — main site (`mhillestad`, www.mhillestad.com):**
- Base directory: `www`
- Build `npm run build`, publish `dist` (see `www/netlify.toml`)
- Content is read from Sanity at build time, so a content change needs a
  rebuild — a Sanity webhook fires the Netlify build hook on publish.
- `www/public/_redirects` proxies `/IndustrialRevolutions/*` to site 2, and
  `/admin/*` (plus `/static/*`) to site 3.
- Environment variables: `SANITY_WRITE_TOKEN` (contact form, scoped to
  **functions** only), `SANITY_API_READ_TOKEN` (draft preview).

**Site 2 — chat site (`mhillestad-indrev`):**
- Base directory: `industrialrevolutions`
- Build `npm run build`, publish `dist` (see `industrialrevolutions/netlify.toml`)
- Environment variables: `ANTHROPIC_API_KEY`, `SANITY_MCP_URL`,
  `SANITY_MCP_TOKEN`. Do **not** set `KB_OPTIONAL` in production.

**Site 3 — Studio (`mhillestad-studio`):**
- **Not connected to git.** Pushing does not redeploy it; run
  `cd studio && npm run deploy:admin`, which pins the site id and lets Netlify
  run the build in `studio/netlify.toml`.
- Served at **www.mhillestad.com/admin** through a proxy on site 1.
- The Studio is built for that subpath, and that is a *build-time* decision —
  it changes where the HTML looks for its assets. `SANITY_STUDIO_BASE_PATH=/admin`
  is set in the site's own Netlify environment, because `netlify deploy` runs
  the build command from `netlify.toml`; a locally built `dist` is overwritten.
  Workspace base paths are prepended with it, so the workspaces are at
  `/admin/content` and `/admin/inbox`.
- `npm run build:admin` produces the same bundle locally if you want to inspect
  it. Plain `npm run build`/`npm run deploy` leave the base path unset, which is
  what mhillestad-com.sanity.studio needs — it serves from the root.
- Deploying the schema (`npm run schema:deploy`) is **not** the same as
  deploying the Studio. The first updates what MCP and agents read; the second
  rebuilds the app you click around in. A new document type needs both.

### Contact form

`POST /api/contact` writes one `contactMessage` to the `inbox` dataset. It needs
a Sanity token with write access, on the **main site** (`mhillestad`):

```sh
# create the token (prints it once — do not paste it anywhere public)
cd studio && npx sanity tokens add "www contact form" --role editor

# then put it on the site, never in the repo
npx netlify env:set SANITY_WRITE_TOKEN "<token>" --site mhillestad
```

Without it the endpoint answers 500 and tells the visitor the form is not
configured, rather than silently dropping the message.

The token is read server-side only, and from `process.env` rather than
`import.meta.env` — Vite inlines the latter at build time, which bakes the
literal token into the deployed bundle and trips Netlify's secret scanning. The
env var is scoped to `functions` only, so it is not present during builds.

The endpoint revalidates every field, caps lengths, stamps `submittedAt` itself,
and drops anything that fills the honeypot or submits in under a second. That
stops bots, not a determined human — if it ever gets abused, add a real
challenge in front of it.

## Local development

```sh
# personal site
cd www
npm install
npm run dev                    # → http://localhost:4321

# chat site
cd industrialrevolutions
npm install
cp .env.example .env           # fill in keys
npm run dev                    # → http://localhost:4321/IndustrialRevolutions

# studio
cd studio
npm install
npm run dev                    # → http://localhost:3333
```

`www` reads published content from the public `production` dataset, so it needs
no token to run locally. Draft preview does — set `SANITY_API_READ_TOKEN` if you
want the `/preview` routes.
