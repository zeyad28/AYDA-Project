import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Returns a vertical pixel offset tracking the element's own position
// relative to the viewport center, scaled by `speed`. A background layer
// with a small negative speed drifts slower than the page scroll - the
// classic parallax depth cue - while foreground content stays static.
export function useParallax<T extends HTMLElement>(speed: number) {
  const ref = useRef<T | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) return

    let ticking = false
    const measure = () => {
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const distanceFromCenter = rect.top + rect.height / 2 - window.innerHeight / 2
        setOffset(distanceFromCenter * speed)
      }
      ticking = false
    }
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [speed])

  return { ref, offset }
}
