import { useMemo } from 'react'

const CHECKLIST = [
  { key: 'typ_obozu',    label: 'Typ obozu wybrany',        section: 'Dane obozu' },
  { key: 'jednostka',    label: 'Nazwa jednostki wpisana',   section: 'Dane obozu' },
  { key: 'kierownik',    label: 'Kierownik wpisany',         section: 'Dane obozu' },
  { key: 'tel_kierownik',label: 'Telefon kierownika',        section: 'Dane obozu' },
  { key: 'miejsce',      label: 'Miejsce obozu wpisane',     section: 'Dane obozu' },
  { key: 'date_start',   label: 'Data rozpoczęcia wybrana',  section: 'Dane obozu' },
  { key: 'date_end',     label: 'Data zakończenia wybrana',  section: 'Dane obozu' },
  { key: '_days',        label: 'Plan zajęć uzupełniony',    section: 'Plan zajęć', special: true },
]

export default function DashboardTab({ meta, days, user, onNavigate }) {
  const today = new Date()

  const daysToStart = meta.date_start
    ? Math.ceil((new Date(meta.date_start) - today) / 86400000)
    : null

  const daysToKuratorium = meta.date_start
    ? Math.ceil((new Date(meta.date_start) - today) / 86400000) - 21
    : null

  const checklist = CHECKLIST.map(item => ({
    ...item,
    done: item.special
      ? (item.key === '_days' ? days.length > 0 : false)
      : Boolean(meta[item.key]),
  }))

  const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)

  const greeting = useMemo(() => {
    const h = today.getHours()
    if (h < 12) return 'Dzień dobry'
    if (h < 18) return 'Cześć'
    return 'Dobry wieczór'
  }, [])

  const name = meta.kierownik?.split(' ')[0] || user?.email?.split('@')[0] || 'Drużynowy'

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Powitanie */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">{greeting}, {name}! 👋</h2>
          <p className="text-green-200 text-sm">
            {meta.jednostka ? meta.jednostka : 'Uzupełnij dane obozu aby zobaczyć szczegóły'}
          </p>

          {/* Countdown */}
          {daysToStart !== null && (
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className={`bg-white/20 rounded-xl px-4 py-3 text-center min-w-[100px] ${daysToStart < 0 ? 'bg-green-500/30' : ''}`}>
                <div className="text-2xl font-bold">
                  {daysToStart < 0 ? '🏕️' : daysToStart}
                </div>
                <div className="text-xs text-green-200 mt-0.5">
                  {daysToStart < 0 ? 'Obóz trwa!' : daysToStart === 0 ? 'Dziś start!' : 'dni do obozu'}
                </div>
              </div>
              {daysToKuratorium !== null && daysToKuratorium > 0 && (
                <div className={`rounded-xl px-4 py-3 text-center min-w-[120px] ${
                  daysToKuratorium <= 7 ? 'bg-red-500/40' : 'bg-white/20'
                }`}>
                  <div className="text-2xl font-bold">{daysToKuratorium}</div>
                  <div className="text-xs text-green-200 mt-0.5">
                    {daysToKuratorium <= 0 ? '⚠️ Kuratorium!' : 'dni do wysyłki kuratorium'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Postęp */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Postęp przygotowań</h3>
            <span className="text-2xl font-bold text-green-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.key} className="flex items-center gap-3 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{item.done ? '✓' : '○'}</span>
                <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                {!item.done && (
                  <button onClick={() => onNavigate(item.section)}
                    className="ml-auto text-xs text-green-600 hover:underline shrink-0">
                    Uzupełnij →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Szybki dostęp */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3">Szybki dostęp</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🏕️', label: 'Dane obozu',  section: 'Dane obozu' },
              { icon: '📋', label: 'Plan zajęć',  section: 'Plan zajęć' },
              { icon: '🗺️', label: 'Mapa terenu', section: 'Mapa terenu' },
              { icon: '🌍', label: 'Mapa obozów', section: 'Mapa obozów' },
            ].map(item => (
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
      </div>
    </div>
  )
}
