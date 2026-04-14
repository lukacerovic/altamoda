import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: 'Alta Moda',
  storeEmail: 'info@altamoda.rs',
  storePhone: '+381 11 123 4567',
  storeAddress: 'Knez Mihailova 22, 11000 Beograd',
  warehouseAddress: '',
  instagram: 'https://instagram.com/altamoda.rs',
  facebook: 'https://facebook.com/altamoda.rs',
  tiktok: '',
  hours_monday: '09:00 - 18:00',
  hours_tuesday: '09:00 - 18:00',
  hours_wednesday: '09:00 - 18:00',
  hours_thursday: '09:00 - 18:00',
  hours_friday: '09:00 - 18:00',
  hours_saturday: '10:00 - 15:00',
  hours_sunday: '',
}

async function main() {
  console.log('Seeding site settings...')

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: {}, // don't overwrite existing values
    })
    console.log(`  ${key}: ${value || '(empty)'}`)
  }

  console.log('Site settings seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
