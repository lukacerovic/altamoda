import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  count: number
  setCount: (count: number) => void
  increment: () => void
  decrement: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      count: 0,
      setCount: (count) => set({ count }),
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
    }),
    {
      name: 'altamoda-wishlist',
      partialize: (state) => ({ count: state.count }),
    }
  )
)
