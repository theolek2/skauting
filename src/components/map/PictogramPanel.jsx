import { useState } from 'react'
import { PICTOGRAM_CATEGORIES, ARROW_COLORS, ARROW_DIRECTIONS } from '../../utils/mapPictograms'

export default function PictogramPanel({ selected, onSelect }) {
  const [arrowColor, setArrowColor] = useState(ARROW_COLORS[0])
  const [arrowLabel, setArrowLabel] = useState('')

  const selectArrow = (dir) => {
    onSelect({
      type: 'arrow',
      emoji: dir.symbol,
      direction: dir.id,
      color: arrowColor.hex,
      colorLabel: arrowColor.label,
      label: arrowLabel,
    })
  }

  const selectPictogram = (item) => {
    onSelect({ type: 'pictogram', emoji: item.emoji, label: item.label })
  }

  const isSelected = (id, type) =>
    selected && selected.type === type && selected.id === id

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pb-4">
      {/* Piktogramy */}
      {PICTOGRAM_CATEGORIES.map(cat => (
        <div key={cat.name}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{cat.name}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {cat.items.map(item => (
              <button
                key={item.id}
                onClick={() => selectPictogram(item)}
                title={item.label}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition text-xs leading-tight
                  ${selected?.label === item.label && selected?.type === 'pictogram'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-green-400 bg-white text-gray-700'}`}
              >
                <span className="text-2xl mb-0.5">{item.emoji}</span>
                <span className="truncate w-full text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Strzałki */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Strzałki</p>

        {/* Kolory strzałek */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {ARROW_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setArrowColor(c)}
              title={c.label}
              className={`w-7 h-7 rounded-full border-2 transition ${
                arrowColor.id === c.id ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          <span className="text-xs text-gray-500 self-center ml-1">{arrowColor.label}</span>
        </div>

        {/* Legenda strzałki */}
        <input
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none focus:border-green-500"
          placeholder="Opis strzałki (np. Dojazd straży)..."
          value={arrowLabel}
          onChange={e => setArrowLabel(e.target.value)}
        />

        {/* Kierunki */}
        <div className="grid grid-cols-4 gap-1">
          {ARROW_DIRECTIONS.map(dir => (
            <button
              key={dir.id}
              onClick={() => selectArrow(dir)}
              title={dir.id}
              className={`h-10 rounded-lg border text-xl font-bold transition flex items-center justify-center
                ${selected?.direction === dir.id && selected?.type === 'arrow'
                  ? 'border-2 scale-110'
                  : 'border-gray-200 hover:border-gray-400 bg-white'}`}
              style={
                selected?.direction === dir.id && selected?.type === 'arrow'
                  ? { borderColor: arrowColor.hex, color: arrowColor.hex, backgroundColor: arrowColor.hex + '15' }
                  : { color: arrowColor.hex }
              }
            >
              {dir.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Instrukacja */}
      {selected && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-xs text-green-800">
          <b>Zaznaczono:</b> {selected.emoji} {selected.label || selected.direction}<br />
          Kliknij na mapie aby umieścić
        </div>
      )}
    </div>
  )
}
