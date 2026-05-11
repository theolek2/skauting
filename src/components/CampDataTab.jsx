import { useState } from 'react'

// ── Moduł bazowy: karta z tytułem i możliwością zwijania ─────────────────────
function Module({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-green-700 text-white hover:bg-green-800 transition"
      >
        <span className="text-xl">{icon}</span>
        <span className="font-bold text-sm flex-1 text-left">{title}</span>
        <span className="text-white/60 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"

// ── Główna zakładka ──────────────────────────────────────────────────────────
export default function CampDataTab({ meta, onUpdateMeta }) {
  const metaOk = meta.jednostka && meta.kierownik

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">

        {/* Nagłówek */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-900">🏕️ Dane obozu</h2>
          <p className="text-sm text-gray-500 mt-1">
            Wypełnij dane obozu — pojawią się na stronie tytułowej eksportowanego PDF
          </p>
          {!metaOk && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700">
              ⚠️ Uzupełnij Jednostkę i Kierownika aby aktywować eksport PDF
            </div>
          )}
          {metaOk && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
              ✅ Dane kompletne — eksport PDF aktywny
            </div>
          )}
        </div>

        {/* Moduł 1: Podstawowe dane */}
        <Module icon="📋" title="Podstawowe dane obozu">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Typ obozu */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Typ obozu <span className="text-red-500">*</span></label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { val: 'wilczkowy', label: '🐺 Obóz wilczkowy', sub: 'Zuchy 6–10 lat' },
                  { val: 'harcerski', label: '⚜️ Drużyna harcerska', sub: 'Harcerze 10–16 lat' },
                  { val: 'starszoharcerski', label: '🏔️ Starszoharcerski', sub: '16+ lat' },
                  { val: 'wędrowniczy', label: '🎒 Wędrowniczy', sub: 'Wędrownicy 18+ lat' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => onUpdateMeta({ typ_obozu: opt.val })}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl border-2 text-left transition ${
                      meta.typ_obozu === opt.val
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-400'
                    }`}>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Jednostka / nazwa szczepu" required>
              <input className={inputCls}
                placeholder={'np. 1 DH „Leśny Wicher"'}
                value={meta.jednostka}
                onChange={e => onUpdateMeta({ jednostka: e.target.value })}
              />
            </Field>
            <Field label="Kierownik obozu" required>
              <input className={inputCls}
                placeholder="Imię i nazwisko"
                value={meta.kierownik}
                onChange={e => onUpdateMeta({ kierownik: e.target.value })}
              />
            </Field>
            <Field label="Miejsce obozu" required>
              <input className={inputCls}
                placeholder="np. Leśniczówka Pisary, gmina Olesno"
                value={meta.miejsce}
                onChange={e => onUpdateMeta({ miejsce: e.target.value })}
              />
            </Field>
            <Field label="Termin">
              <input className={inputCls}
                placeholder="np. 1–14 lipca 2025"
                value={meta.termin}
                onChange={e => onUpdateMeta({ termin: e.target.value })}
              />
            </Field>
            <Field label="Liczba uczestników">
              <input className={inputCls} type="number" min="1"
                placeholder="np. 32"
                value={meta.uczestnicy || ''}
                onChange={e => onUpdateMeta({ uczestnicy: e.target.value })}
              />
            </Field>
            <Field label="Kategoria wiekowa">
              <input className={inputCls}
                placeholder="np. Zuchy 7-10 lat"
                value={meta.wiek || ''}
                onChange={e => onUpdateMeta({ wiek: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        {/* Moduł 2: Kontakty */}
        <Module icon="📞" title="Kontakty alarmowe" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefon kierownika">
              <input className={inputCls}
                placeholder="+48 000 000 000"
                value={meta.tel_kierownik || ''}
                onChange={e => onUpdateMeta({ tel_kierownik: e.target.value })}
              />
            </Field>
            <Field label="Telefon zastępcy kierownika">
              <input className={inputCls}
                placeholder="+48 000 000 000"
                value={meta.tel_zastepca || ''}
                onChange={e => onUpdateMeta({ tel_zastepca: e.target.value })}
              />
            </Field>
            <Field label="Najbliższy szpital / SOR">
              <input className={inputCls}
                placeholder="np. Szpital Miejski w Nowym Sączu"
                value={meta.szpital || ''}
                onChange={e => onUpdateMeta({ szpital: e.target.value })}
              />
            </Field>
            <Field label="Telefon do szpitala">
              <input className={inputCls}
                placeholder="+48 000 000 000"
                value={meta.tel_szpital || ''}
                onChange={e => onUpdateMeta({ tel_szpital: e.target.value })}
              />
            </Field>
            <Field label="Pogotowie / Straż / Policja (lokalny)">
              <input className={inputCls}
                placeholder="np. Policja Olesno: +48 18 123 456"
                value={meta.tel_alarmowy || ''}
                onChange={e => onUpdateMeta({ tel_alarmowy: e.target.value })}
              />
            </Field>
            <Field label="Lekarz obozowy / pielęgniarka">
              <input className={inputCls}
                placeholder="Imię i telefon"
                value={meta.lekarz || ''}
                onChange={e => onUpdateMeta({ lekarz: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        {/* Moduł 3: Informacje organizacyjne */}
        <Module icon="🏛️" title="Informacje organizacyjne" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organ prowadzący / hufiec">
              <input className={inputCls}
                placeholder="np. Hufiec ZHP Kraków-Podgórze"
                value={meta.hufiec || ''}
                onChange={e => onUpdateMeta({ hufiec: e.target.value })}
              />
            </Field>
            <Field label="Komendant hufca (tel.)">
              <input className={inputCls}
                placeholder="+48 000 000 000"
                value={meta.komendant_tel || ''}
                onChange={e => onUpdateMeta({ komendant_tel: e.target.value })}
              />
            </Field>
            <Field label="Numer zgłoszenia / decyzji">
              <input className={inputCls}
                placeholder="np. KH-123/2025"
                value={meta.nr_zgloszenia || ''}
                onChange={e => onUpdateMeta({ nr_zgloszenia: e.target.value })}
              />
            </Field>
            <Field label="Data zgłoszenia do kuratorium">
              <input className={inputCls} type="date"
                value={meta.data_zgloszenia || ''}
                onChange={e => onUpdateMeta({ data_zgloszenia: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Uwagi / dodatkowe informacje">
              <textarea className={inputCls + ' resize-none'} rows={3}
                placeholder="Dodatkowe informacje dla inspektorów..."
                value={meta.uwagi || ''}
                onChange={e => onUpdateMeta({ uwagi: e.target.value })}
              />
            </Field>
          </div>
        </Module>

        {/* Placeholder na przyszłe moduły */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-400">
          <div className="text-3xl mb-2">＋</div>
          <p className="text-sm font-semibold">Kolejne moduły wkrótce</p>
          <p className="text-xs mt-1">Lista uczestników · Harmonogram posiłków · Budżet · Apteczka</p>
        </div>

      </div>
    </div>
  )
}
