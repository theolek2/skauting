import { useState } from 'react'
import { DOC_TEMPLATES } from '../data/dokumenty-szablony.js'
import DocumentEditor from './DocumentEditor.jsx'

const STORAGE_KEY = 'skauting_custom_docs'

function loadCustomDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomDocs(docs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.slice(0, 30))) } catch {}
}

const BUILTIN_DOCS = Object.entries(DOC_TEMPLATES).map(([id, t]) => ({ id, ...t, builtin: true }))

export default function DocumentsTab({ meta, onNavigate }) {
  const metaOk = meta.jednostka && meta.kierownik

  const [selectedDoc, setSelectedDoc] = useState(null)
  const [customDocs, setCustomDocs] = useState(loadCustomDocs)

  const allDocs = [...BUILTIN_DOCS, ...customDocs.map(d => ({ ...d, builtin: false }))]

  const handleAddCustom = () => {
    const label = prompt('Nazwa nowego dokumentu:')
    if (!label || !label.trim()) return
    const doc = { id: `cd_${Date.now()}`, label: label.trim(), html: '', updatedAt: new Date().toISOString() }
    const updated = [doc, ...customDocs]
    setCustomDocs(updated)
    saveCustomDocs(updated)
    setSelectedDoc({ ...doc, builtin: false })
  }

  const handleDeleteCustom = (id) => {
    const updated = customDocs.filter(d => d.id !== id)
    setCustomDocs(updated)
    saveCustomDocs(updated)
  }

  const handleSave = (html) => {
    if (!selectedDoc || selectedDoc.builtin) return
    const updated = customDocs.map(d =>
      d.id === selectedDoc.id ? { ...d, html, updatedAt: new Date().toISOString() } : d
    )
    setCustomDocs(updated)
    saveCustomDocs(updated)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-green-900">{'\uD83D\uDCC4'} Dokumenty</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generuj pisma i dokumenty wymagane do organizacji obozu — dane pobierane automatycznie
          </p>
        </div>

        {!metaOk && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex items-center gap-3">
            <span className="text-xl shrink-0">{'\u26A0\uFE0F'}</span>
            <div className="flex-1">
              <div className="font-semibold">Uzupe\u0142nij dane obozu</div>
              <div className="text-orange-600 text-xs mt-0.5">Dokumenty b\u0119d\u0105 auto-wype\u0142niane danymi z zak\u0142adki Dane obozu</div>
            </div>
            <button onClick={() => onNavigate('Dane obozu')}
              className="shrink-0 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-700 transition">
              Przejd\u017A do danych obozu \u2192
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDocs.map(doc => (
            <div key={doc.id} className="relative group">
              <button
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 text-left transition ${
                  metaOk
                    ? 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                    : 'border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl shrink-0">{doc.icon || '\uD83D\uDCC4'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 leading-tight truncate">{doc.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {doc.builtin ? 'Szablon wbudowany' : `W\u0142asny \u2022 ${new Date(doc.updatedAt).toLocaleDateString('pl-PL')}`}
                  </div>
                </div>
              </button>
              {!doc.builtin && (
                <button onClick={() => handleDeleteCustom(doc.id)}
                  className="absolute top-1 right-1 text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center">
                  \u00D7
                </button>
              )}
            </div>
          ))}
        </div>

        {metaOk && (
          <button onClick={handleAddCustom}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition">
            + Dodaj w\u0142asny dokument
          </button>
        )}
      </div>

      {/* Edytor full screen */}
      {selectedDoc && (
        <DocumentEditor
          templateHtml={selectedDoc.html || ''}
          meta={meta}
          docLabel={selectedDoc.label}
          onClose={() => setSelectedDoc(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
