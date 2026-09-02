import { useId } from 'react'
import { CYCLE } from '../config'
import { useReveal } from '../hooks/useReveal'

/* ---------------------------------------------------------------------------
   The cycle
   ---------------------------------------------------------------------------
   This was two sections: a chart that drew a sine, and a list that described
   one. Both said "up, down, repeat" and neither explained the other, which is
   what made the chart read as decoration.

   Now the curve is the diagram and the phases are annotations on it: each
   label sits at the point of the function it names, and carries the colour of
   the row that expands on it below. The plot has a job.
--------------------------------------------------------------------------- */

const W = 1000
const H = 300
const MID = 150
const AMP = 96
const CYCLES = 2.5

const curveY = (x: number) => MID - Math.sin((x / W) * Math.PI * 2 * CYCLES) * AMP

const PATH = (() => {
  const points: string[] = []
  for (let x = 0; x <= W; x += 8) {
    points.push(`${x === 0 ? 'M' : 'L'}${x} ${curveY(x).toFixed(1)}`)
  }
  return points.join(' ')
})()

const TONES: Record<string, string> = {
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  white: '#ffffff',
}

/**
 * Where each phase actually happens on the curve: UP mid-climb, DOWN mid-fall,
 * REPEAT on the next climb. `at` is how far along the path the point sits, so
 * the marker can wait for the line to reach it.
 */
const MARKS = [
  { phase: 'UP', x: 50, at: 0.05, above: true },
  { phase: 'DOWN', x: 200, at: 0.2, above: false },
  { phase: 'REPEAT', x: 450, at: 0.45, above: true },
] as const

/** Arrow per phase, matching the direction the word describes. */
const ARROWS: Record<string, string> = { UP: '↑', DOWN: '↓', REPEAT: '↻' }

export default function Cycle() {
  const { ref, reveal } = useReveal<HTMLElement>(0.2)
  const gradientId = useId()

  const toneOf = (phase: string) =>
    TONES[CYCLE.find((c) => c.phase === phase)?.tone ?? 'white'] ?? '#ffffff'

  return (
    <section
      id="cycle"
      ref={ref}
      data-reveal={reveal}
      className="mx-auto max-w-5xl px-5 py-20 sm:py-28"
    >
      <p className="font-mono text-[0.68rem] tracking-[0.3em] text-faint uppercase">
        Not a roadmap. A function.
      </p>
      <h2 className="mt-3 font-display text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
        THE CYCLE
      </h2>

      <div
        className="mt-10 rounded-2xl border border-hairline p-4 sm:mt-12 sm:p-8"
        // Near-opaque: the live wave runs behind this panel, and a plot you
        // cannot separate from the background is not a plot.
        style={{ background: 'rgba(5,7,13,0.82)' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          role="img"
          aria-label="A sine wave with three points marked on it: up on the climb, down on the fall, repeat on the next climb"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--cyan)" />
              <stop offset="48%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--magenta)" />
            </linearGradient>
          </defs>

          <line x1="0" y1={MID} x2={W} y2={MID} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />

          {/* pathLength="1" normalises the curve, so the draw-on is a dasharray
              of exactly 1 and needs no getTotalLength() call in JS. */}
          <path
            className="chart-line"
            d={PATH}
            pathLength="1"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {MARKS.map((mark) => {
            const tone = toneOf(mark.phase)
            const y = curveY(mark.x)
            const labelY = mark.above ? y - 26 : y + 48
            return (
              <g
                key={mark.phase}
                className="chart-dot"
                style={{ ['--dot-at' as string]: mark.at }}
              >
                <line
                  x1={mark.x}
                  y1={y}
                  x2={mark.x}
                  y2={mark.above ? y - 14 : y + 18}
                  stroke={tone}
                  strokeWidth="2"
                  opacity="0.5"
                />
                <circle cx={mark.x} cy={y} r="7" fill="var(--bg)" stroke={tone} strokeWidth="3" />
                <text
                  x={mark.x}
                  y={labelY}
                  textAnchor="middle"
                  fill={tone}
                  fontSize="24"
                  fontFamily="var(--font-display)"
                  letterSpacing="1"
                >
                  {mark.phase}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mt-5 font-mono text-[0.8rem] text-dim">
        <span className="text-ink">y = sin(t)</span> — the only forecast on this
        site, and the only one that is actually right.
      </p>

      <ol className="mt-10 sm:mt-14">
        {CYCLE.map((step, i) => {
          const tone = TONES[step.tone] ?? '#ffffff'
          return (
            <li
              key={step.phase}
              // max-content, not a fixed width: "REPEAT" in Bungee is far wider
              // than a guessed column and would run straight into the copy.
              className="grid items-baseline gap-x-8 gap-y-2 border-t border-hairline py-7 sm:grid-cols-[max-content_1fr] sm:py-9"
              style={{ ['--reveal-delay' as string]: `${i * 110}ms` }}
            >
              <p
                className="font-display text-[clamp(2.2rem,7vw,3.2rem)] leading-none tracking-[-0.02em]"
                style={{
                  color: tone,
                  textShadow: `0 0 30px color-mix(in srgb, ${tone} 40%, transparent)`,
                }}
              >
                <span aria-hidden="true" className="mr-2 opacity-70">
                  {ARROWS[step.phase]}
                </span>
                {step.phase}
              </p>
              <p className="text-[1rem] leading-relaxed text-dim">{step.body}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
