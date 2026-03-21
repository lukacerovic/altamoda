import { describe, it, expect, beforeEach } from 'vitest'
import { useWishlistStore } from '@/lib/stores/wishlist-store'

describe('Wishlist Store', () => {
  beforeEach(() => {
    useWishlistStore.setState({ count: 0 })
  })

  it('has initial count of 0', () => {
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('setCount sets the count to the given value', () => {
    useWishlistStore.getState().setCount(5)
    expect(useWishlistStore.getState().count).toBe(5)
  })

  it('increment increases count by 1', () => {
    useWishlistStore.getState().increment()
    expect(useWishlistStore.getState().count).toBe(1)
    useWishlistStore.getState().increment()
    expect(useWishlistStore.getState().count).toBe(2)
  })

  it('decrement decreases count by 1', () => {
    useWishlistStore.getState().setCount(3)
    useWishlistStore.getState().decrement()
    expect(useWishlistStore.getState().count).toBe(2)
  })

  it('decrement does not go below 0', () => {
    useWishlistStore.getState().setCount(0)
    useWishlistStore.getState().decrement()
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('decrement from 1 results in 0', () => {
    useWishlistStore.getState().setCount(1)
    useWishlistStore.getState().decrement()
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('setCount with 0 resets count', () => {
    useWishlistStore.getState().setCount(10)
    useWishlistStore.getState().setCount(0)
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('handles large counts', () => {
    useWishlistStore.getState().setCount(9999)
    expect(useWishlistStore.getState().count).toBe(9999)
    useWishlistStore.getState().increment()
    expect(useWishlistStore.getState().count).toBe(10000)
  })
})
