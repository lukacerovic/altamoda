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
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { ...item, id: crypto.randomUUID() }],
          })
        }
      },

      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
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
