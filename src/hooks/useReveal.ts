import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Reveals an element the first time it scrolls into view.
 *
 * Returns a ref and the current state, which the component spreads onto the
 * element as `data-reveal`. The attribute -- rather than a base CSS class --
 * is what makes this safe without JS: no attribute means no hidden state, so
 * a page where this hook never runs still shows all of its content.
 *
 * Single trigger. The observer unobserves on the first intersection, so
 * nothing here is tied to scrolling afterwards and there is no scroll listener
 * on any device.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null)
  const [state, setState] = useState<'hidden' | 'shown' | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Static state: shown outright, no observer, no transition to sit through.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setState('shown')
      return
    }

    // Hidden is set before paint, so the element never flashes in at full
    // opacity and then drop back for the transition.
    setState('hidden')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          setState('shown')
        }
      },
      { threshold },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold])

  return { ref, reveal: state ?? undefined }
}
