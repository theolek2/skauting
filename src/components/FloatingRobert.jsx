import { useState, useRef, useEffect } from 'react'

export default function FloatingRobert({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! Jestem Robert. O co chcesz zapytać?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    setInput('')
    setError('')
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/robert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd serwera')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        links: data.links || [],
      }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Przycisk */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 w-14 h-14 bg-green-700 text-white rounded-full shadow-xl hover:bg-green-800 hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-[5000]"
          title="Robert — asystent skautowy"
        >
          <span className="text-2xl font-bold">R</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Okno czatu */}
      {open && (
        <div className="fixed bottom-5 right-5 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[5000] overflow-hidden">
          {/* Nagłówek */}
          <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">R</div>
              <div>
                <div className="font-semibold text-sm">Robert</div>
                <div className="text-green-300 text-[10px]">Asystent skautowy</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white text-lg leading-none transition">
              ×
            </button>
          </div>

          {/* Wiadomości */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.map((msg, i) => {
              const isRobert = msg.role === 'assistant'
              return (
                <div key={i} className={`flex gap-2 ${isRobert ? '' : 'flex-row-reverse'}`}>
                  {isRobert && (
                    <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">R</div>
                  )}
                  <div>
                    <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[260px] ${
                      isRobert
                        ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-green-700 text-white rounded-tr-sm'
                    }`}>
                      {msg.content.split('\n').map((line, j) => (
                        <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br/>}</span>
                      ))}
                    </div>
                    {/* Linki */}
                    {isRobert && msg.links?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {msg.links.slice(0, 3).map((link, k) => (
                          <button key={k}
                            onClick={() => onNavigate?.(link.tab)}
                            className="text-[10px] bg-green-50 border border-green-200 text-green-700 rounded-md px-2 py-0.5 hover:bg-green-100 transition flex items-center gap-0.5">
                            <span>📄</span>
                            <span className="truncate max-w-[120px]">{link.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">R</div>
                <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Błąd */}
          {error && (
            <div className="mx-3 mb-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-[10px] text-red-600">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-2.5 shrink-0">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Zapytaj Roberta..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-400"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="bg-green-700 text-white rounded-lg px-3 py-2 font-bold text-xs hover:bg-green-800 disabled:opacity-40 transition shrink-0">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
