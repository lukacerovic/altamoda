/**
 * Orphan upload cleanup.
 *
 * Lists every file in /public/uploads/ and cross-references each filename
 * against every DB column that stores an upload URL. Files nobody references
 * are moved to /public/uploads/_trash/ (or deleted with --delete).
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-uploads.ts                 # dry-run (default, report only)
 *   pnpm tsx scripts/cleanup-uploads.ts --execute       # move orphans to _trash/
 *   pnpm tsx scripts/cleanup-uploads.ts --execute --delete  # permanently delete orphans
 *
 * Always start with a dry run. Review the list. Then run --execute.
 * Trash preserves files for 30 days (clean manually after).
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const TRASH_DIR = path.join(UPLOADS_DIR, '_trash')

const args = process.argv.slice(2)
const EXECUTE = args.includes('--execute')
const DELETE = args.includes('--delete')

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(msg)
}

/**
 * Pull every column where an upload URL could live, then build a Set of
 * referenced filenames. We match by basename (the UUID.ext), not full URL,
 * so it tolerates `/uploads/x.png` and `https://.../uploads/x.png` alike.
 */
async function collectReferencedFilenames(): Promise<Set<string>> {
  const refs = new Set<string>()

  const addIfUploadsPath = (raw: string | null | undefined) => {
    if (!raw || typeof raw !== 'string') return
    // Find every /uploads/xxx substring (URL may contain multiple)
    const matches = raw.match(/\/uploads\/[^"'\s)]+/g)
    if (!matches) return
    for (const m of matches) {
      const filename = m.split('/').pop()
      if (filename) refs.add(decodeURIComponent(filename))
    }
  }

  // ProductImage.url
  const productImages = await prisma.productImage.findMany({ select: { url: true } })
  productImages.forEach((p) => addIfUploadsPath(p.url))
  log(`  • ProductImage.url      — scanned ${productImages.length} rows`)

  // Brand.logoUrl
  const brands = await prisma.brand.findMany({ select: { logoUrl: true } })
  brands.forEach((b) => addIfUploadsPath(b.logoUrl))
  log(`  • Brand.logoUrl         — scanned ${brands.length} rows`)

  // Banner.imageUrl + mobileImageUrl
  const banners = await prisma.banner.findMany({ select: { imageUrl: true, mobileImageUrl: true } })
  banners.forEach((b) => {
    addIfUploadsPath(b.imageUrl)
    addIfUploadsPath(b.mobileImageUrl)
  })
  log(`  • Banner.imageUrl       — scanned ${banners.length} rows`)

  // User.avatarUrl
  const users = await prisma.user.findMany({ select: { avatarUrl: true } })
  users.forEach((u) => addIfUploadsPath(u.avatarUrl))
  log(`  • User.avatarUrl        — scanned ${users.length} rows`)

  // NewsletterTemplate.thumbnail + htmlContent (HTML may embed <img src>)
  const tpl = await prisma.newsletterTemplate.findMany({ select: { thumbnail: true, htmlContent: true } })
  tpl.forEach((t) => {
    addIfUploadsPath(t.thumbnail)
    addIfUploadsPath(t.htmlContent)
  })
  log(`  • NewsletterTemplate    — scanned ${tpl.length} rows`)

  // NewsletterCampaign.content — email HTML may embed image URLs
  const campaigns = await prisma.newsletterCampaign.findMany({ select: { content: true } })
  campaigns.forEach((c) => addIfUploadsPath(c.content))
  log(`  • NewsletterCampaign    — scanned ${campaigns.length} rows`)

  // SiteSetting.value — stores JSON with hero images, etc.
  const settings = await prisma.siteSetting.findMany({ select: { value: true } })
  settings.forEach((s) => addIfUploadsPath(typeof s.value === 'string' ? s.value : JSON.stringify(s.value)))
  log(`  • SiteSetting.value     — scanned ${settings.length} rows`)

  // Product.description + content — rich-text HTML may inline images
  const products = await prisma.product.findMany({ select: { description: true } })
  products.forEach((p) => addIfUploadsPath(p.description))
  log(`  • Product.description   — scanned ${products.length} rows`)

  return refs
}

async function main() {
  log('━'.repeat(60))
  log('🧹 Orphan upload cleanup')
  log(`   mode: ${EXECUTE ? (DELETE ? '🔥 DELETE' : '🗑  MOVE TO _trash') : '👀 DRY RUN'}`)
  log('━'.repeat(60))

  if (!fs.existsSync(UPLOADS_DIR)) {
    log(`Uploads dir missing: ${UPLOADS_DIR}`)
    return
  }

  const allFiles = fs
    .readdirSync(UPLOADS_DIR)
    .filter((f) => !f.startsWith('.') && !f.startsWith('_') && fs.statSync(path.join(UPLOADS_DIR, f)).isFile())

  log(`\nFound ${allFiles.length} files on disk in /public/uploads/\n`)
  log('Scanning database…')

  const referenced = await collectReferencedFilenames()
  log(`\nFound ${referenced.size} referenced filenames in DB.\n`)

  const orphans: string[] = []
  for (const f of allFiles) {
    if (!referenced.has(f)) orphans.push(f)
  }

  if (orphans.length === 0) {
    log('✅ No orphans. Nothing to do.')
    return
  }

  const totalBytes = orphans.reduce((sum, f) => sum + fs.statSync(path.join(UPLOADS_DIR, f)).size, 0)
  const mb = (totalBytes / 1024 / 1024).toFixed(2)

  log(`🔎 ${orphans.length} orphan file(s) (${mb} MB):`)
  orphans.slice(0, 50).forEach((f) => log(`   - ${f}`))
  if (orphans.length > 50) log(`   … and ${orphans.length - 50} more`)

  if (!EXECUTE) {
    log('\nDRY RUN — nothing moved or deleted.')
    log('Re-run with --execute to move to _trash, or --execute --delete to permanently delete.')
    return
  }

  if (DELETE) {
    log('\n🔥 Deleting…')
    for (const f of orphans) fs.unlinkSync(path.join(UPLOADS_DIR, f))
    log(`   Deleted ${orphans.length} files (freed ${mb} MB)`)
  } else {
    if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 10)
    const destDir = path.join(TRASH_DIR, stamp)
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

    log(`\n🗑  Moving to ${destDir}/…`)
    for (const f of orphans) {
      fs.renameSync(path.join(UPLOADS_DIR, f), path.join(destDir, f))
    }
    log(`   Moved ${orphans.length} files (${mb} MB) to _trash/${stamp}/`)
    log('   Review after 30 days and delete manually if still unused.')
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Cleanup failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
