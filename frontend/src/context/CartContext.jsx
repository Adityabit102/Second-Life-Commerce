import { createContext, useContext, useEffect, useState } from 'react'
import { trackInterest } from '../utils/preferences'
import { getProductCategory } from '../utils/productImages'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('slc_cart') || '[]') } catch { return [] }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('slc_cart', JSON.stringify(items))
  }, [items])

  const addItem = (listing) => {
    trackInterest(getProductCategory(listing.product_name), listing.grade)
    setItems(prev => {
      const existing = prev.find(i => i.id === listing.id)
      if (existing) return prev.map(i => i.id === listing.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...listing, qty: 1 }]
    })
    setIsOpen(true)
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, qty) => {
    if (qty <= 0) removeItem(id)
    else setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.suggested_price_inr * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
