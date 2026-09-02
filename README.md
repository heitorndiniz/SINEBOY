# SINEBOY ($SINE)

Single-page site for the Sineboy memecoin. Vite + React + TypeScript + Tailwind v4,
deployed to Cloudflare Workers as a static assets Worker.

## Before launch

Everything that changes lives in [`src/config.ts`](src/config.ts):

- `CONTRACT_ADDRESS` — currently a **placeholder**. Replace with the real mint.
  The Buy button, the DexScreener link and the pump.fun link are all derived from it.
- `LINKS.x` / `LINKS.telegram` — placeholder handles.
- `TOKENOMICS` / `STEPS` — copy for the two content sections.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build into dist/
npm run preview   # serve the built output
npm run deploy    # build, then wrangler deploy
```

`npm run deploy` needs `wrangler login` once. `wrangler.jsonc` serves `./dist`
directly from the edge - there is no server code.

Live at **https://sineboy.fun**, attached as a Cloudflare custom domain, so
Cloudflare owns the DNS record for the apex. workers.dev and preview URLs are
turned off: sineboy.fun is the only origin this Worker answers on.

## Background animation

[`src/components/WaveBackground.tsx`](src/components/WaveBackground.tsx) draws the
neon sine wave and grid floor on a canvas, fixed behind the page.

- **Below 768px** it drops to 2 waves, ~3x coarser sampling, half the grid lines,
  a 1.5x DPR ceiling and 30fps.
- **`prefers-reduced-motion: reduce`** renders one static frame and never
  schedules another. Both media queries are watched live, so the quality tier
  switches on rotation or a system settings change without a reload.
- The loop pauses while the tab is hidden.

## Sections

Hero · Ticker · Stats · How to buy · The cycle · Wave band · Tokenomics ·
Questions · Footer. All wired in [`src/App.tsx`](src/App.tsx).

The cycle section is one thing, not two: the sine is the diagram and UP / DOWN
/ REPEAT are annotations on the points of the function they name.

`STATS` in config is a **hand-maintained snapshot**, labelled as such on the
page. Do not relabel that strip as live without wiring a real API behind it.

## Motion

Depth is a gradient, not two extremes:

| plane | speed |
|---|---|
| grid floor, three waves (inside the canvas) | 0.03x - 0.38x |
| **everything readable** | **1.00x** |
| ticker, section dividers | 1.20x - 1.32x |

Nothing readable leaves 1x. Past the hero the background cools -- it loses
amplitude and brightness over 1.8 viewports, which is what keeps five thousand
pixels of copy legible over a live canvas.

Every effect has a resting state under `prefers-reduced-motion`, verified by
reading computed styles in both modes.

## Assets

`public/sineboy-full.webp` (hero character), `public/sineboy-stand.webp`
(how-to-buy), `public/favicon.png`, `public/pfp.png` (apple-touch-icon),
`public/banner.jpg` (Open Graph). Full-resolution originals are in
the repo root; the WebP files were re-encoded from them, so regenerate rather
than editing in place.
