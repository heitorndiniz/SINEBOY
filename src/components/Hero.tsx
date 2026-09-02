import type { CSSProperties } from 'react'
import { LINKS, TOKEN } from '../config'
import CopyAddress from './CopyAddress'

const TITLE = 'SINEBOY'

/** The tagline's three beats. Each carries its own accent and travel
 *  direction; the shared .tag-part keyframe reads both as custom properties. */
const TAGLINE_PARTS = [
  { text: 'up only.', accent: 'var(--cyan)', dy: '-4px' },
  { text: 'down only.', accent: 'var(--magenta)', dy: '4px' },
  { text: 'repeat.', accent: '#ffffff', dy: '0px' },
]

export default function Hero() {
  return (
    // select-none across the whole hero: no text selection, and no drag ghost
    // off the character. The full contract address in the footer stays
    // selectable, so manual copying is never actually blocked.
    <section
      id="top"
      className="no-drag relative flex min-h-svh items-center px-5 py-16 select-none sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[38%_62%] lg:items-end lg:gap-0">
        {/* Character. Three nested elements because three different things want
            the transform property, and a filled CSS animation outranks an
            inline style: the outer div leans him into the copy column, the
            middle one runs the entrance, the image itself does the bob. */}
        <div className="relative z-10 flex justify-center lg:justify-end">
          <div className="lg:translate-x-[10%]">
            <div className="rise" style={{ animationDelay: '0ms' }}>
              <img
                src="/sineboy-full.webp"
                alt="Sineboy, a grinning cartoon kid in a yellow hoodie, mid-stride and throwing a shaka"
                width={560}
                height={924}
                fetchPriority="high"
                draggable={false}
                className="bob h-[34vh] max-h-[290px] w-auto object-contain drop-shadow-[0_0_26px_rgba(34,211,238,0.3)] lg:h-[60vh] lg:max-h-[620px]"
              />
            </div>
          </div>
        </div>

        <div className="text-center lg:text-left">
          <p
            className="rise font-mono text-[0.68rem] tracking-[0.34em] text-dim uppercase"
            style={{ animationDelay: '70ms' }}
          >
            {TOKEN.chain} · {TOKEN.ticker}
          </p>

          {/* aria-label carries the whole word and the letter spans are hidden,
              so a screen reader reads "SINEBOY" instead of spelling it out. */}
          <h1
            aria-label={TITLE}
            className="rise split-glow mt-3 font-display text-[clamp(3.4rem,9vw,8rem)] leading-[0.86] tracking-[-0.02em]"
            style={{ animationDelay: '140ms' }}
          >
            {TITLE.split('').map((char, i) => (
              <span
                key={`${char}-${i}`}
                aria-hidden="true"
                className="letter-wave"
                // Phase offset per letter: the oscillation travels along the word.
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          <p
            className="rise mt-5 text-[1.05rem] tracking-tight sm:text-[1.35rem]"
            style={{ animationDelay: '210ms' }}
          >
            {TAGLINE_PARTS.map((part, i) => (
              <span
                key={part.text}
                className="tag-part"
                style={
                  {
                    '--tag-accent': part.accent,
                    '--tag-dy': part.dy,
                    animationDelay: `${i * 0.18}s`,
                    // Word gap as margin, not a text node: an inline-block trims
                    // whitespace at its own edges, so a trailing space collapses.
                    marginRight: i < TAGLINE_PARTS.length - 1 ? '0.3em' : undefined,
                  } as CSSProperties
                }
              >
                {part.text}
              </span>
            ))}
          </p>

          <div
            className="rise mt-8 flex w-full max-w-sm flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:mx-0 lg:justify-start"
            style={{ animationDelay: '280ms' }}
          >
            <a
              href={LINKS.buy}
              target="_blank"
              rel="noopener noreferrer"
              className="cta inline-flex w-full items-center justify-center rounded-full bg-yellow px-8 py-3.5 font-display text-[0.8rem] tracking-[0.02em] text-bg sm:w-auto"
            >
              Buy {TOKEN.ticker}
            </a>
            <CopyAddress />
          </div>
        </div>
      </div>

      <a
        href="#how-to-buy"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[0.65rem] tracking-[0.28em] text-dim uppercase transition-colors hover:text-cyan"
      >
        how to buy ↓
      </a>
    </section>
  )
}
