import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const LANGUAGES = [
  { code: 'hinglish', label: 'Hinglish', flag: '🇮🇳', placeholder: 'ReturnBot se kuch bhi pucho…' },
  { code: 'hindi',    label: 'हिंदी',    flag: '🇮🇳', placeholder: 'ReturnBot से कुछ भी पूछें…' },
  { code: 'english',  label: 'English',  flag: '🇬🇧', placeholder: 'Ask ReturnBot anything…' },
  { code: 'french',   label: 'Français', flag: '🇫🇷', placeholder: 'Posez une question à ReturnBot…' },
  { code: 'german',   label: 'Deutsch',  flag: '🇩🇪', placeholder: 'Frag ReturnBot etwas…' },
  { code: 'spanish',  label: 'Español',  flag: '🇪🇸', placeholder: 'Pregúntale algo a ReturnBot…' },
]

const GREET = {
  hinglish: "Haan bhai! Main hoon **ReturnBot** 👋 — Second Life Commerce ka assistant. Returns, grading, pricing ya marketplace ke baare mein kuch bhi pucho!",
  hindi:    "नमस्ते! मैं हूँ **ReturnBot** 👋 — Second Life Commerce का सहायक। रिटर्न, ग्रेडिंग, कीमत या मार्केटप्लेस के बारे में कुछ भी पूछें!",
  english:  "Hi! I'm **ReturnBot** 👋 — your Second Life Commerce assistant. Ask me anything about returns, grading, pricing, or the marketplace!",
  french:   "Bonjour! Je suis **ReturnBot** 👋 — votre assistant Second Life Commerce. Posez-moi des questions sur les retours, la notation, les prix ou la marketplace!",
  german:   "Hallo! Ich bin **ReturnBot** 👋 — Ihr Second Life Commerce Assistent. Fragen Sie mich alles über Rückgaben, Bewertungen, Preise oder den Marktplatz!",
  spanish:  "¡Hola! Soy **ReturnBot** 👋 — tu asistente de Second Life Commerce. ¡Pregúntame sobre devoluciones, calificaciones, precios o el marketplace!",
}

const SUGGESTED = {
  hinglish: [
    'Product kaise return karun? 📦',
    'Grading mein kitna time lagta hai?',
    'Grade A vs Grade B kya hota hai?',
    'Swap/Exchange kaise kaam karta hai?',
    'Wallet credits kaise milte hain?',
  ],
  hindi: [
    'प्रोडक्ट कैसे रिटर्न करूँ? 📦',
    'ग्रेडिंग में कितना समय लगता है?',
    'Grade A और Grade B में क्या फर्क है?',
    'स्वैप/एक्सचेंज कैसे काम करता है?',
    'वॉलेट क्रेडिट कैसे मिलते हैं?',
  ],
  english: [
    'How do I return a product? 📦',
    'How long does grading take?',
    'What is Grade A vs Grade B?',
    'How does the swap/exchange work?',
    'How do I earn wallet credits?',
  ],
  french: [
    'Comment retourner un produit? 📦',
    'Combien de temps prend la notation?',
    'Quelle est la différence Grade A vs B?',
    'Comment fonctionne l\'échange?',
    'Comment gagner des crédits wallet?',
  ],
  german: [
    'Wie gebe ich ein Produkt zurück? 📦',
    'Wie lange dauert die Bewertung?',
    'Was ist der Unterschied Grade A vs B?',
    'Wie funktioniert der Tausch?',
    'Wie verdiene ich Wallet-Guthaben?',
  ],
  spanish: [
    '¿Cómo devuelvo un producto? 📦',
    '¿Cuánto tarda la calificación?',
    '¿Cuál es la diferencia Grade A vs B?',
    '¿Cómo funciona el intercambio?',
    '¿Cómo gano créditos de cartera?',
  ],
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [langCode, setLangCode] = useState('hinglish')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREET['hinglish'] }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggested, setShowSuggested] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const lang = LANGUAGES.find((l) => l.code === langCode)

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const switchLang = (code) => {
    setLangCode(code)
    setShowLangPicker(false)
    setMessages([{ role: 'assistant', content: GREET[code] }])
    setShowSuggested(true)
    setInput('')
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowSuggested(false)

    const userMsg = { role: 'user', content: msg }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const history = next.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
      const { data } = await axios.post('/api/v1/chat/message', {
        message: msg,
        history,
        language: langCode,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: GREET[langCode].includes('नमस्ते') ? 'माफ करें, कोई समस्या आई। फिर से कोशिश करें!' : 'Sorry, something went wrong. Please try again!' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const renderContent = (text) => {
    return text.split('\n').map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          {i < arr.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #232f3e 0%, #ff9900 100%)' }}
        aria-label="Open chat"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ maxHeight: '560px', background: '#fff' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #232f3e 0%, #37475a 100%)' }}>
            <div className="w-9 h-9 rounded-full bg-amz-orange flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              R
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">ReturnBot</p>
              <p className="text-green-400 text-xs">● Online · AI Assistant</p>
            </div>
            {/* Language button */}
            <button
              onClick={() => setShowLangPicker((v) => !v)}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-2 py-1 text-white text-xs font-medium"
              title="Change language"
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="hidden sm:inline">{lang.label}</span>
              <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors ml-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Language picker dropdown */}
          {showLangPicker && (
            <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 font-medium">Choose language</p>
              <div className="grid grid-cols-3 gap-1.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLang(l.code)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      langCode === l.code
                        ? 'bg-amz-orange text-white border-amz-orange shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-amz-orange hover:text-amz-orange'
                    }`}
                  >
                    <span className="text-sm leading-none">{l.flag}</span>
                    <span className="truncate">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-amz-orange flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0 mt-0.5">
                    R
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amz-orange text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                }`}>
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-amz-orange flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0">
                  R
                </div>
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggested && messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-gray-400 pl-9">
                  {langCode === 'hindi' ? 'सुझाए गए प्रश्न' :
                   langCode === 'french' ? 'Questions suggérées' :
                   langCode === 'german' ? 'Vorgeschlagene Fragen' :
                   langCode === 'spanish' ? 'Preguntas sugeridas' :
                   'Suggested questions'}
                </p>
                {SUGGESTED[langCode].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="w-full text-left text-xs bg-white border border-gray-200 hover:border-amz-orange hover:text-amz-orange px-3 py-2 rounded-xl transition-colors ml-9"
                    style={{ maxWidth: 'calc(100% - 2.25rem)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={lang.placeholder}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amz-orange"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: '#ff9900' }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
