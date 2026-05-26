import { describe, it, expect } from 'vitest'
import {
  signRequest,
  verifyOutcome,
  computeOutcomeMac,
  toMinorUnits,
  buildPaymentRequest,
} from '@/lib/payments/vpos'
import type { VposConfig } from '@/lib/payments/vpos-config'
import { generateOrderNumber } from '@/lib/utils'

describe('signRequest — SIA published sample (PDF §5.2.1)', () => {
  // The exact worked example from the manual: this proves our HMAC matches SIA's.
  const SAMPLE_KEY = 'MrXw-RcZ5G-8ge-4EAHE--a-jF-Ux49-BXw2qK4gFZM-U9XXqm'
  const SAMPLE_EXPECTED = 'fa5c28419fd0a0ba80e378ebaa9d12e6cc085bdd780126b830b3f82d5b5b91d1'

  it('reproduces the published HMAC-256 exactly', () => {
    const fields = {
      URLMS: 'https://virtualpostest.sia.eu/vpos/payments/main?PAGE=RICEZIONE_ESITO',
      URLDONE: 'https://virtualpostest.sia.eu/vpos/payments/test/result-it_new.html',
      ORDERID: 'test20211123164921878',
      SHOPID: '129280505050505',
      AMOUNT: '2312',
      CURRENCY: '978',
      ACCOUNTINGMODE: 'I',
      AUTHORMODE: 'I',
    }
    expect(signRequest(fields, SAMPLE_KEY)).toBe(SAMPLE_EXPECTED)
  })

  it('omits absent optional fields from the signed string', () => {
    // Adding undefined EXPONENT/OPTIONS/3DSDATA must not change the hash.
    const fields = {
      URLMS: 'https://virtualpostest.sia.eu/vpos/payments/main?PAGE=RICEZIONE_ESITO',
      URLDONE: 'https://virtualpostest.sia.eu/vpos/payments/test/result-it_new.html',
      ORDERID: 'test20211123164921878',
      SHOPID: '129280505050505',
      AMOUNT: '2312',
      CURRENCY: '978',
      EXPONENT: undefined,
      ACCOUNTINGMODE: 'I',
      AUTHORMODE: 'I',
      OPTIONS: undefined,
    }
    expect(signRequest(fields, SAMPLE_KEY)).toBe(SAMPLE_EXPECTED)
  })
})

describe('toMinorUnits', () => {
  it('converts RSD major units to minor units (×100)', () => {
    expect(toMinorUnits(5000)).toBe('500000')
    expect(toMinorUnits(5000.0, 2)).toBe('500000')
    expect(toMinorUnits(12.34, 2)).toBe('1234')
    expect(toMinorUnits(0, 2)).toBe('0')
  })

  it('rounds to the nearest minor unit', () => {
    expect(toMinorUnits(10.005, 2)).toBe('1001')
  })
})

describe('verifyOutcome — round trip with API-Result key', () => {
  const KEY = 'api-result-key-example-0123456789'

  // Build a valid signed outcome the way SIA would.
  function signedOutcome(extra: Record<string, string> = {}): URLSearchParams {
    const base: Record<string, string> = {
      ORDERID: 'ALT-2026-1A2B3C4D',
      SHOPID: '129280505050505',
      AUTHNUMBER: 'HJ89KR',
      AMOUNT: '500000',
      CURRENCY: '941',
      TRANSACTIONID: 'HK84HL2GHK84HL2GHK84HL2G',
      ACCOUNTINGMODE: 'I',
      AUTHORMODE: 'I',
      RESULT: '00',
      TRANSACTIONTYPE: 'TT06',
      ...extra,
    }
    const params = new URLSearchParams(base)
    params.set('MAC', computeOutcomeMac(params, KEY))
    return params
  }

  it('accepts a correctly signed outcome', () => {
    const r = verifyOutcome(signedOutcome(), KEY)
    expect(r.valid).toBe(true)
    expect(r.result).toBe('00')
  })

  it('accepts an uppercase MAC (case-insensitive)', () => {
    const params = signedOutcome()
    params.set('MAC', (params.get('MAC') ?? '').toUpperCase())
    expect(verifyOutcome(params, KEY).valid).toBe(true)
  })

  it('rejects a tampered amount', () => {
    const params = signedOutcome()
    params.set('AMOUNT', '1') // changed after signing
    expect(verifyOutcome(params, KEY).valid).toBe(false)
  })

  it('rejects a wrong key', () => {
    expect(verifyOutcome(signedOutcome(), 'different-key').valid).toBe(false)
  })

  it('rejects a missing MAC', () => {
    const params = signedOutcome()
    params.delete('MAC')
    expect(verifyOutcome(params, KEY).valid).toBe(false)
  })

  it('ignores unknown/future params', () => {
    // A param not in OUTCOME_MAC_ORDER must not affect verification.
    const params = signedOutcome()
    params.set('SOME_FUTURE_FIELD', 'whatever')
    expect(verifyOutcome(params, KEY).valid).toBe(true)
  })

  it('includes optional fields in order when present', () => {
    const r = verifyOutcome(signedOutcome({ ISSUERCOUNTRY: 'SRB', AUTHCODE: '123' }), KEY)
    expect(r.valid).toBe(true)
  })
})

describe('buildPaymentRequest', () => {
  const config: VposConfig = {
    baseUrl: 'https://virtualpostest.sia.eu/vpos/payments/main?PAGE=LAND',
    shopId: '129280505050505',
    startKey: 'MrXw-RcZ5G-8ge-4EAHE--a-jF-Ux49-BXw2qK4gFZM-U9XXqm',
    apiResultKey: 'api-result-key',
    currency: '941',
    exponent: '2',
  }

  it('produces the gateway action URL and a signed field set', () => {
    const { actionUrl, fields } = buildPaymentRequest(
      {
        orderNumber: 'ALT-2026-1A2B3C4D',
        total: 5000,
        urls: {
          urlBack: 'https://www.altamoda.rs/checkout/cancelled',
          urlDone: 'https://www.altamoda.rs/checkout/confirmation?orderNumber=ALT-2026-1A2B3C4D',
          urlMs: 'https://www.altamoda.rs/api/payments/vpos/notify',
        },
      },
      config
    )
    expect(actionUrl).toBe(config.baseUrl)
    expect(fields.AMOUNT).toBe('500000')
    expect(fields.CURRENCY).toBe('941')
    expect(fields.ACCOUNTINGMODE).toBe('I')
    expect(fields.AUTHORMODE).toBe('I')
    expect(fields.OPTIONS).toBe('GR')
    expect(fields.MAC).toMatch(/^[0-9a-f]{64}$/)
  })

  it('MAC excludes URLBACK/LANG (not part of the request MAC order)', () => {
    const base = {
      orderNumber: 'ALT-2026-1A2B3C4D',
      total: 5000,
      urls: {
        urlBack: 'https://www.altamoda.rs/checkout/cancelled',
        urlDone: 'https://www.altamoda.rs/checkout/confirmation',
        urlMs: 'https://www.altamoda.rs/api/payments/vpos/notify',
      },
    }
    const a = buildPaymentRequest(base, config)
    const b = buildPaymentRequest({ ...base, urls: { ...base.urls, urlBack: 'https://www.altamoda.rs/different' }, lang: 'SC' }, config)
    // URLBACK and LANG differ, but they are not in the MAC, so the MAC is identical.
    expect(a.fields.MAC).toBe(b.fields.MAC)
  })
})

describe('generateOrderNumber — valid SIA ORDERID', () => {
  it('matches the SIA ORDERID regex [a-zA-Z0-9\\-_], max 50 chars', () => {
    for (let i = 0; i < 50; i++) {
      const n = generateOrderNumber()
      expect(n).toMatch(/^[a-zA-Z0-9\-_]{1,50}$/)
    }
  })

  it('is highly collision-resistant', () => {
    const set = new Set<string>()
    for (let i = 0; i < 5000; i++) set.add(generateOrderNumber())
    expect(set.size).toBe(5000)
  })
})
