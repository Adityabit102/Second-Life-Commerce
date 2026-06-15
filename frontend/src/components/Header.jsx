import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import amazonLogo from '../assets/amazon-logo.png'

const SEARCH_CATEGORIES = ['All', 'Electronics', 'Apparel', 'Home Appliances', 'Books', 'Sports']

const NAV_LINKS = [
  { to: '/returns',     label: 'Start a Return' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/orders',      label: '📦 Orders' },
  { to: '/wallet',      label: '🌿 Green Credits' },
  { to: '/risk-check',  label: '🔍 Risk Checker' },
]

const BUY_AGAIN = [
  { id: 1, emoji: '👕', bg: 'bg-blue-50',   name: '30pcs Shirt Collar Protector Sweat Pads',     price: '₹299',  unit: '(₹996.67/100 g)' },
  { id: 2, emoji: '🦶', bg: 'bg-green-50',  name: 'JERN Memory Foam Height Increase Insoles',    price: '₹499'  },
  { id: 3, emoji: '💅', bg: 'bg-pink-50',   name: 'Emigel Professional Nail Glue for Artificial Nails', price: '₹299', unit: '(₹1,495.00/100 g)' },
  { id: 4, emoji: '🥿', bg: 'bg-orange-50', name: 'RENESMEE Orthotic Arch Support Shoe Insoles', price: '₹276'  },
]

const YOUR_LISTS = [
  { label: '📦 My Orders',           to: '/orders' },
  { label: '↩️ Start a Return',      to: '/returns' },
  { label: '🛍️ Browse Marketplace',  to: '/marketplace' },
  { label: '🌿 Green Wallet',        to: '/wallet' },
  { label: '🔍 Return Risk Checker', to: '/risk-check' },
  { label: 'Saved for Later',        to: '/wishlist' },
  { label: 'My Wishlist',            to: '/wishlist' },
  { label: 'Create a Wish List',     to: '/wishlist' },
  { label: 'Explore Showroom',       to: '/marketplace' },
]

const YOUR_ACCOUNT = [
  { label: 'Switch Accounts',                      to: null },
  { label: 'Sign Out',                             to: null },
  null,
  { label: 'Your Account',                         to: null },
  { label: 'Your Orders',                          to: '/orders' },
  { label: 'Your Wish List',                       to: '/wishlist' },
  { label: 'Keep shopping for',                    to: '/marketplace' },
  { label: 'Your Recommendations',                 to: '/marketplace' },
  { label: 'Returns',                              to: '/returns' },
  { label: '🌿 Green Wallet',                      to: '/wallet' },
  { label: '🔍 Risk Checker',                      to: '/risk-check' },
  { label: 'Your Prime Membership',                to: null },
  { label: 'Your Prime Video',                     to: null },
  { label: 'Memberships & Subscriptions',          to: null },
  { label: 'Your Seller Account',                  to: null },
  { label: 'Content Library',                      to: null },
  { label: 'Devices',                              to: null },
  { label: 'Register for a free Business Account', to: null },
]

function AccountDropdown({ onClose, onAddToCart }) {
  const [addedId, setAddedId] = useState(null)

  function handleAdd(p) {
    onAddToCart({ id: p.id, name: p.name, price: parseInt(p.price.replace(/[^0-9]/g, '')), quantity: 1 })
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div className="absolute right-0 top-full mt-0 z-50 shadow-2xl border border-gray-300 bg-white"
      style={{ width: 'min(700px, calc(100vw - 16px))' }}
    >
      {/* Who is shopping bar */}
      <div className="bg-[#f0f2f2] px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-sm text-gray-700">Who is shopping? Select a profile.</span>
        <button className="text-sm text-[#007185] border border-[#FFA41C] px-3 py-0.5 hover:bg-[#FCF4E8] hover:border-[#FF8F00] transition-colors whitespace-nowrap">
          Manage Profiles &gt;
        </button>
      </div>

      {/* Three columns */}
      <div className="flex divide-x divide-gray-200">

        {/* Col 1 — Buy it again */}
        <div className="w-52 flex-shrink-0 px-4 py-4">
          <p className="font-bold text-sm text-gray-900 leading-tight">Buy it again</p>
          <p className="text-xs text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer mb-3">
            View All &amp; Manage
          </p>
          <div className="space-y-3">
            {BUY_AGAIN.map(p => (
              <div key={p.id} className="flex gap-2 items-start">
                <div className={`w-[52px] h-[52px] flex-shrink-0 ${p.bg} rounded flex items-center justify-center text-2xl border border-gray-100`}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer line-clamp-2 leading-snug">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{p.price}</p>
                  {p.unit && <p className="text-[9px] text-gray-500 leading-tight">{p.unit}</p>}
                  <button
                    onClick={() => handleAdd(p)}
                    className={`mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-all ${
                      addedId === p.id
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-amz-yellow text-amz-text border-[#FFA41C] hover:bg-amz-yellow-hover'
                    }`}
                  >
                    {addedId === p.id ? '✓ Added' : 'Add to cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2 — Your Lists */}
        <div className="flex-1 px-5 py-4">
          <p className="font-bold text-sm text-gray-900 mb-3">Quick Access</p>
          <div className="space-y-2">
            {YOUR_LISTS.map(item =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className="block text-sm text-[#007185] hover:text-[#c45500] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <p key={item.label} className="text-sm text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">
                  {item.label}
                </p>
              )
            )}
          </div>
        </div>

        {/* Col 3 — Your Account */}
        <div className="flex-1 px-5 py-4 overflow-y-auto max-h-[70vh]">
          <p className="font-bold text-sm text-gray-900 mb-3">Your Account</p>
          <div className="space-y-1.5">
            {YOUR_ACCOUNT.map((item, i) => {
              if (item === null) return <hr key={i} className="border-gray-200 my-2" />
              if (item.to) return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className="block text-sm text-[#007185] hover:text-[#c45500] hover:underline"
                >
                  {item.label}
                </Link>
              )
              return (
                <p
                  key={item.label}
                  className="text-sm text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer"
                >
                  {item.label}
                </p>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searchQ, setSearchQ]               = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen]       = useState(false)
  const accountRef                          = useRef(null)
  const { count, setIsOpen, addItem }       = useCart()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) navigate('/marketplace')
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-50 shadow-lg">

      {/* ── Primary bar ──────────────────────────────────────────────── */}
      <div className="bg-amz-dark">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-3 h-14">

          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-shrink-0 border border-transparent hover:border-white rounded px-1.5 py-0.5 transition-colors"
          >
            <img
              src={amazonLogo}
              alt="Amazon.in"
              className="h-8 sm:h-9 w-auto object-contain"
              draggable={false}
            />
          </Link>

          {/* Deliver to India */}
          <Link
            to="/"
            className="hidden md:flex flex-col flex-shrink-0 border border-transparent hover:border-white rounded px-2 py-1 transition-colors"
          >
            <span className="text-gray-300 text-[10px] leading-none">Deliver to</span>
            <span className="text-white text-xs font-bold leading-tight">📍 India</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 flex h-10 min-w-0">
            <select className="hidden sm:block bg-[#f3f3f3] text-[#555] text-xs px-2 border-r border-[#cdba96] rounded-l cursor-pointer hover:bg-[#e8e0d3] transition-colors h-full flex-shrink-0">
              {SEARCH_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search Second Life Commerce"
              className="flex-1 px-3 text-sm text-gray-900 h-full border-none outline-none rounded-l sm:rounded-none min-w-0"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            <button
              type="submit"
              className="bg-amz-orange hover:bg-amz-yellow-hover px-3 sm:px-4 rounded-r h-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-amz-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </form>

          {/* Right utilities */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

            {/* Account & Lists — desktop */}
            <div ref={accountRef} className="relative hidden md:block">
              <button
                onClick={() => setAccountOpen(o => !o)}
                className={`flex flex-col border rounded px-2 py-1 transition-colors text-left ${accountOpen ? 'border-white bg-white/10' : 'border-transparent hover:border-white'}`}
              >
                <span className="text-gray-300 text-[10px] leading-none">Hello, Adrika</span>
                <span className="text-white text-xs font-bold leading-tight flex items-center gap-0.5 whitespace-nowrap">
                  Account &amp; Lists {accountOpen ? '▴' : '▾'}
                </span>
              </button>
              {accountOpen && (
                <AccountDropdown
                  onClose={() => setAccountOpen(false)}
                  onAddToCart={addItem ?? (() => {})}
                />
              )}
            </div>

            {/* Returns & Orders — desktop */}
            <Link
              to="/orders"
              className="hidden md:flex flex-col border border-transparent hover:border-white rounded px-2 py-1 transition-colors"
            >
              <span className="text-gray-300 text-[10px] leading-none">Returns &amp;</span>
              <span className="text-white text-xs font-bold leading-tight">Orders</span>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-end gap-0.5 border border-transparent hover:border-white rounded px-1.5 sm:px-2 py-1 transition-colors"
            >
              <div className="relative">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -top-1 left-4 cart-badge">{count > 99 ? '99+' : count}</span>
                )}
              </div>
              <span className="text-white text-xs font-bold pb-1 hidden sm:inline">Cart</span>
            </button>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden flex flex-col justify-center items-center gap-1 border border-transparent hover:border-white rounded px-2 py-2 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-amz-nav border-t border-white/10">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amz-orange text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                A
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Hello, Adrika</p>
                <p className="text-gray-400 text-[10px]">sarawatadrika@gmail.com</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded text-sm font-medium transition-colors ${pathname === to ? 'bg-white/10 text-white font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-1 border-t border-white/10 space-y-1">
                <Link
                  to="/marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded text-sm font-bold text-amz-orange hover:bg-white/10 transition-colors"
                >
                  ⚡ Today's Deals
                </Link>
                <Link
                  to="/returns"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Returns &amp; Orders
                </Link>
                <Link
                  to="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Your Account &amp; Wallet
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary nav (desktop) ──────────────────────────────────── */}
      <div className="bg-amz-nav text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-stretch h-10 gap-0 overflow-x-auto scrollbar-hide">
          <Link
            to="/"
            className={`flex items-center gap-1 px-3 font-bold whitespace-nowrap border-b-2 transition-colors ${pathname === '/' ? 'border-white' : 'border-transparent hover:border-white'}`}
          >
            ☰ All
          </Link>
          <div className="w-px bg-white/20 mx-1 self-center h-5 flex-shrink-0" />
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 flex items-center whitespace-nowrap border-b-2 transition-colors ${pathname === to ? 'border-white font-bold' : 'border-transparent hover:border-white'}`}
            >
              {label}
            </Link>
          ))}
          <div className="w-px bg-white/20 mx-1 self-center h-5 flex-shrink-0" />
          <Link
            to="/marketplace"
            className="px-3 flex items-center text-amz-orange font-bold whitespace-nowrap border-b-2 border-transparent hover:border-amz-orange transition-colors"
          >
            Today's Deals
          </Link>
        </div>
      </div>
    </header>
  )
}
