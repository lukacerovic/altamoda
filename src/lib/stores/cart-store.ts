import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  brand: string
  price: number
  quantity: number
  image: string
  sku: string
  stockQuantity: number
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  isHydrated: boolean

  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  getTotal: () => number
  getItemCount: () => number
}

/** Check if a user is logged in by looking for the cart owner marker */
function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('altamoda-cart-owner')
}

/** Fire-and-forget DB sync — errors are silently ignored */
function syncAddToDb(productId: string, quantity: number) {
  if (!isLoggedIn()) return
  fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  }).catch(() => {})
}

function syncUpdateInDb(productId: string, quantity: number) {
  if (!isLoggedIn()) return
  // We need the cart item DB id — fetch cart then update
  fetch('/api/cart')
    .then((r) => r.json())
    .then((data) => {
      if (!data.success) return
      const item = data.data.items.find((i: CartItem) => i.productId === productId)
      if (!item) return
      return fetch(`/api/cart/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
    })
    .catch(() => {})
}

function syncRemoveFromDb(productId: string) {
  if (!isLoggedIn()) return
  fetch('/api/cart')
    .then((r) => r.json())
    .then((data) => {
      if (!data.success) return
      const item = data.data.items.find((i: CartItem) => i.productId === productId)
      if (!item) return
      return fetch(`/api/cart/${item.id}`, { method: 'DELETE' })
    })
    .catch(() => {})
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isHydrated: false,

      addItem: (item) => {
        const { items } = get()
        const existing = items.find((i) => i.productId === item.productId)
        if (existing) {
          const newQty = existing.quantity + item.quantity
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: newQty }
                : i
            ),
          })
          syncUpdateInDb(item.productId, newQty)
        } else {
          set({
            items: [...items, { ...item, id: crypto.randomUUID() }],
          })
          syncAddToDb(item.productId, item.quantity)
        }
      },

      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })
        syncUpdateInDb(productId, quantity)
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
        syncRemoveFromDb(productId)
      },

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      setLoading: (isLoading) => set({ isLoading }),

      setHydrated: (isHydrated) => set({ isHydrated }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'altamoda-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
