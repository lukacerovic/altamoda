import { redirect } from 'next/navigation'

// Registration lives as a tab on the login page — this route only forwards,
// preserving callbackUrl so post-registration lands back where the user was.
export default async function RegisterRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const suffix = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''
  redirect(`/account/login?tab=register${suffix}`)
}
