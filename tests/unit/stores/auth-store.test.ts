import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/lib/stores/auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({ isLoading: false })
  })

  it('has initial state with isLoading = false', () => {
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setLoading(true) sets isLoading to true', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
  })

  it('setLoading(false) sets isLoading back to false', () => {
    useAuthStore.getState().setLoading(true)
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('multiple setLoading calls work correctly', () => {
    const { setLoading } = useAuthStore.getState()
    setLoading(true)
    setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
    setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
