/**
 * Marquee band between the hero and the how-to-buy steps.
 *
 * Pure CSS: one track holding two identical copies, translated -50% so copy B
 * lands exactly where copy A started and the loop has no seam. No JS, no
 * measurement, no scroll listener. The reduced-motion rule parks it at 0.
 */

import { PARALLAX_MAX, PARALLAX_SPEED, useParallaxLayer } from '../hooks/useParallax'

/* Facts, not the tagline. The hero already says "up only, down only, repeat"
   and the cycle section says it twice more -- a marquee repeating it a fourth
   time is what makes a page read as filler. */
const PHRASE = ['$SINE', '1B SUPPLY', 'LP BURNED', '0% TAX', 'SOLANA']

/** Enough repeats that one copy overflows the widest viewport we care about. */
const REPEATS = 5

function Line() {
  return (
    <span className="flex shrink-0 items-center whitespace-nowrap">
      {Array.from({ length: REPEATS }).flatMap((_, r) =>
        PHRASE.map((word) => (
          <span key={`${r}-${word}`} className="flex items-center">
            <span className="px-3 font-mono text-[0.72rem] tracking-[0.24em] text-dim uppercase">
              {word}
            </span>
            <span aria-hidden="true" className="text-cyan/70">
              &bull;
            </span>
          </span>
        )),
      )}
    </span>
  )
}

export default function Ticker() {
  // Crosses the viewport slightly faster than the page: a foreground plane.
  const ref = useParallaxLayer<HTMLDivElement>(PARALLAX_SPEED.ticker, PARALLAX_MAX.ticker)

  return (
    <div
      ref={ref}
      // Decorative and repetitive: hidden from the accessibility tree rather
      // than read out two dozen times.
      aria-hidden="true"
      className="ticker-mask relative overflow-hidden border-y py-3"
      style={{ borderColor: 'color-mix(in srgb, var(--cyan) 20%, transparent)' }}
    >
      <div className="ticker-track flex w-max">
        <Line />
        <Line />
      </div>
    </div>
  )
}
