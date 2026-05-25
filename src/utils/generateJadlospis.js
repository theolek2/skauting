import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateJadlospisPdf({ meta, days }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const H = 210

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(34, 85, 34)
  doc.text('JADŁOSPIS', W / 2, 15, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${meta.jednostka || ''} · ${meta.miejsce || ''} · ${(meta.date_start && meta.date_end) ? `${meta.date_start} – ${meta.date_end}` : ''}`, W / 2, 23, { align: 'center' })

  let y = 30
  days.forEach((day, i) => {
    if (y > H - 40) { doc.addPage(); y = 15 }
    doc.setFillColor(34, 85, 34)
    doc.rect(10, y, W - 20, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255)
    doc.text(`Dzień ${i + 1}${day.label ? ' – ' + day.label : ''}`, 14, y + 5.5)
    y += 10

    const slots = [...(day.mealSlots || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    if (slots.length > 0) {
      const rows = slots.map(s => [s.time || '', s.name || '', s.ingredients || '', s.description || ''])
      autoTable(doc, {
        startY: y, margin: { left: 10, right: 10 },
        head: [['Godz.', 'Posiłek', 'Składniki', 'Opis']],
        body: rows,
        styles: { fontSize: 7, cellPadding: 2, font: 'helvetica', fontStyle: 'normal' },
        headStyles: { fillColor: [60, 120, 60], textColor: 255, fontSize: 7, font: 'helvetica', fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 40 }, 2: { cellWidth: 70 } },
      })
      y = (doc.lastAutoTable?.finalY || y) + 4
    } else {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Brak posiłków', 14, y + 4)
      y += 10
    }
  })

  doc.save('jadlospis.pdf')
}

export function getShoppingList(days, dateStart) {
  const windows = []
  for (let i = 0; i < days.length; i += 2) {
    const d1 = new Date(dateStart); d1.setDate(d1.getDate() + i)
    const d2 = new Date(dateStart); d2.setDate(d2.getDate() + Math.min(i + 1, days.length - 1))
    const fmt = (d) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric', year: '2-digit' })
    const label = `${fmt(d1)} – ${fmt(d2)}`

    const items = {}
    for (let j = i; j < Math.min(i + 2, days.length); j++) {
      const slots = days[j]?.mealSlots || []
      slots.forEach(s => {
        const ings = s.ingredients
        if (!ings) return
        // Nowy format: tablica obiektów {name, qty, unit}
        if (Array.isArray(ings)) {
          ings.forEach(ing => {
            const key = (ing.name || '').toLowerCase()
            const qty = ing.qty || 0
            items[key] = { name: ing.name, qty: (items[key]?.qty || 0) + qty, unit: ing.unit || 'szt' }
          })
        // Stary format: string z przecinkami
        } else if (typeof ings === 'string') {
          ings.split(',').map(x => x.trim()).filter(Boolean).forEach(ing => {
            const key = ing.toLowerCase()
            items[key] = { name: ing, qty: (items[key]?.qty || 0) + 1, unit: '' }
          })
        }
      })
    }
    windows.push({ label, items: Object.values(items).sort((a, b) => a.name.localeCompare(b.name)) })
  }
  return windows
}

export function generateShoppingListPdf({ days, dateStart }) {
  const list = getShoppingList(days, dateStart)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const H = 297

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(34, 85, 34)
  doc.text('LISTA ZAKUPÓW', W / 2, 15, { align: 'center' })

  let y = 25
  list.forEach(window => {
    if (y > H - 40) { doc.addPage(); y = 15 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(window.label, 14, y)
    y += 6

    if (window.items.length > 0) {
      const rows = window.items.map(it => [it.name, `×${it.qty}`])
      autoTable(doc, {
        startY: y, margin: { left: 14, right: 14 },
        body: rows,
        styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica', fontStyle: 'normal' },
        columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 30, halign: 'right' } },
        theme: 'plain',
        alternateRowStyles: { fillColor: [245, 250, 245] },
      })
      y = (doc.lastAutoTable?.finalY || y) + 6
    } else {
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Brak składników', 14, y + 4)
      y += 8
    }
  })

  doc.save('lista_zakupow.pdf')
}
