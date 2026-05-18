import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Nagłówek i stopka każdego dokumentu
const DOC_HEADER = `
<div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #2d6a2d;padding-bottom:10px;margin-bottom:18px;">
  <img src="/logo.png" style="height:52px;width:auto;object-fit:contain;" onerror="this.style.display='none'"/>
  <div>
    <div style="font-weight:bold;font-size:12pt;color:#1a4a1a;">Skauci Europy</div>
    <div style="font-size:9pt;color:#444;">Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego</div>
  </div>
</div>`

const DOC_FOOTER = `
<div style="border-top:1px solid #ddd;margin-top:28px;padding-top:8px;text-align:center;font-size:8pt;color:#999;">
  skauci-europy.pl · Skauci Europy
</div>`

// Parsuj {{CHOICE:id:opcja1|opcja2}} → wyciągnij listę wyborów
function parseChoices(html) {
  const choices = {}
  const regex = /\{\{CHOICE:([^:}]+):([^}]+)\}\}/g
  let m
  while ((m = regex.exec(html)) !== null) {
    const id = m[1]
    const options = m[2].split('|')
    if (!choices[id]) choices[id] = { options, selected: 0 }
  }
  return choices
}

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave, recipients, multiRecipient }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(() =>
    recipients ? recipients[0]?.id : null
  )
  const [choices, setChoices] = useState(() => parseChoices(templateHtml || ''))

  const currentRecipient = recipients?.find(r => r.id === selectedRecipient)

  const recipientName = (() => {
    if (!currentRecipient) return '<p style="color:#999;">Wybierz odbiorcę powyżej</p>'
    const gpsMap = { psp: meta.psp, policja: meta.policja, szpital: meta.szpital, wojt: meta.gmina, nadlesnictwo: meta.nadlesnictwo }
    const addr = gpsMap[currentRecipient.id] || currentRecipient.addr || ''
    return `<p style="font-weight:bold;margin-bottom:2px;">${currentRecipient.label}</p><p style="margin-bottom:8px;">${addr}</p>`
  })()

  const processedHtml = useMemo(() => {
    if (!templateHtml) return ''
    const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
    const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

    const replacements = {
      data_dzis: today,
      jednostka: meta.jednostka || '.....................',
      kierownik: meta.kierownik || '.....................',
      tel_kierownik: meta.tel_kierownik || '.....................',
      miejsce: meta.miejsce || '.....................',
      termin: (meta.date_start && meta.date_end)
        ? `${meta.date_start} – ${meta.date_end}`
        : (meta.termin || '.....................'),
      date_start: meta.date_start || '.....................',
      date_end: meta.date_end || '.....................',
      uczestnicy: meta.uczestnicy || '...',
      wiek: meta.wiek || '.....................',
      email: meta.email || '.....................',
      liczba_kadry: meta.liczba_kadry || '...',
      gmina: meta.gmina || '.....................',
      powiat: meta.powiat || '.....................',
      wojewodztwo: meta.wojewodztwo || '.....................',
      nadlesnictwo: meta.nadlesnictwo || '.....................',
      lesnictwo: meta.lesnictwo || '.....................',
      oddzial_lesny: meta.oddzial_lesny || '...',
      nr_dzialki: meta.nr_dzialki || '.....................',
      policja: meta.policja || '.....................',
      psp: meta.psp || '.....................',
      szpital: meta.szpital || '.....................',
      przychodnia: meta.przychodnia || '.....................',
      tel_przychodnia: meta.tel_przychodnia || '.....................',
      hufiec: meta.hufiec || '.....................',
      bezp_miejscowosc: meta.bezp_miejscowosc || '.....................',
      bezp_budynek: meta.bezp_budynek || '.....................',
      bezp_adres: meta.bezp_adres || '.....................',
      schronienie: meta.schronienie || '.....................',
      recipient_name: recipientName,
      kontakt1: wychowawcy[0]?.name || '.................................',
      tel_kontakt1: wychowawcy[0]?.phone || '.........................',
      kontakt2: wychowawcy[1]?.name || '.................................',
      tel_kontakt2: wychowawcy[1]?.phone || '.........................',
    }

    let html = templateHtml

    // Zastąp {{VAR}} podświetlonymi spanami
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex,
        `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

    // Zastąp {{CHOICE:id:opcja1|opcja2}} selektami
    html = html.replace(/\{\{CHOICE:([^:}]+):([^}]+)\}\}/g, (_, id, opts) => {
      const options = opts.split('|')
      const selectedIdx = choices[id]?.selected ?? 0
      const selectedVal = options[selectedIdx] || options[0]
      const optionsHtml = options.map((o, i) =>
        `<option value="${i}"${i === selectedIdx ? ' selected' : ''}>${o}</option>`
      ).join('')
      return `<select contenteditable="false" data-choice="${id}"
        style="background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;color:#92400e;
               padding:2px 6px;font-size:inherit;font-family:inherit;cursor:pointer;
               font-weight:bold;" onchange="window.__docChoice && window.__docChoice(this)">${optionsHtml}</select>`
    })

    // Opakuj w header + footer
    return DOC_HEADER + html + DOC_FOOTER
  }, [templateHtml, meta, recipientName, choices])

  // Podłącz globalny handler dla select-ów w contentEditable
  useEffect(() => {
    window.__docChoice = (sel) => {
      const id = sel.getAttribute('data-choice')
      const idx = parseInt(sel.value)
      setChoices(prev => ({ ...prev, [id]: { ...prev[id], selected: idx } }))
    }
    return () => { delete window.__docChoice }
  }, [])

  useEffect(() => {
    if (editorRef.current && processedHtml) {
      editorRef.current.innerHTML = processedHtml
    }
  }, [processedHtml])

  const handleExport = async () => {
    if (!editorRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(editorRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgW = 210
      const imgH = (canvas.height * imgW) / canvas.width
      let y = 0
      const pageH = 297
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, imgW, imgH)
        y += pageH
      }
      pdf.save(`${(docLabel || 'dokument').replace(/\s+/g, '_')}.pdf`)
    } catch (e) {
      alert('Błąd eksportu PDF: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="flex items-center justify-between px-4 py-2 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-800 text-sm truncate max-w-xs">{docLabel || 'Dokument'}</h2>
            <span className="text-xs text-gray-400 hidden sm:block">Kliknij tekst aby edytować · 🟡 pola wyboru · 🔵 dane auto</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={saving}
              className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition disabled:opacity-50">
              {saving ? '⏳ Eksport...' : '📥 Eksportuj PDF'}
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
            padding: '18mm 20mm',
            fontFamily: "'Segoe UI', Arial, sans-serif",
            fontSize: '10.5pt',
            lineHeight: '1.55',
            color: '#111',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
