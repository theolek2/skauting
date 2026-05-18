import { useState, useRef, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave, recipients, multiRecipient }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(() =>
    recipients ? recipients[0]?.id : null
  )

  const currentRecipient = recipients?.find(r => r.id === selectedRecipient)

  const recipientName = (() => {
    if (!currentRecipient) return '<p style="color:#999;">Wybierz odbiorcę powyżej</p>'
    // Auto-fill adresu z danych GPS jeśli dostępne
    const gpsMap = { psp: meta.psp, policja: meta.policja, szpital: meta.szpital, wojt: meta.gmina, nadlesnictwo: meta.nadlesnictwo }
    const addr = gpsMap[currentRecipient.id] || currentRecipient.addr
    return `<p style="font-weight:bold;margin-bottom:2px;">Do: ${currentRecipient.label}</p><p style="margin-bottom:8px;">${addr}</p>`
  })()

  const processedHtml = useMemo(() => {
    if (!templateHtml) return ''
    const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)

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
      szpital: meta.szpital || '...........',
      przychodnia: meta.przychodnia || '...........',
      tel_przychodnia: meta.tel_przychodnia || '...........',
      hufiec: meta.hufiec || '...........',
      bezp_miejscowosc: meta.bezp_miejscowosc || '...........',
      bezp_budynek: meta.bezp_budynek || '...........',
      bezp_adres: meta.bezp_adres || '...........',
      recipient_name: recipientName,
      recipient_addr: '',
      kontakt1: wychowawcy[0]?.name || '.................................',
      tel_kontakt1: wychowawcy[0]?.phone || '.........................',
      kontakt2: wychowawcy[1]?.name || '.................................',
      tel_kontakt2: wychowawcy[1]?.phone || '.........................',
    }

    let html = templateHtml
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex, `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

    return html
  }, [templateHtml, meta, recipientName])

  useEffect(() => {
    if (editorRef.current && processedHtml) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [processedHtml])

  const handleExport = async () => {
    if (!editorRef.current) return
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
              📥 Eksportuj PDF
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition font-bold text-lg leading-none">×</button>
          </div>
        </div>

        {multiRecipient && recipients && (
          <div className="border-t border-gray-100 px-4 py-2 max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1">Odbiorca:</span>
            {recipients.map(r => (
              <button key={r.id}
                onClick={() => setSelectedRecipient(r.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  selectedRecipient === r.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                }`}>
                {selectedRecipient === r.id ? '● ' : '○ '}{r.label}
              </button>
            ))}
          </div>
        )}
      </div>

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
