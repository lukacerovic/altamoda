import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
]
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm']

// Magic byte signatures for file type verification
const MAGIC_BYTES: Record<string, number[][]> = {
  'jpg':  [[0xFF, 0xD8, 0xFF]],
  'jpeg': [[0xFF, 0xD8, 0xFF]],
  'png':  [[0x89, 0x50, 0x4E, 0x47]],
  'gif':  [[0x47, 0x49, 0x46, 0x38]],
  'webp': [[0x52, 0x49, 0x46, 0x46]],
  'mp4':  [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
  'webm': [[0x1A, 0x45, 0xDF, 0xA3]],
}

function verifyMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext]
  if (!signatures) return false

  if (ext === 'mp4') {
    if (buffer.length < 8) return false
    return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  }

  for (const sig of signatures) {
    if (buffer.length < sig.length) continue
    const match = sig.every((byte, i) => buffer[i] === byte)
    if (match) return true
  }
  return false
}

export async function saveUploadedFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fajl je prevelik (max 25MB)')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Nepodržan tip fajla')
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Nepodržana ekstenzija fajla')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (!verifyMagicBytes(buffer, ext)) {
    throw new Error('Sadržaj fajla ne odgovara tipu fajla')
  }

  // Configure fresh every call — serverless functions can have stale module state
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET

  if (!cloud || !key || !secret) {
    throw new Error('Cloudinary credentials not configured')
  }

  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret })

  const publicId = `uploads/${randomUUID()}`
  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' as const : 'image' as const
  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    resource_type: resourceType,
    folder: 'altamoda',
  })

  return result.secure_url
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/**
 * Resolve an input URL to a direct image URL. If the URL already points at an
 * image it is returned as-is; if it points at an HTML page (e.g. an Instagram
 * post link like /p/XXXX/), the page is fetched and its `og:image` meta tag is
 * extracted — that's the public preview image Instagram exposes for link
 * unfurling.
 */
async function resolveToImageUrl(rawUrl: string): Promise<string> {
  // Looks like a direct image file already.
  let pathname = ''
  try {
    pathname = new URL(rawUrl).pathname
  } catch {
    /* validated by caller */
  }
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(pathname)) return rawUrl

  let res: Response
  try {
    res = await fetch(rawUrl, {
      headers: {
        // Use Meta's link-unfurling crawler UA: Instagram serves the og:image
        // meta tag to this crawler, but returns a JS app shell (no meta tags)
        // to a normal browser UA.
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
  } catch {
    throw new Error('Nije moguće pristupiti datom URL-u')
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.startsWith('image/')) return rawUrl
  if (!res.ok || !contentType.includes('html')) {
    throw new Error('Nije moguće preuzeti sliku sa datog URL-a')
  }

  const html = await res.text()
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (!match?.[1]) {
    throw new Error('Sa ove stranice nije moguće pročitati sliku. Nalepite direktan URL slike ili je otpremite.')
  }
  return decodeHtmlEntities(match[1])
}

/**
 * Import a remote image (e.g. an Instagram post link or image URL) into our own
 * Cloudinary account and return the re-hosted secure URL. Re-hosting is required
 * because the storefront CSP only whitelists our own CDN, and Instagram CDN URLs
 * are hotlink-protected and expire.
 */
export async function saveImageFromUrl(remoteUrl: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(remoteUrl)
  } catch {
    throw new Error('Nevažeći URL slike')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('URL mora počinjati sa http(s)')
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!cloud || !key || !secret) {
    throw new Error('Cloudinary credentials not configured')
  }
  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret })

  const imageUrl = await resolveToImageUrl(remoteUrl)

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `uploads/${randomUUID()}`,
      resource_type: 'image',
      folder: 'altamoda',
    })
    return result.secure_url
  } catch {
    throw new Error('Nije moguće preuzeti sliku sa datog URL-a')
  }
}

export async function deleteUploadedFile(url: string): Promise<void> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (cloud && key && secret) {
    cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret })
  }

  // Extract public_id from Cloudinary URL
  const match = url.match(/\/altamoda\/uploads\/([a-f0-9-]+)/)
  if (!match) {
    // Try legacy local path format /uploads/filename.ext
    const legacyMatch = url.match(/^\/uploads\/([a-f0-9-]+)\.\w+$/)
    if (!legacyMatch) {
      throw new Error('Nevažeća putanja fajla')
    }
    // Legacy local file — nothing to delete on Cloudinary
    return
  }

  const publicId = `altamoda/uploads/${match[1]}`
  await cloudinary.uploader.destroy(publicId)
}
