import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getProductCategory } from '../utils/productImages'

const GRADE_CONFIG = {
  A:    { bg: 'bg-green-500',  label: 'Like New' },
  B:    { bg: 'bg-blue-500',   label: 'Good'     },
  C:    { bg: 'bg-amber-500',  label: 'Fair'     },
  Junk: { bg: 'bg-red-500',    label: 'Junk'     },
}

const CATEGORIES = ['Electronics', 'Apparel & Footwear', 'Home & Kitchen', 'Books', 'Sports & Fitness', 'Other']

const RETURN_REASONS = [
  { icon: '💔', label: 'Item damaged',          sub: 'Received broken or scratched' },
  { icon: '📦', label: 'Wrong item sent',        sub: 'Got something different' },
  { icon: '🔧', label: 'Defective / not working', sub: 'Malfunctions or stops working' },
  { icon: '📐', label: "Doesn't fit / match",   sub: 'Wrong size, color or style' },
  { icon: '💸', label: 'Better price found',    sub: 'Found it cheaper elsewhere' },
  { icon: '🙅', label: 'No longer needed',      sub: 'Changed my mind' },
  { icon: '📬', label: 'Missing parts',         sub: 'Accessories or manual missing' },
  { icon: '🕐', label: 'Arrived too late',      sub: 'Delivery took too long' },
]

function extractVideoFrame(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(videoFile)
    video.preload = 'metadata'
    video.muted = true
    video.crossOrigin = 'anonymous'
    video.src = objectUrl
    video.onloadeddata = () => {
      video.currentTime = Math.min(1.5, (video.duration || 0) * 0.1)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(video.videoWidth || 640, 1280)
      canvas.height = Math.min(video.videoHeight || 480, 960)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Frame extraction failed'))),
        'image/jpeg',
        0.88
      )
    }
    video.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Video load error')) }
  })
}

const defaultHighlights = (result) => {
  const damage = result.damage_detected
  const noDamage = damage === 'None visible' || damage?.toLowerCase().includes('no visible')
  return [
    noDamage ? 'No visible damage — cosmetically intact' : damage,
    `Grade ${result.grade} — AI verified condition`,
    'Tested and dispatched within 24 hours',
  ]
}

export default function Returns() {
  // ── Step 1: Product name ──────────────────────────────────────────────────
  const [nameInput, setNameInput]     = useState('')
  const [productName, setProductName] = useState('')

  // ── Step 1.5: Product link ────────────────────────────────────────────────
  const [productUrl, setProductUrl]   = useState('')
  const [urlFetching, setUrlFetching] = useState(false)
  const [urlProduct, setUrlProduct]   = useState(null)
  const [urlError, setUrlError]       = useState('')

  // ── Step 2: Return reason ─────────────────────────────────────────────────
  const [returnReason, setReturnReason] = useState('')

  // ── Step 3: Upload fields ─────────────────────────────────────────────────
  const [files, setFiles]         = useState([])
  const [previews, setPreviews]   = useState([])
  const [isDragging, setDrag]     = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')

  const fileInputRef     = useRef(null)
  const addMoreRef       = useRef(null)
  const uploadSectionRef = useRef(null)
  const actionSectionRef = useRef(null)

  // ── Grading ───────────────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [titleError, setTitleError] = useState(false)
  const [wallet, setWallet]         = useState(null)

  // ── Action choice ─────────────────────────────────────────────────────────
  const [chosenAction, setChosenAction] = useState(null)
  const [actionDone, setActionDone]     = useState(false)

  // ── Donate flow ───────────────────────────────────────────────────────────
  const [donateStep, setDonateStep]     = useState(0) // 0=idle 1=pick-NGO 2=schedule 3=confirmed
  const [donatePartner, setDonatePartner] = useState(null)
  const [donateDate, setDonateDate]     = useState('')

  // ── Recycle flow ──────────────────────────────────────────────────────────
  const [recycleStep, setRecycleStep]   = useState(0) // 0=idle 1=pick-partner 2=schedule 3=confirmed
  const [recyclePartner, setRecyclePartner] = useState(null)
  const [recycleDate, setRecycleDate]   = useState('')

  // ── Exchange / Swap ───────────────────────────────────────────────────────
  const [swapSuggestions, setSwapSuggestions] = useState([])
  const [swapLoading, setSwapLoading]         = useState(false)
  const [swapPick, setSwapPick]               = useState(null)
  const [swapDone, setSwapDone]               = useState(false)

  // ── Extra image URLs (uploaded after grading) ─────────────────────────────
  const [extraImageUrls, setExtraImageUrls] = useState([])

  // ── Listing form — highlights are now a dynamic array ─────────────────────
  const [listTitle, setListTitle]       = useState('')
  const [listDesc, setListDesc]         = useState('')
  const [listCategory, setListCategory] = useState('')
  const [listPrice, setListPrice]       = useState('')
  const [highlights, setHighlights]     = useState(['', '', ''])

  const [listLoading, setListLoading] = useState(false)
  const [listDone, setListDone]       = useState(false)
  const [listError, setListError]     = useState(null)

  // ── Pickup address ────────────────────────────────────────────────────────
  const [pickupAddr, setPickupAddr] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' })
  const setAddr = (field, val) => setPickupAddr(prev => ({ ...prev, [field]: val }))

  // ── Helpers ───────────────────────────────────────────────────────────────
  const commitName = () => {
    const n = nameInput.trim()
    if (n) { setProductName(n); setUploadTitle(n) }
  }

  const fetchFromUrl = async () => {
    setUrlError('')
    try { new URL(productUrl.trim()) } catch { setUrlError('Please paste a valid Amazon product link'); return }
    if (!productUrl.includes('amazon.')) { setUrlError('Please paste a valid Amazon product link (amazon.in or amazon.com)'); return }
    setUrlFetching(true)
    try {
      const res = await axios.get('/api/v1/returns/fetch-product', { params: { url: productUrl.trim() } })
      const data = res.data
      setUrlProduct(data)
      setNameInput(data.name)
      setProductName(data.name)
      setUploadTitle(data.name)
    } catch {
      setUrlError('Could not fetch product details. Please check the link and try again.')
    } finally {
      setUrlFetching(false)
    }
  }

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!valid.length) return
    setFiles(prev => [...prev, ...valid])
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
    setResult(null)
    setError(null)
    setChosenAction(null)
    setActionDone(false)
    setListDone(false)
  }

  const removeFile = (idx) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDrag(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const scrollToUpload = () =>
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const scrollToAction = () =>
    setTimeout(() => actionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)

  const handleGrade = async () => {
    if (!files.length) return
    setLoading(true)
    setError(null)
    setResult(null)
    setChosenAction(null)
    setActionDone(false)
    setListDone(false)
    setDonateStep(0); setDonatePartner(null); setDonateDate('')
    setRecycleStep(0); setRecyclePartner(null); setRecycleDate('')

    if (!uploadTitle.trim()) { setTitleError(true); setLoading(false); return }
    setTitleError(false)

    const primaryFile = files[0]
    let gradingFile = primaryFile
    let uploadPrimaryVideo = false
    if (primaryFile.type.startsWith('video/')) {
      try {
        const frameBlob = await extractVideoFrame(primaryFile)
        gradingFile = new File([frameBlob], 'video_frame.jpg', { type: 'image/jpeg' })
        uploadPrimaryVideo = true
      } catch { /* fall through — mock grade will be used */ }
    }

    const fd = new FormData()
    fd.append('image', gradingFile)
    fd.append('product_name', uploadTitle.trim())
    fd.append('description', uploadTitle || '')

    try {
      const { data } = await axios.post('/api/v1/returns/grade', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      try {
        const cat = getProductCategory(uploadTitle.trim() || data.product_name)
        localStorage.setItem('slc_last_return', JSON.stringify({ name: uploadTitle.trim() || data.product_name, category: cat }))
      } catch {}
      const gradeLabel = GRADE_CONFIG[data.grade]?.label || 'Used'
      const titleVal   = uploadTitle.trim() || `${data.product_name} — Grade ${data.grade}, ${gradeLabel}`
      setListTitle(titleVal)
      setListDesc(
        `Returned ${data.product_name} in ${gradeLabel.toLowerCase()} condition. ` +
        (returnReason ? `Return reason: ${returnReason}. ` : '') +
        (data.damage_detected === 'None visible' ? 'No visible damage detected.' : data.damage_detected + '.')
      )
      setHighlights(defaultHighlights(data))
      // If user provided an Amazon URL, base suggested price on market price - grade discount
      const marketPrice = urlProduct?.market_price_inr
      const gradeDiscount = { A: 100, B: 300, C: 800, Junk: 1500 }
      const urlBasedPrice = marketPrice
        ? Math.max(marketPrice - (gradeDiscount[data.grade] ?? 100), 50)
        : null
      setListPrice(String(urlBasedPrice ?? data.estimated_resale_value_inr))
      setListCategory('')
      axios.get('/api/v1/credits/wallet').then(r => setWallet(r.data)).catch(() => {})

      // Upload extra media (videos + extra images) in the background
      const extraFiles = [
        ...(uploadPrimaryVideo ? [primaryFile] : []),
        ...files.slice(1),
      ]
      if (extraFiles.length > 0) {
        const extraFd = new FormData()
        extraFiles.forEach(f => extraFd.append('files', f))
        axios.post('/api/uploads/media/batch', extraFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => setExtraImageUrls(r.data.urls || [])).catch(() => {})
      }

      scrollToAction()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Grading failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSwapSuggestions = async () => {
    setSwapSuggestions([])
    setSwapLoading(true)
    try {
      const { data } = await axios.get('/api/v1/marketplace/listings', { params: { limit: 100 } })
      const ourPrice = result?.estimated_resale_value_inr ?? 0
      const filtered = data
        .filter(l => l.grade === 'A' || l.grade === 'B')
        .filter(l => { const r = l.suggested_price_inr / (ourPrice || 1); return r >= 0.2 && r <= 5 })
        .sort((a, b) => Math.abs(a.suggested_price_inr - ourPrice) - Math.abs(b.suggested_price_inr - ourPrice))
        .slice(0, 6)
      setSwapSuggestions(filtered)
    } catch {
      setSwapSuggestions([])
    } finally {
      setSwapLoading(false)
    }
  }

  const confirmSwap = async () => {
    try {
      await axios.patch(`/api/v1/marketplace/listings/${swapPick.id}/sold`)
    } catch {}
    try {
      await axios.post('/api/v1/orders/', {
        listing_id: swapPick.id,
        product_name: swapPick.product_name,
        image_url: swapPick.image_url ?? null,
        grade: swapPick.grade,
        original_price: swapPick.suggested_price_inr,
        user_role: 'buyer',
      })
    } catch {}
    setSwapDone(true)
    setActionDone(true)
  }

  const chooseAction = (action) => {
    setChosenAction(action)
    if (action === 'donate') { setDonateStep(1); setDonatePartner(null); setDonateDate('') }
    else if (action === 'recycle') { setRecycleStep(1); setRecyclePartner(null); setRecycleDate('') }
    if (action === 'exchange') { setSwapPick(null); setSwapDone(false); fetchSwapSuggestions() }
  }

  const addHighlight = () => setHighlights(h => [...h, ''])
  const removeHighlight = (idx) => setHighlights(h => h.filter((_, i) => i !== idx))
  const updateHighlight = (idx, val) => setHighlights(h => h.map((v, i) => i === idx ? val : v))

  const submitListing = async () => {
    if (!result || listLoading) return
    const addrValid = pickupAddr.name.trim() && pickupAddr.phone.trim() &&
                      pickupAddr.line1.trim() && pickupAddr.city.trim() &&
                      pickupAddr.state.trim() && pickupAddr.pincode.trim()
    if (!addrValid) { setListError('Please fill in all pickup address fields so agents know where to collect.'); return }
    setListLoading(true)
    setListError(null)
    const cleanHighlights = highlights.filter(h => h.trim())

    // Ensure extra media is uploaded before publishing (race condition guard)
    let finalExtraUrls = extraImageUrls
    const extraToUpload = [
      ...(files[0]?.type.startsWith('video/') ? [files[0]] : []),
      ...files.slice(1),
    ]
    if (extraToUpload.length > 0 && finalExtraUrls.length === 0) {
      const extraFd = new FormData()
      extraToUpload.forEach(f => extraFd.append('files', f))
      try {
        const r = await axios.post('/api/uploads/media/batch', extraFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        finalExtraUrls = r.data.urls || []
        setExtraImageUrls(finalExtraUrls)
      } catch {}
    }

    try {
      const { data: listing } = await axios.post('/api/v1/marketplace/listings', {
        return_id: result.id,
        product_name: result.product_name,
        grade: result.grade,
        image_url: result.image_url ?? null,
        extra_image_urls: finalExtraUrls,
        estimated_resale_value_inr: result.estimated_resale_value_inr,
        damage_detected: result.damage_detected,
        customer_title: listTitle,
        customer_description: listDesc,
        customer_highlights: cleanHighlights,
        customer_price: parseInt(listPrice, 10) || result.estimated_resale_value_inr,
        category: listCategory,
      })
      // Create order record so the Orders page can track it
      await axios.post('/api/v1/orders/', {
        listing_id: listing.id,
        product_name: result.product_name,
        image_url: result.image_url ?? null,
        grade: result.grade,
        original_price: listing.suggested_price_inr,
        user_role: 'seller',
        pickup_address: pickupAddr,
      }).catch(() => {})
      setListDone(true)
      setActionDone(true)
    } catch {
      setListError('Failed to create listing. Please try again.')
    } finally {
      setListLoading(false)
    }
  }

  const reset = () => {
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles([]); setPreviews([]); setExtraImageUrls([])
    setResult(null); setWallet(null)
    setChosenAction(null); setActionDone(false); setListDone(false)
    setListLoading(false); setListError(null); setUploadTitle(''); setTitleError(false)
    setReturnReason(''); setProductUrl(''); setUrlProduct(null); setUrlError('')
    setSwapSuggestions([]); setSwapLoading(false); setSwapPick(null); setSwapDone(false)
    setPickupAddr({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' })
    setDonateStep(0); setDonatePartner(null); setDonateDate('')
    setRecycleStep(0); setRecyclePartner(null); setRecycleDate('')
  }

  const gradeConfig = result ? (GRADE_CONFIG[result.grade] ?? GRADE_CONFIG['C']) : null
  const canResell   = result && (result.grade === 'A' || result.grade === 'B')

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* Step progress */}
      <div className="bg-white border border-amz-border rounded px-3 sm:px-5 py-3 flex items-center">
        {[
          { n: 1, label: 'Describe',  labelFull: 'Describe item', active: true },
          { n: 2, label: 'Grade',     labelFull: 'AI Grade',      active: !!productName },
          { n: 3, label: 'Action',    labelFull: 'Choose action', active: !!result },
          { n: 4, label: 'List',      labelFull: 'Marketplace',   active: !!chosenAction },
        ].map(({ n, label, labelFull, active }, i, arr) => (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${active ? 'bg-amz-orange text-white' : 'bg-amz-border text-gray-400'}`}>
                {n}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${active ? 'text-amz-text' : 'text-gray-400'}`}>
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{labelFull}</span>
              </span>
            </div>
            {i < arr.length - 1 && <div className={`flex-1 h-px mx-1.5 sm:mx-3 ${active && arr[i + 1].active ? 'bg-amz-orange' : 'bg-amz-border'}`} />}
          </div>
        ))}
      </div>

      {/* ── 1. Product name ──────────────────────────────────────────────── */}
      <section className="bg-white rounded border border-amz-border p-5">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Start a Return</h1>
        <p className="text-sm text-gray-500 mb-4">Tell us what you're returning and we'll try to help first.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">What are you returning?</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commitName()}
            placeholder="e.g. Sony WH-1000XM4 Headphones"
            className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange text-gray-800"
          />
          <button
            onClick={commitName}
            disabled={!nameInput.trim()}
            className="bg-amz-yellow text-amz-text border border-[#FFA41C] px-4 py-2.5 rounded-full text-sm font-bold hover:bg-amz-yellow-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Let's go →
          </button>
        </div>
        {productName && <p className="text-xs text-amz-green mt-2 font-medium">✓ Returning: {productName}</p>}
      </section>

      {/* ── 1.5 Amazon Product Link ──────────────────────────────────────── */}
      <section className="bg-white rounded border border-amz-border p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-amz-nav flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🔗</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">Paste your Amazon product link</h2>
              <span className="text-[10px] bg-amz-yellow text-amz-text px-2 py-0.5 rounded-full font-bold border border-[#FFA41C]">Optional</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Auto-fills product name &amp; details from your order — only photo grading needed after this
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={productUrl}
            onChange={e => { setProductUrl(e.target.value); setUrlProduct(null); setUrlError('') }}
            onKeyDown={e => e.key === 'Enter' && productUrl.trim() && !urlFetching && fetchFromUrl()}
            placeholder="https://www.amazon.in/Sony-WH-1000XM4/dp/B0863TXGM3"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amz-orange text-gray-700"
          />
          <button
            onClick={fetchFromUrl}
            disabled={!productUrl.trim() || urlFetching || !!urlProduct}
            className="bg-amz-dark text-white px-4 py-2.5 rounded-full text-sm font-bold hover:bg-[#1a2332] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            {urlFetching ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Fetching…
              </>
            ) : urlProduct ? '✓ Loaded' : 'Fetch Details →'}
          </button>
        </div>

        {urlError && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <span>⚠</span> {urlError}
          </p>
        )}

        {urlProduct && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-base">✅</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-1">Product details loaded</p>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => {
                    setNameInput(e.target.value)
                    setProductName(e.target.value)
                    setUploadTitle(e.target.value)
                  }}
                  className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Product name"
                />
                {urlProduct.asin && (
                  <p className="text-[11px] text-gray-500 mt-1.5 font-mono bg-white border border-gray-200 inline-block px-2 py-0.5 rounded">
                    ASIN: {urlProduct.asin}
                  </p>
                )}
                <p className="text-[11px] text-green-600 mt-1.5">
                  Edit the name above if needed, then select a return reason and upload your photo
                </p>
              </div>
              <button
                onClick={() => { setUrlProduct(null); setProductUrl('') }}
                className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
                title="Clear"
              >✕</button>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Return Reason ─────────────────────────────────────────────── */}
      {productName && (
        <section className="bg-white rounded border border-amz-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Why are you returning this?</h2>
              <p className="text-xs text-gray-500 mt-0.5">Helps us process your return faster and pre-fills the listing description</p>
            </div>
            {returnReason && (
              <button onClick={() => setReturnReason('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RETURN_REASONS.map(({ icon, label, sub }) => {
              const selected = returnReason === label
              return (
                <button
                  key={label}
                  onClick={() => { setReturnReason(label); scrollToUpload() }}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                    selected
                      ? 'border-amz-orange bg-orange-50'
                      : 'border-amz-border hover:border-amz-orange'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className={`text-xs font-semibold leading-tight ${selected ? 'text-amz-text' : 'text-gray-700'}`}>{label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>
                </button>
              )
            })}
          </div>
          {returnReason && (
            <p className="text-xs text-amz-orange font-semibold mt-3">
              ✓ Reason: {returnReason} — scroll down to upload your photo
            </p>
          )}
        </section>
      )}

      {/* ── 3. Upload & Grade ────────────────────────────────────────────── */}
      <section ref={uploadSectionRef} className="bg-white rounded border border-amz-border p-5 space-y-4 scroll-mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h2 className="text-base font-semibold text-gray-800">AI Item Grading</h2>
          <span className="text-xs text-gray-400">Upload a photo — our AI grades and prices it</span>
        </div>

        {/* ── Listing title (required) ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Item Name / Listing Title <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            maxLength={80}
            value={uploadTitle}
            onChange={e => { setUploadTitle(e.target.value); if (e.target.value.trim()) setTitleError(false) }}
            placeholder="e.g. Sony WH-1000XM4 Headphones — barely used"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${titleError ? 'border-red-400 ring-2 ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-amz-orange'}`}
          />
          {titleError
            ? <p className="text-xs text-red-500 mt-1 font-medium">⚠ Please enter an item name before grading</p>
            : <p className="text-[10px] text-gray-400 mt-1">{uploadTitle.length}/80 — you can edit this again before publishing</p>
          }
        </div>

        {/* ── Drop zone ── */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false) }}
          onClick={() => !files.length && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-150 ${
            files.length ? 'border-amz-orange bg-orange-50/30 cursor-default' :
            isDragging ? 'border-amz-orange bg-orange-50 scale-[1.01] cursor-pointer' :
            'border-gray-300 hover:border-amz-orange hover:bg-[#FFFBF2] cursor-pointer'
          }`}
        >
          {files.length === 0 ? (
            <div className="py-12 text-center select-none">
              <div className="text-5xl mb-3">📸</div>
              <p className="text-gray-600 font-medium">Drop photos or videos here, or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · MP4, MOV, WebM · multiple files supported</p>
            </div>
          ) : (
            <div className="p-3">
              {/* Media grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                {previews.map((src, i) => {
                  const isVideo = files[i]?.type.startsWith('video/')
                  return (
                  <div key={i} className="relative group aspect-square">
                    {isVideo ? (
                      <video
                        src={src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover rounded-xl border border-gray-200"
                      />
                    ) : (
                      <img
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-gray-200"
                      />
                    )}
                    {/* Primary badge */}
                    {i === 0 && (
                      <div className="absolute top-1 left-1 flex flex-col gap-1">
                        <span className="text-[9px] font-bold bg-amz-orange text-white px-1.5 py-0.5 rounded-full leading-tight shadow">
                          {isVideo ? '🎥 Primary' : '★ Primary'}
                        </span>
                        {result && gradeConfig && (
                          <span className={`text-[9px] font-bold ${gradeConfig.bg} text-white px-1.5 py-0.5 rounded-full leading-tight shadow`}>
                            Grade {result.grade}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Video badge on non-primary videos */}
                    {isVideo && i !== 0 && (
                      <div className="absolute bottom-1 left-1">
                        <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full leading-tight shadow">🎥</span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeFile(i) }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all leading-none"
                      title={isVideo ? 'Remove video' : 'Remove photo'}
                    >
                      ×
                    </button>
                  </div>
                  )
                })}

                {/* Add more tile */}
                <button
                  type="button"
                  onClick={() => addMoreRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-amz-orange hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition-all text-gray-400 hover:text-amz-orange"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-[10px] font-medium">Add more</span>
                </button>
              </div>

              {(() => {
                const imgCount = files.filter(f => f.type.startsWith('image/')).length
                const vidCount = files.filter(f => f.type.startsWith('video/')).length
                const parts = []
                if (imgCount) parts.push(`${imgCount} photo${imgCount !== 1 ? 's' : ''}`)
                if (vidCount) parts.push(`${vidCount} video${vidCount !== 1 ? 's' : ''}`)
                const primaryLabel = files[0]?.type.startsWith('video/') ? 'video frame' : 'photo'
                return (
                  <p className="text-[10px] text-gray-400 text-center">
                    {parts.join(', ')} selected · first {primaryLabel} used for AI grading
                  </p>
                )
              })()}
            </div>
          )}

          {/* Hidden inputs */}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => e.target.files?.length && addFiles(e.target.files)} />
          <input ref={addMoreRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => e.target.files?.length && addFiles(e.target.files)} />
        </div>

        {/* Explicit add-more button — visible below the drop zone when photos are selected */}
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => addMoreRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-amz-teal hover:text-amz-orange transition-colors"
          >
            <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center font-bold leading-none">+</span>
            Add more photos / videos ({files.length} selected)
          </button>
        )}

        {/* Video grading info */}
        {files.length > 0 && files[0]?.type.startsWith('video/') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
            <span className="flex-shrink-0 text-base">🎥</span>
            <span><strong>Video detected</strong> — AI will analyze the first frame for condition grading. The full video will be attached to your listing so buyers can see the item in action.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          onClick={handleGrade}
          disabled={loading || !files.length}
          className="w-full bg-amz-yellow text-amz-text border border-[#FFA41C] py-3.5 rounded-full font-semibold text-sm hover:bg-amz-yellow-hover active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
        >
          {loading ? (
            <><svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analyzing your item…</>
          ) : '🤖 Get AI Grade'}
        </button>
      </section>

      {/* ── 4. Grade result + action choice ─────────────────────────────── */}
      {result && gradeConfig && (
        <section ref={actionSectionRef} className="bg-white rounded border border-amz-border overflow-hidden scroll-mt-4">

          {/* Grade strip */}
          <div className={`${gradeConfig.bg} px-6 py-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-1">AI Grade</p>
                <div className="flex items-center gap-3">
                  <span className="text-white text-6xl font-black leading-none">{result.grade}</span>
                  <div>
                    <p className="text-white font-bold text-xl leading-tight">{gradeConfig.label}</p>
                    <p className="text-white/80 text-xs mt-0.5">{result.damage_detected}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-white text-4xl font-bold leading-none">{result.confidence}<span className="text-2xl font-semibold">%</span></p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <blockquote className="text-sm text-gray-600 italic border-l-4 border-gray-200 pl-4 py-0.5">
              {result.reason}
            </blockquote>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xl mb-0.5">🌿</p>
                <p className="text-lg font-bold text-green-700 leading-tight">{result.co2_saved_kg}<span className="text-sm font-semibold"> kg</span></p>
                <p className="text-xs text-gray-500 mt-0.5">CO₂ Saved</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-xl mb-0.5">🪙</p>
                <p className="text-lg font-bold text-yellow-700 leading-tight">{result.credits_earned}</p>
                <p className="text-xs text-gray-500 mt-0.5">Credits Earned</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl mb-0.5">💰</p>
                <p className="text-lg font-bold text-blue-700 leading-tight">₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-0.5">Est. Resale Value</p>
              </div>
            </div>

            {result.mock && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-xs">
                <span>⚠️</span>
                <span><strong>Demo mode</strong> — add AWS credentials for live AI grading & pricing</span>
              </div>
            )}

            {wallet && (
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="text-center"><p className="text-lg font-black text-green-700 leading-none">{wallet.total_credits}</p><p className="text-xs text-gray-500 mt-0.5">Total Credits</p></div>
                  <div className="w-px h-8 bg-green-200" />
                  <div className="text-center"><p className="text-lg font-black text-emerald-700 leading-none">{wallet.total_co2_saved_kg.toFixed(1)} kg</p><p className="text-xs text-gray-500 mt-0.5">CO₂ Saved</p></div>
                  <div className="w-px h-8 bg-green-200" />
                  <div className="text-center"><p className="text-lg font-black text-emerald-700 leading-none">{wallet.trees_equivalent.toFixed(2)}</p><p className="text-xs text-gray-500 mt-0.5">🌳 Trees</p></div>
                </div>
                <Link to="/wallet" className="text-xs font-semibold text-green-600 hover:text-green-700 whitespace-nowrap">View wallet →</Link>
              </div>
            )}

            {/* Action cards */}
            {!actionDone && (
              <div>
                <h3 className="text-sm font-bold text-amz-text mb-3">What would you like to do with this item?</h3>
                {(() => {
                  const aiRecommendsExchange = ['Doesn\'t fit / match', 'Wrong item sent', 'Better price found'].includes(returnReason)
                  const aiRecommendsResell   = result.grade === 'A' && !aiRecommendsExchange
                  return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {canResell && (
                    <button onClick={() => chooseAction('resell')}
                      className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${chosenAction === 'resell' ? 'border-amz-orange bg-orange-50' : aiRecommendsResell ? 'border-amz-orange bg-orange-50/30' : 'border-amz-border hover:border-amz-orange'}`}>
                      {aiRecommendsResell && (
                        <span className="absolute -top-2.5 left-3 text-[10px] font-bold bg-amz-orange text-white px-2 py-0.5 rounded-full shadow-sm">⭐ AI Recommends</span>
                      )}
                      <div className="flex items-center gap-2"><span className="text-2xl">🛍️</span><span className="text-sm font-bold text-amz-text">List on Marketplace</span></div>
                      <p className="text-xs text-gray-500 leading-snug">Sell directly to buyers, set your price, earn money back</p>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Earn ₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</span>
                    </button>
                  )}

                  <button onClick={() => chooseAction('exchange')}
                    className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${chosenAction === 'exchange' ? 'border-purple-500 bg-purple-50' : aiRecommendsExchange ? 'border-purple-400 bg-purple-50/30' : 'border-amz-border hover:border-purple-400'}`}>
                    {aiRecommendsExchange && (
                      <span className="absolute -top-2.5 left-3 text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-sm">⭐ AI Recommends</span>
                    )}
                    <div className="flex items-center gap-2"><span className="text-2xl">🔄</span><span className="text-sm font-bold text-amz-text">Exchange / Swap</span></div>
                    <p className="text-xs text-gray-500 leading-snug">Swap for a certified item — we offset the price difference</p>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Your value: ₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</span>
                  </button>

                  {result.grade !== 'Junk' && (
                    <button onClick={() => chooseAction('refurbish')}
                      className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${chosenAction === 'refurbish' ? 'border-blue-500 bg-blue-50' : 'border-amz-border hover:border-blue-400'}`}>
                      <div className="flex items-center gap-2"><span className="text-2xl">🔧</span><span className="text-sm font-bold text-amz-text">Refurbish & Sell</span></div>
                      <p className="text-xs text-gray-500 leading-snug">We professionally repair and list it — you earn credits + a cut</p>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{result.credits_earned} Credits + Revenue share</span>
                    </button>
                  )}

                  <button onClick={() => chooseAction('donate')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${chosenAction === 'donate' ? 'border-rose-500 bg-rose-50' : 'border-amz-border hover:border-rose-400'}`}>
                    <div className="flex items-center gap-2"><span className="text-2xl">❤️</span><span className="text-sm font-bold text-amz-text">Donate</span></div>
                    <p className="text-xs text-gray-500 leading-snug">Give it to an NGO or someone in need — we handle pickup</p>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">{result.credits_earned} Green Credits + Tax receipt</span>
                  </button>

                  <button onClick={() => chooseAction('recycle')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${chosenAction === 'recycle' ? 'border-gray-500 bg-gray-50' : 'border-amz-border hover:border-gray-400'}`}>
                    <div className="flex items-center gap-2"><span className="text-2xl">♻️</span><span className="text-sm font-bold text-amz-text">Recycle</span></div>
                    <p className="text-xs text-gray-500 leading-snug">E-waste / material recycling — zero landfill, maximum CO₂ credit</p>
                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{result.credits_earned} Credits · {result.co2_saved_kg} kg CO₂</span>
                  </button>

                </div>
                  )
                })()}
                <button onClick={reset} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ← Start over with a different item
                </button>
              </div>
            )}

            {/* ── Donate multi-step flow ─────────────────────────────── */}
            {chosenAction === 'donate' && donateStep >= 1 && !actionDone && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-4">
                {donateStep === 1 && (
                  <>
                    <p className="font-bold text-amz-text text-sm">❤️ Choose an NGO partner</p>
                    <p className="text-xs text-gray-500">We work with verified NGOs. Your item will be collected, inspected, and given to someone who truly needs it.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { name: 'GiveIndia', focus: 'Electronics & General', icon: '🤝', desc: 'India\'s largest giving platform — 300+ vetted causes' },
                        { name: 'Goonj', focus: 'Clothing & Household', icon: '👕', desc: 'Urban waste → rural resource. Award-winning NGO.' },
                        { name: 'SOS Children\'s Villages', focus: 'All categories', icon: '🏡', desc: 'Supporting 30,000+ children across India.' },
                        { name: 'iDream Education', focus: 'Electronics for learning', icon: '📚', desc: 'Turns your device into a learning tool for underprivileged students.' },
                      ].map(p => (
                        <button
                          key={p.name}
                          onClick={() => { setDonatePartner(p); setDonateStep(2) }}
                          className={`text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${donatePartner?.name === p.name ? 'border-rose-500 bg-white' : 'border-rose-100 bg-white hover:border-rose-300'}`}
                        >
                          <p className="text-lg mb-0.5">{p.icon}</p>
                          <p className="font-bold text-xs text-amz-text">{p.name}</p>
                          <p className="text-[10px] text-rose-600 font-medium">{p.focus}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {donateStep === 2 && donatePartner && (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDonateStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
                      <p className="font-bold text-amz-text text-sm">📅 Schedule pickup — {donatePartner.name}</p>
                    </div>
                    <p className="text-xs text-gray-500">A {donatePartner.name} partner will collect your {result?.product_name} from your address.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Tomorrow', 'In 2 days', 'This weekend'].map(d => (
                        <button
                          key={d}
                          onClick={() => setDonateDate(d)}
                          className={`py-2 px-2 rounded-lg border-2 text-xs font-semibold transition-all ${donateDate === d ? 'border-rose-500 bg-rose-100 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-rose-300'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    {donateDate && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.post('/api/v1/credits/earn', { product_name: result.product_name, grade: result.grade, action: 'donate', return_id: result.id })
                          } catch {}
                          setDonateStep(3)
                          setActionDone(true)
                        }}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                      >
                        Confirm Donation Pickup ({donateDate})
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Recycle multi-step flow ────────────────────────────── */}
            {chosenAction === 'recycle' && recycleStep >= 1 && !actionDone && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                {recycleStep === 1 && (
                  <>
                    <p className="font-bold text-amz-text text-sm">♻️ Certified E-Waste Recycling</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-700">Material breakdown of your {result?.product_name}:</p>
                      {[
                        ['Recoverable metals', 'Copper, gold, aluminium — resmelted', '35%'],
                        ['Plastics', 'Granulated and reused in manufacturing', '30%'],
                        ['Glass & ceramics', 'Crushed and reused', '20%'],
                        ['Circuit boards', 'Precious metal extraction', '15%'],
                      ].map(([mat, desc, pct]) => (
                        <div key={mat} className="flex items-center gap-2 text-[11px]">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 flex-shrink-0">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: pct }} />
                          </div>
                          <span className="font-medium text-gray-700">{mat}</span>
                          <span className="text-gray-400 hidden sm:inline">· {desc}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Choose a certified recycling partner:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { name: 'Attero Recycling', cert: 'CPCB certified', icon: '🏭', desc: 'India\'s largest e-waste recycler, 48 cities.' },
                        { name: 'EcoEx', cert: 'ISO 14001', icon: '♻️', desc: 'Consumer e-waste pickup with recycling certificate.' },
                        { name: 'Eco Birdd', cert: 'MoEFCC approved', icon: '🐦', desc: 'Doorstep pickup in 50+ cities, real-time tracking.' },
                        { name: 'NEPRA Resource', cert: 'State PCB certified', icon: '🌱', desc: 'Zero-landfill facility — all materials recovered.' },
                      ].map(p => (
                        <button
                          key={p.name}
                          onClick={() => { setRecyclePartner(p); setRecycleStep(2) }}
                          className={`text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${recyclePartner?.name === p.name ? 'border-gray-500 bg-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                        >
                          <p className="text-lg mb-0.5">{p.icon}</p>
                          <p className="font-bold text-xs text-amz-text">{p.name}</p>
                          <p className="text-[10px] text-green-700 font-medium">{p.cert}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {recycleStep === 2 && recyclePartner && (
                  <>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRecycleStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
                      <p className="font-bold text-amz-text text-sm">📅 Schedule pickup — {recyclePartner.name}</p>
                    </div>
                    <p className="text-xs text-gray-500">{recyclePartner.cert} · Doorstep collection, zero landfill guaranteed.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Tomorrow', 'In 2 days', 'This weekend'].map(d => (
                        <button
                          key={d}
                          onClick={() => setRecycleDate(d)}
                          className={`py-2 px-2 rounded-lg border-2 text-xs font-semibold transition-all ${recycleDate === d ? 'border-gray-600 bg-gray-200 text-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    {recycleDate && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.post('/api/v1/credits/earn', { product_name: result.product_name, grade: result.grade, action: 'recycle', return_id: result.id })
                          } catch {}
                          setRecycleStep(3)
                          setActionDone(true)
                        }}
                        className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                      >
                        Confirm Recycling Pickup ({recycleDate})
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Donate / Recycle confirmed */}
            {actionDone && (chosenAction === 'donate' || chosenAction === 'recycle') && (
              <div className={`rounded-xl p-4 border ${chosenAction === 'donate' ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-bold text-amz-text text-sm mb-1">
                  {chosenAction === 'donate' ? '❤️ Donation confirmed!' : '♻️ Recycling booked!'}
                </p>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                  {chosenAction === 'donate'
                    ? `${donatePartner?.name} will collect your ${result.product_name} ${donateDate?.toLowerCase()}. A tax exemption receipt (80G) will be emailed within 3 business days.`
                    : `${recyclePartner?.name} will collect your ${result.product_name} ${recycleDate?.toLowerCase()}. Your recycling certificate will be emailed once processing is complete.`
                  }
                </p>
                <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 space-y-1 mb-3">
                  <p>📍 Reference: <span className="font-mono font-bold text-amz-text">{chosenAction === 'donate' ? 'DON' : 'RCY'}-{Math.random().toString(36).slice(2,8).toUpperCase()}</span></p>
                  {chosenAction === 'donate'
                    ? <p>🧾 80G tax exemption receipt · Estimated 3 business days</p>
                    : <p>📜 Recycling certificate · Zero landfill guaranteed</p>
                  }
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-full font-medium">🪙 {result.credits_earned} credits added</span>
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-full font-medium">🌿 {result.co2_saved_kg} kg CO₂ saved</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link to="/wallet" className="text-xs font-semibold text-amz-teal hover:underline">View wallet →</Link>
                  <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 ml-3">Start another return</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 5. Listing detail form (Resell / Refurbish) ──────────────────── */}
      {result && (chosenAction === 'resell' || chosenAction === 'refurbish') && !listDone && (
        <section className="bg-white rounded border border-amz-border p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-amz-border pb-3">
            <span className="text-xl">{chosenAction === 'resell' ? '🛍️' : '🔧'}</span>
            <div>
              <h2 className="text-base font-bold text-amz-text">
                {chosenAction === 'resell' ? 'Create Marketplace Listing' : 'Submit for Refurbishment & Sale'}
              </h2>
              <p className="text-xs text-gray-500">Pre-filled from the AI grade — edit anything you like</p>
            </div>
          </div>

          {/* Preview of uploaded photos in the listing form */}
          {previews.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              {(() => {
                const imgC = files.filter(f => f.type.startsWith('image/')).length
                const vidC = files.filter(f => f.type.startsWith('video/')).length
                const parts = []
                if (imgC) parts.push(`${imgC} photo${imgC !== 1 ? 's' : ''}`)
                if (vidC) parts.push(`${vidC} video${vidC !== 1 ? 's' : ''}`)
                return (
                  <>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Listing media ({parts.join(', ')})
                      <span className="text-gray-400 font-normal ml-1">— first item is the main listing thumbnail</span>
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {previews.map((src, i) => {
                        const isVid = files[i]?.type.startsWith('video/')
                        return (
                          <div key={i} className="relative flex-shrink-0">
                            {isVid ? (
                              <video
                                src={src}
                                muted
                                loop
                                playsInline
                                autoPlay
                                className={`w-20 h-20 object-cover rounded-lg border-2 ${i === 0 ? 'border-amz-orange' : 'border-gray-200'}`}
                              />
                            ) : (
                              <img
                                src={src}
                                alt={`Photo ${i + 1}`}
                                className={`w-20 h-20 object-cover rounded-lg border-2 ${i === 0 ? 'border-amz-orange' : 'border-gray-200'}`}
                              />
                            )}
                            {i === 0 && (
                              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-amz-orange text-white px-1 py-0.5 rounded-full shadow leading-tight">
                                {isVid ? '🎥' : '★'}
                              </span>
                            )}
                            {isVid && i !== 0 && (
                              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-blue-600 text-white px-1 py-0.5 rounded-full shadow leading-tight">🎥</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      ✓ {parts.join(', ')} attached to listing
                    </span>
                  </>
                )
              })()}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Listing Title <span className="text-gray-400 font-normal">(max 80 chars)</span>
            </label>
            <input
              type="text"
              maxLength={80}
              value={listTitle}
              onChange={e => setListTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange"
            />
            <p className="text-[10px] text-gray-400 mt-1">{listTitle.length}/80</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={listCategory}
              onChange={e => setListCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange bg-white"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(tell buyers what's great and what's not)</span>
            </label>
            <textarea
              rows={3}
              value={listDesc}
              onChange={e => setListDesc(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange resize-none"
            />
          </div>

          {/* Dynamic highlights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Key Highlights <span className="text-gray-400 font-normal">({highlights.length} bullet{highlights.length !== 1 ? 's' : ''})</span>
              </label>
              <button
                type="button"
                onClick={addHighlight}
                disabled={highlights.length >= 10}
                className="flex items-center gap-1 text-xs font-semibold text-amz-teal hover:text-[#005f6b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-base leading-none">+</span> Add Highlight
              </button>
            </div>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-amz-orange font-bold text-sm w-4 flex-shrink-0">›</span>
                  <input
                    type="text"
                    value={h}
                    onChange={e => updateHighlight(i, e.target.value)}
                    placeholder={i < 3 ? `Highlight ${i + 1} (required)` : `Highlight ${i + 1} (optional)`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange"
                  />
                  {highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 text-base leading-none"
                      title="Remove this highlight"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">First 3 are required · up to 10 total</p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Asking Price (₹)</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min={1}
                  value={listPrice}
                  onChange={e => setListPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange"
                />
              </div>
              <div className="text-xs text-gray-500 flex flex-col gap-0.5 flex-shrink-0">
                {urlProduct?.market_price_inr ? (
                  <>
                    <span className="text-gray-400 line-through">Amazon: ₹{urlProduct.market_price_inr.toLocaleString('en-IN')}</span>
                    <span className="text-amz-teal font-medium">Suggested: ₹{listPrice ? parseInt(listPrice).toLocaleString('en-IN') : '—'}</span>
                  </>
                ) : (
                  <span className="text-amz-teal font-medium">AI suggested: ₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</span>
                )}
                <span className="text-gray-400">Adjust to your preference</span>
              </div>
            </div>
          </div>

          {/* Pickup address */}
          <div className="border border-dashed border-amz-border rounded-xl p-4 space-y-3 bg-orange-50/40">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">📍</span>
              <h3 className="text-sm font-bold text-gray-800">Pickup Address</h3>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">Required</span>
            </div>
            <p className="text-xs text-gray-500 -mt-1">An Amazon agent will collect the item from this address when someone buys it</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input type="text" value={pickupAddr.name} onChange={e => setAddr('name', e.target.value)}
                  placeholder="Adrika Sarawat"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                <input type="tel" value={pickupAddr.phone} onChange={e => setAddr('phone', e.target.value)}
                  placeholder="+91 99887 76655"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line *</label>
              <input type="text" value={pickupAddr.line1} onChange={e => setAddr('line1', e.target.value)}
                placeholder="House / Flat No., Street, Locality"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                <input type="text" value={pickupAddr.city} onChange={e => setAddr('city', e.target.value)}
                  placeholder="Jaipur"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                <input type="text" value={pickupAddr.state} onChange={e => setAddr('state', e.target.value)}
                  placeholder="Rajasthan"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pincode *</label>
                <input type="text" maxLength={6} value={pickupAddr.pincode} onChange={e => setAddr('pincode', e.target.value)}
                  placeholder="302001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange" />
              </div>
            </div>
          </div>

          {listError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <span>⚠️</span> {listError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={submitListing}
              disabled={listLoading || !listTitle || !highlights[0]?.trim()}
              className="flex-1 bg-amz-yellow text-amz-text border border-[#FFA41C] py-3 rounded-full font-bold text-sm hover:bg-amz-yellow-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {listLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Publishing…</>
              ) : '✅ Publish Listing'}
            </button>
            <button onClick={reset} className="px-4 py-3 rounded-full text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* ── 6. Exchange / Swap panel ────────────────────────────────────── */}
      {result && chosenAction === 'exchange' && !swapDone && (
        <section className="bg-white rounded border border-amz-border p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-amz-border pb-3">
            <span className="text-xl">🔄</span>
            <div>
              <h2 className="text-base font-bold text-amz-text">Exchange / Swap</h2>
              <p className="text-xs text-gray-500">Pick a certified item — we'll credit your return value toward it</p>
            </div>
          </div>

          {/* Your item */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-0.5">Your return</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">{result.product_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Grade {result.grade} · Est. ₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</p>
            </div>
            <span className="text-2xl text-purple-300">→</span>
          </div>

          {swapLoading ? (
            <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">Finding matching items…</span>
            </div>
          ) : swapSuggestions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm font-medium text-gray-600">No matching items found right now</p>
              <p className="text-xs mt-1">Check back later or browse the full marketplace</p>
              <Link to="/marketplace" className="mt-3 inline-block text-xs font-semibold text-amz-teal hover:underline">Browse Marketplace →</Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">{swapSuggestions.length} certified items found — sorted by price match</p>
              <div className="space-y-2">
                {swapSuggestions.map(item => {
                  const diff = item.suggested_price_inr - result.estimated_resale_value_inr
                  const selected = swapPick?.id === item.id
                  return (
                    <button key={item.id} onClick={() => setSwapPick(selected ? null : item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center text-2xl border border-gray-200">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">Grade {item.grade}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs font-semibold text-gray-700">₹{item.suggested_price_inr.toLocaleString('en-IN')}</span>
                        </div>
                        <p className={`text-xs font-semibold mt-0.5 ${diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-green-600' : 'text-purple-600'}`}>
                          {diff > 0 ? `Pay ₹${diff.toLocaleString('en-IN')} extra` : diff < 0 ? `Get ₹${Math.abs(diff).toLocaleString('en-IN')} credit back` : 'Even swap — no payment needed!'}
                        </p>
                      </div>
                      {selected && <span className="text-purple-500 text-xl flex-shrink-0">✓</span>}
                    </button>
                  )
                })}
              </div>

              {swapPick && (
                <div className="border-t border-amz-border pt-4 space-y-3">
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Swap Summary</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your item value</span>
                      <span className="font-semibold text-gray-800">₹{result.estimated_resale_value_inr.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[180px]">{swapPick.product_name}</span>
                      <span className="font-semibold text-gray-800 flex-shrink-0 ml-2">₹{swapPick.suggested_price_inr.toLocaleString('en-IN')}</span>
                    </div>
                    {(() => {
                      const diff = swapPick.suggested_price_inr - result.estimated_resale_value_inr
                      return diff !== 0 && (
                        <div className="border-t border-purple-200 pt-2 flex items-center justify-between text-sm">
                          <span className="font-bold text-purple-800">{diff > 0 ? 'You pay' : 'You receive'}</span>
                          <span className={`font-black text-lg ${diff > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            ₹{Math.abs(diff).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )
                    })()}
                    {swapPick.suggested_price_inr === result.estimated_resale_value_inr && (
                      <div className="border-t border-purple-200 pt-2 text-center text-xs font-bold text-purple-700">🎉 Even swap — no payment needed!</div>
                    )}
                  </div>
                  <button onClick={confirmSwap}
                    className="w-full bg-purple-600 text-white py-3 rounded-full font-bold text-sm hover:bg-purple-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    🔄 Confirm Swap
                  </button>
                  <button onClick={() => setSwapPick(null)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
                    Choose a different item
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── 6b. Swap success ─────────────────────────────────────────────── */}
      {result && chosenAction === 'exchange' && swapDone && swapPick && (
        <section className="bg-white rounded border border-purple-200 p-5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-amz-text mb-1">Swap confirmed!</h2>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Your <strong>{result.product_name}</strong> will be picked up and you'll receive{' '}
                <strong>{swapPick.product_name}</strong> within 3–5 business days.
                {swapPick.suggested_price_inr !== result.estimated_resale_value_inr && (
                  <> The ₹{Math.abs(swapPick.suggested_price_inr - result.estimated_resale_value_inr).toLocaleString('en-IN')}{' '}
                  {swapPick.suggested_price_inr > result.estimated_resale_value_inr ? 'top-up' : 'refund'} will be processed to your payment method.</>
                )}
              </p>
              <div className="flex items-center gap-3 text-xs mb-4 flex-wrap">
                <span className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full font-medium">🔄 Swap initiated</span>
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">🪙 {result.credits_earned} credits earned</span>
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">🌿 {result.co2_saved_kg} kg CO₂ saved</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link to="/marketplace" className="bg-amz-yellow text-amz-text border border-[#FFA41C] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-amz-yellow-hover transition-colors">
                  Browse More Items →
                </Link>
                <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
                  Return another item
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Listing success ───────────────────────────────────────────── */}
      {listDone && (
        <section className="bg-white rounded border border-green-200 p-5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-amz-text mb-1">Your listing is live!</h2>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                <strong>{listTitle}</strong> is now visible to buyers on the Second Life Marketplace.
                You'll be notified when someone places an order.
              </p>
              <div className="flex items-center gap-3 text-xs mb-4">
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">🪙 {result.credits_earned} credits earned</span>
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-medium">🌿 {result.co2_saved_kg} kg CO₂ saved</span>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/marketplace"
                  className="bg-amz-yellow text-amz-text border border-[#FFA41C] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-amz-yellow-hover transition-colors"
                >
                  View in Marketplace →
                </Link>
                <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
                  Return another item
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
