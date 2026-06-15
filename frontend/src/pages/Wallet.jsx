import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const GRADE_BADGE = {
  A:    'bg-green-100 text-amz-green',
  B:    'bg-blue-100 text-blue-700',
  C:    'bg-amber-100 text-amber-700',
  Junk: 'bg-red-100 text-red-600',
}

const ACTION_ICON = { resell: '🔄', refurbish: '🔧', donate: '🤝', recycle: '♻️' }

const VOUCHERS = [
  {
    id: 'fresh',
    icon: '🛒',
    title: 'Amazon Fresh',
    subtitle: '₹150 off on groceries',
    desc: 'Get ₹150 off on your next Amazon Fresh order above ₹499. Fresh produce, dairy, snacks — delivered in hours.',
    credits: 300,
    badge: 'Grocery',
    expiry: 'Valid till 30 Jun 2026',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    highlight: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'prime',
    icon: '🎬',
    title: 'Prime Video — 30 Days Free',
    subtitle: '1 month unlimited streaming',
    desc: 'Enjoy 30 days of Prime Video absolutely free — unlimited movies, web series, Amazon Originals & more.',
    credits: 500,
    badge: 'Entertainment',
    expiry: 'Valid till 31 Jul 2026',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    highlight: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'pay',
    icon: '💳',
    title: 'Amazon Pay Cashback',
    subtitle: '₹100 cashback via UPI',
    desc: 'Get ₹100 cashback when you pay ₹200 or more via Amazon Pay UPI at any merchant — online or offline.',
    credits: 200,
    badge: 'Payments',
    expiry: 'Valid till 30 Jun 2026',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    highlight: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
]

// Pre-seeded redemption history
const DEMO_REDEMPTIONS = [
  {
    id: 'r1', type: 'wallet',
    credits: 500, amount: 250,
    date: '2026-06-10T10:30:00',
    status: 'credited',
  },
  {
    id: 'r2', type: 'voucher',
    icon: '💳', title: 'Amazon Pay Cashback', subtitle: '₹100 cashback via UPI',
    credits: 200,
    date: '2026-06-05T14:20:00',
    status: 'active',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'r3', type: 'wallet',
    credits: 300, amount: 150,
    date: '2026-05-28T09:15:00',
    status: 'credited',
  },
  {
    id: 'r4', type: 'voucher',
    icon: '🛒', title: 'Amazon Fresh', subtitle: '₹150 off on groceries',
    credits: 300,
    date: '2026-05-20T16:45:00',
    status: 'used',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'r5', type: 'wallet',
    credits: 200, amount: 100,
    date: '2026-04-15T11:00:00',
    status: 'credited',
  },
]

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (!target) { setValue(0); return }
    const start = performance.now()
    const decimals = target < 1 ? 2 : target < 100 ? 1 : 0
    const factor = Math.pow(10, decimals)
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target * factor) / factor)
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

function StatCard({ icon, value, unit, label, accent }) {
  const decimals = value < 1 ? 2 : value < 100 ? 1 : 0
  const display = useCountUp(typeof value === 'number' ? value : 0)
  const formatted = typeof display === 'number'
    ? display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : '0'
  return (
    <div className={`flex-1 rounded p-5 text-center ${accent}`}>
      <p className="text-3xl mb-1">{icon}</p>
      <p className="text-4xl font-black leading-none">
        {formatted}
        {unit && <span className="text-xl font-semibold ml-1">{unit}</span>}
      </p>
      <p className="text-sm mt-1.5 font-medium opacity-70">{label}</p>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLE = {
  credited: 'bg-green-100 text-green-700',
  active:   'bg-blue-100 text-blue-700',
  used:     'bg-gray-100 text-gray-500',
  expired:  'bg-red-50 text-red-400',
}
const STATUS_LABEL = {
  credited: '✓ Credited',
  active:   '● Active',
  used:     '✓ Used',
  expired:  'Expired',
}

function RedemptionHistory({ redemptions }) {
  const walletEntries  = redemptions.filter(r => r.type === 'wallet')
  const voucherEntries = redemptions.filter(r => r.type === 'voucher')
  const totalCredits   = redemptions.reduce((s, r) => s + r.credits, 0)
  const totalCash      = walletEntries.reduce((s, r) => s + r.amount, 0)

  return (
    <section className="bg-white rounded border border-amz-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Redemption History</h2>
        <span className="text-xs text-gray-400">{redemptions.length} transactions</span>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-amz-text">
            {totalCredits.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Credits redeemed</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-amz-green">₹{totalCash}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Added to Amazon Pay</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-blue-600">{voucherEntries.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Vouchers claimed</p>
        </div>
      </div>

      {/* List */}
      <ul className="divide-y divide-gray-50">
        {redemptions.map(r => (
          <li key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
              r.type === 'wallet' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              {r.type === 'wallet' ? '💰' : r.icon}
            </div>

            {/* Label + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {r.type === 'wallet'
                  ? `₹${r.amount} added to Amazon Pay`
                  : r.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.type === 'voucher' && <span className="mr-1">{r.subtitle} ·</span>}
                {formatDate(r.date)}
              </p>
            </div>

            {/* Credits used */}
            <div className="text-right flex-shrink-0 mr-2">
              <p className="text-sm font-bold text-red-500">−{r.credits}</p>
              <p className="text-[10px] text-gray-400">credits</p>
            </div>

            {/* Status badge */}
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[r.status] ?? STATUS_STYLE.used}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RedeemModal({ totalCredits, onRedeem, onClose }) {
  const [tab, setTab]             = useState('wallet')
  const [redeemAmt, setRedeemAmt] = useState(Math.min(300, totalCredits))
  const [success, setSuccess]     = useState(null)

  const rupees   = Math.floor(redeemAmt / 2)
  const canRedeem = redeemAmt >= 100 && redeemAmt <= totalCredits

  function handleWalletRedeem() {
    const entry = {
      id: `r${Date.now()}`, type: 'wallet',
      credits: redeemAmt, amount: rupees,
      date: new Date().toISOString(), status: 'credited',
    }
    onRedeem(entry)
    setSuccess({ type: 'wallet', label: `₹${rupees} added to Amazon Pay balance` })
  }

  function handleVoucherRedeem(v) {
    if (totalCredits < v.credits) return
    const entry = {
      id: `r${Date.now()}`, type: 'voucher',
      icon: v.icon, title: v.title, subtitle: v.subtitle,
      credits: v.credits,
      date: new Date().toISOString(), status: 'active',
      badgeColor: v.badgeColor,
    }
    onRedeem(entry)
    setSuccess({ type: 'voucher', label: `"${v.title}" voucher activated!` })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-amz-dark px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-black text-base">Redeem Green Credits</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              You have <span className="text-yellow-300 font-bold">{totalCredits} credits</span> available
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Done!</h3>
            <p className="text-gray-600 text-sm font-medium mb-1">{success.label}</p>
            {success.type === 'wallet' && (
              <p className="text-xs text-gray-400 mt-1">Balance reflects in Amazon Pay within a few minutes.</p>
            )}
            {success.type === 'voucher' && (
              <p className="text-xs text-gray-400 mt-1">Check your Amazon account email for the voucher code.</p>
            )}
            <button
              onClick={onClose}
              className="mt-8 bg-amz-yellow text-amz-text border border-[#FFA41C] font-bold px-8 py-2.5 rounded text-sm hover:bg-amz-yellow-hover transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {[
                { key: 'wallet',   icon: '💰', label: 'Amazon Wallet Cash' },
                { key: 'vouchers', icon: '🎟️', label: 'Vouchers & Offers' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                    tab === t.key
                      ? 'border-amz-orange text-amz-orange'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">

              {/* Wallet Cash tab */}
              {tab === 'wallet' && (
                <div className="px-5 py-5 space-y-5">
                  <div className="bg-[#FFFBF2] border border-[#F0C14B] rounded-lg px-4 py-3.5">
                    <p className="text-xs font-bold text-amz-text mb-1">How it works</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Convert your Green Credits into real Amazon Pay balance —
                      <span className="font-bold text-gray-800"> 2 credits = ₹1</span>.
                      Minimum redemption is 100 credits (₹50). Balance is added directly
                      to your Amazon Pay wallet for any purchase on Amazon.in.
                    </p>
                    <div className="mt-3 flex gap-3">
                      {[
                        { label: 'Rate',       value: '2 credits = ₹1' },
                        { label: 'Minimum',    value: '100 credits' },
                        { label: 'Credited to', value: 'Amazon Pay' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex-1 bg-white rounded border border-[#F0C14B] px-3 py-2 text-center">
                          <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                          <p className="text-sm font-black text-amz-text">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700">Credits to redeem</label>
                      <span className="text-xs text-gray-400">Max: {totalCredits}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={Math.max(totalCredits, 100)}
                      step={50}
                      value={Math.min(redeemAmt, totalCredits)}
                      onChange={e => setRedeemAmt(Number(e.target.value))}
                      disabled={totalCredits < 100}
                      className="w-full accent-amz-orange"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">100</span>
                      <span className="text-[10px] text-gray-400">{totalCredits}</span>
                    </div>
                  </div>

                  <div className="bg-amz-dark rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">You redeem</p>
                      <p className="text-white text-2xl font-black mt-0.5">
                        {redeemAmt} <span className="text-base font-medium text-gray-400">credits</span>
                      </p>
                    </div>
                    <div className="text-gray-400 text-xl">→</div>
                    <div className="text-right">
                      <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">You get</p>
                      <p className="text-yellow-300 text-2xl font-black mt-0.5">
                        ₹{rupees} <span className="text-base font-medium text-gray-400">cash</span>
                      </p>
                    </div>
                  </div>

                  {totalCredits < 100 && (
                    <p className="text-xs text-red-500 text-center font-medium">
                      You need at least 100 credits to redeem. Keep returning items to earn more!
                    </p>
                  )}

                  <button
                    onClick={handleWalletRedeem}
                    disabled={!canRedeem}
                    className={`w-full py-3.5 rounded font-bold text-sm transition-all ${
                      canRedeem
                        ? 'bg-amz-yellow text-amz-text border border-[#FFA41C] hover:bg-amz-yellow-hover active:scale-[0.99]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
                  >
                    💰 Add ₹{rupees} to Amazon Pay Balance
                  </button>
                </div>
              )}

              {/* Vouchers tab */}
              {tab === 'vouchers' && (
                <div className="px-5 py-5 space-y-3">
                  <p className="text-xs text-gray-500 font-medium">
                    Redeem your credits for exclusive Amazon offers. Credits are deducted on claim.
                  </p>
                  {VOUCHERS.map(v => {
                    const enough = totalCredits >= v.credits
                    return (
                      <div key={v.id} className={`rounded-xl border ${v.color} overflow-hidden`}>
                        <div className="px-4 pt-4 pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${v.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                              {v.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-900">{v.title}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${v.badgeColor}`}>{v.badge}</span>
                              </div>
                              <p className={`text-base font-black ${v.highlight} mt-0.5`}>{v.subtitle}</p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.desc}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-400">{v.expiry}</p>
                              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                                🪙 {v.credits} credits required
                                {!enough && <span className="text-red-500 ml-1.5">— need {v.credits - totalCredits} more</span>}
                              </p>
                            </div>
                            <button
                              onClick={() => handleVoucherRedeem(v)}
                              disabled={!enough}
                              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                                enough
                                  ? `${v.iconBg} ${v.highlight} hover:opacity-80 active:scale-95`
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {enough ? 'Redeem' : 'Not enough'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Wallet() {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [redemptions, setRedemptions] = useState(DEMO_REDEMPTIONS)

  useEffect(() => {
    axios.get('/api/v1/credits/wallet')
      .then(r => setData(r.data))
      .catch(() => setError('Could not load wallet data.'))
      .finally(() => setLoading(false))
  }, [])

  function handleRedeem(entry) {
    setRedemptions(prev => [entry, ...prev])
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <svg className="animate-spin h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-6 py-4 text-sm">{error}</div>
      </div>
    )
  }

  const trees   = data.trees_equivalent
  const bottles = data.plastic_bottles_equivalent

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-gray-900">Your Green Wallet 🌿</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Every sustainable return earns credits and saves the planet.
        </p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <StatCard
          icon="🪙"
          value={data.total_credits}
          label="Green Credits"
          accent="bg-[#FFF9E6] text-amz-text border border-[#F0C14B]"
        />
        <StatCard
          icon="🌱"
          value={Math.round(data.total_co2_saved_kg * 10) / 10}
          unit="kg"
          label="CO₂ Saved"
          accent="bg-[#F0FFF0] text-amz-text border border-[#B2D8B2]"
        />
        <StatCard
          icon="🌳"
          value={Math.round(data.trees_equivalent * 100) / 100}
          label="Trees Equivalent"
          accent="bg-[#E8F5E9] text-amz-text border border-[#A5D6A7]"
        />
      </div>

      {/* ── Impact banner ─────────────────────────────────────────────── */}
      {data.total_credits > 0 && (
        <div className="relative bg-amz-dark rounded px-6 py-5 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="relative text-white/80 text-xs font-semibold uppercase tracking-widest mb-2">Your Impact</p>
          <p className="relative text-white text-base font-semibold leading-relaxed">
            Your returns have saved the equivalent of{' '}
            <span className="text-yellow-300 font-black">
              {trees >= 1 ? `${trees.toFixed(1)} trees` : `${(trees * 365).toFixed(0)} days of tree absorption`}
            </span>{' '}
            and kept{' '}
            <span className="text-yellow-300 font-black">{bottles} plastic bottles</span>{' '}
            out of landfill.
          </p>
          <div className="relative mt-4 flex gap-4 text-white/90 text-sm">
            <span>🌍 {data.total_co2_saved_kg.toFixed(1)} kg CO₂ not emitted</span>
            <span>♻️ {data.transaction_history.length} items diverted</span>
          </div>
        </div>
      )}

      {/* ── Return history ────────────────────────────────────────────── */}
      <section className="bg-white rounded border border-amz-border overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Return History</h2>
          <span className="text-xs text-gray-400">{data.transaction_history.length} items</span>
        </div>
        {data.transaction_history.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-gray-500 font-medium text-sm">No returns yet</p>
            <p className="text-gray-400 text-xs mt-1">Start by grading an item above</p>
            <Link to="/returns" className="inline-block mt-4 bg-amz-yellow text-amz-text border border-[#FFA41C] text-sm font-semibold px-5 py-2 rounded-xl hover:bg-amz-yellow-hover transition-colors">
              Grade an item →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.transaction_history.map(tx => (
              <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <span className="text-xl w-8 text-center flex-shrink-0">{ACTION_ICON[tx.action] ?? '↩'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tx.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_BADGE[tx.grade] ?? GRADE_BADGE['C']}`}>
                    {tx.grade}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{tx.action}</span>
                </div>
                <div className="text-right flex-shrink-0 w-14">
                  <p className="text-sm font-bold text-amz-green">+{tx.credits_earned}</p>
                  <p className="text-xs text-gray-400">credits</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Redemption history ───────────────────────────────────────── */}
      <RedemptionHistory redemptions={redemptions} />

      {/* ── CTA buttons ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setRedeemOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-amz-dark text-white border border-[#3d4f5e] py-3.5 rounded font-semibold text-sm hover:bg-[#232f3e] active:scale-[0.99] transition-all"
        >
          🎁 Redeem Credits
        </button>
        <Link
          to="/returns"
          className="flex-1 block text-center bg-amz-yellow text-amz-text border border-[#FFA41C] py-3.5 rounded font-semibold text-sm hover:bg-amz-yellow-hover active:scale-[0.99] transition-all"
        >
          🔍 Grade another item →
        </Link>
      </div>

      {/* ── Redeem modal ─────────────────────────────────────────────── */}
      {redeemOpen && (
        <RedeemModal
          totalCredits={data.total_credits}
          onRedeem={handleRedeem}
          onClose={() => setRedeemOpen(false)}
        />
      )}
    </div>
  )
}
