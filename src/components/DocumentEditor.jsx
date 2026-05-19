import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

// ── Generatory treści załączników ──────────────────────────────────────────────

function generateContactsHtml(meta) {
  const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
  return DOC_HEADER + `
<div style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:18px;">ŚRODKI ŁĄCZNOŚCI</div>
<div style="font-size:10pt;color:#555;margin-bottom:14px;">Załącznik do pisma przewodniego – dane kontaktowe kadry obozu</div>

<table style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:18px;">
  <tr style="background:#2d6a2d;color:#fff;">
    <th style="padding:8px 10px;text-align:left;">Kierownik wypoczynku</th>
    <th style="padding:8px 10px;text-align:left;">Telefon</th>
    <th style="padding:8px 10px;text-align:left;">E-mail</th>
  </tr>
  <tr style="background:#f0fdf4;">
    <td style="padding:8px 10px;font-weight:bold;">${meta.kierownik || '...'}</td>
    <td style="padding:8px 10px;">${meta.tel_kierownik || '...'}</td>
    <td style="padding:8px 10px;">${meta.email || '...'}</td>
  </tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
  <tr style="background:#2d6a2d;color:#fff;">
    <th style="padding:8px 10px;text-align:left;width:3em;">Nr</th>
    <th style="padding:8px 10px;text-align:left;">Wychowawca</th>
    <th style="padding:8px 10px;text-align:left;">Telefon</th>
  </tr>
  ${wychowawcy.length === 0 ? `<tr><td colspan="3" style="padding:16px 10px;text-align:center;color:#999;">Brak wychowawców — dodaj w Danych Obozu</td></tr>` : ''}
  ${wychowawcy.map((w, i) => `
  <tr style="background:${i % 2 === 0 ? '#f0fdf4' : '#fff'};">
    <td style="padding:8px 10px;">${i + 1}</td>
    <td style="padding:8px 10px;font-weight:bold;">${w.name}</td>
    <td style="padding:8px 10px;">${w.phone || '...'}</td>
  </tr>`).join('')}
</table>

<div style="margin-top:20px;font-size:9pt;color:#666;border:1px solid #d1d5db;border-radius:8px;padding:12px 16px;background:#f9fafb;">
  <b>Numery alarmowe (stałe):</b><br/>
  &bull; Pogotowie: <b>999</b> / <b>112</b><br/>
  &bull; Straż Pożarna: <b>998</b> — ${meta.psp || '...'}<br/>
  &bull; Policja: <b>997</b> — ${meta.policja || '...'}<br/>
  &bull; Szpital/Przychodnia: ${meta.szpital || meta.przychodnia || '...'}
</div>
` + DOC_FOOTER
}

function generateParticipantsHtml(_meta) {
  const rows = 20
  return DOC_HEADER + `
<div style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:18px;">LISTA UCZESTNIKÓW</div>
<div style="font-size:10pt;color:#555;margin-bottom:14px;">Załącznik do pisma przewodniego</div>

<p style="font-size:9pt;color:#e11d48;background:#fef2f2;padding:8px 12px;border-radius:6px;margin-bottom:14px;font-weight:bold;">⚠️ Tu trzeba wpisać imiona — kliknij w pola tabeli i edytuj</p>

<table style="width:100%;border-collapse:collapse;font-size:10pt;">
  <tr style="background:#2d6a2d;color:#fff;">
    <th style="padding:8px 10px;text-align:center;width:3em;">Lp.</th>
    <th style="padding:8px 10px;text-align:left;">Imię i nazwisko</th>
    <th style="padding:8px 10px;text-align:center;width:8em;">Rok urodzenia</th>
  </tr>
  ${Array.from({ length: rows }, (_, i) => `
  <tr style="background:${i % 2 === 0 ? '#f0fdf4' : '#fff'};">
    <td style="padding:10px 10px;text-align:center;color:#666;">${i + 1}</td>
    <td style="padding:10px 10px;color:#aaa;border-bottom:1px solid #e5e7eb;">............................</td>
    <td style="padding:10px 10px;text-align:center;color:#aaa;border-bottom:1px solid #e5e7eb;">..........</td>
  </tr>`).join('')}
</table>

<div style="margin-top:22px;text-align:right;font-size:9pt;">
  <div style="display:inline-block;text-align:center;">
    <div style="border-top:1px solid #333;width:180px;margin-bottom:4px;"></div>
    <span style="color:#666;">podpis kierownika</span>
  </div>
</div>
` + DOC_FOOTER
}

function generatePlaceholderHtml(icon, label) {
  return DOC_HEADER + `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:480px;text-align:center;color:#9ca3af;">
  <div style="font-size:64px;margin-bottom:16px;">${icon}</div>
  <div style="font-size:16pt;font-weight:bold;color:#6b7280;margin-bottom:8px;">${label}</div>
  <div style="font-size:11pt;max-width:340px;">
    Ta sekcja zostanie uzupełniona później.<br/>
    Możesz dodać własny PDF — poeksportuj go jako obrazek i zaimportuj w edytorze.
  </div>
</div>
` + DOC_FOOTER
}

// ── Główny komponent ──────────────────────────────────────────────────────────

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave, recipients, multiRecipient, attachments }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(() =>
    recipients ? recipients[0]?.id : null
  )
  const [choices, setChoices] = useState(() => parseChoices(templateHtml || ''))
  const [activeTab, setActiveTab] = useState('main')

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

    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex,
        `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

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

    return html
  }, [templateHtml, meta, recipientName, choices])

  useEffect(() => {
    window.__docChoice = (sel) => {
      const id = sel.getAttribute('data-choice')
      const idx = parseInt(sel.value)
      setChoices(prev => ({ ...prev, [id]: { ...prev[id], selected: idx } }))
    }
    return () => { delete window.__docChoice }
  }, [])

  // Renderuj treść do edytora przy zmianie zakładki
  useEffect(() => {
    if (!editorRef.current) return

    if (activeTab === 'main') {
      const full = DOC_HEADER + processedHtml + DOC_FOOTER
      editorRef.current.innerHTML = full
      editorRef.current.contentEditable = 'true'
    } else {
      const att = (attachments || []).find(a => a.id === activeTab)
      if (!att) return
      let content
      switch (att.type) {
        case 'contacts':     content = generateContactsHtml(meta); break
        case 'participants': content = generateParticipantsHtml(meta); break
        default:            content = generatePlaceholderHtml(att.icon || '📄', att.label); break
      }
      editorRef.current.innerHTML = content
      editorRef.current.contentEditable = (att.type === 'participants' || att.type === 'placeholder') ? 'true' : 'false'
    }
  }, [activeTab, processedHtml, meta])

  const activeLabel = activeTab === 'main'
    ? docLabel
    : ((attachments || []).find(a => a.id === activeTab)?.label || docLabel)

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
      pdf.save(`${(activeLabel || 'dokument').replace(/\s+/g, '_')}.pdf`)
    } catch (e) {
      alert('Błąd eksportu PDF: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const tabItems = [
    { id: 'main', label: docLabel || 'Pismo',   icon: '📄' },
    ...(attachments || []).map(a => ({ id: a.id, label: a.label, icon: a.icon || '📎' })),
  ]

  const isAttachment = activeTab !== 'main'
  const currentAtt = isAttachment ? (attachments || []).find(a => a.id === activeTab) : null

  return (
    <div className="fixed inset-0 z-[3000] flex bg-gray-900/60 backdrop-blur-sm">
      {/* ── Lewy sidebar ── */}
      <div className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <button onClick={onClose}
            className="w-full text-left text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
            <span className="text-lg leading-none">←</span> Zamknij
          </button>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1 mt-1">Dokument</p>
          {tabItems.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition mb-0.5 ${
                activeTab === tab.id
                  ? 'bg-green-100 text-green-800 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <span className="text-base">{tab.icon}</span>
              <span className="truncate text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
        {isAttachment && currentAtt && (
          <div className="mt-auto p-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {currentAtt.type === 'contacts'
                ? 'Auto-wypełniane z Danych Obozu'
                : currentAtt.type === 'participants'
                ? 'Kliknij w tabelę aby edytować'
                : 'Do uzupełnienia później'}
            </p>
          </div>
        )}
      </div>

      {/* ── Główny obszar ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-800 text-sm truncate max-w-xs">{activeLabel}</h2>
              <span className="text-xs text-gray-400 hidden sm:block">
                {activeTab === 'main' ? 'Kliknij tekst aby edytować · 🟡 pola wyboru · 🔵 dane auto' : 'Załącznik'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} disabled={saving}
                className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition disabled:opacity-50">
                {saving ? '⏳ Eksport...' : '📥 Eksportuj PDF'}
              </button>
            </div>
          </div>

          {multiRecipient && recipients && activeTab === 'main' && (
            <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2 flex-wrap">
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

        <div className="flex-1 flex justify-center p-6 overflow-y-auto">
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
    </div>
  )
}
