import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getProductImage } from '../utils/productImages'

const CATEGORIES = [
  { icon: '📱', label: 'Electronics',  value: 'Electronics',  from: 'from-blue-50',    to: 'to-indigo-50' },
  { icon: '👕', label: 'Apparel',      value: 'Apparel',      from: 'from-purple-50',  to: 'to-pink-50' },
  { icon: '🏠', label: 'Home',         value: 'Home',         from: 'from-amber-50',   to: 'to-orange-50' },
  { icon: '📚', label: 'Books',        value: 'Books',        from: 'from-emerald-50', to: 'to-teal-50' },
  { icon: '⚽', label: 'Sports',       value: 'Sports',       from: 'from-red-50',     to: 'to-rose-50' },
  { icon: '♻️', label: 'All Returns',  value: '',             from: 'from-teal-50',    to: 'to-cyan-50' },
]

const STEPS = [
  { n: '1', icon: '🤖', title: 'Describe your issue', sub: 'Deflect Bot tries to help first' },
  { n: '2', icon: '📸', title: 'Upload a photo',      sub: 'AI grades condition in seconds' },
  { n: '3', icon: '🪙', title: 'Earn Green Credits',  sub: 'Item gets a second life' },
]

function useCountdown() {
  const [time, setTime] = useState({ h: 4, m: 23, s: 15 })
  useEffect(() => {
    const id = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s -= 1
        if (s < 0) { s = 59; m -= 1 }
        if (m < 0) { m = 59; h -= 1 }
        if (h < 0) return { h: 0, m: 0, s: 0 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])
  const p = n => String(n).padStart(2, '0')
  return `${p(time.h)}:${p(time.m)}:${p(time.s)}`
}

function DealCard({ deal }) {
  const [imgErr, setImgErr] = useState(false)
  const initial  = deal.product_name.charAt(0).toUpperCase()
  const imgUrl   = deal.image_url || getProductImage(deal.product_name)
  const showImg  = imgUrl && !imgErr

  return (
    <Link to="/marketplace" className="flex-shrink-0 w-32 sm:w-36 group">
      <div className="relative bg-[#f0f2f2] rounded-t-lg h-32 sm:h-36 flex items-center justify-center overflow-hidden border border-b-0 border-amz-border group-hover:border-amz-orange transition-colors">
        {showImg ? (
          <img
            src={imgUrl}
            alt={deal.product_name}
            className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-200"
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="text-4xl sm:text-5xl font-black text-[#D5D9D9] group-hover:scale-105 transition-transform duration-200 select-none">{initial}</span>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-amz-red py-1 text-center">
          <span className="text-white text-[9px] sm:text-[10px] font-black">Up to 20% off</span>
        </div>
      </div>
      <div className="rounded-b-lg border border-t-0 border-amz-border group-hover:border-amz-orange bg-white p-2 transition-colors">
        <p className="text-xs font-black text-amz-text">₹{deal.suggested_price_inr.toLocaleString('en-IN')}</p>
        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">{deal.title}</p>
      </div>
    </Link>
  )
}

export default function Home() {
  const [stats, setStats] = useState(null)
  const [deals, setDeals] = useState([])
  const countdown = useCountdown()

  useEffect(() => {
    axios.get('/api/v1/credits/wallet').then(r => setStats(r.data)).catch(() => {})
    axios.get('/api/v1/marketplace/listings').then(r => setDeals(r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-3 sm:space-y-4 pb-16">

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-amz-dark via-[#1a2332] to-[#0d1f2d] rounded overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-10 py-7 sm:py-10 gap-5 sm:gap-6">
          <div className="w-full sm:max-w-lg sm:flex-shrink-0">
            <p className="text-amz-orange text-xs font-bold uppercase tracking-widest mb-2">Second Life Commerce</p>
            <h1 className="text-white text-2xl sm:text-4xl font-black leading-tight mb-2 sm:mb-3">
              Returns, Reimagined.<br />
              <span className="text-amz-yellow">Powered by AI.</span>
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
              Every return becomes an opportunity — earn credits, save CO₂,
              and give items a second life on our marketplace.
            </p>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <Link
                to="/returns"
                className="bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm border border-[#FFA41C] transition-colors shadow-md"
              >
                Start a Return
              </Link>
              <Link
                to="/marketplace"
                className="bg-transparent border-2 border-white text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm hover:bg-white hover:text-amz-text transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>

          {/* Mini product tiles — lg+ only */}
          {deals.length >= 4 && (
            <div className="hidden lg:grid grid-cols-2 gap-2 flex-shrink-0">
              {deals.slice(0, 4).map(d => {
                const ini    = d.product_name.charAt(0).toUpperCase()
                const imgUrl = d.image_url || getProductImage(d.product_name)
                return (
                  <Link
                    key={d.id}
                    to="/marketplace"
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-all border border-white/10 hover:border-white/30 w-28 group"
                  >
                    <div className="bg-white/10 rounded h-14 flex items-center justify-center mb-1.5 overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={d.product_name}
                          className="h-12 w-full object-contain p-1 group-hover:scale-105 transition-transform"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                        />
                      ) : null}
                      <span
                        className="text-3xl font-black text-white/40 group-hover:scale-105 transition-transform select-none"
                        style={{ display: imgUrl ? 'none' : 'block' }}
                      >
                        {ini}
                      </span>
                    </div>
                    <p className="text-white text-[10px] font-bold leading-tight line-clamp-1">{d.product_name}</p>
                    <p className="text-amz-yellow text-[10px] font-black mt-0.5">₹{d.suggested_price_inr.toLocaleString('en-IN')}</p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Live stats bar ───────────────────────────────────────────── */}
      {stats && (
        <div className="bg-white border border-amz-border rounded shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-amz-border">
            {[
              { icon: '♻️', v: stats.total_returns,                         l: 'Returns Processed' },
              { icon: '🪙', v: stats.total_credits,                         l: 'Green Credits Issued' },
              { icon: '🌱', v: `${stats.total_co2_saved_kg.toFixed(1)} kg`, l: 'CO₂ Saved' },
              { icon: '🌳', v: stats.trees_equivalent.toFixed(2),           l: 'Trees Equivalent' },
            ].map(({ icon, v, l }, i) => (
              <div key={l} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 ${i % 2 === 0 && i < 2 ? 'border-r border-amz-border sm:border-r-0' : ''}`}>
                <span className="text-xl sm:text-2xl">{icon}</span>
                <div>
                  <p className="text-base sm:text-xl font-black text-amz-text">{v}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Deals ────────────────────────────────────────────── */}
      {deals.length > 0 && (
        <div className="bg-white border border-amz-border rounded p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <h2 className="font-black text-amz-text text-lg sm:text-xl">Today's Deals</h2>
              <div className="flex items-center gap-1.5 bg-amz-nav rounded px-2 py-1">
                <span className="text-gray-400 text-[10px]">Ends in</span>
                <span className="text-amz-yellow font-black text-xs sm:text-sm tabular-nums tracking-tight">{countdown}</span>
              </div>
            </div>
            <Link to="/marketplace" className="text-amz-teal text-xs sm:text-sm hover:text-amz-red hover:underline font-medium whitespace-nowrap">
              See all ›
            </Link>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        </div>
      )}

      {/* ── Shop by Category ─────────────────────────────────────────── */}
      <div className="bg-white border border-amz-border rounded p-3 sm:p-4 shadow-sm">
        <h2 className="font-bold text-amz-text mb-3 text-base sm:text-lg">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {CATEGORIES.map(({ icon, label, value, from, to }) => (
            <Link
              key={label}
              to={value ? `/marketplace?category=${value}` : '/marketplace'}
              className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-gradient-to-b ${from} ${to} hover:shadow-md border border-amz-border hover:border-amz-orange transition-all group`}
            >
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-150">{icon}</span>
              <span className="text-[10px] sm:text-xs text-amz-teal font-medium group-hover:text-[#C7511F] text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <div className="bg-white border border-amz-border rounded p-4 sm:p-5 shadow-sm">
        <h2 className="font-bold text-amz-text mb-3 sm:mb-4 text-base sm:text-lg">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {STEPS.map(({ n, icon, title, sub }, i) => (
            <div key={n} className="flex gap-3">
              <div className="flex sm:flex-col items-center sm:items-center">
                <div className="w-7 h-7 rounded-full bg-amz-orange text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                  {n}
                </div>
                {/* Vertical connector on desktop (last item has none) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block w-px flex-1 bg-amz-border mt-2" />
                )}
              </div>
              <div className="pb-2 sm:pb-4">
                <span className="text-xl sm:text-2xl">{icon}</span>
                <p className="font-bold text-amz-text text-sm mt-1">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/returns"
          className="inline-block mt-2 bg-amz-yellow hover:bg-amz-yellow-hover text-amz-text px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold border border-[#FFA41C] transition-colors shadow-sm"
        >
          Try it now →
        </Link>
      </div>

      {/* ── Feature cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            icon: '🤖',
            title: 'AI-Powered Assessment',
            body: 'Amazon Bedrock analyzes every return to determine condition, resale value, and the most sustainable outcome.',
            link: '/returns',
            cta: 'Start a return',
          },
          {
            icon: '🛍️',
            title: 'Instant Resale Listing',
            body: 'Quality items get AI-generated marketplace listings with honest titles, highlights, and trust scores.',
            link: '/marketplace',
            cta: 'Browse listings',
          },
          {
            icon: '🌍',
            title: 'Track Your Impact',
            body: 'Every decision tracks CO₂ saved, green credits earned, and trees equivalent — making sustainability tangible.',
            link: '/wallet',
            cta: 'View wallet',
          },
        ].map(({ icon, title, body, link, cta }) => (
          <div key={title} className="bg-white border border-amz-border rounded p-4 flex flex-col hover:shadow-md transition-shadow">
            <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
            <h3 className="font-bold text-amz-text text-sm mb-1">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed flex-1">{body}</p>
            <Link to={link} className="text-amz-teal text-xs font-medium mt-3 hover:underline hover:text-amz-red">{cta} ›</Link>
          </div>
        ))}
      </div>

    </div>
  )
}
