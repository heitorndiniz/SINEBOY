import { STEPS } from '../config'
import { useCardSpotlight } from '../hooks/useCardSpotlight'

/** Cyan -> white -> magenta across the three cards: the wave's own gradient,
 *  unrolled into the layout so the sequence reads as one sweep. */
const STEP_COLORS = ['var(--cyan)', '#ffffff', 'var(--magenta)']

export default function HowToBuy() {
  // One listener on the list covers all three cards.
  const listRef = useCardSpotlight<HTMLOListElement>()

  return (
    <section id="how-to-buy" className="relative mx-auto max-w-5xl px-5 py-20 sm:py-28">
      <div className="flex items-end gap-5">
        <div>
          <p className="font-mono text-[0.68rem] tracking-[0.3em] text-faint uppercase">
            Three steps
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
            HOW TO BUY
          </h2>
        </div>
        {/* Standing pose, no animation: the hero already has the moving one. */}
        <img
          src="/sineboy-stand.webp"
          alt="Sineboy standing and facing forward"
          width={240}
          height={452}
          loading="lazy"
          decoding="async"
          className="hidden h-[120px] w-auto object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.25)] sm:block"
        />
      </div>

      <ol ref={listRef} className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            data-spotlight
            className="neon-card spotlight overflow-hidden rounded-2xl p-6 sm:p-7"
            style={{
              // The spotlight picks up this card's own colour.
              ['--spot' as string]: STEP_COLORS[i],
              // Border and inner light pick up that card's colour, kept low
              // enough that the cards read as glass rather than as buttons.
              borderColor: `color-mix(in srgb, ${STEP_COLORS[i]} 26%, transparent)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 26px -14px ${STEP_COLORS[i]}`,
            }}
          >
            {/* Stroke colour only — setting `color` here would override the
                transparent fill in .tube-numeral and give a solid glyph. */}
            <span
              className="tube-numeral font-display text-[2.6rem] leading-none"
              style={{ WebkitTextStrokeColor: STEP_COLORS[i] }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 font-sans text-[1.05rem] font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2.5 text-[0.92rem] leading-relaxed text-dim">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
