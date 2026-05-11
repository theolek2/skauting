import { useState, useEffect } from 'react'
import ActivityPanel from './components/ActivityPanel'
import DayCard from './components/DayCard'
import TemplatePanel from './components/TemplatePanel'
import MapTab from './components/MapTab'
import CampDataTab from './components/CampDataTab'
import CampsMapTab from './components/CampsMapTab'
import AuthModal from './components/AuthModal'
import { makeDay } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'
import { supabase, signOut, getProfile } from './lib/supabase'

const DEFAULT_STATE = {
  meta: { jednostka: '', kierownik: '', miejsce: '', termin: '' },
  activities: [],
  days: [],
  template: [],
}

export default function App() {
  const [state, setState] = useState(() => loadState() || DEFAULT_STATE)
  const [daysCount, setDaysCount] = useState('')
  const [activeTab, setActiveTabMain] = useState('plan')
  const [user, setUser]               = useState(null)
  const [showAuth, setShowAuth]       = useState(false)
  const [showFirstLogin, setShowFirstLogin] = useState(false)

  // Po zalogowaniu — załaduj profil i uzupełnij meta
  const applyProfile = async (u) => {
    if (!u) return
    try {
      const profile = await getProfile(u.id)
      if (profile) {
        update({
          meta: {
            ...state.meta,
            // Wypełnij tylko puste pola
            kierownik:     state.meta.kierownik  || profile.display_name || '',
            jednostka:     state.meta.jednostka  || profile.organization || '',
            tel_kierownik: state.meta.tel_kierownik || profile.phone || '',
          }
        })
      }
    } catch {}
  }

  // Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) applyProfile(u)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) applyProfile(u)
    })
    return () => subscription.unsubscribe()
  }, [])

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

  // ── Bramka logowania — cała aplikacja za auth ──────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-green-900 flex flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Skauci Europy" className="h-20 mx-auto mb-4"
            onError={e => { e.currentTarget.style.display='none' }} />
          <h1 className="text-3xl font-bold text-white">Książka Obozowa</h1>
          <p className="text-green-300 mt-1">Skauci Europy · Ramowy plan pracy</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <p className="text-center text-gray-600 text-sm mb-6">
            Zaloguj się aby korzystać z aplikacji.<br/>
            <span className="text-xs text-gray-400">Dostęp tylko dla @skauci-europy.pl</span>
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition"
          >
            🔐 Zaloguj się
          </button>
        </div>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onAuth={u => {
              setUser(u)
              setShowAuth(false)
              applyProfile(u)
              // Pokaż modal pierwszego logowania jeśli brak lokalizacji
              if (!state.meta.miejsce) setShowFirstLogin(true)
            }}
          />
        )}
      </div>
    )
  }

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
              { id: 'camp',      label: '🏕️ Dane obozu' },
              { id: 'plan',      label: '📋 Plan zajęć' },
              { id: 'map',       label: '🗺️ Mapa terenu' },
              { id: 'campsmap',  label: '🌍 Mapa obozów' },
            ].map(t => (
              <button key={t.id}
                onClick={() => setActiveTabMain(t.id)}
                className={`px-4 py-1.5 text-sm font-semibold transition ${
                  activeTab === t.id ? 'bg-white text-green-800'
                  : t.auth && !user ? 'text-green-500/60 hover:text-green-300'
                  : 'text-green-300 hover:text-white'
                }`}
                title={t.auth && !user ? 'Wymagane logowanie' : undefined}
              >{t.label}{t.auth && !user ? ' 🔒' : ''}</button>
            ))}
          </div>
          <p className="text-green-400 text-xs hidden sm:block">by Aleksander Nasiłowski</p>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-green-300 text-xs hidden md:block">{user.email}</span>
              <button onClick={() => signOut()} className="text-xs text-green-300 border border-green-600 px-3 py-1 rounded-lg hover:bg-green-700">
                Wyloguj
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="text-sm font-semibold bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition">
              🔐 Zaloguj się
            </button>
          )}
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

      {/* Zakładka: Mapa obozów (wymaga logowania) */}
      {activeTab === 'campsmap' && user && (
        <CampsMapTab user={user} meta={meta} />
      )}
      {activeTab === 'campsmap' && !user && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-lg font-semibold text-gray-700">Wymagane logowanie</p>
            <p className="text-sm text-gray-500 mt-1">Dostęp tylko dla @skauci-europy.pl</p>
            <button onClick={() => setShowAuth(true)} className="mt-4 bg-green-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-800">
              Zaloguj się
            </button>
          </div>
        </div>
      )}

      {/* Modal pierwszego logowania */}
      {showFirstLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏕️</div>
              <h2 className="text-xl font-bold text-green-800">Witaj w CampOS!</h2>
              <p className="text-sm text-gray-500 mt-1">Powiedz nam gdzie planujesz obóz</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Miejscowość / teren obozu *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. Leśniczówka Pisary k. Nowego Sącza"
                  value={meta.miejsce || ''}
                  onChange={e => updateMeta({ miejsce: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Termin</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. 1–14 lipca 2025"
                  value={meta.termin || ''}
                  onChange={e => updateMeta({ termin: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { if (meta.miejsce) setShowFirstLogin(false) }}
                disabled={!meta.miejsce}
                className="flex-1 bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 disabled:opacity-40"
              >
                Dalej →
              </button>
              <button onClick={() => setShowFirstLogin(false)}
                className="px-4 py-2.5 border rounded-xl text-gray-500 hover:bg-gray-50 text-sm">
                Pomiń
              </button>
            </div>
          </div>
        </div>
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
            <div className="p-3 border-b border-gray-100">
              <button onClick={() => setActiveTabMain('camp')}
                className="w-full text-xs text-orange-600 border border-orange-200 bg-orange-50 rounded-lg py-2 hover:bg-orange-100 transition">
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
