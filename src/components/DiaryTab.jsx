import { useState } from 'react'
import { FIXED_ACTIVITIES } from '../utils/defaults'
import { generateDiary } from '../utils/generateDiary'

export default function DiaryTab({ meta, days, activities, onNavigate }) {
  // Wychowawca dla tego dziennika
  const wychowawcyList = meta.wychowawcy?.filter(w => w.name) || []
  const [wybranyWychowawca, setWybranyWychowawca] = useState(wychowawcyList[0]?.name || '')
  const [customWychowawca, setCustomWychowawca] = useState('')

  // Bloki zajęciowe — kaflami
  const [bloki, setBloki] = useState([{ id: 1, nazwa: '', opis: '' }])

  const addBlok = (nazwa = '', opis = '') =>
    setBloki(prev => [...prev, { id: Date.now(), nazwa, opis }])

  const removeBlok = (id) => setBloki(prev => prev.filter(b => b.id !== id))
  const updateBlok = (id, field, val) => setBloki(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b))

  const quickAdd = (name, description = '') => {
    const already = bloki.find(b => b.nazwa === name)
    if (already) {
      removeBlok(already.id)
    } else {
      addBlok(name, description)
    }
  }

  const allActivities = [
    ...FIXED_ACTIVITIES.map(a => ({ id: a.id, name: a.name, description: a.description })),
    ...(activities || []).map(a => ({ id: a.id, name: a.name, description: a.description })),
  ]

  const wychowawca = wybranyWychowawca === '__custom__' ? customWychowawca : wybranyWychowawca

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'

  const handleGenerate = () => {
    generateDiary({ meta, days, wychowawca, blokiZajeciowe: bloki })
  }

  const canGenerate = wychowawca.trim().length > 0

  const campDays = (meta.date_start && meta.date_end)
    ? Math.max(1, Math.ceil((new Date(meta.date_end) - new Date(meta.date_start)) / 86400000) + 1)
    : days.length

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">📓 Dziennik zajęć</h2>
          <p className="text-sm text-gray-500 mt-1">
            Wygeneruj dziennik zajęć dla wychowawcy — gotowy do druku (format A5)
          </p>
        </div>

        {/* Brak danych obozu */}
        {(!meta.date_start || !meta.date_end) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold">Brak dat obozu</div>
              <div className="text-red-600 text-xs mt-0.5">Uzupełnij daty rozpoczęcia i zakończenia obozu</div>
            </div>
            <button onClick={() => onNavigate('Dane obozu')}
              className="shrink-0 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition">
              Przejdź do danych obozu →
            </button>
          </div>
        )}

        {/* Sekcja 1: Wychowawca */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Wychowawca
          </h3>

          {wychowawcyList.length > 0 ? (
            <div className="space-y-2">
              {wychowawcyList.map(w => (
                <label key={w.name} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  wybranyWychowawca === w.name ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'
                }`}>
                  <input type="radio" name="wychowawca" value={w.name}
                    checked={wybranyWychowawca === w.name}
                    onChange={() => setWybranyWychowawca(w.name)}
                    className="accent-green-600" />
                  <div>
                    <div className="font-semibold text-sm">{w.name}</div>
                    {w.phone && <div className="text-xs text-gray-400">{w.phone}</div>}
                  </div>
                </label>
              ))}
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                wybranyWychowawca === '__custom__' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'
              }`}>
                <input type="radio" name="wychowawca" value="__custom__"
                  checked={wybranyWychowawca === '__custom__'}
                  onChange={() => setWybranyWychowawca('__custom__')}
                  className="accent-green-600" />
                <span className="text-sm text-gray-600">Inny wychowawca...</span>
              </label>
              {wybranyWychowawca === '__custom__' && (
                <input className={inp} placeholder="Imię i nazwisko wychowawcy"
                  value={customWychowawca} onChange={e => setCustomWychowawca(e.target.value)} />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">Brak wychowawców — dodaj ich w Danych obozu lub wpisz ręcznie:</p>
              <input className={inp} placeholder="Imię i nazwisko wychowawcy"
                value={wybranyWychowawca} onChange={e => setWybranyWychowawca(e.target.value)} />
            </div>
          )}
        </div>

        {/* Sekcja 2: Bloki zajęciowe — KAFELKI */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Bloki zajęciowe
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Wybierz bloki zajęciowe z listy — pojawią się na stronie 2 dziennika. Wychowawca będzie wpisywał ich numery w planie każdego dnia.
          </p>

          {/* Kafelki — stałe elementy */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Stałe elementy:</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FIXED_ACTIVITIES.map(f => {
                const added = bloki.some(b => b.nazwa === f.name)
                return (
                  <button key={f.id} onClick={() => quickAdd(f.name)}
                    className={`text-xs px-2 py-1 rounded-full border transition ${
                      added ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
                    }`}>
                    {added ? '✓ ' : '+ '}{f.name}
                  </button>
                )
              })}
            </div>

            {/* Kafelki — zajęcia własne */}
            {activities && activities.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Zajęcia własne:</p>
                <div className="flex flex-wrap gap-1.5">
                  {activities.map(a => {
                    const added = bloki.some(b => b.nazwa === a.name)
                    return (
                      <button key={a.id} onClick={() => quickAdd(a.name, a.description)}
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          added ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500'
                        }`}>
                        {added ? '✓ ' : '+ '}{a.name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Lista wybranych bloków */}
          {bloki.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wybrane bloki:</p>
              {bloki.map((blok, i) => (
                <div key={blok.id} className="flex gap-2 items-start">
                  <div className="w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input className={inp} placeholder={`Nazwa bloku ${i + 1}`}
                      value={blok.nazwa} onChange={e => updateBlok(blok.id, 'nazwa', e.target.value)} />
                    <textarea className={inp + ' resize-none'} rows={2}
                      placeholder="Opis / cele zajęcia (opcjonalnie)"
                      value={blok.opis} onChange={e => updateBlok(blok.id, 'opis', e.target.value)} />
                  </div>
                  <button onClick={() => removeBlok(blok.id)}
                    className="text-red-400 hover:text-red-600 mt-1.5 text-lg leading-none shrink-0">×</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => addBlok()}
            className="mt-1 w-full border-2 border-dashed border-green-400 rounded-xl py-2 text-sm text-green-700 hover:bg-green-50 transition">
            + Dodaj własny blok (spoza listy)
          </button>
        </div>

        {/* Podgląd struktury */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            Struktura dziennika
          </h3>
          <div className="space-y-2 text-sm">
            {[
              ['📄 Strona 1', 'Strona tytułowa (wychowawca, obóz, termin)'],
              ['📋 Strona 2', `Bloki zajęciowe (${bloki.filter(b=>b.nazwa).length} zdefiniowanych)`],
              ['✍️ Strona 3', 'Lista uczestników — wypełniają sami (RODO)'],
              ...Array.from({ length: campDays }, (_, i) => {
                const day = days[i]
                return [`📅 Strona ${4 + i}`, `Dzień ${i + 1}${day?.label ? ' — ' + day.label : ''} · ${(day?.slots || []).length || 0} zajęć`]
              }),
            ].map(([page, desc]) => (
              <div key={page} className="flex gap-3 py-1.5 border-b border-gray-100 last:border-0">
                <span className="font-semibold text-gray-700 w-24 shrink-0 text-xs">{page}</span>
                <span className="text-gray-500 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Przycisk generowania */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow ${
            canGenerate
              ? 'bg-green-700 text-white hover:bg-green-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          📥 Generuj dziennik PDF
        </button>
        {!canGenerate && <p className="text-center text-xs text-red-400">Uzupełnij imię wychowawcy</p>}
      </div>
    </div>
  )
}
