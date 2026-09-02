import { TOKENOMICS } from '../config'
import { formatCount, useCountUp, type CountFormat } from '../hooks/useCountUp'

const TONES: Record<string, string> = {
  cyan: 'var(--cyan)',
  white: '#ffffff',
  magenta: 'var(--magenta)',
}

type StatProps = {
  to: number
  format: CountFormat
  label: string
  note: string
  tone: string
}

function Stat({ to, format, label, note, tone }: StatProps) {
  const valueRef = useCountUp(to, format)

  return (
    <div
      className="bg-white/[0.015] px-6 py-9 text-center sm:py-12"
      // gap-px plus this ring gives hairline dividers between cells without
      // border rules doubling up at the grid seams.
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}
    >
      <dd
        ref={valueRef}
        // tabular-nums stops the number jittering in width while it counts.
        className="font-display text-[clamp(2.8rem,11vw,4.5rem)] leading-none tracking-[-0.03em] tabular-nums"
        style={{
          color: tone,
          textShadow: `0 0 28px color-mix(in srgb, ${tone} 45%, transparent)`,
        }}
      >
        {/* Final value in the markup: correct even if the effect never runs.
            The hook zeroes it before paint when it does. */}
        {formatCount(to, format)}
      </dd>
      <dt className="mt-4 font-mono text-[0.7rem] tracking-[0.22em] text-ink uppercase">{label}</dt>
      <p className="mt-2 text-[0.87rem] text-dim">{note}</p>
    </div>
  )
}

export default function Tokenomics() {
  return (
    <section id="tokenomics" className="relative mx-auto max-w-5xl px-5 py-20 sm:py-28">
      <p className="font-mono text-[0.68rem] tracking-[0.3em] text-faint uppercase">
        Nothing hidden
      </p>
      <h2 className="mt-3 font-display text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
        TOKENOMICS
      </h2>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-hairline sm:mt-14 sm:grid-cols-3">
        {TOKENOMICS.map((item) => (
          <Stat
            key={item.label}
            to={item.to}
            format={item.format}
            label={item.label}
            note={item.note}
            tone={TONES[item.tone] ?? '#ffffff'}
          />
        ))}
      </dl>
    </section>
  )
}
