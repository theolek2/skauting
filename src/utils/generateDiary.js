import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateDiary({ meta, days, wychowawca, blokiZajeciowe }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  const W = 148
  const H = 210

  // ── STRONA 1: Strona tytułowa ──────────────────────────────────────────────
  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255)
  doc.text('DZIENNIK ZAJEC', W / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Skauci Europy', W / 2, 27, { align: 'center' })

  doc.setTextColor(0)
  doc.setFontSize(11)

  const fields = [
    ['Jednostka:', meta.jednostka || ''],
    ['Kierownik:', meta.kierownik || ''],
    ['Wychowawca:', wychowawca || ''],
    ['Miejsce obozu:', meta.miejsce || ''],
    ['Termin:', meta.date_start && meta.date_end ? `${meta.date_start} - ${meta.date_end}` : (meta.termin || '')],
  ]

  let y = 56
  fields.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 15, y)
    doc.setFont('helvetica', 'normal')
    doc.text(val, 55, y)
    doc.setLineWidth(0.2)
    doc.setDrawColor(200)
    doc.line(15, y + 2, W - 15, y + 2)
    y += 14
  })

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Dokument wygenerowany przez CampOS · Skauci Europy · by Aleksander Nasilowski', W / 2, H - 8, { align: 'center' })

  // ── STRONA 2: Bloki zajęciowe ──────────────────────────────────────────────
  doc.addPage()

  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.text('BLOKI ZAJECIOWE', W / 2, 8.5, { align: 'center' })
  doc.setTextColor(0)

  if (blokiZajeciowe.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('Brak zdefiniowanych blokow zajeciowych', W / 2, 30, { align: 'center' })
  } else {
    const rows = blokiZajeciowe.map((b, i) => [
      `${i + 1}.`,
      b.nazwa || '',
      b.opis || '',
    ])
    autoTable(doc, {
      startY: 15,
      margin: { left: 12, right: 12 },
      head: [['Nr', 'Nazwa zajecia', 'Opis / cele']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 45 } },
    })
  }

  // ── STRONA 3: Lista podobiecznych (RODO — wypełniają sami) ─────────────────
  doc.addPage()

  doc.setFillColor(34, 85, 34)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.text('LISTA UCZESTNIKOW', W / 2, 8.5, { align: 'center' })
  doc.setTextColor(0)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100)
  doc.text('Uczestnicy wypelniaja liste samodzielnie (RODO)', W / 2, 18, { align: 'center' })
  doc.setTextColor(0)

  // Tabela do wypełnienia
  const emptyRows = Array.from({ length: 20 }, (_, i) => [`${i + 1}.`, '', '', ''])
  autoTable(doc, {
    startY: 22,
    margin: { left: 12, right: 12 },
    head: [['Lp.', 'Imie i nazwisko', 'Podpis', 'Uwagi']],
    body: emptyRows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
    },
  })

  // ── STRONY 4+: Plan dnia dla każdego dnia ──────────────────────────────────
  days.forEach((day, i) => {
    doc.addPage()

    const dayDate = meta.date_start
      ? (() => {
          const d = new Date(meta.date_start)
          d.setDate(d.getDate() + i)
          return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
        })()
      : ''

    // Nagłówek dnia
    doc.setFillColor(34, 85, 34)
    doc.rect(0, 0, W, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255)
    doc.text(`DZIEN ${i + 1}${day.label ? ' - ' + day.label.toUpperCase() : ''}`, W / 2, 7, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (dayDate) doc.text(dayDate, W / 2, 12, { align: 'center' })
    doc.setTextColor(0)

    // Sloty z planu zajęć
    const sorted = [...(day.slots || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const planRows = sorted.map(s => [s.time || '', s.name || '', s.description || ''])

    // Dodaj 2 puste bloki zajęciowe do wpisania przez wychowawcę
    planRows.push(
      ['', `Blok zajeciowy nr ......`, '(wychowawca wpisuje numer bloku)'],
      ['', `Blok zajeciowy nr ......`, '(wychowawca wpisuje numer bloku)'],
    )

    autoTable(doc, {
      startY: 17,
      margin: { left: 10, right: 10 },
      head: [['Godz.', 'Zajecia', 'Opis / uwagi']],
      body: planRows,
      styles: { fontSize: 8, cellPadding: 2.5, valign: 'top', overflow: 'linebreak' },
      headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 50 },
      },
      // Podświetl puste bloki zajęciowe
      didParseCell(data) {
        if (data.row.index >= planRows.length - 2 && data.section === 'body') {
          data.cell.styles.fontStyle = 'italic'
          data.cell.styles.textColor = [100, 100, 100]
          data.cell.styles.fillColor = [245, 245, 245]
        }
      },
    })

    // Podpis wychowawcy
    const finalY = doc.lastAutoTable?.finalY || 160
    if (finalY < H - 25) {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Podpis wychowawcy: ____________________________', 12, Math.min(finalY + 10, H - 15))
    }
  })

  doc.save(`dziennik_${(wychowawca || 'oboz').replace(/\s+/g, '_')}.pdf`)
}
