import { useState, useRef, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const processedHtml = useMemo(() => {
    if (!templateHtml) return ''
    const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
    const wychowawcyListHtml = wychowawcy.length > 0
      ? wychowawcy.map(w => `<p>${w.name}${w.phone ? ' — tel. ' + w.phone : ''}</p>`).join('')
      : '<p style="color:#999;">Brak wychowawc\u00f3w w danych obozu</p>'

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
      szpital: meta.szpital || '...........',
      tel_szpital: meta.tel_szpital || '...........',
      tel_alarmowy: meta.tel_alarmowy || '...........',
      lekarz: meta.lekarz || '...........',
      wychowawcy_list: wychowawcyListHtml,
      hufiec: meta.hufiec || '...........',
    }

    let html = templateHtml
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex, `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

    return html
  }, [templateHtml, meta])

  useEffect(() => {
    if (editorRef.current && processedHtml) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [processedHtml])

  const handleExport = async () => {
    if (!editorRef.current) return
    try {
      const canvas = await html2canvas(editorRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${(docLabel || 'dokument').replace(/\s+/g, '_')}.pdf`)
    } catch {
      alert('B\u0142\u0105d eksportu PDF')
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
            <span className="text-xs text-gray-400 hidden sm:block">Edytuj tekst bezpo\u015brednio — kliknij i pisz</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={saving}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              {saving ? 'Zapisywanie...' : '\uD83D\uDCBE Zapisz'}
            </button>
            <button onClick={handleExport}
              className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition">
              \uD83D\uDCE5 Eksportuj PDF
            </button>
            <button onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 text-lg leading-none">\u2715</button>
          </div>
        </div>
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
