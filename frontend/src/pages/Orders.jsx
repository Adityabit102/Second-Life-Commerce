import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const STATUS_FLOW = [
  'pending', 'confirmed', 'agent_assigned', 'agent_en_route',
  'agent_arrived', 'agent_analyzed', 'item_picked_up',
  'out_for_delivery', 'dispatched', 'delivered',
]

const STATUS_CFG = {
  pending:          { pill: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400',      icon: '🕐', label: 'Listed' },
  confirmed:        { pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',      icon: '✅', label: 'Confirmed' },
  agent_assigned:   { pill: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',     icon: '🚗', label: 'Agent Assigned' },
  agent_en_route:   { pill: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500',    icon: '🚗', label: 'Agent En Route' },
  agent_arrived:    { pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',    icon: '🔍', label: 'Agent Arrived' },
  agent_analyzed:   { pill: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500',    icon: '📸', label: 'Item Analyzed' },
  item_picked_up:   { pill: 'bg-cyan-100 text-cyan-700',     dot: 'bg-cyan-500',      icon: '📦', label: 'Picked Up' },
  out_for_delivery: { pill: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500',    icon: '🚚', label: 'Out for Delivery' },
  dispatched:       { pill: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500',      icon: '✈️', label: 'Dispatched' },
  delivered:        { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500',     icon: '🎉', label: 'Delivered ✓' },
  cancelled:        { pill: 'bg-red-100 text-red-700',       dot: 'bg-red-500',       icon: '❌', label: 'Sale Cancelled' },
}

const GRADE_BG = { A: 'bg-green-500', B: 'bg-blue-500', C: 'bg-amber-500', Junk: 'bg-red-500' }

function ProgressBar({ statusIndex }) {
  const pct = Math.round((statusIndex / (STATUS_FLOW.length - 1)) * 100)
  return (
    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amz-orange to-amber-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function AgentCard({ order }) {
  if (!order.agent_name) return null
  const isEn = order.status === 'agent_en_route'
  return (
    <div className={`mt-3 rounded-xl p-3 border ${isEn ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
      <p className={`text-xs font-bold mb-1 ${isEn ? 'text-orange-700' : 'text-amber-700'}`}>
        {isEn ? '🚗 Agent En Route' : '🚗 Agent Assigned'}
      </p>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{order.agent_name}</p>
          <p className="text-xs text-gray-500">{order.agent_phone}</p>
        </div>
        {order.agent_eta_date && (
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700">📅 {order.agent_eta_date}</p>
            <p className="text-xs text-gray-500">{order.agent_eta_time}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Shown for SELLERS when agent updated price and seller hasn't decided yet
function SellerDecisionBanner({ order, onDecision }) {
  const [deciding, setDeciding] = useState(false)
  const a = order.agent_analysis
  const newPrice = a.price?.toLocaleString('en-IN')
  const origPrice = order.original_price?.toLocaleString('en-IN')

  const decide = async (accept) => {
    setDeciding(true)
    try {
      const { data } = await axios.post(`/api/v1/orders/${order.id}/seller-decision`, { accept })
      onDecision(data)
    } catch {
      // silent
    } finally {
      setDeciding(false)
    }
  }

  return (
    <div className="mt-3 border-2 border-red-300 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-red-500 px-3 py-2.5 flex items-center gap-2">
        <span className="text-white text-base animate-pulse">⚠️</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">ACTION REQUIRED — Agent Updated Price</p>
          <p className="text-[10px] text-red-100">Agent {order.agent_name} is at your address waiting for your response</p>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full border border-white/30 animate-pulse flex-shrink-0">
          Respond now
        </span>
      </div>

      <div className="p-3 bg-red-50 space-y-3">
        {/* Price comparison */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Your Listed Price</p>
            <p className="text-lg font-bold text-gray-400 line-through">₹{origPrice}</p>
          </div>
          <div className="text-gray-400 text-xl font-light">→</div>
          <div className="flex-1 bg-amber-50 border-2 border-amber-300 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wide">Agent's New Price</p>
            <p className="text-lg font-bold text-amber-700">₹{newPrice}</p>
          </div>
        </div>

        {/* Agent photo + notes */}
        <div className="flex gap-3 bg-white rounded-lg p-2.5 border border-red-100">
          {order.agent_photo_url && (
            <img src={order.agent_photo_url} alt=""
              className="w-16 h-16 object-cover rounded-lg border border-red-200 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Agent Notes</p>
            <p className="text-xs text-gray-700 leading-snug">{a.notes}</p>
          </div>
        </div>

        {/* Decision buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => decide(true)}
            disabled={deciding}
            className="flex-1 py-2.5 text-sm font-bold bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {deciding ? 'Processing…' : `✅ Sell at ₹${newPrice}`}
          </button>
          <button
            onClick={() => decide(false)}
            disabled={deciding}
            className="flex-1 py-2.5 text-sm font-bold bg-white text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deciding ? '…' : '❌ Cancel Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Shown after analysis for normal cases (no pending seller decision)
function AgentAnalysisPanel({ order, isSeller }) {
  const [buyerAccepted, setBuyerAccepted] = useState(false)
  if (!order.agent_analysis) return null
  const a = order.agent_analysis
  const dispPrice = (a.price || order.original_price).toLocaleString('en-IN')
  const origPrice = order.original_price?.toLocaleString('en-IN')

  return (
    <div className="mt-3 border border-violet-200 rounded-xl overflow-hidden">
      <div className="bg-violet-50 px-3 py-2 border-b border-violet-200 flex items-center gap-2">
        <span className="text-sm">📸</span>
        <p className="text-xs font-bold text-violet-700">Agent Inspection Report</p>
        {isSeller && order.seller_decision === 'accepted' && (
          <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full border border-green-200">
            ✓ Price Accepted
          </span>
        )}
        {!isSeller && !buyerAccepted && a.price_change && (
          <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
            Action required
          </span>
        )}
      </div>
      <div className="p-3 flex gap-3">
        {order.agent_photo_url && (
          <div className="flex-shrink-0">
            <img src={order.agent_photo_url} alt="Agent inspection photo"
              className="w-20 h-20 object-cover rounded-lg border border-violet-200" />
            <p className="text-[9px] text-gray-400 text-center mt-0.5">Agent photo</p>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${GRADE_BG[a.grade] ?? GRADE_BG.C}`}>
              Grade {a.grade}
            </span>
            {a.price_change ? (
              <span className="text-xs font-bold text-amber-600">
                Updated: ₹{dispPrice}
                <span className="text-gray-400 line-through ml-1.5">₹{origPrice}</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-green-600">Price unchanged · ₹{dispPrice}</span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1.5 leading-snug">{a.notes}</p>

          {/* Seller — post-decision message */}
          {isSeller && order.seller_decision === 'accepted' && (
            <p className="text-xs text-green-600 font-semibold mt-2">✓ You accepted ₹{dispPrice} — item is being picked up</p>
          )}

          {/* Buyer — accept/cancel buttons */}
          {!isSeller && !buyerAccepted && (
            <div className="flex gap-2 mt-2.5">
              {a.price_change ? (
                <>
                  <button
                    onClick={() => setBuyerAccepted(true)}
                    className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 hover:bg-green-200 transition-colors"
                  >
                    Accept ₹{dispPrice}
                  </button>
                  <button className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-200 hover:bg-red-100 transition-colors">
                    Cancel Order
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setBuyerAccepted(true)}
                  className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 hover:bg-green-200 transition-colors"
                >
                  ✓ Looks good — proceed
                </button>
              )}
            </div>
          )}
          {!isSeller && buyerAccepted && (
            <p className="text-xs text-green-600 font-semibold mt-2">✓ Accepted — item on its way to you</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Timeline({ events, statusIndex, isCancelled }) {
  const cancelledEvent = events.find(e => e.status === 'cancelled')
  return (
    <div className="space-y-0">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= statusIndex
        const current = i === statusIndex && !isCancelled
        const cfg = STATUS_CFG[s] ?? STATUS_CFG.pending
        const event = events.find(e => e.status === s)
        return (
          <div key={s} className="flex items-start gap-2.5">
            <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                done
                  ? cfg.dot + ' border-transparent shadow-sm'
                  : 'bg-white border-gray-200'
              } ${current ? 'ring-2 ring-offset-1 ring-offset-white ' + cfg.dot.replace('bg-', 'ring-') : ''}`}>
                {done && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`w-0.5 mt-0.5 ${isCancelled && i === statusIndex ? 'h-6 bg-red-200' : i < statusIndex ? 'h-6 bg-gray-200' : 'h-6 bg-gray-100'}`} />
              )}
            </div>
            <div className="flex-1 pb-2 min-w-0">
              <p className={`text-xs font-semibold leading-tight ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                {cfg.label}
              </p>
              {event ? (
                <>
                  <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{event.note}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{event.ts}</p>
                </>
              ) : !done && (
                <p className="text-[10px] text-gray-300 mt-0.5">Pending…</p>
              )}
            </div>
          </div>
        )
      })}

      {/* Cancelled row appended after the last real step */}
      {isCancelled && cancelledEvent && (
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border-2 bg-red-500 border-transparent shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex-1 pb-2 min-w-0">
            <p className="text-xs font-semibold leading-tight text-red-700">Sale Cancelled</p>
            <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{cancelledEvent.note}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">{cancelledEvent.ts}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onUpdate }) {
  const [showTimeline, setShowTimeline] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const isCancelled = order.status === 'cancelled'
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending
  const isDelivered = order.status === 'delivered'
  const isSeller = order.user_role === 'seller'
  const finalPrice = (order.final_price || order.original_price).toLocaleString('en-IN')
  const priceChanged = order.final_price && order.final_price !== order.original_price

  // Show the big decision banner for seller when agent changed price and seller hasn't responded
  const showDecisionBanner = isSeller && order.status === 'agent_analyzed'
    && order.agent_analysis?.price_change && !order.seller_decision

  // Hide Next Stage button when: delivered, cancelled, or waiting for seller price decision
  const showAdvanceButton = !isDelivered && !isCancelled && !showDecisionBanner

  const advance = async () => {
    setAdvancing(true)
    try {
      const { data } = await axios.post(`/api/v1/orders/${order.id}/advance`)
      onUpdate(data)
    } catch {
      // silent — backend blocks advance if pending decision
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
      isCancelled ? 'border-red-200' : isDelivered ? 'border-green-200' : 'border-amz-border'
    }`}>

      {/* Header strip */}
      <div className={`px-4 py-2 flex items-center justify-between border-b ${
        isCancelled ? 'bg-red-50 border-red-100'
        : isDelivered ? 'bg-green-50 border-green-100'
        : showDecisionBanner ? 'bg-red-50 border-red-100'
        : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">{cfg.icon}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>{cfg.label}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isSeller ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
            {isSeller ? '📤 My Sale' : '📥 My Purchase'}
          </span>
          {showDecisionBanner && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
              ⚠️ Response needed
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">#{order.id}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Product row */}
        <div className="flex items-start gap-3">
          {order.image_url ? (
            <img src={order.image_url} alt=""
              className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0 shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 border border-gray-200">📦</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-snug">{order.product_name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${GRADE_BG[order.grade] ?? GRADE_BG.C}`}>
                Grade {order.grade}
              </span>
              <span className={`text-sm font-bold ${priceChanged ? 'text-amber-600' : 'text-gray-800'}`}>
                ₹{finalPrice}
              </span>
              {priceChanged && (
                <span className="text-xs text-gray-400 line-through">₹{order.original_price.toLocaleString('en-IN')}</span>
              )}
            </div>
            {isSeller && order.buyer_name && (
              <p className="text-xs text-gray-500 mt-0.5">
                Buyer: <span className="font-medium">{order.buyer_name}</span> · {order.delivery_city}
              </p>
            )}
            {!isSeller && (
              <p className="text-xs text-gray-500 mt-0.5">
                Seller: <span className="font-medium">{order.seller_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress bar — muted red for cancelled */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCancelled ? 'bg-red-300' : 'bg-gradient-to-r from-amz-orange to-amber-400'}`}
            style={{ width: `${Math.round((order.status_index / (STATUS_FLOW.length - 1)) * 100)}%` }}
          />
        </div>

        {/* Pickup address (seller only) */}
        {isSeller && order.pickup_address && (
          <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="font-semibold text-gray-700">📍 Pickup: </span>
            {order.pickup_address.line1}, {order.pickup_address.city} — {order.pickup_address.phone}
          </div>
        )}

        {/* Agent card (assigned / en route / arrived) */}
        {['agent_assigned', 'agent_en_route', 'agent_arrived'].includes(order.status) && (
          <AgentCard order={order} />
        )}

        {/* Seller decision banner — replaces normal analysis panel when pending */}
        {showDecisionBanner && (
          <SellerDecisionBanner order={order} onDecision={onUpdate} />
        )}

        {/* Normal agent analysis panel (no pending seller decision) */}
        {order.agent_analysis && !showDecisionBanner && (
          <AgentAnalysisPanel order={order} isSeller={isSeller} />
        )}

        {/* Cancelled sale notice */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-red-700">❌ Sale Cancelled</p>
            <p className="text-xs text-gray-600 mt-0.5">You declined the agent's updated price. The item stays with you — you can relist it anytime.</p>
            <Link to="/returns" className="text-xs font-bold text-amz-teal hover:underline mt-1.5 inline-block">Relist this item →</Link>
          </div>
        )}

        {/* Delivered — credits (seller) */}
        {isDelivered && isSeller && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-700">🎉 Sale complete!</p>
              <p className="text-xs text-gray-600 mt-0.5">Green Credits have been added to your wallet</p>
            </div>
            <Link to="/wallet" className="text-xs font-bold text-amz-teal hover:underline flex-shrink-0">
              View wallet →
            </Link>
          </div>
        )}
        {isDelivered && !isSeller && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-green-700">🎉 Delivered!</p>
            <p className="text-xs text-gray-600 mt-0.5">Your item has been delivered. Enjoy your purchase!</p>
          </div>
        )}

        {/* Timeline toggle */}
        <div className="border-t border-amz-border pt-2">
          <button
            onClick={() => setShowTimeline(v => !v)}
            className="text-xs text-amz-teal hover:text-[#005f6b] flex items-center gap-1 transition-colors"
          >
            {showTimeline ? '▲ Hide' : '▼ Show'} full delivery timeline
            <span className="text-gray-400">({order.events.length} updates)</span>
          </button>
          {showTimeline && (
            <div className="mt-3 pl-1">
              <Timeline events={order.events} statusIndex={order.status_index} isCancelled={isCancelled} />
            </div>
          )}
        </div>

        {/* Next Stage demo button */}
        {showAdvanceButton && (
          <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-100">
            <p className="text-[10px] text-gray-400">Demo: advance delivery stage</p>
            <button
              onClick={advance}
              disabled={advancing}
              className="text-xs font-semibold text-amz-orange hover:text-amber-600 disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              {advancing
                ? <><svg className="animate-spin h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</>
                : 'Next Stage →'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('seller')

  useEffect(() => {
    axios.get('/api/v1/orders/')
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateOrder = (updated) =>
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))

  const isPendingDecision = (o) =>
    o.user_role === 'seller' && o.status === 'agent_analyzed'
    && o.agent_analysis?.price_change && !o.seller_decision

  const rawSellerOrders = orders.filter(o => o.user_role === 'seller')
  // Pending-decision orders always float to the top
  const sellerOrders = [
    ...rawSellerOrders.filter(isPendingDecision),
    ...rawSellerOrders.filter(o => !isPendingDecision(o)),
  ]
  const buyerOrders  = orders.filter(o => o.user_role === 'buyer')
  const shown        = tab === 'seller' ? sellerOrders : buyerOrders

  const activeCount = shown.filter(o => !['delivered', 'pending', 'cancelled'].includes(o.status)).length

  // Seller orders at agent_analyzed with a price change and no decision yet
  const pendingDecisions = sellerOrders.filter(isPendingDecision)

  const scrollToFirstPending = () => {
    setTab('seller')
    setTimeout(() => {
      const el = document.getElementById(`order-pending-${pendingDecisions[0]?.id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const [resetting, setResetting] = useState(false)
  const resetDemo = async () => {
    if (resetting) return
    setResetting(true)
    try {
      await fetch('/api/v1/orders/demo-reset', { method: 'POST' })
    } finally {
      window.location.reload()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* Page header */}
      <div className="bg-white border border-amz-border rounded-xl px-5 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Orders &amp; Deliveries
            {activeCount > 0 && (
              <span className="text-sm font-bold bg-amz-orange text-white px-2 py-0.5 rounded-full">
                {activeCount} active
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time tracking for your sales and purchases</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Link to="/returns" className="text-xs font-semibold text-amz-teal hover:underline">
            + List an item
          </Link>
          <button
            onClick={resetDemo}
            disabled={resetting}
            className="text-[10px] font-semibold disabled:opacity-40 transition-colors flex items-center gap-1 text-gray-400 hover:text-red-500"
          >
            {resetting ? '↺ Resetting…' : '↺ Reset Demo'}
          </button>
        </div>
      </div>

      {/* ⚠️ Urgent notification — pending price decisions (always visible, not tab-specific) */}
      {pendingDecisions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <span className="text-2xl flex-shrink-0 animate-pulse">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">
              {pendingDecisions.length === 1
                ? 'Agent updated a price — your response needed'
                : `${pendingDecisions.length} agents updated prices — responses needed`}
            </p>
            <p className="text-xs text-red-600 mt-0.5 truncate">
              {pendingDecisions.map(o => o.product_name.split(' ').slice(0, 4).join(' ')).join(' · ')}
            </p>
          </div>
          <button
            onClick={scrollToFirstPending}
            className="flex-shrink-0 text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Review →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-amz-border rounded-xl p-1 flex gap-1">
        {[
          { id: 'seller', icon: '📤', label: 'My Sales',     count: sellerOrders.length },
          { id: 'buyer',  icon: '📥', label: 'My Purchases', count: buyerOrders.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-amz-orange text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
            {/* Red dot on seller tab if there are pending decisions */}
            {t.id === 'seller' && pendingDecisions.length > 0 && tab !== 'seller' && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Active order count banner */}
      {activeCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg flex-shrink-0">🔔</span>
          <p className="text-xs text-amber-800">
            <span className="font-bold">{activeCount} order{activeCount > 1 ? 's' : ''} in progress</span>
            {tab === 'seller'
              ? ' — click "Next Stage →" to simulate the delivery pipeline'
              : ' — your purchases are being processed'
            }
          </p>
        </div>
      )}

      {/* Order list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-amz-border p-12 text-center">
          <div className="text-4xl mb-3 animate-pulse">📦</div>
          <p className="text-sm text-gray-500">Loading orders…</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-xl border border-amz-border p-12 text-center">
          <p className="text-4xl mb-3">{tab === 'seller' ? '📤' : '📥'}</p>
          <p className="text-sm font-semibold text-gray-700">
            {tab === 'seller' ? 'No active sales yet' : 'No purchases yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {tab === 'seller'
              ? 'Return and list an item to see it here'
              : 'Browse the marketplace to find items to buy'
            }
          </p>
          <Link
            to={tab === 'seller' ? '/returns' : '/marketplace'}
            className="inline-block bg-amz-yellow text-amz-text border border-[#FFA41C] px-5 py-2 rounded-full text-sm font-bold hover:bg-amz-yellow-hover transition-colors"
          >
            {tab === 'seller' ? 'Start a Return →' : 'Browse Marketplace →'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(order => (
            <div key={order.id} id={isPendingDecision(order) ? `order-pending-${order.id}` : undefined}>
              <OrderCard order={order} onUpdate={updateOrder} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
