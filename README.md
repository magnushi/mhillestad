# mhillestad.com

Personal site for Magnus Hillestad, CLI-style. Pure static — one `index.html`,
no build step, no dependencies.

- Commands: `help` / `ls`, `about`, `books`, `blog`, `investments`, `clear`.
  Type them or click them.
- `books` and `blog` currently print "to come".
- `investments` lists funds and angel investments with links.

## Run locally

Open `index.html` in a browser, or:

```sh
npx serve .
```

## Deploy (Netlify)

Deploy this folder as the site serving `www.mhillestad.com` (publish directory:
repo root). `_redirects` contains a commented-out proxy rule that will serve
the Industrial Revolutions chat site under `/IndustrialRevolutions` once that
project is deployed — fill in its Netlify site name and uncomment.
