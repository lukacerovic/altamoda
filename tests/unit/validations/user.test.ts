import { describe, it, expect } from 'vitest'
import { loginSchema, registerB2cSchema, registerB2bSchema } from '@/lib/validations/user'

describe('User Validations', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.parse({ email: 'user@test.com', password: 'password123' })
      expect(result.email).toBe('user@test.com')
    })

    it('rejects invalid email', () => {
      expect(() => loginSchema.parse({ email: 'bad', password: '123456' })).toThrow()
    })

    it('rejects password shorter than 6 chars', () => {
      expect(() => loginSchema.parse({ email: 'user@test.com', password: '12345' })).toThrow()
    })

    it('accepts password exactly 6 chars', () => {
      const result = loginSchema.parse({ email: 'user@test.com', password: '123456' })
      expect(result.password).toBe('123456')
    })
  })

  describe('registerB2cSchema', () => {
    const validB2c = {
      name: 'Marko Petrović',
      email: 'marko@test.com',
      password: 'sifra123',
    }

    it('accepts valid B2C registration', () => {
      const result = registerB2cSchema.parse(validB2c)
      expect(result.name).toBe('Marko Petrović')
    })

    it('accepts optional phone', () => {
      const result = registerB2cSchema.parse({ ...validB2c, phone: '+381641234567' })
      expect(result.phone).toBe('+381641234567')
    })

    it('rejects name shorter than 2 chars', () => {
      expect(() => registerB2cSchema.parse({ ...validB2c, name: 'M' })).toThrow()
    })

    it('rejects missing email', () => {
      expect(() => registerB2cSchema.parse({ name: 'Marko', password: '123456' })).toThrow()
    })
  })

  describe('registerB2bSchema', () => {
    const validB2b = {
      name: 'Ana Jovanović',
      email: 'ana@salon.rs',
      password: 'sifra123',
      salonName: 'Salon Lepota',
      pib: '123456789',
      maticniBroj: '12345678',
    }

    it('accepts valid B2B registration', () => {
      const result = registerB2bSchema.parse(validB2b)
      expect(result.salonName).toBe('Salon Lepota')
      expect(result.pib).toBe('123456789')
      expect(result.maticniBroj).toBe('12345678')
    })

    it('rejects PIB shorter than 9 chars', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, pib: '12345678' })).toThrow()
    })

    it('rejects PIB longer than 9 chars', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, pib: '1234567890' })).toThrow()
    })

    it('rejects matični broj shorter than 8 chars', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, maticniBroj: '1234567' })).toThrow()
    })

    it('rejects matični broj longer than 8 chars', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, maticniBroj: '123456789' })).toThrow()
    })

    it('rejects salon name shorter than 2 chars', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, salonName: 'S' })).toThrow()
    })

    it('accepts optional address', () => {
      const result = registerB2bSchema.parse({ ...validB2b, address: 'Terazije 5, Beograd' })
      expect(result.address).toBe('Terazije 5, Beograd')
    })

    it('inherits B2C validation (rejects short password)', () => {
      expect(() => registerB2bSchema.parse({ ...validB2b, password: '12345' })).toThrow()
    })
  })
})
