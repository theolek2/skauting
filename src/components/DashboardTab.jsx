import { useMemo } from 'react'

const GROUPS = [
  {
    key: 'podstawowe',
    icon: '🏕️',
    label: 'Podstawowe',
    items: [
      { key: 'camp',  label: 'Dane obozu',   icon: '🏕️' },
      { key: 'kadra', label: 'Kadra',         icon: '👥' },
    ],
    requires: [],
  },
  {
    key: 'planowanie',
    icon: '📅',
    label: 'Planowanie',
    items: [
      { key: 'plan',  label: 'Plan zajęć',    icon: '📋' },
      { key: 'diary', label: 'Dziennik zajęć', icon: '📓' },
    ],
    requires: ['podstawowe'],
  },
  {
    key: 'dokumenty',
    icon: '📄',
    label: 'Dokumenty',
    items: [
      { key: 'docs',  label: 'Dokumenty',     icon: '📄' },
    ],
    requires: ['podstawowe'],
  },
  {
    key: 'mapy',
    icon: '🗺️',
    label: 'Mapy',
    items: [
      { key: 'map',      label: 'Mapa terenu',  icon: '🗺️' },
      { key: 'campsmap', label: 'Mapa obozów',  icon: '🌍' },
    ],
    requires: [],
  },
]

const QUICK_LINKS = [
  { icon: '🏕️', label: 'Dane obozu',  section: 'Dane obozu' },
  { icon: '📋', label: 'Plan zajęć',  section: 'Plan zajęć' },
  { icon: '🗺️', label: 'Mapa terenu', section: 'Mapa terenu' },
  { icon: '🌍', label: 'Mapa obozów', section: 'Mapa obozów' },
  { icon: '📄', label: 'Dokumenty',   section: 'Dokumenty' },
]

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Przed chwilą'
  if (mins < 60) return `${mins} min temu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Wczoraj'
  return `${days} dni temu`
}

function groupProgress(group, progress) {
  const done = group.items.filter(i => progress[i.key]).length
  return { done, total: group.items.length, pct: Math.round((done / group.items.length) * 100) }
}

function isGroupLocked(group, groupStates) {
  return group.requires.some(r => groupStates[r]?.pct < 100)
}

export default function DashboardTab({ meta, days, user, onNavigate, activityLog, progress = {} }) {
  const today = new Date()

  const daysToStart = meta.date_start
    ? Math.ceil((new Date(meta.date_start) - today) / 86400000)
    : null

  const daysToKuratorium = meta.date_start
    ? Math.ceil((new Date(meta.date_start) - today) / 86400000) - 21
    : null

  const greeting = useMemo(() => {
    const h = today.getHours()
    if (h < 12) return 'Dzień dobry'
    if (h < 18) return 'Cześć'
    return 'Dobry wieczór'
  }, [])

  const name = meta.kierownik?.split(' ')[0] || user?.email?.split('@')[0] || 'Drużynowy'

  const groupStates = {}
  GROUPS.forEach(g => { groupStates[g.key] = groupProgress(g, progress) })

  const totalDone = GROUPS.reduce((s, g) => s + groupStates[g.key].done, 0)
  const totalItems = GROUPS.reduce((s, g) => s + groupStates[g.key].total, 0)
  const totalPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Powitanie */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">{greeting}, {name}! 👋</h2>
          <p className="text-green-200 text-sm">
            {meta.jednostka ? meta.jednostka : 'Uzupełnij dane obozu aby zobaczyć szczegóły'}
          </p>
          {daysToStart !== null && (
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className={`bg-white/20 rounded-xl px-4 py-3 text-center min-w-[100px] ${daysToStart < 0 ? 'bg-green-500/30' : ''}`}>
                <div className="text-2xl font-bold">{daysToStart < 0 ? '🏕️' : daysToStart}</div>
                <div className="text-xs text-green-200 mt-0.5">
                  {daysToStart < 0 ? 'Obóz trwa!' : daysToStart === 0 ? 'Dziś start!' : 'dni do obozu'}
                </div>
              </div>
              {daysToKuratorium !== null && daysToKuratorium > 0 && (
                <div className={`rounded-xl px-4 py-3 text-center min-w-[120px] ${daysToKuratorium <= 7 ? 'bg-red-500/40' : 'bg-white/20'}`}>
                  <div className="text-2xl font-bold">{daysToKuratorium}</div>
                  <div className="text-xs text-green-200 mt-0.5">dni do wysyłki kuratorium</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ogólny postęp */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Postęp przygotowań</h3>
            <span className="text-2xl font-bold text-green-700">{totalPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${totalPct}%` }} />
          </div>
          <p className="text-xs text-gray-400">{totalDone} z {totalItems} punktów zaliczonych</p>
        </div>

        {/* Grupy */}
        {GROUPS.map(g => {
          const gs = groupStates[g.key]
          const locked = isGroupLocked(g, groupStates)
          return (
            <div key={g.key} className={`bg-white rounded-2xl border-2 p-5 ${locked ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{g.icon}</span>
                <h3 className="font-bold text-gray-800">{g.label}</h3>
                <span className={`text-xs font-bold ml-auto px-2 py-0.5 rounded-full ${
                  gs.pct === 100 ? 'bg-green-100 text-green-700' : gs.pct > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>{gs.done}/{gs.total}</span>
                {locked && <span className="text-xs text-gray-400 ml-1">🔒</span>}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full transition-all ${gs.pct === 100 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${gs.pct}%` }} />
              </div>
              <div className="space-y-1.5">
                {g.items.map(item => {
                  const done = progress[item.key]
                  return (
                    <button key={item.key}
                      onClick={() => onNavigate(g.key === 'podstawowe' && item.key === 'kadra' ? 'Dane obozu' : item.label)}
                      className={`w-full flex items-center gap-2 text-left text-sm px-3 py-1.5 rounded-lg transition ${
                        done ? 'bg-green-50 text-green-800' : locked ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        done ? 'bg-green-500 text-white' : locked ? 'bg-gray-100 text-gray-300' : 'bg-gray-200 text-gray-400'
                      }`}>{done ? '✓' : '○'}</span>
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Szybki dostęp */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">Szybki dostęp</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {QUICK_LINKS.map(item => (
              <button key={item.section} onClick={() => onNavigate(item.section)}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info o obózie */}
        {meta.miejsce && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Twój obóz</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Jednostka', value: meta.jednostka },
                { label: 'Kierownik', value: meta.kierownik },
                { label: 'Miejsce', value: meta.miejsce },
                { label: 'Termin', value: meta.date_start && meta.date_end ? `${meta.date_start} – ${meta.date_end}` : meta.termin },
                { label: 'Typ obozu', value: meta.typ_obozu },
              ].filter(i => i.value).map(item => (
                <div key={item.label}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</div>
                  <div className="font-medium text-gray-800 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ostatnio robiłeś */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3">Ostatnio robiłeś…</h3>
          {(activityLog && activityLog.length > 0) ? (
            <div className="space-y-2">
              {activityLog.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xl shrink-0">{entry.icon}</span>
                  <span className="text-sm text-gray-700 flex-1">{entry.action}</span>
                  <span className="text-xs text-gray-400 shrink-0">{relativeTime(entry.time)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">Brak aktywności — zacznij od uzupełnienia danych obozu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
