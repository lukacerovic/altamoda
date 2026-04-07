'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/stores/cart-store'
import { FREE_SHIPPING_THRESHOLD, MIN_B2B_ORDER } from '@/lib/constants'
import {
  ChevronRight, MapPin, Truck, CreditCard, CheckCircle,
  AlertCircle, ChevronLeft, Shield, User,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Address {
  id: string
  label: string
  street: string
  city: string
  postalCode: string
  country: string
  isDefault: boolean
}

interface Props {
  userRole: string | null
  isGuest: boolean
  addresses: Address[]
}

type Step = 'contact' | 'address' | 'shipping' | 'payment' | 'review'

export default function CheckoutClient({ userRole, isGuest, addresses }: Props) {
  const router = useRouter()
  const { t } = useLanguage()
  const { items, getTotal, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // For guests, first step is contact info; for logged-in users, skip it
  const STEPS: { key: Step; label: string; icon: typeof MapPin }[] = isGuest
    ? [
        { key: 'contact', label: t('checkout.step1'), icon: User },
        { key: 'address', label: t('checkout.step2'), icon: MapPin },
        { key: 'shipping', label: t('checkout.step3'), icon: Truck },
        { key: 'payment', label: t('checkout.step4'), icon: CreditCard },
        { key: 'review', label: t('checkout.step5'), icon: CheckCircle },
      ]
    : [
        { key: 'address', label: t('checkout.step2'), icon: MapPin },
        { key: 'shipping', label: t('checkout.step3'), icon: Truck },
        { key: 'payment', label: t('checkout.step4'), icon: CreditCard },
        { key: 'review', label: t('checkout.step5'), icon: CheckCircle },
      ]

  const [step, setStep] = useState<Step>(STEPS[0].key)

  // Guest contact info
  const [guestInfo, setGuestInfo] = useState({
    name: '', email: '', phone: '',
  })

  // Address form
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0]
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr?.id ?? '')
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', postalCode: '', country: 'Srbija',
  })
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0)

  // Shipping
  const [shippingMethod, setShippingMethod] = useState('standard')

  // Payment — guests can't use invoice
  const isB2b = userRole === 'b2b'
  const paymentOptions = isB2b
    ? [
        { key: 'invoice', label: t('checkout.invoicePreinvoice') },
        { key: 'card', label: t('checkout.card') },
      ]
    : [
        { key: 'card', label: t('checkout.cardVisaMaster') },
        { key: 'bank_transfer', label: t('checkout.bankTransfer') },
        { key: 'cash_on_delivery', label: t('checkout.cashOnDelivery') },
      ]
  const [paymentMethod, setPaymentMethod] = useState(isB2b ? 'invoice' : 'card')

  // Notes
  const [notes, setNotes] = useState('')

  const subtotal = getTotal()
  const shippingCost =
    shippingMethod === 'express'
      ? 690
      : shippingMethod === 'pickup'
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : 350
  const total = subtotal + shippingCost

  const shippingAddress = useNewAddress
    ? newAddress
    : addresses.find((a) => a.id === selectedAddressId)

  const canProceedContact = isGuest
    ? guestInfo.name.trim() && guestInfo.email.trim() && guestInfo.phone.trim()
    : true

  const canProceedAddress = useNewAddress
    ? newAddress.street && newAddress.city && newAddress.postalCode
    : !!selectedAddressId

  const b2bMinimumMet = !isB2b || subtotal >= MIN_B2B_ORDER

  if (items.length === 0 && step !== 'review') {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-black mb-2">{t('checkout.emptyCart')}</h2>
          <p className="text-gray-500 mb-4">{t('checkout.emptyCartDesc')}</p>
          <Link href="/products" className="px-6 py-3 bg-black text-white rounded font-medium hover:bg-stone-800">
            {t('checkout.continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    if (!b2bMinimumMet) return

    setIsSubmitting(true)
    setError('')

    try {
      // Layer 3: Validate stock before placing order
      const stockRes = await fetch('/api/cart/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: items.map((i) => i.productId) }),
      })
      const stockData = await stockRes.json()
      if (stockData.success) {
        const outOfStockNames = items
          .filter((item) => (stockData.data[item.productId] ?? 0) <= 0)
          .map((item) => item.name)
        if (outOfStockNames.length > 0) {
          setError(`${t('checkout.outOfStockError')}: ${outOfStockNames.join(', ')}. ${t('checkout.removeOutOfStock')}`)
          setIsSubmitting(false)
          return
        }
      }

      const orderPayload: Record<string, unknown> = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          street: shippingAddress?.street ?? '',
          city: shippingAddress?.city ?? '',
          postalCode: shippingAddress?.postalCode ?? '',
          country: shippingAddress?.country ?? 'Srbija',
        },
        paymentMethod,
        shippingMethod,
        notes: notes || undefined,
      }

      if (isGuest) {
        orderPayload.guestInfo = guestInfo
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      const data = await res.json()
      if (!data.success) {
        // If auth required, redirect to login
        if (res.status === 401) {
          setError(t('checkout.mustBeLoggedIn'))
          return
        }
        setError(data.error || t('checkout.orderError'))
        return
      }

      clearCart()
      router.push(`/checkout/confirmation?orderNumber=${data.data.orderNumber}`)
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(t('checkout.noInternetConnection'))
      } else {
        setError(t('checkout.serverError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  const goNext = () => {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next.key)
  }

  const goPrev = () => {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev.key)
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-secondary">{t('checkout.breadcrumbHome')}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/cart" className="hover:text-secondary">{t('checkout.breadcrumbCart')}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black">{t('checkout.breadcrumbCheckout')}</span>
        </nav>

        <h1 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: "'Noto Serif', serif" }}>{t('checkout.breadcrumbCheckout')}</h1>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i <= stepIndex ? 'text-secondary' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < stepIndex ? 'bg-black text-white' : i === stepIndex ? 'border-2 border-black text-secondary' : 'border-2 border-gray-200 text-gray-300'}`}>
                  {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < stepIndex ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">

            {/* STEP: Contact (guest only) */}
            {step === 'contact' && isGuest && (
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h2 className="text-lg font-bold text-black mb-4">{t('checkout.yourDetails')}</h2>
                <p className="text-sm text-gray-500 mb-4">{t('checkout.enterContactDetails')}</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.fullName')} *</label>
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder={t('checkout.fullNamePlaceholder')}
                      className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.emailLabel')} *</label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder={t('checkout.emailPlaceholder')}
                      className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.phoneLabel')} *</label>
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder="+381 6x xxx xxxx"
                      className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-stone-50 rounded-sm text-sm text-gray-600">
                  {t('checkout.haveAccount')}{' '}
                  <Link href="/account/login?callbackUrl=/checkout" className="text-secondary font-medium hover:underline">
                    {t('checkout.loginLink')}
                  </Link>{' '}
                  {t('checkout.forFasterOrdering')}
                </div>

                <button
                  onClick={goNext}
                  disabled={!canProceedContact}
                  className="mt-6 w-full bg-black hover:bg-stone-800 text-white py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {t('checkout.continue')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP: Address */}
            {step === 'address' && (
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h2 className="text-lg font-bold text-black mb-4">{t('checkout.shippingAddress')}</h2>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map((addr) => (
                      <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-sm border-2 cursor-pointer transition-colors ${!useNewAddress && selectedAddressId === addr.id ? 'border-black bg-stone-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="address" checked={!useNewAddress && selectedAddressId === addr.id} onChange={() => { setSelectedAddressId(addr.id); setUseNewAddress(false) }} className="mt-1 text-secondary" />
                        <div>
                          <span className="font-medium text-sm">{addr.label}</span>
                          <p className="text-sm text-gray-500">{addr.street}, {addr.postalCode} {addr.city}, {addr.country}</p>
                        </div>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-4 rounded-sm border-2 cursor-pointer transition-colors ${useNewAddress ? 'border-black bg-stone-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="address" checked={useNewAddress} onChange={() => setUseNewAddress(true)} className="text-secondary" />
                      <span className="text-sm font-medium">{t('checkout.newAddress')}</span>
                    </label>
                  </div>
                )}

                {useNewAddress && (
                  <div className="space-y-3">
                    <input type="text" placeholder={t('checkout.streetAndNumber')} value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder={t('checkout.city')} value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none" />
                      <input type="text" placeholder={t('checkout.postalCode')} value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="border border-gray-200 rounded px-4 py-3 text-sm focus:border-black focus:outline-none" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  {isGuest && (
                    <button onClick={goPrev} className="flex-1 border border-gray-200 py-3 rounded font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> {t('checkout.back')}
                    </button>
                  )}
                  <button onClick={goNext} disabled={!canProceedAddress} className="flex-1 bg-black hover:bg-stone-800 text-white py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {t('checkout.continue')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Shipping */}
            {step === 'shipping' && (
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h2 className="text-lg font-bold text-black mb-4">{t('checkout.shippingMethod')}</h2>
                <div className="space-y-3">
                  {[
                    { key: 'standard', label: t('checkout.standardShipping'), price: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 350 },
                    { key: 'express', label: t('checkout.expressShipping'), price: 690 },
                    { key: 'pickup', label: t('checkout.storePickup'), price: 0 },
                  ].map((opt) => (
                    <label key={opt.key} className={`flex items-center justify-between gap-3 p-4 rounded-sm border-2 cursor-pointer transition-colors ${shippingMethod === opt.key ? 'border-black bg-stone-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shipping" checked={shippingMethod === opt.key} onChange={() => setShippingMethod(opt.key)} className="text-secondary" />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${opt.price === 0 ? 'text-green-600' : ''}`}>
                        {opt.price === 0 ? t('checkout.free') : `${opt.price} RSD`}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={goPrev} className="flex-1 border border-gray-200 py-3 rounded font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> {t('checkout.back')}
                  </button>
                  <button onClick={goNext} className="flex-1 bg-black hover:bg-stone-800 text-white py-3 rounded font-medium flex items-center justify-center gap-2">
                    {t('checkout.continue')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Payment */}
            {step === 'payment' && (
              <div className="bg-white rounded-sm shadow-sm p-6">
                <h2 className="text-lg font-bold text-black mb-4">{t('checkout.paymentMethod')}</h2>
                <div className="space-y-3">
                  {paymentOptions.map((opt) => (
                    <label key={opt.key} className={`flex items-center gap-3 p-4 rounded-sm border-2 cursor-pointer transition-colors ${paymentMethod === opt.key ? 'border-black bg-stone-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" checked={paymentMethod === opt.key} onChange={() => setPaymentMethod(opt.key)} className="text-secondary" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.noteOptional')}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('checkout.additionalNotes')} className="w-full border border-gray-200 rounded px-4 py-3 text-sm resize-none focus:border-black focus:outline-none" />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={goPrev} className="flex-1 border border-gray-200 py-3 rounded font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> {t('checkout.back')}
                  </button>
                  <button onClick={goNext} className="flex-1 bg-black hover:bg-stone-800 text-white py-3 rounded font-medium flex items-center justify-center gap-2">
                    {t('checkout.continue')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Review */}
            {step === 'review' && (
              <div className="space-y-4">
                <div className="bg-white rounded-sm shadow-sm p-6">
                  <h2 className="text-lg font-bold text-black mb-4">{t('checkout.orderReview')}</h2>

                  {/* Guest contact summary */}
                  {isGuest && (
                    <div className="mb-4 p-4 bg-stone-50 rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-black">{t('checkout.contactDetails')}</span>
                        <button onClick={() => setStep('contact')} className="text-xs text-secondary hover:underline">{t('checkout.edit')}</button>
                      </div>
                      <p className="text-sm text-gray-600">{guestInfo.name}</p>
                      <p className="text-sm text-gray-600">{guestInfo.email} | {guestInfo.phone}</p>
                    </div>
                  )}

                  {/* Address summary */}
                  <div className="mb-4 p-4 bg-stone-50 rounded-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-black">{t('checkout.shippingAddress')}</span>
                      <button onClick={() => setStep('address')} className="text-xs text-secondary hover:underline">{t('checkout.edit')}</button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {shippingAddress?.street}, {shippingAddress?.postalCode} {shippingAddress?.city}
                    </p>
                  </div>

                  {/* Shipping summary */}
                  <div className="mb-4 p-4 bg-stone-50 rounded-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-black">{t('checkout.step3')}</span>
                      <button onClick={() => setStep('shipping')} className="text-xs text-secondary hover:underline">{t('checkout.edit')}</button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {shippingMethod === 'standard' ? t('checkout.standardShort') : shippingMethod === 'express' ? t('checkout.expressShort') : t('checkout.pickupShort')}
                      {' — '}
                      {shippingCost === 0 ? t('checkout.free') : `${shippingCost} RSD`}
                    </p>
                  </div>

                  {/* Payment summary */}
                  <div className="p-4 bg-stone-50 rounded-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-black">{t('checkout.step4')}</span>
                      <button onClick={() => setStep('payment')} className="text-xs text-secondary hover:underline">{t('checkout.edit')}</button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {paymentOptions.find((o) => o.key === paymentMethod)?.label}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-sm shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-black mb-4">{t('checkout.products')} ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">x{item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString('sr-RS')} RSD</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                    {isGuest && error.includes(t('checkout.mustBeLoggedIn').substring(0, 10)) && (
                      <div className="mt-2 flex gap-2">
                        <Link href="/account/login?callbackUrl=/checkout" className="px-4 py-2 bg-black text-white text-sm rounded font-medium hover:bg-stone-800">
                          {t('checkout.loginLink')}
                        </Link>
                        <Link href="/account/register?callbackUrl=/checkout" className="px-4 py-2 border border-black text-secondary text-sm rounded font-medium hover:bg-stone-50">
                          {t('checkout.createAccount')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {!b2bMinimumMet && (
                  <div className="bg-orange-50 border border-orange-200 rounded-sm p-3 flex items-center gap-2 text-sm text-orange-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {t('checkout.b2bMinimum')} {MIN_B2B_ORDER.toLocaleString('sr-RS')} RSD
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={goPrev} className="flex-1 border border-gray-200 py-3 rounded font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> {t('checkout.back')}
                  </button>
                  <button onClick={handlePlaceOrder} disabled={isSubmitting || !b2bMinimumMet} className="flex-1 bg-black hover:bg-stone-800 text-white py-3.5 rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? t('checkout.processing') : t('checkout.placeOrderBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="bg-white rounded-sm shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-black mb-4" style={{ fontFamily: "'Noto Serif', serif" }}>{t('checkout.summary')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('checkout.subtotal')} ({items.length} {t('checkout.itemsCount')})</span>
                  <span className="font-medium">{subtotal.toLocaleString('sr-RS')} RSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('checkout.step3')}</span>
                  <span className="font-medium">{shippingCost === 0 ? t('checkout.free') : `${shippingCost} RSD`}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between text-lg font-bold">
                  <span>{t('checkout.total')}</span>
                  <span>{total.toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-secondary" /> {t('checkout.securePayment')}</div>
                <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-secondary" /> {t('checkout.freeShippingOver')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
