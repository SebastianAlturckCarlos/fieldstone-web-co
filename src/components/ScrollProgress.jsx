import { motion, useScroll, useSpring } from 'framer-motion'

// Thin ember bar across the top that fills as you scroll.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-linear-to-r from-ember-300 via-ember-400 to-ember-600"
    />
  )
}
