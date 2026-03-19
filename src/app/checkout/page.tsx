import { getCurrentUser } from '@/lib/auth-helpers'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  const user = await getCurrentUser()

  let addresses: {
    id: string
    label: string
    street: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean
  }[] = []

  if (user) {
    const { prisma } = await import('@/lib/db')
    const dbAddresses = await prisma.userAddress.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    })
    addresses = dbAddresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      city: a.city,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    }))
  }

  return (
    <CheckoutClient
      userRole={user?.role ?? null}
      isGuest={!user}
      addresses={addresses}
    />
  )
}
