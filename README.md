# mhillestad.com

Monorepo for Magnus Hillestad's websites, deployed as two Netlify sites.

| Folder | Site | What it is |
|---|---|---|
| `www/` | www.mhillestad.com | CLI-style personal site. Pure static, one `index.html`, no build. |
| `industrialrevolutions/` | served at www.mhillestad.com/IndustrialRevolutions | "Canal Mania & the Philosophers Stone" — AI chat about the industrial revolutions and the AI revolution. Astro + Anthropic API + Sanity knowledge base. See its own README. |

## Datasets

| Dataset | Access | Holds |
|---|---|---|
| `production` | **public** | The site: commands, pages, entries, books. Read with no token. |
| `inbox` | **private** | Contact form submissions — names and email addresses. |

The split is deliberate and load-bearing. `production` is public-read, so
anything written there is published, not stored. Visitor details therefore go to
`inbox`, which needs a token to read. **Never add `contactMessage` to the
default workspace**, and never write a submission to `production`.

The Studio has one workspace per dataset (`/content` and `/inbox`); its root
shows a picker between them.

## Netlify setup

**Site 1 — main site (`www.mhillestad.com`):**
- Base directory: `www`
- No build command, publish `.` (see `www/netlify.toml`)
- `www/_redirects` proxies `/IndustrialRevolutions/*` to site 2 — fill in
  site 2's Netlify name and uncomment once it's deployed.

**Site 2 — chat site:**
- Base directory: `industrialrevolutions`
- Build `npm run build`, publish `dist` (see `industrialrevolutions/netlify.toml`)
- Environment variables: `ANTHROPIC_API_KEY`, `SANITY_MCP_URL`,
  `SANITY_MCP_TOKEN`. Do **not** set `KB_OPTIONAL` in production.

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

The token is read server-side only. The endpoint revalidates every field, caps
lengths, stamps `submittedAt` itself, and drops anything that fills the honeypot
or submits in under a second. That stops bots, not a determined human — if it
ever gets abused, add a real challenge in front of it.

## Local development

```sh
# personal site
open www/index.html            # or: npx serve www

# chat site
cd industrialrevolutions
npm install
cp .env.example .env           # fill in keys
npm run dev                    # → http://localhost:4321/IndustrialRevolutions
```
