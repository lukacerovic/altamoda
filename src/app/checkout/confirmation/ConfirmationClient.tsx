'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Package, ChevronRight, Clock, XCircle } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useCheckoutStore } from '@/lib/stores/checkout-store'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export type ConfirmationState = 'success' | 'pending' | 'failed'

/** Payment-slip details shown for an unpaid "Uplatnicom" order. */
export interface BankTransferInfo {
  payee: string
  account: string
  amount: string
}

interface Props {
  orderNumber: string
  state: ConfirmationState
  payUrl: string
  bankTransfer?: BankTransferInfo | null
}

export default function ConfirmationClient({ orderNumber, state, payUrl, bankTransfer }: Props) {
  const { clearCart } = useCartStore()
  const { clearDraft } = useCheckoutStore()
  const { t } = useLanguage()

  // Clear the cart only once the order is actually settled successfully. For
  // non-card orders this is a harmless no-op (the cart was already cleared at
  // placement). Pending/failed payments keep the cart so the customer can retry.
  useEffect(() => {
    if (state === 'success') {
      clearCart()
      clearDraft()
    }
  }, [state, clearCart, clearDraft])

  // While the URLMS notification is still in flight, refresh shortly to pick up
  // the settled status.
  useEffect(() => {
    if (state !== 'pending') return
    const t = setTimeout(() => window.location.reload(), 6000)
    return () => clearTimeout(t)
  }, [state])

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-sm shadow-sm p-8 text-center">
          {state === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                {t('checkout.confirmSuccessTitle')}
              </h1>
              <p className="text-[#1a1c1e] mb-6">{t('checkout.confirmSuccessDesc')}</p>
            </>
          )}

          {state === 'pending' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                {t('checkout.confirmPendingTitle')}
              </h1>
              <p className="text-[#1a1c1e] mb-6">
                {t('checkout.confirmPendingDesc')}
              </p>
            </>
          )}

          {state === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                {t('checkout.confirmFailedTitle')}
              </h1>
              <p className="text-[#1a1c1e] mb-6">
                {t('checkout.confirmFailedDesc')}
              </p>
            </>
          )}

          {orderNumber && (
            <div className="bg-[#FFFFFF] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-5 h-5 text-[#edb4bd]" />
                <span className="text-sm font-semibold text-[#1a1c1e]">{t('checkout.orderNumberLabel')}</span>
              </div>
              <span className="text-xl font-bold text-[#edb4bd]">{orderNumber}</span>
            </div>
          )}

          {state === 'success' && bankTransfer && (
            <div className="text-left border border-[#dddbd9] rounded-sm p-4 mb-6">
              <p className="text-sm font-semibold text-[#1a1c1e] mb-1">{t('checkout.confirmBankTransferTitle')}</p>
              <p className="text-xs text-[#1a1c1e] mb-3">{t('checkout.confirmBankTransferDesc')}</p>
              <dl className="text-sm space-y-2">
                {[
                  [t('checkout.bankTransferPayee'), bankTransfer.payee],
                  [t('checkout.bankTransferAccount'), bankTransfer.account],
                  [t('checkout.bankTransferAmount'), bankTransfer.amount],
                  [t('checkout.bankTransferPurpose'), 'Online porudžbina'],
                  [t('checkout.bankTransferReference'), orderNumber],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-[#1a1c1e]/70">{label}</dt>
                    <dd className="font-medium text-[#1a1c1e] break-words">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-[#1a1c1e] mt-3">{t('checkout.bankTransferReferenceWarning')}</p>
            </div>
          )}

          {state === 'success' && !bankTransfer && (
            <p className="text-sm text-[#1a1c1e] mb-6">
              {t('checkout.confirmEmailSentNote')}
            </p>
          )}

          <div className="space-y-3">
            {state === 'failed' ? (
              <>
                <Link
                  href={payUrl}
                  className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {t('checkout.tryAgain')} <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  className="w-full border border-[#dddbd9] text-[#1a1c1e] py-3 rounded font-medium hover:bg-[#FFFFFF] flex items-center justify-center gap-2"
                >
                  {t('checkout.backToCart')}
                </Link>
              </>
            ) : (
              <Link
                href="/products"
                className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                {t('checkout.continueShopping')} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
