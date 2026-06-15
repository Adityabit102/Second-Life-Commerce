import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { getProductImage, getProductCategory } from '../utils/productImages'
import { hasPreferences, rankListings, topPreferredCategory } from '../utils/preferences'

const GRADE_BADGE = {
  A:    { cls: 'bg-green-100 text-green-800 border border-green-200', label: 'Grade A' },
  B:    { cls: 'bg-blue-100 text-blue-800 border border-blue-200',   label: 'Grade B' },
  C:    { cls: 'bg-amber-100 text-amber-800 border border-amber-200', label: 'Grade C' },
  Junk: { cls: 'bg-red-100 text-red-800 border border-red-200',      label: 'For Parts' },
}

const GRADE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'A', label: 'Grade A' },
  { value: 'B', label: 'Grade B' },
  { value: 'C', label: 'Grade C' },
]

const CATEGORY_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'Electronics', label: '📱 Electronics' },
  { value: 'Apparel', label: '👕 Apparel' },
  { value: 'Home', label: '🏠 Home & Kitchen' },
  { value: 'Books', label: '📚 Books' },
  { value: 'Sports', label: '⚽ Sports & Fitness' },
]

const isVideoUrl = (url) => Boolean(url) && /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i.test(url)

const RISK_LEVEL_CONFIG = {
  low:    { cls: 'bg-green-100 text-green-700', bar: 'bg-green-500', label: 'Low Risk' },
  medium: { cls: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', label: 'Moderate Risk' },
  high:   { cls: 'bg-red-100 text-red-700',     bar: 'bg-red-500',   label: 'High Risk' },
}

const CAT_API_MAP = {
  Electronics: 'Electronics',
  Apparel:     'Apparel & Footwear',
  Home:        'Home Appliances',
  Books:       'Books & Stationery',
  Sports:      'Sports & Fitness',
  Other:       'Other',
}

function StarRow({ score }) {
  const rating = (score / 100) * 5
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-[14px] h-[14px] ${i <= filled ? 'text-amz-orange' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[11px] text-amz-teal ml-0.5 font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

function PhotoCarousel({ listing }) {
  const fallback = getProductImage(listing.product_name)
  const allPhotos = [
    listing.image_url || fallback,
    ...(listing.extra_images || []),
  ].filter(Boolean)

  const [idx, setIdx] = useState(0)
  const [err, setErr]  = useState(false)

  const prev = useCallback((e) => { e.stopPropagation(); setErr(false); setIdx(i => (i - 1 + allPhotos.length) % allPhotos.length) }, [allPhotos.length])
  const next = useCallback((e) => { e.stopPropagation(); setErr(false); setIdx(i => (i + 1) % allPhotos.length) }, [allPhotos.length])

  const src = allPhotos[idx]

  return (
    <div className="relative w-full h-44 group/carousel">
      {src && !err ? (
        isVideoUrl(src) ? (
          <video
            src={src}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-44 object-contain p-3"
          />
        ) : (
          <img
            src={src}
            alt={`${listing.product_name} photo ${idx + 1}`}
            className="w-full h-44 object-contain p-3"
            onError={() => setErr(true)}
          />
        )
      ) : (
        <div className="w-full h-44 flex items-center justify-center">
          <span className="text-7xl font-black text-[#D5D9D9] select-none">
            {listing.product_name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Prev / Next arrows — only when multiple photos */}
      {allPhotos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center text-xs opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center text-xs opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {allPhotos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setErr(false); setIdx(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-amz-orange scale-125' : 'bg-gray-400/70 hover:bg-gray-600'}`}
              />
            ))}
          </div>

          {/* Count / type badge */}
          <span className="absolute top-2 left-2 text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full z-10 flex items-center gap-1">
            {isVideoUrl(src) && <span>🎥</span>}
            {idx + 1}/{allPhotos.length}
          </span>
        </>
      )}
    </div>
  )
}

const CATEGORY_COLORS = {
  Electronics: 'bg-blue-50 text-blue-700',
  Apparel:     'bg-purple-50 text-purple-700',
  Home:        'bg-amber-50 text-amber-700',
  Books:       'bg-emerald-50 text-emerald-700',
  Sports:      'bg-red-50 text-red-700',
  Other:       'bg-gray-50 text-gray-600',
}

// ── Compact card used in the "Recommended for You" strip ──────────────────────
function RecoCard({ listing }) {
  const { addItem } = useCart()
  const [addedState, setAddedState] = useState('idle')
  const [imgErr, setImgErr]         = useState(false)
  const imgUrl = listing.image_url || getProductImage(listing.product_name)
  const badge  = GRADE_BADGE[listing.grade] ?? GRADE_BADGE['C']

  return (
    <div className="flex-shrink-0 w-28 sm:w-32 bg-white border border-amz-border rounded hover:border-amz-orange hover:shadow-md transition-all group">
      <div className="bg-[#f8f8f8] rounded-t h-20 sm:h-24 flex items-center justify-center overflow-hidden">
        {imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={listing.product_name}
            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-4xl font-black text-[#D5D9D9] select-none">
            {listing.product_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="p-2 space-y-1">
        <p className="text-[10px] text-amz-teal line-clamp-2 leading-tight font-medium min-h-[2rem]">
          {listing.title || listing.product_name}
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`inline-block text-[9px] font-bold px-1 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
          {listing.grade === 'A' && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">🛡️</span>
          )}
        </div>
        <p className="text-[11px] font-black text-amz-text">₹{listing.suggested_price_inr.toLocaleString('en-IN')}</p>
        <button
          onClick={() => {
            addItem(listing)
            setAddedState('added')
            setTimeout(() => setAddedState('idle'), 2000)
          }}
          className={`w-full text-[10px] font-bold py-1 rounded-full border transition-all ${
            addedState === 'added'
              ? 'bg-green-500 text-white border-green-600'
              : 'bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text border-[#FFA41C]'
          }`}
        >
          {addedState === 'added' ? '✓ Added' : '+ Cart'}
        </button>
      </div>
    </div>
  )
}

// ── Product detail modal (Amazon-style) ──────────────────────────────────────
function ListingDetailModal({ listing, onClose }) {
  const { addItem, setIsOpen } = useCart()
  const [addedState, setAddedState] = useState('idle')
  const [activeImg, setActiveImg]   = useState(0)
  const [imgErr, setImgErr]         = useState(false)
  const [riskOpen, setRiskOpen]     = useState(false)
  const [risk, setRisk]             = useState(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const scrollRef = useRef(null)

  const fallback  = getProductImage(listing.product_name)
  const allPhotos = [listing.image_url || fallback, ...(listing.extra_images || [])].filter(Boolean)

  const badge      = GRADE_BADGE[listing.grade] ?? GRADE_BADGE['C']
  const cat        = getProductCategory(listing.product_name)
  const GRADE_RETAIL = { A: 1 / 0.75, B: 1 / 0.55, C: 1 / 0.30, Junk: 2 }
  const origPrice  = Math.round(listing.suggested_price_inr * (GRADE_RETAIL[listing.grade] ?? 1.4))
  const savings    = origPrice - listing.suggested_price_inr
  const savingsPct = Math.round((savings / origPrice) * 100)
  const isRenewed  = listing.grade === 'A'
  const isPrime    = listing.suggested_price_inr >= 1000
  const isFreeDeliv = listing.suggested_price_inr >= 500
  const reviewCount = Math.round(listing.trust_score * 14 + listing.product_name.length * 8 + 150)
  const rcfg       = risk ? (RISK_LEVEL_CONFIG[risk.risk_level] ?? RISK_LEVEL_CONFIG.medium) : null

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const fetchRisk = async () => {
    if (risk || riskLoading) { setRiskOpen(o => !o); return }
    setRiskOpen(true); setRiskLoading(true)
    try {
      const { data } = await axios.post('/api/v1/predict/return-risk', {
        product_name: listing.product_name,
        category: CAT_API_MAP[cat] || 'Other',
        price_inr: listing.suggested_price_inr,
      })
      setRisk(data)
    } catch {
      setRisk({ risk_level: 'medium', risk_score: 50, top_reasons: ['Unable to assess'], suggestion: '' })
    } finally {
      setRiskLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={scrollRef} className="bg-white rounded-lg shadow-2xl w-full max-w-5xl relative">

        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-amz-border sticky top-0 bg-white z-10 rounded-t-lg">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-amz-teal font-medium">Second Life Marketplace</span>
            <span>›</span>
            <span className="line-clamp-1 max-w-[200px] sm:max-w-none">{listing.product_name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── Main content: gallery + details ── */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8">

          {/* Left column: thumbnail strip + main image */}
          <div className="flex gap-3 md:w-80">
            {/* Thumbnail strip */}
            {allPhotos.length > 1 && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                {allPhotos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => { setImgErr(false); setActiveImg(i) }}
                    className={`w-14 h-14 border-2 rounded overflow-hidden transition-all flex-shrink-0 ${
                      activeImg === i
                        ? 'border-amz-orange shadow-md'
                        : 'border-amz-border hover:border-amz-orange'
                    }`}
                  >
                    {isVideoUrl(src) ? (
                      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-white text-base leading-none">▶</span>
                        <span className="text-[8px] text-gray-300 font-bold">VIDEO</span>
                      </div>
                    ) : (
                      <img src={src} alt="" className="w-full h-full object-contain p-1"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main media viewer */}
            <div className="flex-1 bg-[#f8f8f8] rounded-lg flex items-center justify-center overflow-hidden min-h-60 max-h-80">
              {allPhotos[activeImg] && !imgErr ? (
                isVideoUrl(allPhotos[activeImg]) ? (
                  <video
                    key={activeImg}
                    src={allPhotos[activeImg]}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-72 max-w-full object-contain p-2 rounded"
                  />
                ) : (
                  <img
                    key={activeImg}
                    src={allPhotos[activeImg]}
                    alt={`${listing.product_name} photo ${activeImg + 1}`}
                    className="max-h-72 max-w-full object-contain p-4 transition-opacity duration-150"
                    onError={() => setImgErr(true)}
                  />
                )
              ) : (
                <span className="text-8xl font-black text-gray-200 select-none">
                  {listing.product_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Right column: all product details */}
          <div className="space-y-3 min-w-0">

            {/* Title + seller */}
            <div>
              <h1 className="text-[15px] sm:text-base font-medium text-amz-text leading-snug">{listing.title}</h1>
              <p className="text-xs text-gray-500 mt-1">
                Visit the <span className="text-amz-teal hover:underline cursor-pointer">Second Life Commerce</span> Store
              </p>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 flex-wrap">
              <StarRow score={listing.trust_score} />
              <span className="text-xs text-amz-teal hover:underline cursor-pointer">
                {reviewCount.toLocaleString()} ratings
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-amz-teal hover:underline cursor-pointer">Search "similar items"</span>
            </div>

            <div className="border-t border-amz-border" />

            {/* Price block */}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                M.R.P.: <span className="line-through">₹{origPrice.toLocaleString('en-IN')}</span>
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-amz-red font-bold text-sm">-{savingsPct}%</span>
                <span className="text-2xl sm:text-3xl font-black text-amz-text leading-none">
                  ₹{listing.suggested_price_inr.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Inclusive of all taxes</p>
              <p className="text-[11px] text-green-700 font-medium mt-0.5">
                You Save: ₹{savings.toLocaleString('en-IN')} ({savingsPct}%)
              </p>
            </div>

            {/* Grade + category + renewed */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${badge.cls}`}>
                {badge.label} — AI Graded
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other}`}>
                {cat}
              </span>
              {isRenewed && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                  🛡️ Amazon Renewed · 6-mo warranty
                </span>
              )}
            </div>

            {/* AI Trust Score bar */}
            <div className="border border-amz-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-amz-text">AI Trust Score</p>
                <span className="text-xs font-black text-amz-teal">{listing.trust_score}/100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amz-teal transition-all"
                  style={{ width: `${listing.trust_score}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Graded by Second Life AI · Verified condition</p>
            </div>

            {/* Delivery block */}
            <div className="bg-[#f0f2f2] rounded-lg p-3 space-y-1.5">
              {isPrime ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#00A8E1] font-black text-sm italic tracking-tight">prime</span>
                  <span className="text-sm font-medium text-amz-text">FREE Delivery</span>
                </div>
              ) : (
                <p className="text-sm font-medium text-amz-text">
                  {isFreeDeliv ? 'FREE Delivery' : `₹${listing.suggested_price_inr < 200 ? 40 : 29} Delivery charge`}
                </p>
              )}
              <p className="text-xs text-gray-600">
                Get it <span className="font-semibold text-amz-text">{isPrime ? 'Tomorrow' : isFreeDeliv ? 'in 3–4 days' : 'in 5–7 days'}</span>
              </p>
              <p className="text-sm text-amz-green font-medium">In Stock</p>
            </div>

            {/* Add to Cart / Buy Now */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { addItem(listing); setAddedState('added'); setTimeout(() => setAddedState('idle'), 2500) }}
                className={`w-full py-2.5 rounded-full font-bold text-sm border transition-all shadow-sm ${
                  addedState === 'added'
                    ? 'bg-green-500 text-white border-green-600 scale-[0.98]'
                    : 'bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text border-[#FFA41C]'
                }`}
              >
                {addedState === 'added' ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => { addItem(listing); setIsOpen(true); onClose() }}
                className="w-full py-2.5 rounded-full font-bold text-sm bg-[#FFA41C] hover:bg-[#FF8F00] text-amz-text border border-[#E57000] transition-colors shadow-sm"
              >
                Buy Now
              </button>
            </div>

            {/* Secure transaction note */}
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              🔒 Secure transaction · Ships from Second Life Commerce
            </p>
          </div>
        </div>

        {/* ── Bottom section: About this item + Description + Risk ── */}
        <div className="border-t border-amz-border mx-4 sm:mx-6" />
        <div className="px-4 sm:px-6 py-5 space-y-5">

          {/* Highlights */}
          {listing.highlights?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-amz-text mb-3 pb-1 border-b border-amz-border">
                About this item
              </h2>
              <ul className="space-y-2">
                {listing.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="text-amz-orange font-bold mt-0.5 flex-shrink-0 text-base leading-none">›</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-sm font-bold text-amz-text mb-3 pb-1 border-b border-amz-border">
                Product Description
              </h2>
              <p className="text-[13px] text-gray-600 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Technical details table */}
          <div>
            <h2 className="text-sm font-bold text-amz-text mb-3 pb-1 border-b border-amz-border">
              Technical Details
            </h2>
            <table className="w-full text-[12px]">
              <tbody>
                {[
                  ['Condition Grade', `${badge.label} — AI Graded`],
                  ['Category', cat],
                  ['AI Trust Score', `${listing.trust_score}/100`],
                  ['Seller', 'Second Life Commerce'],
                  ['Warranty', isRenewed ? '6 months Amazon Renewed warranty' : 'Sold as-is'],
                  ['Return Policy', '7 days replacement'],
                  ['Listed Since', new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                ].map(([label, val]) => (
                  <tr key={label} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-500 font-medium w-44 align-top">{label}</td>
                    <td className="py-2 text-amz-text">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Return risk */}
          <div className="border-t border-amz-border pt-4">
            <button
              onClick={fetchRisk}
              className="text-[13px] text-gray-500 hover:text-amz-teal flex items-center gap-1.5 transition-colors font-medium"
            >
              🔍 {riskLoading ? 'Analysing…' : riskOpen ? 'Hide return risk analysis ▲' : 'Check return risk analysis ▼'}
            </button>
            {riskOpen && !riskLoading && rcfg && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rcfg.cls}`}>{rcfg.label}</span>
                  <span className="text-xs text-gray-500">Risk score: {risk.risk_score}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${rcfg.bar}`} style={{ width: `${risk.risk_score}%` }} />
                </div>
                {risk.top_reasons?.map((r, i) => (
                  <p key={i} className="text-[12px] text-gray-600 flex items-start gap-1.5">
                    <span className="text-amz-orange font-bold flex-shrink-0">•</span> {r}
                  </p>
                ))}
                {risk.suggestion && (
                  <p className="text-[12px] text-amz-teal font-medium">{risk.suggestion}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Full listing card ─────────────────────────────────────────────────────────
function ListingCard({ listing }) {
  const { addItem, setIsOpen } = useCart()
  const { toggle: wishlistToggle, isWishlisted } = useWishlist()
  const [showDetail, setShowDetail]   = useState(false)
  const wishlisted                    = isWishlisted(listing.id)
  const [addedState, setAddedState]   = useState('idle')
  const [riskOpen, setRiskOpen]       = useState(false)
  const [risk, setRisk]               = useState(null)
  const [riskLoading, setRiskLoading] = useState(false)

  const badge        = GRADE_BADGE[listing.grade] ?? GRADE_BADGE['C']
  const cat          = getProductCategory(listing.product_name)
  // Reverse the grade discount to get an approximate retail/MRP price
  const GRADE_RETAIL = { A: 1 / 0.75, B: 1 / 0.55, C: 1 / 0.30, Junk: 2 }
  const origPrice    = Math.round(listing.suggested_price_inr * (GRADE_RETAIL[listing.grade] ?? 1.4))
  const savings      = origPrice - listing.suggested_price_inr
  const savingsPct   = Math.round((savings / origPrice) * 100)
  const isChoice     = listing.trust_score >= 85
  const isBestSeller = listing.grade === 'A'
  const isSponsored  = listing.grade === 'B'
  const isLowStock   = listing.grade === 'C' || listing.grade === 'Junk'
  const isRenewed    = listing.grade === 'A'
  const stockLeft    = listing.grade === 'Junk' ? 1 : 3
  const reviewCount  = Math.round(listing.trust_score * 14 + listing.product_name.length * 8 + 150)
  const price        = listing.suggested_price_inr
  const isPrime      = price >= 1000
  const isFreeDeliv  = price >= 500
  const deliveryFee  = price < 500 ? (price < 200 ? 40 : 29) : 0
  const delivByDate  = isPrime ? 'Tomorrow' : isFreeDeliv ? 'in 3–4 days' : 'in 5–7 days'
  const rcfg         = risk ? (RISK_LEVEL_CONFIG[risk.risk_level] ?? RISK_LEVEL_CONFIG.medium) : null

  const handleAddToCart = () => {
    addItem(listing)
    setAddedState('added')
    setTimeout(() => setAddedState('idle'), 2500)
  }

  const handleBuyNow = () => {
    addItem(listing)
    setIsOpen(true)
  }

  const fetchRisk = async () => {
    if (risk || riskLoading) { setRiskOpen(o => !o); return }
    setRiskOpen(true)
    setRiskLoading(true)
    try {
      const { data } = await axios.post('/api/v1/predict/return-risk', {
        product_name: listing.product_name,
        category:    CAT_API_MAP[cat] || 'Other',
        price_inr:   listing.suggested_price_inr,
      })
      setRisk(data)
    } catch {
      setRisk({ risk_level: 'medium', risk_score: 50, top_reasons: ['Unable to assess'], suggestion: '' })
    } finally {
      setRiskLoading(false)
    }
  }

  return (
    <div className="bg-white border border-amz-border rounded hover:shadow-xl transition-shadow duration-200 flex flex-col group relative">

      {/* Wishlist */}
      <button
        onClick={() => wishlistToggle(listing)}
        className="absolute top-2 right-2 z-20 bg-white rounded-full p-1.5 shadow border border-amz-border opacity-0 group-hover:opacity-100 transition-opacity"
        title="Add to Wish List"
      >
        <svg
          className={`w-4 h-4 transition-colors ${wishlisted ? 'text-amz-red' : 'text-gray-400 hover:text-amz-red'}`}
          fill={wishlisted ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image area */}
      <div className="relative bg-[#f8f8f8] rounded-t overflow-hidden cursor-pointer" onClick={() => setShowDetail(true)}>
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isBestSeller && (
            <span className="bg-[#E47911] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm leading-snug">
              #1 Best Seller
            </span>
          )}
          {isChoice && !isBestSeller && (
            <div className="bg-amz-teal text-white px-1.5 py-0.5 rounded shadow-sm">
              <p className="text-[8px] italic leading-tight">amazon's</p>
              <p className="text-[9px] font-black leading-tight">Choice</p>
            </div>
          )}
        </div>
        <span className="absolute top-2 right-8 z-10 bg-amz-red text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
          -{savingsPct}%
        </span>
        <PhotoCarousel listing={listing} />
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 flex flex-col flex-1 gap-1.5">

        {isSponsored && <p className="text-[10px] text-gray-400 -mb-0.5">Sponsored</p>}

        <h3
          className="text-[13px] text-amz-teal hover:text-amz-red hover:underline cursor-pointer line-clamp-2 leading-snug font-medium min-h-[2.5rem]"
          onClick={() => setShowDetail(true)}
        >
          {listing.title}
        </h3>

        <p className="text-[11px] text-gray-500">
          by <span className="text-amz-teal hover:underline cursor-pointer">Second Life Commerce</span>
        </p>

        <div className="flex items-center gap-1">
          <StarRow score={listing.trust_score} />
          <span className="text-[11px] text-amz-teal hover:underline cursor-pointer">
            ({reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Grade + category badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
            {badge.label} — AI Graded
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other}`}>
            {cat}
          </span>
        </div>

        {/* Amazon Renewed badge — Grade A only */}
        {isRenewed && (
          <div className="flex items-center gap-1.5 -mt-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
              🛡️ Amazon Renewed
            </span>
            <span className="text-[10px] text-gray-400">· 6-mo warranty</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-0.5">
          <p className="text-[11px] text-gray-500">
            List Price: <span className="line-through">₹{origPrice.toLocaleString('en-IN')}</span>
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-amz-red text-sm font-bold">-{savingsPct}%</span>
            <span className="text-[22px] font-black text-amz-text leading-none">
              ₹{listing.suggested_price_inr.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-gray-500">You Save: ₹{savings.toLocaleString('en-IN')} ({savingsPct}%)</p>
          <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
        </div>

        {/* Delivery */}
        <div>
          {isPrime ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[#00A8E1] font-black text-[11px] italic tracking-tight">prime</span>
              <span className="text-[11px] text-amz-text font-medium">FREE Delivery</span>
            </div>
          ) : isFreeDeliv ? (
            <span className="text-[11px] text-amz-text font-medium">FREE Delivery</span>
          ) : (
            <span className="text-[11px] text-amz-text font-medium">
              ₹{deliveryFee} Delivery charge
            </span>
          )}
          <p className="text-[11px] text-gray-500">
            {isPrime ? 'Get it ' : 'Estimated delivery '}{delivByDate}
          </p>
        </div>

        {/* Stock */}
        {isLowStock ? (
          <p className="text-[11px] text-amz-red font-semibold">
            Only {stockLeft} left in stock – order soon.
          </p>
        ) : (
          <p className="text-[11px] text-amz-green font-medium">In Stock</p>
        )}

        {/* Highlights */}
        {listing.highlights?.length > 0 && (
          <div className="border-t border-amz-border pt-1.5 flex flex-col gap-0.5">
            {listing.highlights.slice(0, 2).map((h, i) => (
              <span key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                <span className="text-amz-orange font-bold mt-0.5 flex-shrink-0">›</span> {h}
              </span>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-1.5 mt-auto pt-2">
          <button
            onClick={handleAddToCart}
            className={`w-full text-amz-text text-xs font-bold py-2 rounded-full border transition-all shadow-sm ${
              addedState === 'added'
                ? 'bg-green-500 border-green-600 text-white scale-[0.98]'
                : 'bg-amz-yellow hover:bg-amz-yellow-hover active:bg-[#e8bb00] border-[#FFA41C]'
            }`}
          >
            {addedState === 'added' ? '✓ Added to Cart' : 'Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            className="w-full bg-[#FFA41C] hover:bg-[#FF8F00] active:bg-[#e57900] text-amz-text text-xs font-bold py-2 rounded-full border border-[#E57000] transition-colors shadow-sm"
          >
            Buy Now
          </button>
        </div>

        {/* Return Risk widget — lazy loads on click */}
        <div className="border-t border-amz-border pt-1.5">
          <button
            onClick={fetchRisk}
            className="w-full text-[11px] text-gray-400 hover:text-amz-teal flex items-center justify-center gap-1 py-0.5 transition-colors"
          >
            <span>🔍</span>
            {riskLoading ? 'Checking…' : riskOpen ? 'Hide return risk ▲' : 'Check return risk ▼'}
          </button>
          {riskOpen && !riskLoading && rcfg && (
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rcfg.cls}`}>
                  {rcfg.label}
                </span>
                <span className="text-[10px] text-gray-500">{risk.risk_score}/100</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${rcfg.bar}`} style={{ width: `${risk.risk_score}%` }} />
              </div>
              {risk.top_reasons?.[0] && (
                <p className="text-[10px] text-gray-500 leading-tight">{risk.top_reasons[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* "View details" hint */}
        <button
          onClick={() => setShowDetail(true)}
          className="w-full text-[11px] text-amz-teal hover:text-amz-orange border-t border-amz-border pt-1.5 transition-colors text-center"
        >
          View full details →
        </button>

      </div>

      {/* Detail modal */}
      {showDetail && (
        <ListingDetailModal listing={listing} onClose={() => setShowDetail(false)} />
      )}
    </div>
  )
}

const PRICE_RANGES = [
  { label: 'All Prices',        min: 0,     max: Infinity },
  { label: 'Under ₹1,000',     min: 0,     max: 1000 },
  { label: '₹1,000 – ₹5,000', min: 1000,  max: 5000 },
  { label: '₹5,000 – ₹20,000', min: 5000,  max: 20000 },
  { label: 'Above ₹20,000',    min: 20000, max: Infinity },
]

function FilterPanel({ category, setCategory, grade, setGrade, priceIdx, setPriceIdx, freeDelivery, setFreeDelivery, prime, setPrime }) {
  const activeFilters = [category, grade, priceIdx > 0, freeDelivery, prime].filter(Boolean).length
  return (
    <div className="space-y-4">
      {activeFilters > 0 && (
        <button
          onClick={() => { setCategory(''); setGrade(''); setPriceIdx(0); setFreeDelivery(false); setPrime(false) }}
          className="text-xs text-amz-teal underline"
        >
          Clear all filters ({activeFilters})
        </button>
      )}

      <div>
        <h3 className="font-bold text-amz-text text-sm border-b border-amz-border pb-2 mb-3">Category</h3>
        <div className="flex flex-col gap-2">
          {CATEGORY_FILTERS.map(f => (
            <label key={f.value} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="category" checked={category === f.value} onChange={() => setCategory(f.value)} className="accent-amz-orange w-3.5 h-3.5" />
              <span className={`text-sm group-hover:text-[#C7511F] transition-colors ${category === f.value ? 'font-bold text-amz-text' : 'text-amz-teal'}`}>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-amz-border pt-3">
        <h3 className="font-bold text-amz-text text-sm border-b border-amz-border pb-2 mb-3">Condition Grade</h3>
        <div className="flex flex-col gap-2">
          {GRADE_FILTERS.map(f => (
            <label key={f.value} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="grade" checked={grade === f.value} onChange={() => setGrade(f.value)} className="accent-amz-orange w-3.5 h-3.5" />
              <span className={`text-sm group-hover:text-[#C7511F] transition-colors ${grade === f.value ? 'font-bold text-amz-text' : 'text-amz-teal'}`}>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-amz-border pt-3">
        <h3 className="font-bold text-amz-text text-sm border-b border-amz-border pb-2 mb-3">Price Range</h3>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="price" checked={priceIdx === i} onChange={() => setPriceIdx(i)} className="accent-amz-orange w-3.5 h-3.5" />
              <span className={`text-sm transition-colors group-hover:text-[#C7511F] ${priceIdx === i ? 'font-bold text-amz-text' : 'text-amz-teal'}`}>{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-amz-border pt-3">
        <h3 className="font-bold text-amz-text text-sm mb-2.5">Delivery</h3>
        <label className="flex items-center gap-2 cursor-pointer mb-2 group">
          <input type="checkbox" checked={freeDelivery} onChange={e => setFreeDelivery(e.target.checked)} className="accent-amz-orange w-3.5 h-3.5" />
          <span className={`text-sm transition-colors ${freeDelivery ? 'text-amz-text font-medium' : 'text-gray-400 line-through'}`}>FREE Delivery</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={prime} onChange={e => setPrime(e.target.checked)} className="accent-[#00A8E1] w-3.5 h-3.5" />
          <span className={`text-[12px] italic font-black transition-colors ${prime ? 'text-[#00A8E1]' : 'text-gray-400 line-through'}`}>prime</span>
        </label>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [searchParams] = useSearchParams()
  const [allListings, setAllListings]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [grade, setGrade]               = useState('')
  const [category, setCategory]         = useState(searchParams.get('category') || '')
  const [priceIdx, setPriceIdx]         = useState(0)
  const [freeDelivery, setFreeDelivery] = useState(false)
  const [prime, setPrime]               = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [lastReturn, setLastReturn]     = useState(null)

  useEffect(() => {
    setCategory(searchParams.get('category') || '')
  }, [searchParams])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('slc_last_return')
      if (raw) setLastReturn(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    axios.get('/api/v1/marketplace/listings')
      .then(r => setAllListings(r.data))
      .catch(() => setAllListings([]))
      .finally(() => setLoading(false))
  }, [])

  const priceRange = PRICE_RANGES[priceIdx]
  const activeFilterCount = [category, grade, priceIdx > 0, freeDelivery, prime].filter(Boolean).length

  const listings = useMemo(() => {
    return allListings.filter(l => {
      if (grade && l.grade !== grade) return false
      if (category && getProductCategory(l.product_name) !== category) return false
      if (l.suggested_price_inr < priceRange.min || l.suggested_price_inr >= priceRange.max) return false
      const lIsPrime     = l.suggested_price_inr >= 1000
      const lIsFreeDeliv = l.suggested_price_inr >= 500
      if (freeDelivery && !lIsFreeDeliv) return false
      if (prime && !lIsPrime) return false
      return true
    })
  }, [allListings, grade, category, priceRange, freeDelivery, prime])

  // Personalized recommendations — ranks by user's interest profile when available
  const isPersonalized = useMemo(() => hasPreferences(), [allListings])
  const recommended = useMemo(() => {
    let pool = allListings.filter(l => l.grade === 'A' || l.grade === 'B')
    if (isPersonalized) {
      pool = rankListings(pool, getProductCategory)
    } else {
      const priorityCat = category || lastReturn?.category
      if (priorityCat) {
        const same = pool.filter(l => getProductCategory(l.product_name) === priorityCat)
        const rest = pool.filter(l => getProductCategory(l.product_name) !== priorityCat)
        pool = [...same, ...rest]
      }
      pool = pool.sort((a, b) => b.trust_score - a.trust_score)
    }
    return pool.slice(0, 8)
  }, [allListings, category, lastReturn, isPersonalized])

  const filterProps = { category, setCategory, grade, setGrade, priceIdx, setPriceIdx, freeDelivery, setFreeDelivery, prime, setPrime }

  // Strip the emoji prefix from category label for the heading
  const categoryLabel = CATEGORY_FILTERS.find(f => f.value === category)?.label?.replace(/^\S+\s/, '') ?? category

  return (
    <div className="space-y-3 sm:space-y-4 pb-16">

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link to="/" className="text-amz-teal hover:underline">Home</Link>
        <span>›</span>
        <Link to="/marketplace" className="text-amz-teal hover:underline">Second Life Marketplace</Link>
        {category && (
          <>
            <span>›</span>
            <span className="text-amz-text">{CATEGORY_FILTERS.find(f => f.value === category)?.label ?? category}</span>
          </>
        )}
      </nav>

      <div className="flex gap-4">

        {/* ── Sidebar — desktop only ───────────────────────────────────── */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="bg-white border border-amz-border rounded p-3 sticky top-24">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Results header */}
          <div className="bg-white border border-amz-border rounded px-3 sm:px-4 py-2.5 mb-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-amz-text min-w-0">
                {loading ? 'Loading…' : (
                  <><span className="text-amz-red font-medium">1–{listings.length}</span> of {listings.length} results</>
                )}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setMobileFiltersOpen(o => !o)}
                  className="md:hidden flex items-center gap-1.5 border border-amz-border rounded px-2.5 py-1.5 text-xs font-medium text-amz-text hover:border-amz-orange transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-amz-orange text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                  )}
                </button>
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                  Sort:
                  <select className="border border-amz-border rounded px-2 py-1 text-xs text-amz-text cursor-pointer">
                    <option>Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>AI Trust Score</option>
                  </select>
                </div>
              </div>
            </div>

            {mobileFiltersOpen && (
              <div className="md:hidden mt-3 pt-3 border-t border-amz-border">
                <FilterPanel {...filterProps} />
              </div>
            )}
          </div>

          {/* ── Personalized recommendations strip ───────────────────── */}
          {!loading && recommended.length > 0 && (
            <div className="bg-white border border-amz-border rounded px-3 sm:px-4 py-3 mb-3">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="font-bold text-amz-text text-sm">
                    {isPersonalized
                      ? `Recommended for You`
                      : lastReturn && !category
                        ? `Because you returned: ${lastReturn.name.split(' ').slice(0, 5).join(' ')}${lastReturn.name.split(' ').length > 5 ? '…' : ''}`
                        : category
                          ? `Recommended in ${categoryLabel}`
                          : 'Recommended for You'
                    }
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isPersonalized
                      ? `Personalised based on your browsing & wishlist · AI verified`
                      : lastReturn && !category
                        ? `Top picks in ${lastReturn.category} · AI verified · Amazon Renewed`
                        : 'AI-graded · Highest trust scores · Amazon Renewed'
                    }
                  </p>
                </div>
                <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {isPersonalized ? '✨ For You' : '🛡️ Renewed'}
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {recommended.map(l => <RecoCard key={l.id} listing={l} />)}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-amz-orange" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}

          {/* Empty */}
          {!loading && listings.length === 0 && (
            <div className="bg-white border border-amz-border rounded p-8 sm:p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <h2 className="text-base sm:text-lg font-bold text-amz-text mb-1">No results for this filter</h2>
              <p className="text-sm text-gray-500 mb-4">Grade a returned item to automatically create a listing</p>
              <Link to="/returns" className="inline-block bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text text-sm font-bold px-5 py-2 rounded-full border border-[#FFA41C] transition-colors">
                Start a Return →
              </Link>
            </div>
          )}

          {/* Product grid */}
          {!loading && listings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
