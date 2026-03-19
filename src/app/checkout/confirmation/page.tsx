'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, ChevronRight } from 'lucide-react'
import { Suspense } from 'react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber') ?? ''

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-[#2d2d2d] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Porudžbina primljena!
          </h1>
          <p className="text-gray-500 mb-6">Hvala vam na kupovini. Vaša porudžbina je uspešno kreirana.</p>

          {orderNumber && (
            <div className="bg-[#faf7f2] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-5 h-5 text-[#8c4a5a]" />
                <span className="text-sm font-semibold text-[#2d2d2d]">Broj porudžbine</span>
              </div>
              <span className="text-xl font-bold text-[#8c4a5a]">{orderNumber}</span>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Poslali smo vam email sa potvrdom porudžbine i detaljima o dostavi.
          </p>

          <div className="space-y-3">
            <Link href="/products" className="w-full bg-[#8c4a5a] hover:bg-[#6e3848] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2">
              Nastavi kupovinu <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
