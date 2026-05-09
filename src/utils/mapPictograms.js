export const ARROW_COLORS = [
  { id: 'red',    hex: '#ef4444', label: 'Czerwona' },
  { id: 'blue',   hex: '#3b82f6', label: 'Niebieska' },
  { id: 'green',  hex: '#22c55e', label: 'Zielona' },
  { id: 'orange', hex: '#f97316', label: 'Pomarańczowa' },
  { id: 'purple', hex: '#a855f7', label: 'Fioletowa' },
]

export const ARROW_DIRECTIONS = [
  { id: 'up',    symbol: '↑', angle: 0 },
  { id: 'down',  symbol: '↓', angle: 180 },
  { id: 'left',  symbol: '←', angle: 270 },
  { id: 'right', symbol: '→', angle: 90 },
  { id: 'ne',    symbol: '↗', angle: 45 },
  { id: 'se',    symbol: '↘', angle: 135 },
  { id: 'sw',    symbol: '↙', angle: 225 },
  { id: 'nw',    symbol: '↖', angle: 315 },
]

export const PICTOGRAM_CATEGORIES = [
  {
    name: 'Bezpieczeństwo',
    items: [
      { id: 'gasnica',       emoji: '🧯', label: 'Gaśnica' },
      { id: 'medyczny',      emoji: '🏥', label: 'Punkt medyczny' },
      { id: 'sanitarny',     emoji: '🚿', label: 'Punkt sanitarny' },
      { id: 'bezpieczne',    emoji: '✅', label: 'Miejsce bezpieczne' },
      { id: 'niebezpiecz',   emoji: '⚠️', label: 'Niebezpieczeństwo' },
      { id: 'ewakuacja',     emoji: '🚪', label: 'Wyjście ewakuacyjne' },
    ],
  },
  {
    name: 'Obóz',
    items: [
      { id: 'obozowisko',    emoji: '⛺', label: 'Obozowisko' },
      { id: 'apelowy',       emoji: '🟩', label: 'Plac apelowy' },
      { id: 'toaleta',       emoji: '🚻', label: 'Toaleta' },
      { id: 'woda',          emoji: '💧', label: 'Woda pitna' },
      { id: 'smietnik',      emoji: '♻️', label: 'Śmietnik' },
      { id: 'kuchnia',       emoji: '🍳', label: 'Kuchnia / jadłodajnia' },
    ],
  },
  {
    name: 'Dojazd i służby',
    items: [
      { id: 'sluzby',        emoji: '🚒', label: 'Dojazd służb' },
      { id: 'parking',       emoji: '🅿️', label: 'Parking' },
      { id: 'wejscie',       emoji: '🔰', label: 'Wejście na teren' },
      { id: 'droga',         emoji: '🛣️', label: 'Droga dojazdowa' },
      { id: 'telefon',       emoji: '📞', label: 'Punkt telefoniczny' },
    ],
  },
]

export function makePlacedItem({ type, emoji, label, color, direction, x, y }) {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,       // 'pictogram' | 'arrow'
    emoji,
    label,
    color,
    direction,
    x,          // % of container width
    y,          // % of container height
    size: 1,    // scale factor (0.5 – 2.0)
  }
}
