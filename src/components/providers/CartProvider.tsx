'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useWishlistStore } from '@/lib/stores/wishlist-store'

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { items, setItems, setLoading, setHydrated } = useCartStore()
  const setWishlistCount = useWishlistStore((s) => s.setCount)

  // Hydrate cart from API when user logs in
  useEffect(() => {
    if (status === 'loading') return
    setHydrated(true)

    if (session?.user) {
      // User is logged in — merge guest cart then fetch from API
      const mergeAndFetch = async () => {
        setLoading(true)
        try {
          // If there are guest items in localStorage, merge them
          if (items.length > 0) {
            await fetch('/api/cart/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                })),
              }),
            })
          }

          // Fetch the authoritative cart from DB
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
      mergeAndFetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status])

  return <>{children}</>
}
