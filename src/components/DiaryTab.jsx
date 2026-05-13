import { useState } from 'react'
import { generateDiary } from '../utils/generateDiary'

export default function DiaryTab({ meta, days, activities }) {
  // Wychowawca dla tego dziennika
  const wychowawcyList = meta.wychowawcy?.filter(w => w.name) || []
  const [wybranyWychowawca, setWybranyWychowawca] = useState(wychowawcyList[0]?.name || '')
  const [customWychowawca, setCustomWychowawca] = useState('')

  // Bloki zajęciowe
  const [bloki, setBloki] = useState([{ id: 1, nazwa: '', opis: '' }])

  const addBlok = () => setBloki(prev => [...prev, { id: Date.now(), nazwa: '', opis: '' }])
  const removeBlok = (id) => setBloki(prev => prev.filter(b => b.id !== id))
  const updateBlok = (id, field, val) => setBloki(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b))

  const wychowawca = wybranyWychowawca === '__custom__' ? customWychowawca : wybranyWychowawca

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500'

  const handleGenerate = () => {
    generateDiary({ meta, days, wychowawca, blokiZajeciowe: bloki })
  }

  const canGenerate = wychowawca.trim().length > 0

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">📓 Dziennik zajęć</h2>
          <p className="text-sm text-gray-500 mt-1">
            Wygeneruj dziennik zajęć dla wychowawcy — gotowy do druku (format A5)
          </p>
        </div>

        {days.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
            ⚠️ Brak planu zajęć — najpierw utwórz plan w zakładce <b>Plan zajęć</b>
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

        {/* Sekcja 2: Bloki zajęciowe */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Bloki zajęciowe
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Opisz bloki zajęciowe które wychowawca będzie realizować. Pojawią się na stronie 2 dziennika i jako miejsca do wpisania numeru w planie każdego dnia.
          </p>

          <div className="space-y-3">
            {bloki.map((blok, i) => (
              <div key={blok.id} className="flex gap-2 items-start">
                <div className="w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1.5">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <input className={inp} placeholder={`Nazwa bloku ${i + 1} (np. Pionierka)`}
                    value={blok.nazwa} onChange={e => updateBlok(blok.id, 'nazwa', e.target.value)} />
                  <textarea className={inp + ' resize-none'} rows={2}
                    placeholder="Opis / cele zajęcia (opcjonalnie)"
                    value={blok.opis} onChange={e => updateBlok(blok.id, 'opis', e.target.value)} />
                </div>
                {bloki.length > 1 && (
                  <button onClick={() => removeBlok(blok.id)}
                    className="text-red-400 hover:text-red-600 mt-1.5 text-lg leading-none shrink-0">×</button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addBlok}
            className="mt-3 w-full border-2 border-dashed border-green-400 rounded-xl py-2 text-sm text-green-700 hover:bg-green-50 transition">
            + Dodaj blok zajęciowy
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
              ...days.map((d, i) => [`📅 Strona ${4 + i}`, `Dzień ${i + 1}${d.label ? ' — ' + d.label : ''} · ${(d.slots||[]).length} zajęć + 2 bloki`]),
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
          disabled={!canGenerate || days.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow ${
            canGenerate && days.length > 0
              ? 'bg-green-700 text-white hover:bg-green-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          📥 Generuj dziennik PDF
        </button>
        {!canGenerate && <p className="text-center text-xs text-red-400">Uzupełnij imię wychowawcy</p>}
        {days.length === 0 && <p className="text-center text-xs text-red-400">Dodaj plan zajęć przed generowaniem</p>}
      </div>
    </div>
  )
}
