import { CONTRACT_ADDRESS, LINKS, TOKEN } from '../config'

const SOCIALS = [
  { label: 'X', href: LINKS.x },
  { label: 'Telegram', href: LINKS.telegram },
  { label: 'DexScreener', href: LINKS.dexscreener },
  { label: 'pump.fun', href: LINKS.pumpfun },
]

export default function Footer() {
  return (
    <footer className="relative mx-auto max-w-5xl px-5 pt-16 pb-14 sm:pt-20">
      <nav aria-label="Sineboy links" className="flex flex-wrap justify-center gap-x-8 gap-y-4">
        {SOCIALS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[0.78rem] tracking-[0.18em] text-dim uppercase transition-colors duration-200 hover:text-cyan"
          >
            {social.label}
          </a>
        ))}
      </nav>

      <p className="mt-10 text-center font-mono text-[0.68rem] break-all text-faint">
        {CONTRACT_ADDRESS}
      </p>

      <div className="neon-rule mt-10" />

      <p className="mx-auto mt-8 max-w-xl text-center text-[0.78rem] leading-relaxed text-faint">
        {TOKEN.ticker} is a meme coin with no intrinsic value and no expectation of financial
        return. No team, no roadmap, no promises. Verify the contract address before you buy.
      </p>
    </footer>
  )
}
