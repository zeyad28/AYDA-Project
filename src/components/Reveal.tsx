import type { ReactNode } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

interface RevealProps {
  children: ReactNode
  className?: string
  delayMs?: number
}

// Generic fade-up-on-scroll wrapper for blocks that don't need a specific
// semantic tag. For elements that do (article, section...), call
// useScrollReveal directly instead of wrapping them in this.
export function Reveal({ children, className = '', delayMs = 0 }: RevealProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'} ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
