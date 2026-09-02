import { useLayoutEffect, useRef } from 'react'

export type CountFormat = 'compact' | 'percent'

/**
 * `compact` keeps a nine-digit supply legible in display type (1B, not
 * 1,000,000,000) while still stepping through 247M, 812M on the way up.
 * `percent` groups with a thousands separator for anything four digits or
 * longer and appends the sign.
 */
const FORMATTERS: Record<CountFormat, Intl.NumberFormat> = {
  compact: new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }),
  percent: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }),
}

export function formatCount(value: number, format: CountFormat): string {
  const text = FORMATTERS[format].format(value)
  return format === 'percent' ? `${text}%` : text
}

const DURATION_MS = 1200

/** ease-out cubic: fast off the line, settles onto the final value. */
const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * Counts an element's text from 0 up to `to` the first time it scrolls into
 * view. Returns a ref to attach to the element that holds the number.
 *
 * Two deliberate choices:
 * - The value is written with `textContent`, not React state. A state update
 *   per frame would re-render the section ~70 times over 1.2s for a string
 *   nothing else depends on.
 * - `useLayoutEffect`, not `useEffect`: JSX renders the *final* value so the
 *   number is correct if this effect never runs. Zeroing it has to happen
 *   before the browser paints, or the final value flashes for one frame.
 */
export function useCountUp(to: number, format: CountFormat) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Static state under reduced motion: final value, no observer, no rAF.
    // Same bail-out with no IntersectionObserver: the number must never be
    // left reading 0, which would state something false about the token.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      el.textContent = formatCount(to, format)
      return
    }

    el.textContent = formatCount(0, format)

    let rafId = 0
    let startedAt = 0

    function tick(now: number) {
      if (!el) return
      if (!startedAt) startedAt = now
      const t = Math.min((now - startedAt) / DURATION_MS, 1)
      el.textContent = formatCount(Math.round(to * easeOut(t)), format)
      if (t < 1) rafId = requestAnimationFrame(tick)
    }

    // Single trigger: unobserve on the first intersection, so nothing here is
    // tied to scrolling after that. No scroll listener anywhere.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          rafId = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [to, format])

  return ref
}
