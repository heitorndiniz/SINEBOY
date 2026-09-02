import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
   Parallax layers
   ---------------------------------------------------------------------------
   Depth on this page is a gradient, not two extremes:

     0.03x - 0.38x   the canvas planes (grid floor, three waves)
     1.00x           every readable thing: title, copy, cards, numbers
     1.20x - 1.32x   decorative bands that cross faster than the page

   This module owns the layers ABOVE 1x. The canvas planes are handled inside
   WaveBackground, which already has a per-frame loop of its own.

   Nothing readable ever leaves 1x. A lagging headline or a drifting mascot
   reads as a broken element, not as depth -- depth has to come from things the
   eye treats as scenery.

   One scroll listener, one rAF, one scrollY read per frame for all layers.
--------------------------------------------------------------------------- */

/** 1 is normal document scroll. Above 1 the layer crosses the viewport faster,
 *  which is what the eye reads as "closer than the page". */
export const PARALLAX_SPEED = {
  ticker: 1.2,
  divider: 1.32,
} as const

/** Displacement ceiling in px, per layer. Keeps a fast band inside the
 *  whitespace it was given instead of drifting into the next heading. */
export const PARALLAX_MAX = {
  ticker: 58,
  divider: 76,
} as const

type Layer = {
  el: HTMLElement
  speed: number
  max: number
  /** Untransformed position in the document, measured off the layout pass. */
  docTop: number
  height: number
}

const DESKTOP_QUERY = '(min-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const layers = new Set<Layer>()

let desktopMq: MediaQueryList | null = null
let motionMq: MediaQueryList | null = null
let enabled = false
let rafId = 0
let needsMeasure = true

/**
 * Caches where the layer sits in the document with no transform applied.
 * Doing this once per resize keeps the per-frame path free of layout reads --
 * calling getBoundingClientRect every frame would force a synchronous layout,
 * and would read back our own transform from the previous frame.
 */
function measure(layer: Layer) {
  const previous = layer.el.style.transform
  layer.el.style.transform = ''
  const rect = layer.el.getBoundingClientRect()
  layer.docTop = rect.top + window.scrollY
  layer.height = rect.height
  layer.el.style.transform = previous
}

/**
 * The only place scrollY is read, and it runs inside rAF.
 *
 * Displacement is measured from the viewport centre, not from absolute scroll:
 * a layer sits exactly where the layout put it at the moment it is centred,
 * and leans the other way on either side. That is self-limiting -- no global
 * clamp, and no accumulated drift once a section is far off screen.
 */
function frame() {
  rafId = 0

  if (needsMeasure) {
    for (const layer of layers) measure(layer)
    needsMeasure = false
  }

  const scrollY = window.scrollY
  const viewportCentre = window.innerHeight / 2

  for (const layer of layers) {
    const layerCentre = layer.docTop + layer.height / 2 - scrollY
    const fromCentre = layerCentre - viewportCentre
    const raw = -fromCentre * (layer.speed - 1)
    const offset = Math.max(-layer.max, Math.min(layer.max, raw))
    layer.el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
  }
}

/** Coalesces a burst of scroll events into one update per frame. */
function schedule() {
  if (rafId) return
  rafId = requestAnimationFrame(frame)
}

function remeasure() {
  needsMeasure = true
  schedule()
}

function stopListening() {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', remeasure)
  window.removeEventListener('load', remeasure)
  cancelAnimationFrame(rafId)
  rafId = 0
}

function clear(layer: Layer) {
  layer.el.style.transform = ''
  layer.el.style.willChange = ''
}

/** Turns the controller on or off to match the current media queries. */
function sync() {
  const next = Boolean(desktopMq?.matches) && !motionMq?.matches
  if (next === enabled) return
  enabled = next

  if (enabled) {
    for (const layer of layers) layer.el.style.willChange = 'transform'
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
    // Fonts and the hero image settle after first paint and move everything
    // below them, so the cached positions have to be taken again.
    window.addEventListener('load', remeasure)
    remeasure()
  } else {
    stopListening()
    // Static state: no transform, and will-change dropped so the compositor
    // stops holding a layer for something that is not going to move.
    for (const layer of layers) clear(layer)
  }
}

function register(el: HTMLElement, speed: number, max: number): () => void {
  const layer: Layer = { el, speed, max, docTop: 0, height: 0 }
  layers.add(layer)

  if (!desktopMq) {
    desktopMq = window.matchMedia(DESKTOP_QUERY)
    motionMq = window.matchMedia(REDUCED_MOTION_QUERY)
    desktopMq.addEventListener('change', sync)
    motionMq.addEventListener('change', sync)
  }

  sync()
  // sync() no-ops when the state has not changed, so a layer registering after
  // the controller is already running has to opt itself in here.
  if (enabled) {
    el.style.willChange = 'transform'
    remeasure()
  }

  return () => {
    layers.delete(layer)
    clear(layer)
    if (layers.size > 0) return

    // Last layer gone: tear the controller all the way down. StrictMode runs
    // this between its two mounts, so it must leave nothing a second
    // register() cannot rebuild.
    stopListening()
    desktopMq?.removeEventListener('change', sync)
    motionMq?.removeEventListener('change', sync)
    desktopMq = null
    motionMq = null
    enabled = false
    needsMeasure = true
  }
}

/** Returns a ref for an element that should cross the viewport at `speed`. */
export function useParallaxLayer<T extends HTMLElement>(speed: number, max: number) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return register(el, speed, max)
  }, [speed, max])

  return ref
}
