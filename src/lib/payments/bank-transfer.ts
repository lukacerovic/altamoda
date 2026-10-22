/** Payee details printed on the "Uplatnicom" payment slip (nalog za uplatu).
 *  Registered seat + UniCredit account, as confirmed by the client (Oct 2026).
 *  Payment code, currency and model are left blank, as on the legacy slip;
 *  the reference number (poziv na broj) is the order number, which is how the client matches bank statements to orders. */
export const BANK_TRANSFER_PAYEE = {
  name: 'Alta Moda d.o.o.',
  street: 'Cara Dušana 45, lokal J',
  city: '36000 Kraljevo',
  country: 'Srbija',
  account: '170-0030013183000-92',
  bank: 'UniCredit banka',
  pib: '101773967',
  maticniBroj: '17222783',
} as const

/** Hours the customer has to pay before the client may cancel the order. */
export const BANK_TRANSFER_DEADLINE_HOURS = 24

/** Slip amount, e.g. 3015 → "3.015,00" (Serbian grouping, always 2 decimals). */
export function formatSlipAmount(amount: number): string {
  return amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
