import { useState, useEffect } from 'react'
import ActivityPanel from './components/ActivityPanel'
import DayCard from './components/DayCard'
import TemplatePanel from './components/TemplatePanel'
import MapTab from './components/MapTab'
import CampDataTab from './components/CampDataTab'
import CampsMapTab from './components/CampsMapTab'
import AuthModal from './components/AuthModal'
import OnboardingWizard from './components/OnboardingWizard'
import DashboardTab from './components/DashboardTab'
import DuringCampTab from './components/DuringCampTab'
import DiaryTab from './components/DiaryTab'
import { makeDay } from './utils/defaults'
import { generatePdf } from './utils/generatePdf'
import { saveState, loadState } from './utils/storage'
import { supabase, signOut, getProfile, upsertProfile, saveCampMeta, loadCampMeta } from './lib/supabase'

const DEFAULT_STATE = {
  meta: { jednostka: '', kierownik: '', miejsce: '', termin: '', date_start: '', date_end: '' },
  activities: [],
  days: [],
  template: [],
  activityLog: [],
}

export default function App() {
  const [state, setState] = useState(() => loadState() || DEFAULT_STATE)
  const [daysCount, setDaysCount] = useState('')
  // Główne sekcje: 'before' | 'during' | 'tasks' | 'settings'
  const [mainSection, setMainSection] = useState('before')
  // Pod-zakładki w sekcji "Przed obozem"
  const [activeTab, setActiveTabMain] = useState('dashboard')
  const [user, setUser]               = useState(null)
  const [showAuth, setShowAuth]       = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Nawigacja z DashboardTab
  const navigateToSection = (section) => {
    const map = {
      'Dane obozu':  'camp',
      'Plan zajęć':  'plan',
      'Mapa terenu': 'map',
      'Mapa obozów': 'campsmap',
    }
    if (map[section]) { setActiveTabMain(map[section]); setMainSection('before') }
  }

  // Po zalogowaniu — załaduj profil + zapisane dane obozu z Supabase
  const applyProfile = async (u) => {
    if (!u) return
    try {
      // Zawsze upewnij się że profil istnieje (FK constraint)
      await upsertProfile({ id: u.id, display_name: u.email?.split('@')[0] || '' })

      const profile = await getProfile(u.id)
      const savedMeta = await loadCampMeta(u.id)

      if (savedMeta && Object.keys(savedMeta).length > 0) {
        // Przywróć pełne zapisane dane obozu
        update({ meta: savedMeta })
      } else if (profile) {
        // Pierwsze logowanie — uzupełnij z profilu rejestracji
        update({
          meta: {
            ...state.meta,
            kierownik:     state.meta.kierownik     || profile.display_name || '',
            jednostka:     state.meta.jednostka     || profile.organization || '',
            tel_kierownik: state.meta.tel_kierownik || profile.phone        || '',
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

  const { meta, activities, days, template, activityLog = [] } = state

  useEffect(() => { saveState(state) }, [state])

  const update = (patch) => setState(s => ({ ...s, ...patch }))

  const logActivity = (action, icon = '📌') => {
    setState(s => ({
      ...s,
      activityLog: [
        { id: `al_${Date.now()}`, action, icon, time: new Date().toISOString() },
        ...(s.activityLog || []).slice(0, 19),
      ]
    }))
  }

  const updateMeta = (patch) => {
    const newMeta = { ...meta, ...patch }
    update({ meta: newMeta })
    // Zapisz do Supabase jeśli zalogowany
    if (user?.id) {
      saveCampMeta(user.id, newMeta).catch(() => {})
    }
  }

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
    logActivity(`Ustawiono plan na ${count} ${count === 1 ? 'dzień' : 'dni'}`, '📋')
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
    logActivity('Dodano nowy dzień do planu', '➕')
  }

  const handleExport = () => {
    if (!meta.jednostka || !meta.kierownik) {
      alert('Uzupełnij Jednostkę i Kierownika w lewym panelu przed eksportem.')
      return
    }
    generatePdf({ meta, days })
    logActivity('Wyeksportowano PDF — Ramowy Plan Pracy', '📄')
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
              if (!state.meta.miejsce) setShowOnboarding(true)
            }}
          />
        )}
      </div>
    )
  }

  const MAIN_SECTIONS = [
    { id: 'before',   label: 'Przed obozem',     icon: '🏕️' },
    { id: 'during',   label: 'W trakcie obozu',  icon: '⛺' },
    { id: 'tasks',    label: 'Zadania',           icon: '📌' },
    { id: 'settings', label: 'Ustawienia',        icon: '⚙️' },
  ]

  const BEFORE_TABS = [
    { id: 'dashboard', label: 'Pulpit' },
    { id: 'camp',      label: 'Dane obozu' },
    { id: 'plan',      label: 'Plan zajęć' },
    { id: 'diary',     label: 'Dziennik' },
    { id: 'map',       label: 'Mapa terenu' },
    { id: 'campsmap',  label: 'Mapa obozów' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Onboarding wizard */}
      {showOnboarding && (
        <div className="fixed inset-0 overflow-y-auto" style={{zIndex:2000}}>
          <OnboardingWizard
            meta={meta} userId={user?.id}
            updateMeta={(newMeta) => update({ meta: newMeta })}
            onDone={() => { setShowOnboarding(false); setMainSection('before'); setActiveTabMain('dashboard'); logActivity('Ukończono konfigurację obozu', '✅') }}
          />
        </div>
      )}

      {/* Header z nawigacją */}
      <header className="bg-green-800 text-white shadow shrink-0">
        {/* Top row */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Skauci Europy" className="h-8 w-auto object-contain"
              onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }} />
            <div className="hidden items-center justify-center w-8 h-8 bg-yellow-400 rounded-full text-green-900 font-black text-sm">⚜</div>
            <div>
              <h1 className="text-sm font-bold leading-tight">CampOS</h1>
              <p className="text-green-400 text-xs">Skauci Europy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-300 text-xs hidden md:block">{user?.email?.split('@')[0]}</span>
            {activeTab === 'plan' && mainSection === 'before' && (
              <button onClick={handleExport} disabled={!metaOk}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  metaOk ? 'bg-white text-green-800 hover:bg-green-50' : 'bg-green-700 text-green-400 cursor-not-allowed'
                }`}>
                📄 PDF
              </button>
            )}
            <button onClick={() => signOut()}
              className="text-xs text-green-400 hover:text-white px-2 py-1 rounded border border-green-700 hover:border-green-400 transition">
              Wyloguj
            </button>
          </div>
        </div>

        {/* 4 główne sekcje */}
        <div className="flex border-t border-green-700">
          {MAIN_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setMainSection(s.id)}
              className={`flex-1 py-2.5 text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                mainSection === s.id ? 'bg-white text-green-800' : 'text-green-300 hover:text-white hover:bg-green-700'
              }`}>
              <span className="text-base">{s.icon}</span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Sub-nawigacja — widoczna tylko w sekcji "Przed obozem" */}
        {mainSection === 'before' && (
          <div className="flex overflow-x-auto border-t border-green-700 bg-green-900">
            {BEFORE_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTabMain(t.id)}
                className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === t.id ? 'bg-green-600 text-white' : 'text-green-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Treść sekcji ── */}

      {/* PRZED OBOZEM */}
      {mainSection === 'before' && (
        <>
          {activeTab === 'dashboard' && (
            <DashboardTab meta={meta} days={days} user={user} onNavigate={navigateToSection} activityLog={activityLog} />
          )}
          {activeTab === 'camp' && (
            <CampDataTab meta={meta} onUpdateMeta={updateMeta} userId={user?.id} />
          )}
          {activeTab === 'diary' && (
            <DiaryTab meta={meta} days={days} activities={activities} />
          )}
          {activeTab === 'map' && (
            <div className="flex flex-1 overflow-hidden"><MapTab /></div>
          )}
          {activeTab === 'campsmap' && (
            <CampsMapTab user={user} meta={meta} />
          )}
          {activeTab === 'plan' && (
            <div className="flex flex-1 overflow-hidden">
              <aside className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                {!metaOk && (
                  <div className="p-3 border-b border-gray-100">
                    <button onClick={() => setActiveTabMain('camp')}
                      className="w-full text-xs text-orange-600 border border-orange-200 bg-orange-50 rounded-lg py-2 hover:bg-orange-100 transition">
                      ⚠️ Uzupełnij dane obozu
                    </button>
                  </div>
                )}
                <div className="p-4 border-b border-gray-100">
                  <TemplatePanel
                    slots={template}
                    onChange={(newSlots) => {
                      const existingIds = new Set(template.map(s => s.id))
                      const added = newSlots.filter(s => !existingIds.has(s.id))
                      if (added.length > 0 && days.length > 0) {
                        update({ template: newSlots, days: days.map(day => ({
                          ...day,
                          slots: [...day.slots, ...added.map(s => ({ ...s, id: `slot_${Date.now()}_${Math.random()}` }))]
                        })) })
                      } else { update({ template: newSlots }) }
                    }}
                    activities={activities}
                  />
                </div>
                <div className="p-4 flex-1">
                  <ActivityPanel activities={activities} onAdd={addActivity} onEdit={editActivity} onDelete={deleteActivity} />
                </div>
              </aside>
              <main className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Liczba dni obozu:</span>
                  <input type="number" min={1} max={30}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                    placeholder="np. 10" value={daysCount}
                    onChange={e => setDaysCount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setDays(daysCount)} />
                  <button onClick={() => setDays(daysCount)}
                    className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800">
                    Ustaw
                  </button>
                  {days.length > 0 && <span className="text-sm text-gray-500">Zaplanowane: <b>{days.length}</b> dni</span>}
                  <button onClick={addDay}
                    className="ml-auto text-sm text-green-700 border border-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50">
                    + Dodaj dzień
                  </button>
                </div>
                {days.length === 0 && (
                  <div className="text-center py-24 text-gray-400">
                    <div className="text-5xl mb-4">⛺</div>
                    <p className="text-lg font-semibold">Wpisz liczbę dni i kliknij „Ustaw"</p>
                  </div>
                )}
                {days.map((day, i) => (
                  <DayCard key={day.id} day={day} index={i} activities={activities}
                    onChange={updated => updateDay(day.id, updated)}
                    onDelete={() => deleteDay(day.id)} />
                ))}
                {days.length > 0 && (
                  <button onClick={handleExport} disabled={!metaOk}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-base transition shadow ${
                      metaOk ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    📄 Eksportuj PDF — Ramowy Plan Pracy
                  </button>
                )}
              </main>
            </div>
          )}
        </>
      )}

      {/* W TRAKCIE OBOZU */}
      {mainSection === 'during' && (
        <DuringCampTab meta={meta} days={days} />
      )}

      {/* ZADANIA */}
      {mainSection === 'tasks' && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-3">📌</div>
            <p className="font-semibold">Zadania</p>
            <p className="text-sm mt-1">Tablica zadań dla kadry — wkrótce</p>
          </div>
        </div>
      )}

      {/* USTAWIENIA */}
      {mainSection === 'settings' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ustawienia</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
            <hr />
            <button onClick={() => signOut()}
              className="w-full text-left text-red-500 hover:text-red-700 text-sm font-semibold py-2">
              🚪 Wyloguj się
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
