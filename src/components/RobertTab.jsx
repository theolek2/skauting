import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'Co muszę zrobić żeby zorganizować obóz?',
  'Jakie dokumenty wysłać do PSP?',
  'Ile czasu przed obozem wysłać dokumenty do kuratorium?',
  'Podaj treść Prawa Harcerskiego',
  'Jakie są zasady bezpieczeństwa przeciwpożarowego?',
  'Co powinien zawierać regulamin obozu?',
]

function Message({ msg }) {
  const isRobert = msg.role === 'assistant'
  return (
    <div className={`flex gap-3 ${isRobert ? '' : 'flex-row-reverse'}`}>
      {isRobert && (
        <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">R</div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isRobert
          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          : 'bg-green-700 text-white rounded-tr-sm'
      }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br/>}</span>
        ))}
      </div>
    </div>
  )
}

export default function RobertTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! Jestem Robert — Twój asystent skautowy. Mogę pomóc z organizacją obozu, dokumentami, przepisami ppoż. i prawem harcerskim. O co chcesz zapytać?' }
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
          history: newMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd serwera')
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Nagłówek */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-lg">R</div>
          <div>
            <h2 className="font-bold text-gray-800">Robert</h2>
            <p className="text-xs text-gray-500">Asystent skautowy · Skauci Europy</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">online</span>
          </div>
        </div>
      </div>

      {/* Historia czatu */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">R</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}

        {/* Sugestie — tylko gdy brak historii */}
        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-gray-400 text-center">Przykładowe pytania:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Błąd */}
      {error && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Napisz pytanie do Roberta… (Enter = wyślij)"
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="bg-green-700 text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-green-800 disabled:opacity-40 transition shrink-0">
            ➤
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Powered by DeepSeek · baza wiedzy Skautów Europy
        </p>
      </div>
    </div>
  )
}
