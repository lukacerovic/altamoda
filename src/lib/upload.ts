import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'crypto'

let configured = false
function ensureCloudinaryConfig() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    configured = true
  }
}

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

  ensureCloudinaryConfig()

  const publicId = `uploads/${randomUUID()}`
  const isVideo = file.type.startsWith('video/')
  const resourceType = isVideo ? 'video' : 'image'

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: resourceType, folder: 'altamoda' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve(result)
      }
    ).end(buffer)
  })

  return result.secure_url
}

export async function deleteUploadedFile(url: string): Promise<void> {
  ensureCloudinaryConfig()
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
