import { create } from 'zustand'

interface WishlistState {
  count: number
  setCount: (count: number) => void
  increment: () => void
  decrement: () => void
}

export const useWishlistStore = create<WishlistState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}))
