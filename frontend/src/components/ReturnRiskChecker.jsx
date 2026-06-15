import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const CATEGORIES = [
  'Electronics',
  'Apparel & Footwear',
  'Home Appliances',
  'Books & Stationery',
  'Sports & Fitness',
  'Other',
]

const RISK_CONFIG = {
  low:    { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', icon: '✓', label: 'Low Risk' },
  medium: { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', icon: '⚠', label: 'Moderate Risk' },
  high:   { badge: 'bg-red-100 text-red-700',     bar: 'bg-red-500',   icon: '⚠', label: 'High Risk' },
}

export default function ReturnRiskChecker() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ product_name: '', category: 'Electronics', price_inr: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [proceeded, setProceeded] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const check = async () => {
    const price = parseInt(form.price_inr, 10)
    if (!form.product_name.trim() || !price || price <= 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post('/api/v1/predict/return-risk', {
        product_name: form.product_name.trim(),
        category: form.category,
        price_inr: price,
      })
      setResult(data)
    } catch {
      setError('Could not analyse this product. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? (RISK_CONFIG[result.risk_level] ?? RISK_CONFIG.medium) : null
  const canSubmit = form.product_name.trim() && form.price_inr && parseInt(form.price_inr, 10) > 0

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-gray-900">Return Risk Checker</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Find out how likely you are to return a product before you buy it.
        </p>
      </div>

      {/* Form card */}
      <section className="bg-white rounded border border-amz-border p-6 space-y-4">

        {/* Product name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product name</label>
          <input
            type="text"
            value={form.product_name}
            onChange={set('product_name')}
            onKeyDown={e => e.key === 'Enter' && canSubmit && check()}
            placeholder="e.g. Boat Bassheads 100 Earphones"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange text-gray-800"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange text-gray-800 bg-white"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
            <input
              type="number"
              min="1"
              value={form.price_inr}
              onChange={set('price_inr')}
              onKeyDown={e => e.key === 'Enter' && canSubmit && check()}
              placeholder="999"
              className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange text-gray-800"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          onClick={check}
          disabled={loading || !canSubmit}
          className="w-full bg-amz-yellow text-amz-text py-3 rounded-full font-semibold text-sm hover:bg-amz-yellow-hover active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-[#FFA41C] shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analysing…
            </>
          ) : (
            '🔍 Check Return Risk'
          )}
        </button>
      </section>

      {/* Result card */}
      {result && cfg && (
        <section className="bg-white rounded border border-amz-border p-6 space-y-4">

          {/* Risk badge + return rate */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${cfg.badge}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-xs text-gray-400">{result.return_rate_estimate}</span>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-gray-500">Risk Score</span>
              <span className="text-sm font-black text-gray-800">{result.risk_score}<span className="text-xs font-normal">/100</span></span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${result.risk_score}%` }}
              />
            </div>
          </div>

          {/* Reason chips */}
          <div className="flex flex-wrap gap-2">
            {result.top_reasons.map((r, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
              >
                {r}
              </span>
            ))}
          </div>

          {/* Suggestion */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <span className="text-lg mt-0.5 flex-shrink-0">💡</span>
            <p className="text-sm text-blue-800 leading-relaxed">{result.suggestion}</p>
          </div>

          {result.mock && (
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <span>⚠️</span>
              <span>Demo mode — add AWS credentials for live AI analysis</span>
            </p>
          )}

          {/* CTAs */}
          {proceeded ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-start gap-2">
              <span className="text-lg">✓</span>
              <div>
                <p className="font-semibold">Noted! We've flagged the risk.</p>
                <p className="text-xs mt-0.5 text-green-600">
                  Consider checking our pre-loved marketplace for a verified, cheaper alternative.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setProceeded(true)}
                className="flex-1 bg-amz-yellow hover:bg-amz-yellow-hover active:scale-[0.99] text-amz-text py-2.5 rounded-full text-sm font-semibold border border-[#FFA41C] transition-all shadow-sm"
              >
                Proceed to buy anyway
              </button>
              <Link
                to="/marketplace"
                className="flex-1 text-center border-2 border-amz-teal text-amz-teal py-2.5 rounded-full text-sm font-semibold hover:bg-amz-teal hover:text-white transition-all"
              >
                See resale items →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
