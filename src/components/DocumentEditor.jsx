import { useState, useRef, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave, recipients, multiRecipient }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState(() =>
    recipients ? new Set() : null
  )

  const toggleRecipient = (id) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (!recipients) return
    setSelectedRecipients(new Set(recipients.map(r => r.id)))
  }

  const clearAll = () => {
    setSelectedRecipients(new Set())
  }

  const currentRecipientHeader = useMemo(() => {
    if (!recipients || !selectedRecipients) return ''
    const sel = recipients.filter(r => selectedRecipients.has(r.id))
    if (sel.length === 0) return ''
    return sel.map(r => `<p style="margin-bottom:2px;font-weight:bold;">Do: ${r.label}</p><p style="margin-bottom:8px;">${r.addr}</p>`).join('')
  }, [recipients, selectedRecipients])

  const processedHtml = useMemo(() => {
    if (!templateHtml) return ''
    const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
    const wychowawcyListHtml = wychowawcy.length > 0
      ? wychowawcy.map(w => `<p>${w.name}${w.phone ? ' — tel. ' + w.phone : ''}</p>`).join('')
      : '<p style="color:#999;">Brak wychowawców w danych obozu</p>'

    const replacements = {
      jednostka: meta.jednostka || '...........',
      kierownik: meta.kierownik || '...........',
      tel_kierownik: meta.tel_kierownik || '...........',
      miejsce: meta.miejsce || '...........',
      termin: (meta.date_start && meta.date_end) ? `${meta.date_start} – ${meta.date_end}` : (meta.termin || '...........'),
      date_start: meta.date_start || '...........',
      date_end: meta.date_end || '...........',
      uczestnicy: meta.uczestnicy || '...',
      wiek: meta.wiek || '...........',
      bezp_miejscowosc: meta.bezp_miejscowosc || '...........',
      bezp_budynek: meta.bezp_budynek || '...........',
      bezp_adres: meta.bezp_adres || '...........',
      email: meta.email || '...........',
      liczba_kadry: meta.liczba_kadry || '...',
      gmina: meta.gmina || '...........',
      powiat: meta.powiat || '...........',
      nadlesnictwo: meta.nadlesnictwo || '...........',
      lesnictwo: meta.lesnictwo || '...........',
      oddzial_lesny: meta.oddzial_lesny || '...........',
      nr_dzialki: meta.nr_dzialki || '...........',
      policja: meta.policja || '...........',
      psp: meta.psp || '...........',
      przychodnia: meta.przychodnia || '...........',
      tel_przychodnia: meta.tel_przychodnia || '...........',
      wychowawcy_list: wychowawcyListHtml,
      hufiec: meta.hufiec || '...........',
      recipient_header: currentRecipientHeader || '<p style="color:#999;">Wybierz odbiorców pisma poniżej</p>',
    }

    let html = templateHtml
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex, `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

    return html
  }, [templateHtml, meta, currentRecipientHeader])

  useEffect(() => {
    if (editorRef.current && processedHtml) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [processedHtml])

  const handleExport = async () => {
    if (!editorRef.current) return
    if (multiRecipient && selectedRecipients && selectedRecipients.size > 1) {
      // Eksportuj osobno dla każdego odbiorcy
      const sel = recipients.filter(r => selectedRecipients.has(r.id))
      for (const r of sel) {
        setSelectedRecipients(new Set([r.id]))
        await new Promise(resolve => setTimeout(resolve, 300)) // wait for re-render
        try {
          const canvas = await html2canvas(editorRef.current, { scale: 2, backgroundColor: '#ffffff' })
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
          const imgW = 210
          const imgH = (canvas.height * imgW) / canvas.width
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
          pdf.save(`${(docLabel || 'dokument').replace(/\s+/g, '_')}_${r.label.replace(/\s+/g, '_')}.pdf`)
        } catch { /* skip errors in batch */ }
      }
      setSelectedRecipients(sel.length > 0 ? new Set(sel.map(r => r.id)) : new Set())
      return
    }
    // Pojedynczy eksport
    try {
      const canvas = await html2canvas(editorRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgW = 210
      const imgH = (canvas.height * imgW) / canvas.width
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      pdf.save(`${(docLabel || 'dokument').replace(/\s+/g, '_')}.pdf`)
    } catch {
      alert('Błąd eksportu PDF')
    }
  }

  const handleSaveDraft = () => {
    if (!editorRef.current) return
    setSaving(true)
    onSave(editorRef.current.innerHTML)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Toolbar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="flex items-center justify-between px-4 py-2 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-800 text-sm truncate max-w-xs">{docLabel || 'Dokument'}</h2>
            <span className="text-xs text-gray-400 hidden sm:block">Edytuj tekst bezpośrednio — kliknij i pisz</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={saving}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              {saving ? 'Zapisywanie...' : '💾 Zapisz'}
            </button>
            <button onClick={handleExport}
              className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition">
              📥 {multiRecipient && selectedRecipients && selectedRecipients.size > 1 ? `Eksportuj ${selectedRecipients.size} PDF-y` : 'Eksportuj PDF'}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition font-bold text-lg leading-none">×</button>
          </div>
        </div>

        {/* Selector odbiorców */}
        {multiRecipient && recipients && (
          <div className="border-t border-gray-100 px-4 py-2 max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1">Odbiorcy:</span>
            {recipients.map(r => (
              <button key={r.id}
                onClick={() => toggleRecipient(r.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  selectedRecipients.has(r.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                }`}>
                {selectedRecipients.has(r.id) ? '✓ ' : ''}{r.label}
              </button>
            ))}
            <span className="text-gray-300 mx-1">|</span>
            <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Wszyscy</button>
            <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">Wyczyść</button>
          </div>
        )}
      </div>

      {/* Editor A4 */}
      <div className="flex-1 flex justify-center p-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="bg-white shadow-2xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: '11pt',
            lineHeight: '1.6',
            color: '#111',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
