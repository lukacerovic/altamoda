/** Payee details printed on the "Uplatnicom" payment slip (nalog za uplatu).
 *  Taken from the legacy site's slip email. Payment code, currency and model
 *  are left blank there too; the reference number (poziv na broj) is the order
 *  number, which is how the client matches bank statements to orders. */
export const BANK_TRANSFER_PAYEE = {
  name: 'Alta Moda d.o.o.',
  street: 'Cara Dušana 45',
  city: '36101 Kraljevo',
  country: 'Srbija',
  account: '325-9500500002310-56',
  bank: 'OTP Banka',
  pib: '101773967',
  maticniBroj: '17222783',
} as const

/** Hours the customer has to pay before the client may cancel the order. */
export const BANK_TRANSFER_DEADLINE_HOURS = 24

/** Slip amount, e.g. 3015 → "3.015,00" (Serbian grouping, always 2 decimals). */
export function formatSlipAmount(amount: number): string {
  return amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
