import { useEffect, useRef } from 'react'

/**
 * Card spotlight: writes --mx / --my onto whichever card the pointer is over,
 * throttled to one write per frame.
 *
 * One delegated listener on the list, not one per card. The handler stores the
 * event coordinates and nothing else; the rect read and the style write both
 * happen inside rAF, so a burst of pointermove events costs one layout read
 * per frame instead of one per event.
 *
 * Only bound on devices that actually hover, and never under reduced motion.
 */
export function useCardSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    let rafId = 0
    let card: HTMLElement | null = null
    let clientX = 0
    let clientY = 0

    function paint() {
      rafId = 0
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${clientX - rect.left}px`)
      card.style.setProperty('--my', `${clientY - rect.top}px`)
    }

    function onPointerMove(e: PointerEvent) {
      const target =
        (e.target as Element | null)?.closest<HTMLElement>('[data-spotlight]') ?? null
      if (target !== card) {
        // Leaving a card resets it, so the light does not stay frozen where
        // the pointer happened to exit.
        card?.style.removeProperty('--mx')
        card?.style.removeProperty('--my')
        card = target
      }
      if (!card) return
      clientX = e.clientX
      clientY = e.clientY
      if (!rafId) rafId = requestAnimationFrame(paint)
    }

    function bind() {
      root?.removeEventListener('pointermove', onPointerMove)
      if (!hoverMq.matches || motionMq.matches) return
      root?.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    bind()
    hoverMq.addEventListener('change', bind)
    motionMq.addEventListener('change', bind)

    return () => {
      cancelAnimationFrame(rafId)
      root.removeEventListener('pointermove', onPointerMove)
      hoverMq.removeEventListener('change', bind)
      motionMq.removeEventListener('change', bind)
    }
  }, [])

  return ref
}
