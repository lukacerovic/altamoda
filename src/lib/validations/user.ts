import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Unesite validnu email adresu'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
})

/**
 * Validation messages are stored as translation KEYS (e.g. "auth.errNameMin"),
 * not literal text. The server has no access to the visitor's selected language,
 * so the API forwards the failing key as a `code` and the client resolves it via
 * t(code) in the currently selected language. Keys must exist in every locale
 * file (sr/en/ru → auth.*).
 */
export const registerB2cSchema = z.object({
  name: z
    .string()
    .min(2, 'auth.errNameMin')
    // Letters (any script + diacritics), spaces, hyphen and apostrophe only —
    // no digits. `name` is the combined "First Last".
    .regex(/^[\p{L}\p{M}\s'’-]+$/u, { message: 'auth.errNameLetters' }),
  email: z.string().email('auth.errEmailInvalid'),
  password: z.string().min(6, 'auth.errPasswordMin'),
  // Phone is required: optional '+' then 8–15 digits (dial code included).
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, { message: 'auth.errPhoneInvalid' }),
})

export const registerB2bSchema = registerB2cSchema.extend({
  salonName: z.string().min(2, 'auth.errSalonNameMin'),
  pib: z.string().min(9, 'auth.errPibLength').max(9, 'auth.errPibLength'),
  maticniBroj: z.string().min(8, 'auth.errMaticniLength').max(8, 'auth.errMaticniLength'),
  address: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterB2cInput = z.infer<typeof registerB2cSchema>
export type RegisterB2bInput = z.infer<typeof registerB2bSchema>
