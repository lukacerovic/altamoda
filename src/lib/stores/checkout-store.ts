import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CheckoutGuestInfo {
  name: string
  email: string
  phone: string
}

export interface CheckoutNewAddress {
  street: string
  city: string
  postalCode: string
  country: string
}

interface CheckoutDraftState {
  /** Current wizard step; null = not started (use first step of the flow). */
  step: string | null
  guestInfo: CheckoutGuestInfo
  selectedAddressId: string
  newAddress: CheckoutNewAddress
  /** null = not yet decided, so the "no saved addresses" default still applies. */
  useNewAddress: boolean | null
  shippingMethod: string
  /** null = use the role-based default (b2b → invoice, otherwise card). */
  paymentMethod: string | null
  notes: string
  /** True once a guest explicitly chose "continue as guest". */
  guestMode: boolean

  setStep: (step: string) => void
  setGuestInfo: (guestInfo: CheckoutGuestInfo) => void
  setSelectedAddressId: (id: string) => void
  setNewAddress: (address: CheckoutNewAddress) => void
  setUseNewAddress: (useNew: boolean) => void
  setShippingMethod: (method: string) => void
  setPaymentMethod: (method: string) => void
  setNotes: (notes: string) => void
  setGuestMode: (guestMode: boolean) => void
  clearDraft: () => void
}

const initialDraft = {
  step: null as string | null,
  guestInfo: { name: '', email: '', phone: '' },
  selectedAddressId: '',
  newAddress: { street: '', city: '', postalCode: '', country: 'Srbija' },
  useNewAddress: null as boolean | null,
  shippingMethod: 'standard',
  paymentMethod: null as string | null,
  notes: '',
  guestMode: false,
}

export const useCheckoutStore = create<CheckoutDraftState>()(
  persist(
    (set) => ({
      ...initialDraft,

      setStep: (step) => set({ step }),
      setGuestInfo: (guestInfo) => set({ guestInfo }),
      setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
      setNewAddress: (newAddress) => set({ newAddress }),
      setUseNewAddress: (useNewAddress) => set({ useNewAddress }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setNotes: (notes) => set({ notes }),
      setGuestMode: (guestMode) => set({ guestMode }),
      clearDraft: () => set({ ...initialDraft }),
    }),
    {
      name: 'altamoda-checkout-draft',
      partialize: (state) => ({
        step: state.step,
        guestInfo: state.guestInfo,
        selectedAddressId: state.selectedAddressId,
        newAddress: state.newAddress,
        useNewAddress: state.useNewAddress,
        shippingMethod: state.shippingMethod,
        paymentMethod: state.paymentMethod,
        notes: state.notes,
        guestMode: state.guestMode,
      }),
    }
  )
)
