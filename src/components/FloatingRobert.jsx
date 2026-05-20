import { useState, useRef, useEffect } from 'react'

const BASE = '/filmiki'

const IDLE_GIFS = [
  'A_cheerful_boy_scout_sitting_by_a_campfire_ro.gif',
  'A_cheerful_boy_scout_sitting_by_a_campfire_ty.gif',
  'Harcerz_siedzcy_przy_ognisku_cieszy_si_i_bi.gif',
  'The_boy_scout_from_the_original_video_stands.gif',
  'The_boy_scout_from_the_reference_images_unfol.gif',
  'The_boy_scout_looks_directly_at_the_camera_wi.gif',
  'The_boy_scout_pulls_out_a_pair_of_binoculars.gif',
  'The_boy_scout_takes_a_refreshing_sip_from_an.gif',
  'Masz_grafike_to_ma_byc_pierwsza_i_ostatnia_kl.gif',
]

const THINK_GIFS = ['think.gif', 'lupa.gif']

const ENTER_GIF = 'wbieg.gif'
const EXIT_GIF  = 'wybieg.gif'

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const TIMING = { enter: 1400, exit: 1400 }

export default function FloatingRobert({ onNavigate }) {
  const [phase, setPhase] = useState('idle')
  const [idleGif, setIdleGif] = useState(() => pick(IDLE_GIFS))
  const [thinkGif, setThinkGif] = useState(() => pick(THINK_GIFS))
  const [visible, setVisible] = useState(true)
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

  useEffect(() => () => {}, [])

  const handleOpen = () => {
    if (phase !== 'idle') return
    setVisible(false)
    setTimeout(() => { setPhase('entering'); setVisible(true) }, 200)
    setTimeout(() => {
      setPhase('open')
      setTimeout(() => inputRef.current?.focus(), 200)
    }, TIMING.enter + 200)
  }

  const handleClose = () => {
    if (phase !== 'open' && phase !== 'thinking') return
    setVisible(false)
    setTimeout(() => { setPhase('exiting'); setVisible(true) }, 200)
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setPhase('idle')
        setIdleGif(pick(IDLE_GIFS))
        setVisible(true)
      }, 250)
    }, TIMING.exit + 200)
  }

  const send = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    setInput('')
    setError('')
    const newMessages = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)
    setThinkGif(pick(THINK_GIFS))
    setVisible(false)
    setTimeout(() => { setPhase('thinking'); setVisible(true) }, 200)
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
      if (!res.ok) throw new Error(data.error || 'Błąd')
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
      setVisible(false)
      setTimeout(() => { setPhase('open'); setVisible(true) }, 200)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const showEnterExit = phase === 'entering' || phase === 'exiting'
  const showButton     = phase === 'idle'
  const showChat       = phase === 'open' || phase === 'thinking'

  return (
    <>
      {showButton && (
        <div
          onClick={handleOpen}
          className={`fixed bottom-5 right-5 z-[9999] cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
          title="Robert — asystent skautowy"
        >
          <img
            src={`${BASE}/${idleGif}`}
            alt="Robert"
            className="w-28 h-28 object-cover rounded-full shadow-xl border-3 border-green-700"
          />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
        </div>
      )}

      {showEnterExit && (
        <div className={`fixed bottom-5 right-5 z-[9999] pointer-events-none transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src={`${BASE}/${phase === 'entering' ? ENTER_GIF : EXIT_GIF}`}
            alt={phase === 'entering' ? 'Robert wbiega' : 'Robert wybiega'}
            className="w-28 h-28 object-cover rounded-full shadow-xl border-2 border-green-700"
          />
        </div>
      )}

      {showChat && (
        <div className={`fixed bottom-5 right-5 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[9999] overflow-hidden transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-green-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src={`${BASE}/${loading ? thinkGif : idleGif}`}
                alt="Robert"
                className="w-11 h-11 rounded-full object-cover border-2 border-white/30"
              />
              <div>
                <div className="font-semibold text-sm">Robert</div>
                <div className="text-green-300 text-[10px]">
                  {loading ? 'Analizuje...' : 'Asystent skautowy'}
                </div>
              </div>
            </div>
            <button onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white text-lg leading-none transition">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.map((msg, i) => {
              const isRobert = msg.role === 'assistant'
              return (
                <div key={i} className={`flex gap-2 ${isRobert ? '' : 'flex-row-reverse'}`}>
                  {isRobert && (
                    <img
                      src={`${BASE}/${idleGif}`}
                      alt="R"
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-green-300"
                    />
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
                <img
                  src={`${BASE}/${thinkGif}`}
                  alt="Myśli..."
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-green-300"
                />
                <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3 py-2">
                  <span className="text-xs text-gray-400 italic">Robert analizuje...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-3 mb-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-[10px] text-red-600">
              {error}
            </div>
          )}

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
