const DOCUMENTS = [
  { id: 'kontaktowa',     icon: '📞', label: 'Lista kontaktowa' },
  { id: 'oswiadczenie',   icon: '📝', label: 'Oświadczenie właściciela' },
  { id: 'wojt',           icon: '🏛️', label: 'Pismo do Wójta' },
  { id: 'przewodnie',     icon: '📋', label: 'Pismo przewodnie' },
  { id: 'pojazd',         icon: '🚐', label: 'Umowa użyczenia pojazdu' },
  { id: 'schronienie',    icon: '🏠', label: 'Umowa tymcz. schronienie' },
  { id: 'nadlesnictwo',   icon: '🌲', label: 'Wniosek do Nadleśnictwa' },
  { id: 'szkola',         icon: '🏫', label: 'Udostępnienie pom. szkolnych' },
  { id: 'zawiadomienie',  icon: '📨', label: 'Zawiadomienie o obozie' },
]

export default function DocumentsTab({ meta, onNavigate }) {
  const metaOk = meta.jednostka && meta.kierownik

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">📄 Dokumenty</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generuj pisma i dokumenty wymagane do organizacji obozu — dane pobierane automatycznie
          </p>
        </div>

        {!metaOk && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold">Uzupełnij dane obozu</div>
              <div className="text-orange-600 text-xs mt-0.5">Dokumenty będą auto-wypełniane danymi z zakładki Dane obozu</div>
            </div>
            <button onClick={() => onNavigate('Dane obozu')}
              className="shrink-0 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-700 transition">
              Przejdź do danych obozu →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENTS.map(doc => (
            <button key={doc.id}
              onClick={() => alert(`Szablon "${doc.label}" — gotowy do wypełnienia po wklejeniu treści PDF`)}
              className={`flex items-center gap-4 p-4 bg-white rounded-2xl border-2 text-left transition ${
                metaOk
                  ? 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl shrink-0">{doc.icon}</span>
              <div>
                <div className="font-semibold text-sm text-gray-800 leading-tight">{doc.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">Kliknij aby wygenerować</div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-400">
          <div className="text-3xl mb-2">⁉️</div>
          <p className="text-sm font-semibold">Brakuje dokumentu?</p>
          <p className="text-xs mt-1">
            Każdy dokument zostanie wypełniony automatycznie danymi z zakładki <b>Dane obozu</b> oraz <b>Kadra</b>.
            Po wklejeniu treści PDF-ów szablony będą generować gotowe pisma.
          </p>
        </div>
      </div>
    </div>
  )
}
