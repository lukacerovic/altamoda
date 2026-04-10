import { writeFile, mkdir, unlink, access } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
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
  'gif':  [[0x47, 0x49, 0x46, 0x38]],  // GIF8
  'webp': [[0x52, 0x49, 0x46, 0x46]],  // RIFF (WebP container)
  'mp4':  [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],  // ftyp at offset 4
  'webm': [[0x1A, 0x45, 0xDF, 0xA3]],  // EBML header
}

function verifyMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext]
  if (!signatures) return false

  // MP4 has ftyp at offset 4, not offset 0
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

  // Verify actual file content matches claimed type
  if (!verifyMagicBytes(buffer, ext)) {
    throw new Error('Sadržaj fajla ne odgovara tipu fajla')
  }

  const filename = `${randomUUID()}.${ext}`

  await mkdir(UPLOAD_DIR, { recursive: true })
  const filePath = path.join(UPLOAD_DIR, filename)
  await writeFile(filePath, buffer)

  return `/uploads/${filename}`
}

export async function deleteUploadedFile(url: string): Promise<void> {
  // Only allow deleting files from /uploads/
  const match = url.match(/^\/uploads\/([a-f0-9-]+\.\w+)$/)
  if (!match) {
    throw new Error('Nevažeća putanja fajla')
  }

  const filePath = path.join(UPLOAD_DIR, match[1])

  // Ensure the resolved path is still within UPLOAD_DIR
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error('Nevažeća putanja fajla')
  }

  try {
    await access(resolved)
    await unlink(resolved)
  } catch {
    // File doesn't exist — not an error, it may have been deleted already
  }
}
