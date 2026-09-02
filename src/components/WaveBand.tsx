import { useId } from 'react'

/* ---------------------------------------------------------------------------
   WaveBand
   ---------------------------------------------------------------------------
   The mascot in the surf, replacing the cropped JPEG that used to sit here.
   The subject is him; the scrolling waves are the surface he stands on. That
   distinction matters -- a band of abstract neon curves would be the fifth
   thing on this page saying "sine", and the page already has enough of those.

   SVG, not a second canvas: the budget allows exactly one canvas on the page
   and it belongs to the background.

   The loop is seamless because each path spans twice the band width and every
   layer completes a whole number of periods per band width. Sliding a layer
   left by exactly one band width lands it on a copy of itself, so there is no
   seam to hide.
--------------------------------------------------------------------------- */

const BAND_W = 1200
const BAND_H = 200
const MID = BAND_H / 2

/** Periods must be whole numbers, or the loop point stops matching up. */
const LAYERS = [
  { periods: 1, amp: 54, seconds: 15, opacity: 1, width: 4, core: true },
  { periods: 2, amp: 33, seconds: 23, opacity: 0.45, width: 2.5, core: false },
  { periods: 3, amp: 20, seconds: 34, opacity: 0.25, width: 2, core: false },
] as const

/** Sampled across two band widths so the second half covers the first as it slides. */
function sinePath(periods: number, amp: number): string {
  const points: string[] = []
  for (let x = 0; x <= BAND_W * 2; x += 8) {
    const y = MID - Math.sin((x / BAND_W) * Math.PI * 2 * periods) * amp
    points.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`)
  }
  return points.join(' ')
}

const PATHS = LAYERS.map((layer) => sinePath(layer.periods, layer.amp))

export default function WaveBand() {
  const gradientId = useId()

  return (
    <section
      aria-label="Sineboy in the surf"
      className="relative my-4 overflow-hidden border-y border-hairline select-none"
      // Tracks viewport width so this stays a band instead of a stripe on wide
      // screens or a wall on narrow ones.
      style={{ height: 'clamp(180px, 21vw, 330px)' }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${BAND_W} ${BAND_H}`}
        // The curve stretches with the box; non-scaling-stroke below keeps the
        // line weight even when it does.
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="40%" stopColor="var(--cyan)" />
            <stop offset="52%" stopColor="#ffffff" />
            <stop offset="64%" stopColor="var(--magenta)" />
            <stop offset="100%" stopColor="var(--magenta)" />
          </linearGradient>
        </defs>

        {LAYERS.map((layer, i) => (
          <g
            key={layer.periods}
            className="band-layer"
            style={{ animationDuration: `${layer.seconds}s`, opacity: layer.opacity }}
          >
            {/* Halo and line as two strokes of one path -- the same trick the
                background canvas uses. Far cheaper than an SVG blur filter and
                it matches the look exactly. */}
            <path
              d={PATHS[i]}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={layer.width * 4}
              strokeLinecap="round"
              opacity="0.16"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={PATHS[i]}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={layer.width}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {layer.core && (
              <path
                d={PATHS[i]}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={layer.width * 0.32}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Same file as the hero, so it is already in cache and costs nothing
          here. Feet sit at 68% and he stands 62% tall, which puts his head at
          6% -- clear of the top edge at every band height. The front layer
          swings between 23% and 77%, so the water crosses him somewhere
          between ankle and shin as it rolls past. No JS sync needed: he is
          standing in the surf, not pinned to a crest. */}
      <img
        src="/sineboy-full.webp"
        alt="Sineboy standing in the surf, throwing a shaka"
        width={560}
        height={924}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="bob absolute bottom-[32%] left-[6%] h-[62%] w-auto object-contain drop-shadow-[0_0_22px_rgba(34,211,238,0.35)] sm:left-[12%]"
      />

      {/* Fades the band into the page at both ends instead of stopping at a
          hard vertical edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, var(--bg) 0%, rgba(5,7,13,0) 16%, rgba(5,7,13,0) 84%, var(--bg) 100%)',
        }}
      />
    </section>
  )
}
