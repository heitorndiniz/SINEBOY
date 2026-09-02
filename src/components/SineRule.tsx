import { useId } from 'react'
import { PARALLAX_MAX, PARALLAX_SPEED, useParallaxLayer } from '../hooks/useParallax'

/**
 * The section divider: the same sine curve the hero animates, frozen into a
 * static SVG. It costs nothing to render and keeps one shape running through
 * the whole page instead of a generic hairline.
 */
export default function SineRule({ flip = false }: { flip?: boolean }) {
  // Gradient ids must be unique per instance or the second one silently
  // reuses the first definition.
  const gradientId = useId()
  // The nearest plane on the page. Both dividers sit in generous section
  // padding, so a fast band has room to travel without touching a heading.
  const ref = useParallaxLayer<HTMLDivElement>(PARALLAX_SPEED.divider, PARALLAX_MAX.divider)

  return (
    <div ref={ref} aria-hidden="true" className="relative w-full overflow-hidden">
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="block h-10 w-full"
        style={{ transform: flip ? 'scaleY(-1)' : undefined }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0" />
            <stop offset="22%" stopColor="var(--cyan)" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="80%" stopColor="var(--magenta)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--magenta)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Two cubic periods, sampled from y = 20 + 12*sin(x). */}
        <path
          d="M0 20 C 75 -4, 225 -4, 300 20 S 525 44, 600 20 S 825 -4, 900 20 S 1125 44, 1200 20"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
