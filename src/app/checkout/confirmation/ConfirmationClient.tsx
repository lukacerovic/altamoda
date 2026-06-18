'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Package, ChevronRight, Clock, XCircle } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart-store'

export type ConfirmationState = 'success' | 'pending' | 'failed'

interface Props {
  orderNumber: string
  state: ConfirmationState
  payUrl: string
}

export default function ConfirmationClient({ orderNumber, state, payUrl }: Props) {
  const { clearCart } = useCartStore()

  // Clear the cart only once the order is actually settled successfully. For
  // non-card orders this is a harmless no-op (the cart was already cleared at
  // placement). Pending/failed payments keep the cart so the customer can retry.
  useEffect(() => {
    if (state === 'success') clearCart()
  }, [state, clearCart])

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
                Porudžbina primljena!
              </h1>
              <p className="text-[#1a1c1e] mb-6">Hvala vam na kupovini. Vaša porudžbina je uspešno kreirana.</p>
            </>
          )}

          {state === 'pending' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                Plaćanje se obrađuje
              </h1>
              <p className="text-[#1a1c1e] mb-6">
                Potvrda plaćanja je u toku. Stranica će se automatski osvežiti za nekoliko trenutaka.
              </p>
            </>
          )}

          {state === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                Plaćanje nije uspelo
              </h1>
              <p className="text-[#1a1c1e] mb-6">
                Vaše plaćanje nije moglo biti obrađeno. Možete pokušati ponovo — artikli su i dalje u korpi.
              </p>
            </>
          )}

          {orderNumber && (
            <div className="bg-[#FFFFFF] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-5 h-5 text-[#edb4bd]" />
                <span className="text-sm font-semibold text-[#1a1c1e]">Broj porudžbine</span>
              </div>
              <span className="text-xl font-bold text-[#edb4bd]">{orderNumber}</span>
            </div>
          )}

          {state === 'success' && (
            <p className="text-sm text-[#1a1c1e] mb-6">
              Poslali smo vam email sa potvrdom porudžbine i detaljima o dostavi.
            </p>
          )}

          <div className="space-y-3">
            {state === 'failed' ? (
              <>
                <Link
                  href={payUrl}
                  className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Pokušaj ponovo <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  className="w-full border border-[#dddbd9] text-[#1a1c1e] py-3 rounded font-medium hover:bg-[#FFFFFF] flex items-center justify-center gap-2"
                >
                  Nazad na korpu
                </Link>
              </>
            ) : (
              <Link
                href="/products"
                className="w-full bg-[#edb4bd] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                Nastavi kupovinu <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
