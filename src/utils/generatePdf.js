import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generatePdf({ meta, activities, days, template = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const H = 297

  // ── Czcionka (latin) ────────────────────────────────────────────────────
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

  // linia dolna tytułowej
  doc.setLineWidth(0.5)
  doc.line(20, 160, W - 20, 160)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text('Wygenerowano w Aplikacji Książki Obozowej', W / 2, 168, { align: 'center' })
  doc.setTextColor(0)

  // ══════════════════════════════════════════════════════════
  // DNI — po 2 na stronie (każdy dzień = A5 pionowo)
  // ══════════════════════════════════════════════════════════
  const dayHeight = H / 2   // 148.5 mm — A5
  const marginX = 12
  const tableW = W - marginX * 2

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const isTop = i % 2 === 0

    if (isTop) {
      doc.addPage()
    }

    const offsetY = isTop ? 0 : dayHeight

    // nagłówek dnia
    doc.setFillColor(34, 85, 34)
    doc.rect(0, offsetY, W, 10, 'F')
    doc.setTextColor(255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Dzień ${i + 1}${day.label ? ' — ' + day.label : ''}`, W / 2, offsetY + 7, { align: 'center' })
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')

    // tabela zajęć
    // Scal sloty szablonu (na górze) + sloty dnia
    const allSlots = [...template, ...day.slots]
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const rows = allSlots.map(slot => [
      slot.time || '',
      slot.name || '',
      slot.description || '',
    ])

    doc.autoTable({
      startY: offsetY + 11,
      margin: { left: marginX, right: marginX },
      tableWidth: tableW,
      head: [['Godziny', 'Zajęcia', 'Opis / uwagi']],
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
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      // ogranicz wysokość do połowy strony
      pageBreak: 'avoid',
      rowPageBreak: 'avoid',
      didDrawPage: () => {},
    })

    // linia podziału między dniami
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
