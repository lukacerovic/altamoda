import Link from 'next/link'
import { XCircle, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

/** URLBACK landing — the customer cancelled the payment on the SIA page. */
export default async function CancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>
}) {
  const { orderNumber } = await searchParams

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-sm shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
            Plaćanje je otkazano
          </h1>
          <p className="text-[#1a1c1e] mb-6">
            Plaćanje nije završeno. Vaši artikli su i dalje u korpi, možete pokušati ponovo.
          </p>

          <div className="space-y-3">
            {orderNumber && (
              <Link
                href={`/checkout/pay/${orderNumber}`}
                className="w-full bg-[#c19742] hover:bg-[#413d3a] text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                Pokušaj ponovo <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/cart"
              className="w-full border border-[#dddbd9] text-[#1a1c1e] py-3 rounded font-medium hover:bg-[#FFFFFF] flex items-center justify-center gap-2"
            >
              Nazad na korpu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
