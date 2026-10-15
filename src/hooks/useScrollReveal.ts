import { useEffect, useRef, useState } from 'react'

// Fades an element in the first time it enters the viewport. Respects
// prefers-reduced-motion by starting (and staying) visible.
export function useScrollReveal<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options is expected to be a stable literal at call sites
  }, [visible])

  return { ref, visible }
}
