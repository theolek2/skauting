export const DEFAULT_ARROW_COLORS = [
  { id: 'red',    hex: '#ef4444', label: 'Trasa czerwona' },
  { id: 'blue',   hex: '#3b82f6', label: 'Trasa niebieska' },
  { id: 'green',  hex: '#22c55e', label: 'Trasa zielona' },
  { id: 'orange', hex: '#f97316', label: 'Trasa pomarańczowa' },
  { id: 'purple', hex: '#a855f7', label: 'Trasa fioletowa' },
]

export const PICTOGRAM_CATEGORIES = [
  {
    name: 'Bezpieczeństwo',
    items: [
      { id: 'gasnica',     emoji: '🧯', label: 'Gaśnica' },
      { id: 'medyczny',    emoji: '🏥', label: 'Punkt medyczny' },
      { id: 'sanitarny',   emoji: '🚿', label: 'Punkt sanitarny' },
      { id: 'bezpieczne',  emoji: '✅', label: 'Miejsce bezpieczne' },
      { id: 'niebezpiecz', emoji: '⚠️', label: 'Niebezpieczeństwo' },
      { id: 'ewakuacja',   emoji: '🚪', label: 'Wyjście ewakuacyjne' },
    ],
  },
  {
    name: 'Obóz',
    items: [
      { id: 'obozowisko',  emoji: '⛺', label: 'Obozowisko' },
      { id: 'apelowy',     emoji: '🟩', label: 'Plac apelowy' },
      { id: 'toaleta',     emoji: '🚻', label: 'Toaleta' },
      { id: 'woda',        emoji: '💧', label: 'Woda pitna' },
      { id: 'smietnik',    emoji: '♻️', label: 'Śmietnik' },
      { id: 'kuchnia',     emoji: '🍳', label: 'Kuchnia / jadłodajnia' },
    ],
  },
  {
    name: 'Dojazd i służby',
    items: [
      { id: 'sluzby',      emoji: '🚒', label: 'Dojazd służb' },
      { id: 'parking',     emoji: '🅿️', label: 'Parking' },
      { id: 'wejscie',     emoji: '🔰', label: 'Wejście na teren' },
      { id: 'droga',       emoji: '🛣️', label: 'Droga dojazdowa' },
      { id: 'telefon',     emoji: '📞', label: 'Punkt telefoniczny' },
      { id: 'ppoz',        emoji: '🔴', label: 'Punkt p.poż.' },
    ],
  },
  {
    name: 'Sanepid / inspekcja',
    items: [
      { id: 'ognisko',     emoji: '🔥', label: 'Ognisko' },
      { id: 'kraal',       emoji: '🏕️', label: 'Kraal / obozo.' },
      { id: 'zastep',      emoji: '⛺', label: 'Zastęp / namiot' },
      { id: 'magazer',     emoji: '🏚️', label: 'Mauzer / magazyn' },
      { id: 'woda_pit',    emoji: '🚰', label: 'Woda pitna' },
      { id: 'mycie_rak',   emoji: '🧴', label: 'Mycie rąk' },
      { id: 'prysznic',    emoji: '🚿', label: 'Prysznice' },
      { id: 'ewak_punkt',  emoji: '🏃', label: 'Zbiórka ewakuac.' },
      { id: 'schronienie', emoji: '⛱️', label: 'Schronienie tymcz.' },
      { id: 'plac_apel',   emoji: '🟩', label: 'Plac apelowy' },
    ],
  },
]

export function makePlacedItem({ type, emoji, imageUrl, label, color, colorId, x, y }) {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,        // 'pictogram' | 'arrow' | 'custom'
    emoji,
    imageUrl,    // for custom uploads
    label,
    color,       // hex for arrows
    colorId,     // id for arrows (for legend grouping)
    x, y,
    size: 1,
    rotation: 0, // degrees, for arrows
  }
}

// Usuwa tło obrazka (uproszczone — na bazie koloru narożnika)
export async function removeBg(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target.result
      // SVG — nie potrzebuje usuwania tła
      if (file.type === 'image/svg+xml') { resolve(src); return }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const px = data.data
        // Kolor tła = lewy górny narożnik
        const bgR = px[0], bgG = px[1], bgB = px[2]
        const thr = 40
        for (let i = 0; i < px.length; i += 4) {
          if (
            Math.abs(px[i]   - bgR) < thr &&
            Math.abs(px[i+1] - bgG) < thr &&
            Math.abs(px[i+2] - bgB) < thr
          ) { px[i+3] = 0 }
        }
        ctx.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}
