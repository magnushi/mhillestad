# Canal Mania & the Philosophers Stone

> This folder also powers the separate **AI Trends & Development** chatbot.
> Set `SITE_VARIANT=ai-trends` and `SITE_BASE_PATH=/AITrends` at build time to
> produce that deployment. Without those variables, the original Industrial
> Revolutions site remains unchanged.

A chat-only website where a resident AI expert — **The Guide** — discusses
artificial intelligence through the lens of the industrial revolutions, together
with the visitor. No login required.

## How it works

- **Astro** site with a single chat page and one streaming API endpoint.
- The endpoint calls the **Anthropic Messages API** (`claude-haiku-4-5`, chosen
  for cost) once per active persona per user message.
- Content grounding comes from the **Sanity MCP server** via the Anthropic
  **MCP connector** — the API connects to Sanity server-side and performs the
  knowledge-base lookups itself. No agent framework, no tool loop.
- The knowledge base is **required**: if the MCP server is unconfigured or
  unreachable, the Guide refuses to answer (fail closed) rather than falling
  back to general knowledge.

```
src/pages/index.astro    chat UI (streams via SSE)
src/pages/api/chat.ts    POST endpoint → Anthropic API + MCP connector
src/lib/personas.ts      system prompts + which personas are active
```

## Personas

`src/lib/personas.ts` defines three personas and an `ENABLED_PERSONAS` list that
controls which of them actually answer:

| id | name | scope |
|---|---|---|
| `guide` | The Guide | both the industrial revolutions and the AI revolution |
| `historian` | The Historian | the industrial revolutions |
| `technologist` | The Technologist | the AI revolution |

The site currently runs **one persona**: `ENABLED_PERSONAS = ['guide']`. With a
single entry the moderator step is skipped and the Guide answers everything.

Setting two or more (e.g. `['historian', 'technologist']`) restores the
multi-expert conversation: a moderator call first picks who should speak, each
speaker is called in turn, and later speakers see the earlier replies from the
same turn, so they react to each other. The chat UI and the header byline read
from `ENABLED_PERSONAS`, so no other code changes are needed.

## Running locally

```sh
npm install
npm run dev
# → http://localhost:4321/IndustrialRevolutions
```

Secrets live in `.env` (gitignored — see `.env.example`):

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key used by the chat endpoint |
| `SANITY_MCP_URL` | Sanity MCP endpoint for project `301op25o` / `production` |
| `SANITY_MCP_TOKEN` | Sanity API token (read access) sent as Bearer auth |

> **Knowledge base prerequisite:** the Sanity MCP endpoint only serves datasets
> with a **deployed Sanity Studio (v5.1.0+)**. That Studio lives in `studio/` in
> this repo and is deployed, so the endpoint serves `301op25o/production`. If it
> is ever undeployed the MCP server returns an error and the site refuses to
> answer — by design, not a bug to work around.

The site is built with `base: '/IndustrialRevolutions'` so it can be served
under a path of an existing domain.

## Deployment

Deployed as its own Netlify site, `mhillestad-indrev`, and served at
`www.mhillestad.com/IndustrialRevolutions` through a proxy rewrite on the main
site (`www/public/_redirects` in this repo). Base directory
`industrialrevolutions`, build `npm run build`, publish `dist`.

The chat endpoint runs as a Netlify Function, which supports streaming. Set
`ANTHROPIC_API_KEY`, `SANITY_MCP_URL` and `SANITY_MCP_TOKEN` on the site; do not
set `KB_OPTIONAL`.

The AI Trends deployment uses the same base directory and build command, plus:

| Variable | Value |
|---|---|
| `SITE_VARIANT` | `ai-trends` |
| `SITE_BASE_PATH` | `/AITrends` |
| `SANITY_MCP_URL` | Context MCP endpoint serving Knowledge Base `kb1CjEx8bNWb` |
| `SANITY_MCP_TOKEN` | Organization token with Context Viewer access |

Its prompt treats the knowledge base as the authority, distinguishes facts
from forecasts, retains source dates, surfaces disagreement, and links to an
original source when the retrieved entry supplies a URL.

Astro prefixes asset URLs with `base`, so the built page requests
`/IndustrialRevolutions/_astro/*` while the files are published at the root —
`netlify.toml` rewrites that path back. Without it the site loads unstyled in
production only, since `astro dev` serves everything under the base path.

## Sources & attribution

The knowledge base draws on 16 curated sources across two strands: eleven
works on the Industrial Revolution (Ashton, Landes, Hobsbawm, Allen, Mokyr,
E. P. Thompson, Griffin, Uglow, the Industrial Revolutions podcast,
Encyclopædia Britannica, and digital archives incl. the Smithsonian and
British History Online) and five on AI as a general-purpose technology
(Crafts; Brynjolfsson, Rock & Syverson; Veldkamp & Abis; Caprettini/VoxDev;
AEI). The full credit lives on the `/sources` page, linked from the chat
footer. Educational and entertainment purposes only; no commercial use of the
knowledge base.

## Abuse guards

The site is public, so the endpoint enforces: max 2,000 chars per message,
max 40 messages per transcript, and a per-IP limit of 8 requests/minute
(in-memory — resets on redeploy/cold start; good enough for a hobby site).
