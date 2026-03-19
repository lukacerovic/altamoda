import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Unesite validnu email adresu'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
})

export const registerB2cSchema = z.object({
  name: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  email: z.string().email('Unesite validnu email adresu'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
  phone: z.string().optional(),
})

export const registerB2bSchema = registerB2cSchema.extend({
  salonName: z.string().min(2, 'Unesite naziv salona'),
  pib: z.string().min(9, 'PIB mora imati 9 cifara').max(9),
  maticniBroj: z.string().min(8, 'Matični broj mora imati 8 cifara').max(8),
  address: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterB2cInput = z.infer<typeof registerB2cSchema>
export type RegisterB2bInput = z.infer<typeof registerB2bSchema>
