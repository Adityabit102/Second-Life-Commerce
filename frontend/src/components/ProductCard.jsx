const conditionColors = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-yellow-100 text-yellow-700',
  poor: 'bg-red-100 text-red-700',
}

export default function ProductCard({ product }) {
  const savings =
    product.original_price > 0
      ? Math.round((1 - product.resale_price / product.original_price) * 100)
      : 0

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">
            {product.title}
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              conditionColors[product.condition] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {product.condition}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-green-700">
              ${product.resale_price?.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 line-through ml-2">
              ${product.original_price?.toFixed(2)}
            </span>
          </div>
          {savings > 0 && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {savings}% off
            </span>
          )}
        </div>

        <button className="mt-3 w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 transition-colors">
          View Item
        </button>
      </div>
    </div>
  )
}
