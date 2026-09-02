/**
 * Everything that changes between "pre-launch" and "live" lives here.
 * Swap the mint address and the socials, and the rest of the site follows —
 * the buy button and the DexScreener link are derived from CONTRACT_ADDRESS.
 */

/** Solana mint address. TODO: replace with the real mint at launch. */
export const CONTRACT_ADDRESS = 'SiNEboyMEMEwave1111111111111111111111111pump'

export const TOKEN = {
  name: 'Sineboy',
  ticker: '$SINE',
  chain: 'Solana',
  tagline: 'up only. down only. repeat.',
} as const

export const LINKS = {
  buy: `https://pump.fun/coin/${CONTRACT_ADDRESS}`,
  pumpfun: `https://pump.fun/coin/${CONTRACT_ADDRESS}`,
  dexscreener: `https://dexscreener.com/solana/${CONTRACT_ADDRESS}`,
  x: 'https://x.com/sineboysol',
} as const

/**
 * The three numbers on the tokenomics strip, in reading order.
 * `to` + `format` drive both the count-up animation and the rendered value,
 * so there is no second copy of the number to keep in sync.
 */
export const TOKENOMICS = [
  {
    to: 1_000_000_000,
    format: 'compact',
    label: 'Total supply',
    note: 'Minted once. No more, ever.',
    tone: 'cyan',
  },
  {
    to: 100,
    format: 'percent',
    label: 'LP burned',
    note: 'Liquidity keys are gone.',
    tone: 'white',
  },
  {
    to: 0,
    format: 'percent',
    label: 'Tax',
    note: 'Buy, sell, nothing skimmed.',
    tone: 'magenta',
  },
] as const

export const STEPS = [
  {
    title: 'Get a Solana wallet',
    body: 'Install Phantom or Solflare, then send SOL to it from any exchange. A few dollars is enough to start.',
  },
  {
    title: 'Open the buy link',
    body: 'Hit Buy $SINE to land on the pump.fun page. Check the contract address matches the one on this site.',
  },
  {
    title: 'Ride the wave',
    body: 'Swap your SOL and hold through the peaks and the troughs. That is the entire strategy.',
  },
] as const

/**
 * Hand-maintained figures for the stats strip.
 *
 * Rendered as a dated snapshot, never as live data: a number that only changes
 * when someone edits this file must not be presented as real time. Update
 * `takenAt` every time you touch the values, or the label starts lying.
 *
 * TODO: fill these in on launch day. They read as em dashes until then.
 */
export const STATS = {
  takenAt: 'Pre-launch',
  items: [
    { label: 'Holders', value: '—' },
    { label: 'Market cap', value: '—' },
    { label: '24h volume', value: '—' },
    { label: 'Liquidity', value: '—' },
  ],
} as const

/** The joke roadmap. Three phases, no promises -- which is the point. */
export const CYCLE = [
  {
    phase: 'UP',
    tone: 'cyan',
    body: 'Green candles. Everyone is a genius. The group chat will not shut up.',
  },
  {
    phase: 'DOWN',
    tone: 'magenta',
    body: 'Red candles. Everyone was always a long-term holder. Total silence.',
  },
  {
    phase: 'REPEAT',
    tone: 'white',
    body: 'The wave does not stop at the bottom and it does not stop at the top.',
  },
] as const

export const FAQ = [
  {
    q: 'What is $SINE?',
    a: 'A meme coin on Solana with a mascot who surfs a sine wave. There is no product, no yield, no roadmap. The joke is the whole thing.',
  },
  {
    q: 'Is the liquidity locked?',
    a: 'Burned, not locked. The LP tokens were destroyed, so nobody can pull the pool. That includes whoever made this.',
  },
  {
    q: 'Is there a tax on buys or sells?',
    a: 'No. Nothing is skimmed on either side. What you swap is what you get, minus the usual Solana network fee.',
  },
  {
    q: 'How do I know I have the right token?',
    a: 'Check the contract address against the one on this page before you swap. Anyone can mint a token with the same name and ticker, and they do.',
  },
] as const
