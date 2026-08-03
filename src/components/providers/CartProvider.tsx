'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useWishlistStore } from '@/lib/stores/wishlist-store'

/**
 * Tracks which userId the localStorage cart belongs to.
 * This survives page navigations (unlike refs) so we can detect
 * when the cart was left behind by a different user.
 */
function getCartOwner(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('altamoda-cart-owner')
}

function setCartOwner(userId: string | null) {
  if (typeof window === 'undefined') return
  if (userId) {
    localStorage.setItem('altamoda-cart-owner', userId)
  } else {
    localStorage.removeItem('altamoda-cart-owner')
  }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { items, setItems, clearCart, setLoading, setHydrated } = useCartStore()
  const setWishlistCount = useWishlistStore((s) => s.setCount)
  const hasMergedRef = useRef(false)

  useEffect(() => {
    if (status === 'loading') return
    setHydrated(true)

    const currentUserId = session?.user?.id ?? null
    const cartOwner = getCartOwner()

    // No user logged in — clear any leftover cart from a previous user
    if (!currentUserId) {
      if (cartOwner) {
        // Cart belongs to a user who logged out — wipe it. The guest wishlist
        // (guestItems) survives logout; the previous user's server-side
        // wishlist was never in local state, so the badge falls back to
        // whatever the guest has locally.
        clearCart()
        setWishlistCount(useWishlistStore.getState().guestItems.length)
        setCartOwner(null)
      }
      // Guest with no leftover data — nothing to do
      return
    }

    // User is logged in but cart belongs to a different user — clear stale data
    if (cartOwner && cartOwner !== currentUserId) {
      clearCart()
      setWishlistCount(useWishlistStore.getState().guestItems.length)
      hasMergedRef.current = false
    }

    // Mark this user as the cart owner
    setCartOwner(currentUserId)

    const syncCart = async () => {
      setLoading(true)
      try {
        // Merge guest cart items into DB only once per login
        const guestItems = useCartStore.getState().items
        if (!hasMergedRef.current && guestItems.length > 0 && !cartOwner) {
          hasMergedRef.current = true
          await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: guestItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            }),
          })
        }

        // Merge the guest wishlist into the user's DB wishlist. The endpoint
        // is a union and idempotent, so no once-per-login guard is needed —
        // guest ids are only cleared after a successful merge, and the GET
        // below always sets the authoritative count.
        try {
          const guestWishlist = useWishlistStore.getState().guestItems
          if (guestWishlist.length > 0) {
            const mergeRes = await fetch('/api/wishlist/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: guestWishlist }),
            })
            if (mergeRes.ok) {
              useWishlistStore.getState().clearGuest()
            }
          }
        } catch (err) {
          // Keep guestItems so the merge can retry on the next sync
          console.error('Wishlist merge error:', err)
        }

        // Fetch the authoritative cart from DB — always replaces localStorage
        const [cartRes, wishlistRes] = await Promise.all([
          fetch('/api/cart'),
          fetch('/api/wishlist'),
        ])
        if (cartRes.ok) {
          const data = await cartRes.json()
          if (data.success) {
            setItems(data.data.items)
          }
        }
        if (wishlistRes.ok) {
          const data = await wishlistRes.json()
          if (data.success) {
            setWishlistCount(data.data.items.length)
          }
        }
      } catch (err) {
        console.error('Cart sync error:', err)
      } finally {
        setLoading(false)
      }
    }
    syncCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status])

  return <>{children}</>
}
