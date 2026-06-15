import { createContext, useContext, useEffect, useState } from 'react'
import { trackInterest } from '../utils/preferences'
import { getProductCategory } from '../utils/productImages'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('slc_wishlist') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('slc_wishlist', JSON.stringify(items))
  }, [items])

  const toggle = (listing) => {
    const alreadyIn = items.some(i => i.id === listing.id)
    if (!alreadyIn) trackInterest(getProductCategory(listing.product_name), listing.grade)
    setItems(prev =>
      alreadyIn ? prev.filter(i => i.id !== listing.id) : [...prev, listing]
    )
  }

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const isWishlisted = (id) => items.some(i => i.id === id)

  return (
    <WishlistContext.Provider value={{ items, toggle, remove, isWishlisted, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
