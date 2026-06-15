import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { getProductImage } from '../utils/productImages'

function CartItem({ item, onRemove, onQty }) {
  const [imgErr, setImgErr] = useState(false)
  const imgUrl = item.image_url || getProductImage(item.product_name)

  return (
    <div className="flex gap-3 py-4 border-b border-amz-border last:border-0">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 bg-[#f7f7f7] rounded border border-amz-border overflow-hidden flex items-center justify-center">
        {imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={item.product_name}
            className="w-full h-full object-contain p-1"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-2xl font-black text-[#D5D9D9] select-none">
            {item.product_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-amz-teal font-medium line-clamp-2 leading-snug">{item.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">by Second Life Commerce</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[#00A8E1] font-black text-[10px] italic">prime</span>
          <span className="text-[11px] text-amz-green font-medium">FREE Delivery</span>
        </div>
        <p className="text-base font-black text-amz-text mt-1">
          ₹{(item.suggested_price_inr * item.qty).toLocaleString('en-IN')}
        </p>

        {/* Qty controls + Delete */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-amz-border rounded-full overflow-hidden bg-amz-bg">
            <button
              onClick={() => onQty(item.id, item.qty - 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-amz-border text-amz-text font-bold text-sm transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-black text-amz-text">
              {item.qty}
            </span>
            <button
              onClick={() => onQty(item.id, item.qty + 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-amz-border text-amz-text font-bold text-sm transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-xs text-amz-teal hover:text-amz-red hover:underline transition-colors"
          >
            Delete
          </button>
          <button className="text-xs text-amz-teal hover:underline transition-colors">
            Save for later
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count, isOpen, setIsOpen, clearCart } = useCart()
  const [ordered, setOrdered]         = useState(false)
  const [creditsBalance, setCreditsBalance] = useState(0)
  const [applyCredits, setApplyCredits]     = useState(false)

  useEffect(() => {
    if (!isOpen) return
    axios.get('/api/v1/credits/wallet')
      .then(r => setCreditsBalance(r.data.total_credits || 0))
      .catch(() => {})
  }, [isOpen])

  if (!isOpen) return null

  const maxCredits = Math.min(creditsBalance, Math.floor(total * 0.2))
  const creditsDiscount = applyCredits ? maxCredits : 0
  const finalTotal = Math.max(0, total - creditsDiscount)

  const handleCheckout = async () => {
    if (applyCredits && creditsDiscount > 0) {
      try {
        await axios.post('/api/v1/credits/redeem', { credits_used: creditsDiscount })
        setCreditsBalance(b => b - creditsDiscount)
      } catch {}
    }
    setOrdered(true)
    setTimeout(() => clearCart(), 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => { setIsOpen(false); setOrdered(false) }}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] max-w-[95vw] bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="bg-amz-dark text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-amz-yellow" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-bold text-base">
              {ordered ? 'Order Confirmed!' : `Shopping Cart (${count})`}
            </span>
          </div>
          <button
            onClick={() => { setIsOpen(false); setOrdered(false) }}
            className="text-gray-300 hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        {ordered ? (
          /* ── Order success ── */
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 text-4xl">🎉</div>
            <h3 className="text-xl font-black text-amz-text mb-2">Order Placed!</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              Your items will be delivered by <strong>Sun, 15 Jun</strong>.
            </p>
            <p className="text-xs text-amz-green font-medium mb-6">
              🌿 You earned Green Credits for choosing pre-loved items!
            </p>
            <div className="bg-amz-bg rounded-lg p-4 w-full text-left mb-6 border border-amz-border">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Order Summary</p>
              <p className="text-xs text-amz-text">✓ Free delivery · <span className="text-[#00A8E1] italic font-black text-[11px]">prime</span> eligible</p>
              <p className="text-xs text-amz-text">✓ Carbon-neutral shipment</p>
              <p className="text-xs text-amz-text">✓ 30-day return policy</p>
            </div>
            <button
              onClick={() => { setOrdered(false); setIsOpen(false) }}
              className="bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text font-bold px-8 py-2.5 rounded-full border border-[#FFA41C] transition-colors shadow-sm"
            >
              Continue Shopping
            </button>
          </div>

        ) : items.length === 0 ? (
          /* ── Empty cart ── */
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-bold text-amz-text mb-1">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-5">
              Add pre-loved items from the marketplace
            </p>
            <Link
              to="/marketplace"
              onClick={() => setIsOpen(false)}
              className="bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text font-bold px-6 py-2.5 rounded-full border border-[#FFA41C] transition-colors text-sm shadow-sm"
            >
              Browse Marketplace
            </Link>
          </div>

        ) : (
          <>
            {/* ── Items list ── */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onQty={updateQty}
                />
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="border-t-2 border-amz-border px-5 py-4 flex-shrink-0 bg-white space-y-3">
              {/* Green credits redemption */}
              {creditsBalance > 0 && (
                <div className={`rounded-lg border px-3 py-2.5 transition-colors ${applyCredits ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <label className="flex items-center justify-between cursor-pointer gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">🌿</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800">Apply Green Credits</p>
                        <p className="text-[10px] text-gray-500">{creditsBalance} credits available · Save up to ₹{maxCredits}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={applyCredits}
                      onChange={e => setApplyCredits(e.target.checked)}
                      className="accent-green-600 w-4 h-4 flex-shrink-0"
                    />
                  </label>
                  {applyCredits && creditsDiscount > 0 && (
                    <p className="text-[11px] text-green-700 font-semibold mt-1 pl-6">
                      −₹{creditsDiscount} discount applied!
                    </p>
                  )}
                </div>
              )}

              {/* Subtotal */}
              <div className="space-y-1">
                {creditsDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subtotal:</span>
                    <span className="line-through">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {creditsDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-green-700 font-medium">
                    <span>Green Credits discount:</span>
                    <span>−₹{creditsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amz-text font-medium">
                    {creditsDiscount > 0 ? 'Total' : `Subtotal (${count} ${count === 1 ? 'item' : 'items'})`}:
                  </span>
                  <span className="text-xl font-black text-amz-text">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-amz-green font-medium -mt-1">
                Eligible for FREE Delivery
              </p>

              {/* Gift checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-amz-orange w-4 h-4" />
                <span className="text-xs text-amz-text">This order contains a gift</span>
              </label>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-amz-yellow hover:bg-amz-yellow-hover active:bg-[#e8bb00] text-amz-text font-bold py-3 rounded-full border border-[#FFA41C] transition-colors shadow-sm text-sm"
              >
                Proceed to Checkout ({count} {count === 1 ? 'item' : 'items'})
              </button>

              <p className="text-center text-[10px] text-gray-400">
                ♻️ Pre-loved items · 🌱 Carbon-neutral delivery · 🔒 Secure checkout
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
