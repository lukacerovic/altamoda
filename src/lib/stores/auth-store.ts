import { create } from 'zustand'

interface AuthState {
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
