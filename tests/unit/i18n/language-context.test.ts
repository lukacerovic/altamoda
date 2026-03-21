import { describe, it, expect } from 'vitest'
import { languageLabels, languageFlags, type Language } from '@/lib/i18n/LanguageContext'

describe('i18n — Language Context exports', () => {
  describe('languageLabels', () => {
    it('has labels for all 3 supported languages', () => {
      expect(Object.keys(languageLabels)).toHaveLength(3)
      expect(languageLabels.sr).toBe('Srpski')
      expect(languageLabels.en).toBe('English')
      expect(languageLabels.ru).toBe('Русский')
    })
  })

  describe('languageFlags', () => {
    it('has flags for all 3 supported languages', () => {
      expect(Object.keys(languageFlags)).toHaveLength(3)
      expect(languageFlags.sr).toBeDefined()
      expect(languageFlags.en).toBeDefined()
      expect(languageFlags.ru).toBeDefined()
    })
  })

  describe('Language type', () => {
    it('supports sr, en, ru as valid Language values', () => {
      const languages: Language[] = ['sr', 'en', 'ru']
      expect(languages).toHaveLength(3)
      for (const lang of languages) {
        expect(languageLabels[lang]).toBeDefined()
        expect(languageFlags[lang]).toBeDefined()
      }
    })
  })
})
