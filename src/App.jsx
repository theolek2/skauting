import { useState, useEffect } from 'react'
import ActivityPanel from './components/ActivityPanel'
import DayCard from './components/DayCard'
import { FIXED_ACTIVITIES, makeDay, makeSlot } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'

const DEFAULT_STATE = {
  meta: { jednostka: '', kierownik: '', miejsce: '', termin: '' },
  activities: [],
  days: [],
}

export default function App() {
  const [state, setState] = useState(() => loadState() || DEFAULT_STATE)
  const [daysCount, setDaysCount] = useState('')
  const [showMeta, setShowMeta] = useState(false)

  const { meta, activities, days } = state

  useEffect(() => { saveState(state) }, [state])

  const update = (patch) => setState(s => ({ ...s, ...patch }))
  const updateMeta = (patch) => update({ meta: { ...meta, ...patch } })

  // ── Zajęcia ──────────────────────────────────────────────────────────────
  const addActivity = (name, description) => {
    const a = { id: `a_${Date.now()}`, name, description }
    update({ activities: [...activities, a] })
  }
  const editActivity = (id, name, description) => {
    update({ activities: activities.map(a => a.id === id ? { ...a, name, description } : a) })
  }
  const deleteActivity = (id) => {
    update({ activities: activities.filter(a => a.id !== id) })
  }

  // ── Dni ──────────────────────────────────────────────────────────────────
  const setDays = (n) => {
    const count = Math.max(1, Math.min(30, parseInt(n) || 0))
    if (!count) return
    const newDays = Array.from({ length: count }, (_, i) => days[i] || makeDay(i))
    update({ days: newDays })
    setDaysCount('')
  }
  const updateDay = (id, updated) => {
    update({ days: days.map(d => d.id === id ? updated : d) })
  }
  const deleteDay = (id) => {
    update({ days: days.filter(d => d.id !== id) })
  }
  const addDay = () => {
    update({ days: [...days, makeDay(days.length)] })
  }

  const handleExport = () => {
    if (!meta.jednostka || !meta.kierownik) {
      setShowMeta(true)
      alert('Uzupełnij dane na stronę tytułową (Jednostka i Kierownik).')
      return
    }
    generatePdf({ meta, activities, days })
  }

  const allFilled = meta.jednostka && meta.kierownik

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛺</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Książka Obozowa</h1>
            <p className="text-green-300 text-xs">Ramowy plan pracy</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowMeta(m => !m)}
            className={`text-sm px-4 py-1.5 rounded border transition ${allFilled
              ? 'border-green-400 text-green-200 hover:bg-green-700'
              : 'border-yellow-400 text-yellow-300 hover:bg-green-700 animate-pulse'
            }`}
          >
            {allFilled ? '✅ Strona tytułowa' : '⚠️ Uzupełnij dane'}
          </button>
          <button
            onClick={handleExport}
            className="bg-white text-green-800 text-sm font-bold px-5 py-1.5 rounded hover:bg-green-50 transition"
          >
            📄 Eksportuj PDF
          </button>
        </div>
      </header>

      {/* Modal: Strona tytułowa */}
      {showMeta && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-green-800 mb-4">📄 Dane strony tytułowej</h2>
            {[
              { key: 'jednostka', label: 'Jednostka *', placeholder: 'np. 1 Drużyna Harcerska „Leśny Wicher"' },
              { key: 'kierownik', label: 'Kierownik obozu *', placeholder: 'Imię i nazwisko' },
              { key: 'miejsce',   label: 'Miejsce obozu',     placeholder: 'np. Zakopane' },
              { key: 'termin',    label: 'Termin',            placeholder: 'np. 1-14 lipca 2025' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder={placeholder}
                  value={meta[key]}
                  onChange={e => updateMeta({ [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowMeta(false)}
                className="flex-1 bg-green-700 text-white rounded-lg py-2 font-semibold hover:bg-green-800"
              >
                Zapisz
              </button>
              <button
                onClick={() => setShowMeta(false)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Główny układ */}
      <div className="flex h-[calc(100vh-60px)]">

        {/* ── LEWA KOLUMNA: Zajęcia ── */}
        <aside className="w-80 shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col overflow-hidden">
          <ActivityPanel
            activities={activities}
            onAdd={addActivity}
            onEdit={editActivity}
            onDelete={deleteActivity}
          />
        </aside>

        {/* ── PRAWA KOLUMNA: Plan ── */}
        <main className="flex-1 overflow-y-auto p-5">
          {/* Ustaw liczbę dni */}
          <div className="flex items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">Liczba dni obozu:</span>
            <input
              type="number"
              min={1} max={30}
              className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              placeholder="np. 10"
              value={daysCount}
              onChange={e => setDaysCount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setDays(daysCount)}
            />
            <button
              onClick={() => setDays(daysCount)}
              className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800"
            >
              Ustaw dni
            </button>
            {days.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                Zaplanowane: <b>{days.length}</b> {days.length === 1 ? 'dzień' : 'dni'}
              </span>
            )}
            <button
              onClick={addDay}
              className="ml-auto text-sm text-green-700 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50"
            >
              + Dodaj dzień
            </button>
          </div>

          {/* Karty dni */}
          {days.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">⛺</div>
              <p className="text-lg font-semibold">Wpisz liczbę dni i kliknij „Ustaw dni"</p>
              <p className="text-sm mt-1">Możesz też dodawać dni pojedynczo przyciskiem powyżej</p>
            </div>
          )}
          {days.map((day, i) => (
            <DayCard
              key={day.id}
              day={day}
              index={i}
              activities={activities}
              onChange={updated => updateDay(day.id, updated)}
              onDelete={() => deleteDay(day.id)}
            />
          ))}

          {days.length > 0 && (
            <button
              onClick={handleExport}
              className="w-full mt-4 bg-green-700 text-white py-3 rounded-xl font-bold text-base hover:bg-green-800 transition shadow"
            >
              📄 Eksportuj PDF — Ramowy Plan Pracy
            </button>
          )}
        </main>
      </div>
    </div>
  )
}
