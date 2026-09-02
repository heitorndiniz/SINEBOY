import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
   WaveBackground
   ---------------------------------------------------------------------------
   A neon sine wave rolling over a perspective grid floor - the key art, drawn
   live. Sits behind everything: position fixed, z-index -1, pointer-events none.

   Three things drive the cost, and all three are turned down on small screens:
   sample density along the wave, number of grid lines, and frame rate.

   Rendering notes:
   - The "neon tube" look is three strokes of the same path (wide + faint,
     medium, thin white core) composited with `lighter`. That is much cheaper
     than ctx.shadowBlur, which re-rasterises the whole path on every stroke and
     is the usual reason canvas glow tanks on mobile GPUs.
   - Gradients and per-column colours are rebuilt on resize only, never per frame.
--------------------------------------------------------------------------- */

type Quality = {
  /** How many of the WAVES below to draw. */
  waveCount: number
  /** Horizontal distance in CSS px between sine samples. Higher = coarser. */
  sampleStep: number
  gridCols: number
  gridRows: number
  /** Device pixel ratio ceiling. Mobile GPUs are fill-rate bound, not CPU bound. */
  maxDpr: number
  fps: number
}

const DESKTOP: Quality = {
  waveCount: 3,
  sampleStep: 5,
  gridCols: 26,
  gridRows: 16,
  maxDpr: 2,
  fps: 60,
}

/** Below 768px: fewer waves, coarser sampling, half the frame rate.
 *  sampleStep stays at 8 rather than going higher: a phone viewport is narrow
 *  enough that a bigger step leaves visibly straight segments in the curve. */
const MOBILE: Quality = {
  waveCount: 2,
  sampleStep: 8,
  gridCols: 13,
  gridRows: 10,
  maxDpr: 1.5,
  fps: 30,
}

/**
 * Wave layers in normalised units so they scale with any viewport:
 * `amp` and `y` are fractions of height, `freq` is cycles across the width,
 * `speed` is cycles per second (negative travels the other way).
 */
const WAVES = [
  // Rest positions are spread wider than the depths, so the planes stay apart
  // instead of piling up on each other once the fastest one has climbed.
  { amp: 0.13, freq: 1.15, speed: 0.14, y: 0.66, width: 3, alpha: 1, depth: 0.38 },
  { amp: 0.075, freq: 2.1, speed: -0.2, y: 0.44, width: 1.8, alpha: 0.45, depth: 0.18 },
  { amp: 0.16, freq: 0.8, speed: 0.09, y: 0.26, width: 2, alpha: 0.28, depth: 0.08 },
] as const

/** The floor is the deepest plane, so it barely moves. */
const GRID_DEPTH = 0.03

/* --- Cooling -------------------------------------------------------------
   The euphoria at the top settles as you read down. Past the hero the wave
   loses amplitude and brightness, which is both the point and the thing that
   keeps five thousand pixels of copy readable over a live background. */

/** How much intensity is lost by the time cooling is complete. */
const COOL_DEPTH = 0.62
/** Distance over which that happens, in viewport heights. */
const COOL_OVER = 1.8

/* --- 2.1 Cursor ----------------------------------------------------------
   Horizontal cursor position pushes the wave's phase, vertical nudges its
   amplitude. Both are lerped, never assigned: water has inertia, and a direct
   assignment reads as the wave teleporting to the mouse. */

/** Fraction of the remaining distance closed per frame. */
const CURSOR_LERP = 0.08
/** Radians of phase the cursor can push, edge to edge. */
const CURSOR_PHASE_PUSH = Math.PI * 0.9
/** Amplitude swing from the cursor, as a fraction of the wave's own. */
const CURSOR_AMP_PUSH = 0.18

/* --- 2.2 Ripples ---------------------------------------------------------
   A click sends a ring outward along the wave. Cheap on purpose: the band is
   a parabola, not a gaussian, and samples outside it cost one compare. */

const RIPPLE_LIFE = 1.5 // seconds
const RIPPLE_SPEED = 640 // px per second the ring travels
// Half-width of the moving crest. Narrow bands read as a kink in the line
// rather than as a swell passing under it.
const RIPPLE_BAND = 240
const RIPPLE_AMP = 72 // px at full strength
const RIPPLE_MAX = 3

/** Where the grid floor's vanishing line sits, as a fraction of viewport height. */
const HORIZON = 0.66

const MOBILE_QUERY = '(max-width: 767px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Reads a CSS custom property off :root so the palette has one home (index.css). */
function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/** Mixes two hex colours. Tints the grid across the cyan-to-magenta sweep. */
function mix(a: string, b: string, t: number, alpha: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t)
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t)
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t)
  return `rgba(${r},${g},${bl},${alpha})`
}

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    /* ---- Lifecycle bookkeeping -------------------------------------------
       Everything mutable lives in this closure, not in React state. A frame
       counter in state would re-render the tree 60 times a second; the canvas
       is a deliberate escape hatch from React's render cycle.

       `rafId` and the listeners below are all torn down in the cleanup return.
       That matters under StrictMode in dev, where the effect mounts twice - an
       incomplete cleanup leaves a second rAF loop running forever, which shows
       up as "the animation is mysteriously twice as fast".
    --------------------------------------------------------------------- */
    let rafId = 0
    let running = false
    let elapsed = 0 // animation clock in seconds; only advances while visible
    let lastFrame = 0

    let width = 0
    let height = 0

    // 2.1 -- target is written by the pointer handler, current is what the
    // frame actually draws. Both normalised to -1..1 from the viewport centre.
    let targetX = 0
    let targetY = 0
    let cursorX = 0
    let cursorY = 0

    // 2.2 -- newest last. Capped at RIPPLE_MAX; the oldest is dropped.
    const ripples: { x: number; y: number; born: number }[] = []
    // Same value as `height`; kept separate because every composition anchor
    // below is expressed as a fraction of the viewport, never of the scroll.
    let layoutHeight = 0
    let quality: Quality = DESKTOP

    // Rebuilt on resize only.
    let waveGradient: CanvasGradient | null = null
    let columnColors: string[] = []

    const mobileMq = window.matchMedia(MOBILE_QUERY)
    const motionMq = window.matchMedia(REDUCED_MOTION_QUERY)

    const cyan = cssVar('--cyan', '#22d3ee')
    const magenta = cssVar('--magenta', '#ff2fd0')

    function resize() {
      if (!canvas || !ctx) return

      quality = mobileMq.matches ? MOBILE : DESKTOP

      width = window.innerWidth
      // innerHeight, not 100vh: on mobile Safari the visual viewport shrinks as
      // the URL bar collapses, and a vh-sized canvas would letterbox.
      height = window.innerHeight
      layoutHeight = height

      const dpr = Math.min(window.devicePixelRatio || 1, quality.maxDpr)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      // Draw in CSS pixels from here on; the backing store handles the density.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // The cyan and magenta halves hold their own colour for most of the run
      // and only blow out to white where they meet, like the artwork. A wider
      // white band washes the whole wave grey once the halo is stacked on top.
      waveGradient = ctx.createLinearGradient(0, 0, width, 0)
      waveGradient.addColorStop(0, cyan)
      waveGradient.addColorStop(0.4, cyan)
      waveGradient.addColorStop(0.52, '#ffffff')
      waveGradient.addColorStop(0.64, magenta)
      waveGradient.addColorStop(1, magenta)

      columnColors = Array.from({ length: quality.gridCols + 1 }, (_, i) =>
        mix(cyan, magenta, i / quality.gridCols, 0.75),
      )
    }

    /** Perspective floor: horizontals bunched near the horizon, verticals converging. */
    function drawGrid(t: number, shift: number, cool: number) {
      if (!ctx) return
      const horizonY = layoutHeight * HORIZON
      // Geometry is computed once, independent of the shift, then the whole
      // plane is translated. Folding the shift into `depth` instead would keep
      // restretching the perspective and the rows would crawl as you scroll.
      // The floor is drawn past the bottom edge by the largest shift it can
      // take, so lifting it never exposes bare background; the canvas clips it.
      const floorBottom = height + GRID_DEPTH * layoutHeight
      const depth = floorBottom - horizonY
      if (depth <= 0) return

      const { gridCols } = quality
      // Row count follows the extra distance so the floor keeps its density.
      const gridRows = Math.round(quality.gridRows * (depth / (layoutHeight - horizonY)))
      const centerX = width / 2
      // Fractional row offset - the floor scrolls toward the viewer and wraps.
      const phase = (t * 0.14) % 1

      ctx.save()
      ctx.translate(0, -shift)
      ctx.lineWidth = 1

      // Horizontals. The `d ** 2.3` falloff is the perspective: rows crowd
      // together near the horizon and stretch out toward the bottom edge.
      for (let i = 0; i <= gridRows; i++) {
        const d = (i + phase) / gridRows
        if (d <= 0 || d > 1) continue
        const y = horizonY + depth * d ** 2.3
        ctx.strokeStyle = mix(cyan, magenta, 0.5, 0.4 * d * cool)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Verticals: each starts at the vanishing point and fans out to the
      // bottom edge, so they converge without any extra maths.
      ctx.save()
      ctx.globalAlpha = 0.6 * cool
      for (let j = 0; j <= gridCols; j++) {
        const spread = (j / gridCols - 0.5) * width * 2.4
        ctx.strokeStyle = columnColors[j] ?? 'rgba(255,255,255,0.2)'
        ctx.beginPath()
        ctx.moveTo(centerX, horizonY)
        ctx.lineTo(centerX + spread, height)
        ctx.stroke()
      }
      ctx.restore()

      // Erase the grid back out around the horizon so the convergence point
      // dissolves instead of showing as a hard pencil-point. Still inside the
      // translated space, so the fade tracks the horizon as the plane moves.
      ctx.globalCompositeOperation = 'destination-out'
      const fade = ctx.createLinearGradient(0, horizonY, 0, horizonY + depth * 0.5)
      fade.addColorStop(0, 'rgba(0,0,0,1)')
      fade.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = fade
      ctx.fillRect(0, horizonY, width, depth * 0.5)
      ctx.restore()
    }

    /** Vertical displacement all live ripples add to one point on a wave. */
    function rippleAt(x: number, baseY: number, t: number): number {
      if (ripples.length === 0) return 0
      let sum = 0

      for (let i = 0; i < ripples.length; i++) {
        const ripple = ripples[i]
        const age = t - ripple.born
        if (age < 0 || age > RIPPLE_LIFE) continue

        // Distance from this sample to the moving crest.
        const offset = Math.abs(x - ripple.x) - age * RIPPLE_SPEED
        const d = offset / RIPPLE_BAND
        if (d <= -1 || d >= 1) continue

        // Parabolic envelope, linear fade over the ripple's life. A gaussian
        // looks marginally better and costs an exp() per sample per ripple.
        const band = 1 - d * d
        const fade = 1 - age / RIPPLE_LIFE
        // A click far above or below a given wave barely disturbs it.
        const reach = 1 - Math.min(Math.abs(ripple.y - baseY) / height, 1)
        sum += Math.cos(d * Math.PI) * band * fade * reach * RIPPLE_AMP
      }
      return sum
    }

    function drawWaves(t: number, scrolled: number, cool: number) {
      if (!ctx || !waveGradient) return
      const count = Math.min(quality.waveCount, WAVES.length)

      ctx.save()
      // `lighter` (additive) is what makes overlapping strokes read as light
      // rather than as paint - the core of the neon look.
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      for (let w = 0; w < count; w++) {
        const wave = WAVES[w]
        // Nearer planes react more to the cursor, same as they scroll more.
        const react = wave.depth / WAVES[0].depth
        // Cooling flattens the curve as well as dimming it -- a wave that only
        // faded would still be a bright shape crossing the copy.
        const amp =
          wave.amp * layoutHeight * (1 + cursorY * CURSOR_AMP_PUSH * react) * (0.45 + 0.55 * cool)
        // Each wave is its own depth plane: the nearest lifts three times as
        // fast as the furthest, which is what separates them as you scroll.
        const baseY = wave.y * layoutHeight - wave.depth * scrolled
        const k = (wave.freq * Math.PI * 2) / width
        const phase = t * wave.speed * Math.PI * 2 + cursorX * CURSOR_PHASE_PUSH * react

        // Build the path once, then stroke it three times at different widths.
        const path = new Path2D()
        for (let x = 0; x <= width + quality.sampleStep; x += quality.sampleStep) {
          const y = baseY + Math.sin(x * k + phase) * amp + rippleAt(x, baseY, t)
          if (x === 0) path.moveTo(x, y)
          else path.lineTo(x, y)
        }

        ctx.strokeStyle = waveGradient

        // Halo. Kept narrow: a very wide additive halo desaturates the colour
        // underneath it and the wave ends up reading grey.
        ctx.globalAlpha = 0.14 * wave.alpha * cool
        ctx.lineWidth = wave.width * 5.5
        ctx.stroke(path)

        // Body.
        ctx.globalAlpha = 0.8 * wave.alpha * cool
        ctx.lineWidth = wave.width * 2
        ctx.stroke(path)

        // White core, front wave only - that is what sells the glass tube.
        if (w === 0) {
          ctx.globalAlpha = 0.95 * cool
          ctx.strokeStyle = 'rgba(255,255,255,0.95)'
          ctx.lineWidth = wave.width * 0.85
          ctx.stroke(path)
        }
      }
      ctx.restore()
    }

    function draw(t: number) {
      if (!ctx) return

      // One scrollY read per frame, inside the loop that is already running.
      // Clamped to a viewport: past that the hero is gone, and letting the
      // planes keep climbing would empty the background behind the sections
      // further down the page.
      const parallax = !mobileMq.matches && !motionMq.matches
      const rawScroll = window.scrollY
      const scrolled = parallax ? Math.min(rawScroll, layoutHeight) : 0
      // Unclamped, unlike the parallax offset: cooling keeps going long after
      // the hero is gone, which is where the long content sections are.
      const cool =
        1 - Math.min(rawScroll / (layoutHeight * COOL_OVER), 1) * COOL_DEPTH

      // Ease toward the cursor by a fixed fraction of the gap each frame.
      // Disabled below 768px: touch has no hover, and the cost buys nothing.
      if (!parallax) {
        targetX = 0
        targetY = 0
      }
      cursorX += (targetX - cursorX) * CURSOR_LERP
      cursorY += (targetY - cursorY) * CURSOR_LERP

      // Drop ripples that have finished. Oldest first, so one pass is enough.
      while (ripples.length > 0 && t - ripples[0].born > RIPPLE_LIFE) ripples.shift()

      ctx.clearRect(0, 0, width, height)
      drawGrid(t, GRID_DEPTH * scrolled, cool)
      drawWaves(t, scrolled, cool)
    }

    function frame(now: number) {
      rafId = requestAnimationFrame(frame)

      const delta = now - lastFrame
      const interval = 1000 / quality.fps
      if (delta < interval) return
      // Keep the remainder so the cap does not drift into a slower actual rate.
      lastFrame = now - (delta % interval)

      // Clamped so returning from a background tab resumes instead of jumping.
      elapsed += Math.min(delta, 100) / 1000
      draw(elapsed)
    }

    function start() {
      if (running || motionMq.matches) return
      running = true
      lastFrame = performance.now()
      rafId = requestAnimationFrame(frame)
    }

    function stop() {
      running = false
      cancelAnimationFrame(rafId)
    }

    /** Reduced motion: render one static frame and never schedule another. */
    function apply() {
      stop()
      resize()
      syncPointer()
      if (motionMq.matches) draw(0)
      else start()
    }

    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    function onPointerMove(e: PointerEvent) {
      if (mobileMq.matches) return
      // Only stores. width/height are cached from resize(), so a pointermove
      // never touches layout -- this handler fires hundreds of times a second.
      targetX = (e.clientX / width) * 2 - 1
      targetY = (e.clientY / height) * 2 - 1
    }

    function onPointerLeave() {
      targetX = 0
      targetY = 0
    }

    function onPointerDown(e: PointerEvent) {
      // Buttons and links own their own press feedback; a ripple there would
      // read as the click missing its target.
      const target = e.target as Element | null
      if (target?.closest('a, button, input, [role="button"]')) return

      // Same clock the waves are drawn on, so age maths needs no conversion.
      ripples.push({ x: e.clientX, y: e.clientY, born: elapsed })
      if (ripples.length > RIPPLE_MAX) ripples.shift()
    }

    /** Pointer input is motion; under reduced motion nothing is bound at all. */
    function syncPointer() {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerleave', onPointerLeave)
      onPointerLeave()

      if (motionMq.matches) return
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onPointerDown, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave)
    }

    apply()

    // ResizeObserver on <html> catches mobile URL-bar collapse and desktop
    // resizes alike; the window `resize` event alone misses some mobile cases.
    const ro = new ResizeObserver(() => {
      resize()
      if (motionMq.matches) draw(0)
    })
    ro.observe(document.documentElement)

    mobileMq.addEventListener('change', apply)
    motionMq.addEventListener('change', apply)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      ro.disconnect()
      mobileMq.removeEventListener('change', apply)
      motionMq.removeEventListener('change', apply)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerleave', onPointerLeave)
    }
    // Empty deps on purpose: the loop is created once for the component's
    // lifetime. Nothing from props or state feeds it, so it must not rebuild.
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {/* Static vignette. Keeping it in CSS keeps it off the per-frame budget
          and gives the hero copy a dark bed to sit on. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(105% 62% at 50% 36%, rgba(5,7,13,0.62) 0%, rgba(5,7,13,0.22) 48%, rgba(5,7,13,0) 78%)',
        }}
      />
    </div>
  )
}
