import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Services from './components/Services'
import Pricing from './components/Pricing'
import Process from './components/Process'
import About from './components/About'
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
        <Services />
        <Pricing />
        <Process />
        <About />
        <Quote />
      </main>
      <Footer />
    </div>
  )
}
