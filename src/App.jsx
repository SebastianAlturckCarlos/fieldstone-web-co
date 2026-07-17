import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import PainPoints from './components/PainPoints'
import Platform from './components/Platform'
import Security from './components/Security'
import TradePlans from './components/TradePlans'
import Process from './components/Process'
import Quote from './components/Quote'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'

export default function App() {
  return (
    <div className="grain">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <PainPoints />
        <Platform />
        <Security />
        <TradePlans />
        <Process />
        <Quote />
      </main>
      <Footer />
    </div>
  )
}
