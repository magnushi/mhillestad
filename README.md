# mhillestad.com

Monorepo for Magnus Hillestad's websites, deployed as two Netlify sites.

| Folder | Site | What it is |
|---|---|---|
| `www/` | www.mhillestad.com | CLI-style personal site. Pure static, one `index.html`, no build. |
| `industrialrevolutions/` | served at www.mhillestad.com/IndustrialRevolutions | "Canal Mania & the Philosophers Stone" — AI chat about the industrial revolutions and the AI revolution. Astro + Anthropic API + Sanity knowledge base. See its own README. |

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
