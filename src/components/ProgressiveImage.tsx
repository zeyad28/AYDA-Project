import { useState } from 'react'
import { getOptimizedImageUrl } from '../lib/assets'

interface ProgressiveImageProps {
  src: string
  alt: string
  width: number
  height: number
  quality?: number
  eager?: boolean
  className?: string
  containerClassName?: string
}

// Shows a skeleton shimmer, then a tiny blurred placeholder, then fades in
// the real image once it finishes downloading - so a slow connection sees
// something immediately instead of a blank box, and the final swap never
// pops in abruptly. The full-quality image itself is requested through
// Supabase's image transform endpoint (see getOptimizedImageUrl) sized to
// width x height, so the browser downloads a file matched to how large it
// will actually render instead of the original upload at full resolution.
//
// width/height should match the aspect ratio of containerClassName's box
// (both are required - see getOptimizedImageUrl for why passing only a
// width produced badly distorted images on this project).
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  quality = 70,
  eager = false,
  className = '',
  containerClassName = '',
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)

  const optimizedSrc = getOptimizedImageUrl(src, { width, height, quality })
  const placeholderSrc = getOptimizedImageUrl(src, {
    width: 24,
    height: Math.max(1, Math.round((24 * height) / width)),
    quality: 20,
  })
  const loadingAttr = eager ? 'eager' : 'lazy'

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <div
        className={`absolute inset-0 bg-sand-deep transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'animate-pulse opacity-100'
        }`}
        aria-hidden="true"
      />

      {!loaded && placeholderSrc !== optimizedSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          loading={loadingAttr}
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}

      <img
        src={useOriginal ? src : optimizedSrc}
        alt={alt}
        loading={loadingAttr}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Image Transformations may not be enabled on this Supabase
          // plan - fall back to the untransformed original rather than
          // showing a broken image. If the original ALSO fails, stop the
          // skeleton from pulsing forever rather than retry endlessly.
          if (!useOriginal) setUseOriginal(true)
          else setLoaded(true)
        }}
        className={`relative h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  )
}
