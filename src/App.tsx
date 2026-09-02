import Cycle from './components/Cycle'
import Faq from './components/Faq'
import Footer from './components/Footer'
import Hero from './components/Hero'
import HowToBuy from './components/HowToBuy'
import SineRule from './components/SineRule'
import Stats from './components/Stats'
import Ticker from './components/Ticker'
import Tokenomics from './components/Tokenomics'
import WaveBand from './components/WaveBand'
import WaveBackground from './components/WaveBackground'

export default function App() {
  return (
    <>
      {/* Fixed, behind everything. Rendered outside <main> so no ancestor with
          a transform/filter can trap it in a new stacking context. */}
      <WaveBackground />

      <a
        href="#how-to-buy"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-cyan focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>

      <main className="relative">
        <Hero />
        <SineRule />
        <Ticker />
        <Stats />
        <HowToBuy />
        <SineRule flip />
        <Cycle />
        <WaveBand />
        <Tokenomics />
        <Faq />
        <Footer />
      </main>
    </>
  )
}
