import { FAQ } from '../config'
import { useReveal } from '../hooks/useReveal'

/**
 * Native <details>, so every answer is reachable with no JS at all and the
 * open state is the browser's problem. Only the plus sign is animated.
 */
export default function Faq() {
  const { ref, reveal } = useReveal<HTMLElement>()

  return (
    <section
      id="faq"
      ref={ref}
      data-reveal={reveal}
      className="mx-auto max-w-3xl px-5 py-20 sm:py-28"
    >
      <p className="font-mono text-[0.68rem] tracking-[0.3em] text-faint uppercase">
        Before you swap
      </p>
      <h2 className="mt-3 font-display text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
        QUESTIONS
      </h2>

      <div className="mt-8 sm:mt-12">
        {FAQ.map((item, i) => (
          <details
            key={item.q}
            className="faq-item border-t border-hairline"
            style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}
          >
            <summary className="flex items-center justify-between gap-6 py-5 text-left text-[1rem] font-semibold tracking-tight">
              {item.q}
              <span aria-hidden="true" className="faq-sign shrink-0 text-lg text-cyan">
                +
              </span>
            </summary>
            <p className="pb-6 text-[0.94rem] leading-relaxed text-dim">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
