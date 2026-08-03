import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  count: number
  /** Guest wishlist product IDs, newest first. Merged into the DB wishlist on login. */
  guestItems: string[]
  setCount: (count: number) => void
  increment: () => void
  decrement: () => void
  /** Adds (to front) or removes a product ID for guests. Returns true if added. */
  toggleGuest: (productId: string) => boolean
  /** Empties guestItems (after a successful server merge). Does NOT touch count. */
  clearGuest: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      count: 0,
      guestItems: [],
      setCount: (count) => set({ count }),
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
      toggleGuest: (productId) => {
        const current = get().guestItems
        const added = !current.includes(productId)
        const next = added
          ? [productId, ...current]
          : current.filter((id) => id !== productId)
        set({ guestItems: next, count: next.length })
        return added
      },
      clearGuest: () => set({ guestItems: [] }),
    }),
    {
      name: 'altamoda-wishlist',
      partialize: (state) => ({ count: state.count, guestItems: state.guestItems }),
    }
  )
)
