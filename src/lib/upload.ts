import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
]

export async function saveUploadedFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fajl je prevelik (max 10MB)')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Nepodržan tip fajla')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await mkdir(UPLOAD_DIR, { recursive: true })
  const filePath = path.join(UPLOAD_DIR, filename)
  await writeFile(filePath, buffer)

  return `/uploads/${filename}`
}
