/**
 * Custom next/image loader for Cloudinary.
 * Appends Cloudinary transformation parameters to URLs so optimization
 * is handled by Cloudinary CDN rather than the Next.js server.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // Only transform Cloudinary URLs
  if (!src.includes('res.cloudinary.com')) return src

  const q = quality || 75
  // Insert transforms after /upload/
  return src.replace('/upload/', `/upload/f_auto,q_${q},w_${width}/`)
}
