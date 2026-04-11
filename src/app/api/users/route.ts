import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { registerB2cSchema, registerB2bSchema } from '@/lib/validations/user'
import { registrationRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { sendTransactional } from '@/lib/email'
import { b2bSignupAdminTemplate } from '@/lib/email-templates'

export const POST = withErrorHandler(async (req: Request) => {
  const rateLimitResponse = applyRateLimit(registrationRateLimiter, `register:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse as never

  const body = await req.json()
  const isB2b = body.salonName || body.pib

  const schema = isB2b ? registerB2bSchema : registerB2cSchema
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    return errorResponse(firstIssue?.message || 'Nevažeći podaci', 400)
  }

  const data = parsed.data as Record<string, string | undefined>

  const existing = await prisma.user.findUnique({
    where: { email: data.email as string },
  })

  if (existing) {
    return errorResponse('Korisnik sa ovom email adresom već postoji', 409)
  }

  const passwordHash = await hash(data.password as string, 12)

  const user = await prisma.user.create({
    data: {
      email: data.email as string,
      passwordHash,
      name: data.name as string,
      phone: data.phone,
      role: isB2b ? 'b2b' : 'b2c',
      status: isB2b ? 'pending' : 'active',
      ...(isB2b && data.salonName
        ? {
            b2bProfile: {
              create: {
                salonName: data.salonName as string,
                pib: data.pib as string,
                maticniBroj: data.maticniBroj as string,
                address: data.address,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  })

  if (isB2b) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      void sendTransactional({
        to: adminEmail,
        subject: 'Nova B2B prijava ceka odobrenje',
        html: b2bSignupAdminTemplate({
          name: data.name as string,
          email: data.email as string,
          phone: data.phone,
          salonName: data.salonName,
          pib: data.pib,
          maticniBroj: data.maticniBroj,
          address: data.address,
        }),
      }).catch((err) => console.error('[email] B2B admin alert failed:', err))
    }
  }

  return successResponse(user, 201)
})
