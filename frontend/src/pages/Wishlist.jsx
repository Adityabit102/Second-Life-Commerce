import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

const GRADE_LABEL = { A: 'Like New', B: 'Refurbished', C: 'Fair', Junk: 'For Parts' }
const GRADE_COLOR = { A: 'text-green-700 bg-green-50 border-green-200', B: 'text-blue-700 bg-blue-50 border-blue-200', C: 'text-yellow-700 bg-yellow-50 border-yellow-200', Junk: 'text-red-700 bg-red-50 border-red-200' }

function WishlistItem({ listing }) {
  const { remove } = useWishlist()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const GRADE_RETAIL = { A: 1 / 0.75, B: 1 / 0.55, C: 1 / 0.30, Junk: 2 }
  const origPrice = Math.round(listing.suggested_price_inr * (GRADE_RETAIL[listing.grade] ?? 1.4))
  const savings = origPrice - listing.suggested_price_inr
  const savingsPct = Math.round((savings / origPrice) * 100)

  const handleAdd = () => {
    addItem(listing)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white border border-amz-border rounded p-4 flex gap-4 items-start">
      {/* Image */}
      <div className="w-28 h-28 flex-shrink-0 bg-gray-50 border border-amz-border rounded overflow-hidden">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0f1111] line-clamp-2 leading-snug">{listing.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">by Second Life Commerce</p>

        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${GRADE_COLOR[listing.grade] ?? GRADE_COLOR.C}`}>
            Grade {listing.grade} — {GRADE_LABEL[listing.grade] ?? 'Used'}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-[#0f1111]">₹{listing.suggested_price_inr.toLocaleString('en-IN')}</span>
          <span className="text-xs text-gray-500 line-through">₹{origPrice.toLocaleString('en-IN')}</span>
          <span className="text-xs text-green-700 font-semibold">Save {savingsPct}%</span>
        </div>

        <p className="text-xs text-green-700 font-semibold mt-0.5">In Stock</p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAdd}
            className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
              added
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-amz-yellow text-amz-text border-[#FFA41C] hover:bg-amz-yellow-hover'
            }`}
          >
            {added ? '✓ Added to Cart' : 'Add to Cart'}
          </button>
          <button
            onClick={() => remove(listing.id)}
            className="text-sm text-[#007185] hover:text-[#c45500] hover:underline px-2"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Price on right (desktop) */}
      <div className="hidden sm:block text-right flex-shrink-0">
        <p className="text-lg font-bold text-[#0f1111]">₹{listing.suggested_price_inr.toLocaleString('en-IN')}</p>
        <p className="text-xs text-red-600 font-semibold">-{savingsPct}% off</p>
      </div>
    </div>
  )
}

export default function Wishlist() {
  const { items } = useWishlist()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f1111]">Your Wish List</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length === 0 ? 'No items' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/marketplace" className="text-sm text-[#007185] hover:text-[#c45500] hover:underline">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-amz-border rounded p-10 text-center">
          <p className="text-4xl mb-3">🤍</p>
          <p className="text-lg font-semibold text-[#0f1111]">Your wish list is empty</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Browse the marketplace and click the heart icon to save items here.</p>
          <Link
            to="/marketplace"
            className="inline-block bg-amz-yellow text-amz-text font-semibold text-sm px-6 py-2 rounded-full border border-[#FFA41C] hover:bg-amz-yellow-hover transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(listing => (
            <WishlistItem key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
