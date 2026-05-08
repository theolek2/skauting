import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generatePdf({ meta, activities, days, template = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const H = 297

  doc.setFont('helvetica')

  // ══════════════════════════════════════════════════════════
  // STRONA TYTUŁOWA
  // ══════════════════════════════════════════════════════════
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Ramowy plan pracy', W / 2, 80, { align: 'center' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Jednostka: ${meta.jednostka || '—'}`, W / 2, 105, { align: 'center' })
  doc.text(`Kierownik: ${meta.kierownik || '—'}`, W / 2, 115, { align: 'center' })

  if (meta.miejsce) {
    doc.text(`Miejsce: ${meta.miejsce}`, W / 2, 125, { align: 'center' })
  }
  if (meta.termin) {
    doc.text(`Termin: ${meta.termin}`, W / 2, 135, { align: 'center' })
  }

  doc.setLineWidth(0.5)
  doc.line(20, 160, W - 20, 160)
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text('Skauci Europy · Aplikacja Ksiazki Obozowej', W / 2, 168, { align: 'center' })
  doc.text('by Aleksander Nasilowski', W / 2, 174, { align: 'center' })
  doc.setTextColor(0)

  // ══════════════════════════════════════════════════════════
  // DNI — po 2 na stronie (kazdy dzien = A5)
  // ══════════════════════════════════════════════════════════
  const dayHeight = H / 2
  const marginX = 12
  const tableW = W - marginX * 2

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const isTop = i % 2 === 0

    if (isTop) {
      doc.addPage()
    }

    const offsetY = isTop ? 0 : dayHeight

    // Naglowek dnia
    doc.setFillColor(34, 85, 34)
    doc.rect(0, offsetY, W, 10, 'F')
    doc.setTextColor(255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `Dzien ${i + 1}${day.label ? ' — ' + day.label : ''}`,
      W / 2, offsetY + 7,
      { align: 'center' }
    )
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')

    // Scal szablon + sloty dnia, posortuj po godzinie
    const allSlots = [...template, ...day.slots]
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const rows = allSlots.map(slot => [
      slot.time || '',
      slot.name || '',
      slot.description || '',
    ])

    autoTable(doc, {
      startY: offsetY + 11,
      margin: { left: marginX, right: marginX },
      tableWidth: tableW,
      head: [['Godziny', 'Zajecia', 'Opis / uwagi']],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        valign: 'top',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [60, 120, 60],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 55 },
        2: { cellWidth: tableW - 22 - 55 },
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2,
    })

    // Linia podzialu miedzy dniami
    if (isTop) {
      doc.setDrawColor(180)
      doc.setLineWidth(0.3)
      doc.setLineDash([3, 2])
      doc.line(0, dayHeight, W, dayHeight)
      doc.setLineDash([])
    }
  }

  doc.save('ramowy_plan_pracy.pdf')
}
