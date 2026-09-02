import { STATS } from '../config'
import { useReveal } from '../hooks/useReveal'

/**
 * Snapshot figures, not live data.
 *
 * The `takenAt` label is not decoration: these numbers only change when
 * somebody edits config.ts, so presenting them as real time would be a lie
 * told to people deciding whether to buy. Wire an API here before ever
 * relabelling this strip as live.
 */
export default function Stats() {
  const { ref, reveal } = useReveal<HTMLElement>()

  return (
    <section ref={ref} data-reveal={reveal} className="mx-auto max-w-5xl px-5 py-14">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline sm:grid-cols-4">
        {STATS.items.map((item) => (
          <div
            key={item.label}
            className="bg-white/[0.015] px-4 py-6 text-center"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            <p className="font-display text-[1.6rem] leading-none tabular-nums">{item.value}</p>
            <p className="mt-2.5 font-mono text-[0.62rem] tracking-[0.2em] text-dim uppercase">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-[0.62rem] tracking-[0.18em] text-faint uppercase">
        Snapshot · {STATS.takenAt} · not live
      </p>
    </section>
  )
}
