import { useState } from 'react'
import axios from 'axios'

const EMPTY_FORM = {
  order_id: '',
  product_name: '',
  reason: '',
  condition_description: '',
  customer_email: '',
  original_price: '',
}

const conditionBadge = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
}

export default function ReturnForm() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post('/api/returns/', {
        ...form,
        original_price: parseFloat(form.original_price),
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">Return Submitted!</h2>
          <p className="text-sm text-gray-500 mt-1">AI assessment complete</p>
        </div>

        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 text-sm">Condition</dt>
            <dd>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  conditionBadge[result.condition] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {result.condition}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 text-sm">Recommendation</dt>
            <dd className="font-medium text-gray-800 text-sm capitalize">
              {result.ai_recommendation?.replace(/_/g, ' ')}
            </dd>
          </div>
          {result.resale_value > 0 && (
            <div className="flex justify-between">
              <dt className="text-gray-500 text-sm">Est. Resale Value</dt>
              <dd className="font-medium text-green-700 text-sm">
                ${result.resale_value?.toFixed(2)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500 text-sm">Status</dt>
            <dd className="font-medium text-gray-800 text-sm capitalize">{result.status}</dd>
          </div>
        </dl>

        {result.ai_notes && (
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <p className="text-xs font-medium text-gray-500 mb-1">AI Notes</p>
            <p className="text-sm text-gray-700">{result.ai_notes}</p>
          </div>
        )}

        <button
          onClick={() => { setResult(null); setForm(EMPTY_FORM) }}
          className="mt-6 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Submit Another Return
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow p-8 max-w-lg mx-auto space-y-4"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a Return</h2>

      {[
        { name: 'order_id', label: 'Order ID', type: 'text', placeholder: 'ORD-12345' },
        { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g. Nike Air Max 90' },
        { name: 'customer_email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
        { name: 'original_price', label: 'Original Purchase Price ($)', type: 'number', placeholder: '99.99' },
      ].map(({ name, label, type, placeholder }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type}
            name={name}
            value={form[name]}
            onChange={handleChange}
            placeholder={placeholder}
            required
            min={type === 'number' ? 0 : undefined}
            step={type === 'number' ? '0.01' : undefined}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
        <select
          name="reason"
          value={form.reason}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select a reason…</option>
          <option value="wrong_size">Wrong Size</option>
          <option value="defective">Defective / Damaged</option>
          <option value="not_as_described">Not as Described</option>
          <option value="changed_mind">Changed Mind</option>
          <option value="gift_duplicate">Gift Duplicate</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Describe the Item's Condition
        </label>
        <textarea
          name="condition_description"
          value={form.condition_description}
          onChange={handleChange}
          placeholder="Describe any wear, damage, or issues. The more detail, the better the AI assessment."
          required
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Analyzing with AI…' : 'Submit Return Request'}
      </button>
    </form>
  )
}
