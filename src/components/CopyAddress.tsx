import { useCallback, useEffect, useRef, useState } from 'react'
import { CONTRACT_ADDRESS } from '../config'

/** Middle-truncates the mint so it stays one line on a narrow phone. */
function shorten(address: string, edge = 6): string {
  if (address.length <= edge * 2 + 3) return address
  return `${address.slice(0, edge)}...${address.slice(-edge)}`
}

/**
 * Copy-the-contract button. Swaps its own label to "Copied" for two seconds,
 * and announces the change to screen readers via the live region.
 */
export default function CopyAddress() {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Clear a pending reset if the component unmounts mid-timeout.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    } catch {
      // navigator.clipboard is undefined on http:// and in older in-app
      // browsers (Telegram, Twitter). Fall back to the execCommand trick.
      const el = document.createElement('textarea')
      el.value = CONTRACT_ADDRESS
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(el)
      }
    }

    setCopied(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-bg/70 px-5 py-3.5 font-mono text-[0.8rem] tracking-tight text-dim transition-colors hover:border-cyan/50 hover:text-ink sm:w-auto sm:px-6"
      style={{ transitionDuration: '180ms' }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full transition-colors"
        style={{
          background: copied ? 'var(--cyan)' : 'var(--ink-faint)',
          boxShadow: copied ? '0 0 10px var(--cyan)' : 'none',
        }}
      />
      <span className="sm:hidden">{shorten(CONTRACT_ADDRESS)}</span>
      <span className="hidden sm:inline">{shorten(CONTRACT_ADDRESS, 10)}</span>
      <span
        className="border-l border-white/12 pl-2.5 font-sans text-[0.7rem] font-semibold tracking-[0.14em] uppercase"
        style={{ color: copied ? 'var(--cyan)' : undefined }}
      >
        {copied ? 'Copied' : 'Copy'}
      </span>
      {/* Politely announced, so the visual-only state change is not silent. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Contract address copied to clipboard' : ''}
      </span>
    </button>
  )
}
