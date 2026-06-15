import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const BADGE = {
  fix:           { cls: 'bg-blue-100 text-blue-700',   label: '💡 Quick fix' },
  part:          { cls: 'bg-purple-100 text-purple-700', label: '🔧 Spare part' },
  resale:        { cls: 'bg-green-100 text-green-700',  label: '💰 Earn money back' },
  accept_return: { cls: 'bg-gray-100 text-gray-500',    label: '✓ Return approved' },
}

const QUICK_REPLIES = [
  "I don't need it anymore",
  "Wrong size",
  "Bought by mistake",
  "It's not working",
  "Battery drains fast",
  "Found it cheaper",
  "Poor quality",
  "It's a gift issue",
]

function makeOpeningMessage(productName) {
  return {
    role: 'bot',
    content: `Hi! Before we process your return, can you tell me what's wrong with your ${productName}? I might be able to help fix it quickly.`,
    offer_type: null,
  }
}

export default function DeflectBot({ productName, onProceedToUpload }) {
  const [messages, setMessages]     = useState(() => [makeOpeningMessage(productName)])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [issue, setIssue]           = useState('')   // original issue; set on first send
  const [latestBot, setLatestBot]   = useState(null)

  const chatRef    = useRef(null)
  const inputRef   = useRef(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when component mounts
  useEffect(() => { inputRef.current?.focus() }, [])

  // Count how many real bot replies we've shown (excluding the greeting)
  const botReplyCount = messages.filter(m => m.role === 'bot' && m.offer_type !== null).length
  const isAccepted    = latestBot?.offer_type === 'accept_return'
  const showStillReturn = !isAccepted && botReplyCount >= 2

  const sendText = async (text) => {
    if (!text || loading || isAccepted) return

    const isFirstSend = !issue
    const currentIssue = isFirstSend ? text : issue

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    let history = []
    if (!isFirstSend) {
      const subsequent = messages.slice(2)
      history = subsequent.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }))
      history.push({ role: 'user', content: text })
    }

    try {
      const { data } = await axios.post('/api/v1/deflect/chat', {
        product_name: productName || 'the product',
        issue: currentIssue,
        history,
      })

      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: data.message,
          offer_type: data.offer_type,
          mock: data.mock,
        },
      ])
      setLatestBot(data)
      if (isFirstSend) setIssue(text)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: 'Sorry, I ran into an issue. Go ahead and proceed with your return.',
          offer_type: 'accept_return',
        },
      ])
      setLatestBot({ offer_type: 'accept_return' })
    } finally {
      setLoading(false)
    }
  }

  const send = () => sendText(input.trim())

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center text-lg select-none">
          🤖
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 leading-tight">Return Assistant</p>
          <p className="text-xs text-green-600 leading-tight">Online — here to help</p>
        </div>
      </div>

      {/* Chat bubbles */}
      <div
        ref={chatRef}
        className="px-4 py-4 space-y-3 overflow-y-auto"
        style={{ maxHeight: '400px' }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar — only for bot */}
            {msg.role === 'bot' && (
              <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-0.5 select-none">
                🤖
              </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amz-dark text-white rounded-lg rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Offer badge */}
              {msg.offer_type && BADGE[msg.offer_type] && (
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${BADGE[msg.offer_type].cls}`}
                >
                  {BADGE[msg.offer_type].label}
                </span>
              )}

              {/* Demo notice on bot messages */}
              {msg.mock && (
                <span className="text-xs text-amber-500 pl-1">⚠️ Demo mode</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 select-none">
              🤖
            </div>
            <div className="bg-gray-100 rounded-lg rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proceed / Still-return CTA buttons */}
      {(isAccepted || showStillReturn) && (
        <div className="px-4 pb-2">
          {isAccepted ? (
            <button
              onClick={onProceedToUpload}
              className="w-full bg-amz-yellow text-amz-text py-2.5 rounded font-bold border border-[#FFA41C] text-sm font-semibold hover:bg-amz-yellow-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              📸 Proceed to upload &amp; grade →
            </button>
          ) : (
            <button
              onClick={onProceedToUpload}
              className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-[0.99] transition-all"
            >
              I'd still like to return it →
            </button>
          )}
        </div>
      )}

      {/* Quick-reply chips — shown only before first send */}
      {!issue && !isAccepted && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {QUICK_REPLIES.map(qr => (
            <button
              key={qr}
              onClick={() => sendText(qr)}
              disabled={loading}
              className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-amz-yellow hover:border-[#FFA41C] hover:text-amz-text transition-all disabled:opacity-40"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={issue ? 'Reply…' : 'Or describe the problem in your own words…'}
          disabled={loading || isAccepted}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim() || isAccepted}
          className="bg-amz-yellow text-amz-text px-4 py-2 rounded font-bold border border-[#FFA41C] text-sm font-semibold hover:bg-amz-yellow-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
