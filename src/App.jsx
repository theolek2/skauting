import { useState, useEffect } from 'react'
import ActivityPanel from './components/ActivityPanel'
import DayCard from './components/DayCard'
import TemplatePanel from './components/TemplatePanel'
import MapTab from './components/MapTab'
import CampDataTab from './components/CampDataTab'
import { makeDay } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'

const DEFAULT_STATE = {
  meta: { jednostka: '', kierownik: '', miejsce: '', termin: '' },
  activities: [],
  days: [],
  template: [],
}

export default function App() {
  const [state, setState] = useState(() => loadState() || DEFAULT_STATE)
  const [daysCount, setDaysCount] = useState('')
  const [activeTab, setActiveTabMain] = useState('plan')  // 'plan' | 'map'

  const { meta, activities, days, template } = state

  useEffect(() => { saveState(state) }, [state])

  const update = (patch) => setState(s => ({ ...s, ...patch }))
  const updateMeta = (patch) => update({ meta: { ...meta, ...patch } })

  // ── Zajęcia ──
  const addActivity = (name, description) =>
    update({ activities: [...activities, { id: `a_${Date.now()}`, name, description }] })
  const editActivity = (id, name, description) =>
    update({ activities: activities.map(a => a.id === id ? { ...a, name, description } : a) })
  const deleteActivity = (id) =>
    update({ activities: activities.filter(a => a.id !== id) })

  // ── Dni ──
  const setDays = (n) => {
    const count = Math.max(1, Math.min(30, parseInt(n) || 0))
    if (!count) return
    const newDays = Array.from({ length: count }, (_, i) => {
      if (days[i]) return days[i]
      // Nowy dzień: skopiuj sloty szablonu jako własne sloty (edytowalne)
      const day = makeDay(i)
      day.slots = template.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
      return day
    })
    update({ days: newDays })
    setDaysCount('')
  }
  const updateDay = (id, updated) =>
    update({ days: days.map(d => d.id === id ? updated : d) })
  const deleteDay = (id) =>
    update({ days: days.filter(d => d.id !== id) })
  const addDay = () => {
    const day = makeDay(days.length)
    day.slots = template.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
    update({ days: [...days, day] })
  }

  const handleExport = () => {
    if (!meta.jednostka || !meta.kierownik) {
      alert('Uzupełnij Jednostkę i Kierownika w lewym panelu przed eksportem.')
      return
    }
    generatePdf({ meta, days })
  }

  const metaOk = meta.jednostka && meta.kierownik

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo Skautów Europy — wklej plik logo.png do public/ aby zastąpić emoji */}
          <img
            src="/logo.png"
            alt="Skauci Europy"
            className="h-10 w-auto object-contain"
            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }}
          />
          <div className="hidden items-center justify-center w-10 h-10 bg-yellow-400 rounded-full text-green-900 font-black text-lg">⚜</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Książka Obozowa</h1>
            <p className="text-green-300 text-xs">Ramowy plan pracy · Skauci Europy</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Zakładki */}
          <div className="flex bg-green-900 rounded-lg overflow-hidden">
            {[
              { id: 'camp', label: '🏕️ Dane obozu' },
              { id: 'plan', label: '📋 Plan zajęć' },
              { id: 'map',  label: '🗺️ Mapa terenu' },
            ].map(t => (
              <button key={t.id}
                onClick={() => setActiveTabMain(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold transition ${
                  activeTab === t.id ? 'bg-white text-green-800' : 'text-green-300 hover:text-white'
                }`}
              >{t.label}</button>
            ))}
          </div>
          <p className="text-green-400 text-xs hidden sm:block">by Aleksander Nasiłowski</p>
          {activeTab === 'plan' && (
            <button
              onClick={handleExport}
              disabled={!metaOk}
              className={`text-sm font-bold px-5 py-2 rounded-lg transition ${
                metaOk ? 'bg-white text-green-800 hover:bg-green-50' : 'bg-green-600 text-green-200 cursor-not-allowed'
              }`}
            >
              📄 Eksportuj PDF
            </button>
          )}
        </div>
      </header>

      {/* Zakładka: Dane obozu */}
      {activeTab === 'camp' && (
        <CampDataTab meta={meta} onUpdateMeta={updateMeta} />
      )}

      {/* Zakładka: Mapa */}
      {activeTab === 'map' && (
        <div className="flex flex-1 overflow-hidden">
          <MapTab />
        </div>
      )}

      {/* Główny układ — Plan zajęć */}
      {activeTab !== 'map' && <div className="flex flex-1 overflow-hidden">

        {/* ── LEWA KOLUMNA ── */}
        <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">

          {/* 1. DANE OBOZU */}
          {/* Skrót do danych obozu */}
          {!metaOk && (
            <div className=”p-3 border-b border-gray-100”>
              <button onClick={() => setActiveTabMain('camp')}
                className=”w-full text-xs text-orange-600 border border-orange-200 bg-orange-50 rounded-lg py-2 hover:bg-orange-100 transition”>
                ⚠️ Uzupełnij dane obozu → zakładka 🏕️
              </button>
            </div>
          )}

          {/* SZABLON DNIA */}
          <div className="p-4 border-b border-gray-100">
            <TemplatePanel
              slots={template}
              onChange={(newSlots) => {
                // Znajdź nowo dodane sloty (są w newSlots ale nie ma ich w template)
                const existingIds = new Set(template.map(s => s.id))
                const added = newSlots.filter(s => !existingIds.has(s.id))
                // Propaguj nowe sloty do wszystkich istniejących dni
                if (added.length > 0 && days.length > 0) {
                  const updatedDays = days.map(day => ({
                    ...day,
                    slots: [
                      ...day.slots,
                      ...added.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))
                    ]
                  }))
                  update({ template: newSlots, days: updatedDays })
                } else {
                  update({ template: newSlots })
                }
              }}
              activities={activities}
            />
          </div>

          {/* 3. ZAJĘCIA WŁASNE */}
          <div className="p-4 flex-1">
            <ActivityPanel
              activities={activities}
              onAdd={addActivity}
              onEdit={editActivity}
              onDelete={deleteActivity}
            />
          </div>
        </aside>

        {/* ── PRAWA KOLUMNA: Plan ── */}
        <main className="flex-1 overflow-y-auto p-5">
          {/* Pasek ustawiania dni */}
          <div className="flex items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">Liczba dni obozu:</span>
            <input
              type="number" min={1} max={30}
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
              Ustaw
            </button>
            {days.length > 0 && (
              <span className="text-sm text-gray-500">
                Zaplanowane: <b>{days.length}</b> {days.length === 1 ? 'dzień' : days.length < 5 ? 'dni' : 'dni'}
              </span>
            )}
            <button
              onClick={addDay}
              className="ml-auto text-sm text-green-700 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50"
            >
              + Dodaj dzień
            </button>
          </div>

          {/* Puste */}
          {days.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">⛺</div>
              <p className="text-lg font-semibold">Wpisz liczbę dni i kliknij „Ustaw"</p>
              <p className="text-sm mt-1">Pamiętaj też uzupełnić dane w lewym panelu</p>
            </div>
          )}

          {/* Karty dni */}
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
              disabled={!metaOk}
              className={`w-full mt-2 py-3 rounded-xl font-bold text-base transition shadow ${
                metaOk
                  ? 'bg-green-700 text-white hover:bg-green-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              📄 Eksportuj PDF — Ramowy Plan Pracy
            </button>
          )}
        </main>
      </div>}
    </div>
  )
}
