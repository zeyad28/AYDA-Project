// Public site assets live in the public 'images' storage bucket.
// Built from the env URL instead of hardcoding the project domain.
const PUBLIC_BUCKET_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images`

export const LOGO_URL = `${PUBLIC_BUCKET_URL}/LOGO.png`
export const HERO_IMAGE_URL = `${PUBLIC_BUCKET_URL}/AYDA.jpg`

interface ImageTransformOptions {
  width: number
  height: number
  quality?: number
}

// Supabase Storage can transform public-bucket images on the fly by
// swapping /object/public/ for /render/image/public/ and adding query
// params - no separate image pipeline needed. This only works for
// Supabase-hosted URLs and only on plans with Image Transformations
// enabled; ProgressiveImage falls back to the original src if the
// transformed request ever fails, so this degrades safely either way.
//
// Both width AND height are required: passing width alone (even without a
// `resize` mode) was observed returning wildly distorted results on this
// project (e.g. a request for width=700 came back 700x3223 - about 9x
// taller than it should be, for every image tested, not just one bad file).
// Pairing an explicit height with resize=cover is what actually produces a
// correctly proportioned, correctly cropped result.
export function getOptimizedImageUrl(url: string, { width, height, quality = 70 }: ImageTransformOptions): string {
  if (!url.includes('/storage/v1/object/public/')) return url
  const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  return `${transformed}?width=${width}&height=${height}&quality=${quality}&resize=cover`
}
