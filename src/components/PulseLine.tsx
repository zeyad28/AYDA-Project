interface PulseLineProps {
  className?: string
  strokeWidth?: number
}

const ECG_PATH =
  'M0,50 L110,50 L140,50 L158,22 L176,78 L194,12 L212,62 L230,50 L400,50 L430,50 L448,22 L466,78 L484,12 L502,62 L520,50 L600,50'

// The recurring signature motif: an ECG/heart-monitor trace. A faint static
// copy stays always visible for shape/context; a brighter copy pulses in a
// continuous "lub-dub...pause" rhythm (opacity + glow, see the `heartbeat`
// keyframes in tailwind.config.js) so it reads unmistakably as a live pulse
// instead of a decoration that happened to animate once. Skips the pulsing
// layer under prefers-reduced-motion via Tailwind's motion-safe: variant.
export function PulseLine({ className = '', strokeWidth = 3 }: PulseLineProps) {
  return (
    <svg viewBox="0 0 600 100" fill="none" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        d={ECG_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.25}
      />
      <path
        d={ECG_PATH}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-center motion-safe:animate-heartbeat"
      />
    </svg>
  )
}
