import { useRef, useState, useCallback } from 'react'

const MIN_SIZE = 0.5
const MAX_SIZE = 3.0
const SIZE_STEP = 0.25

export default function MapEditor({ mapImageUrl, items, selected, onPlace, onUpdate, onDelete, coords, locationName }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null) // { id, startX, startY, origX, origY }

  const getRelativePos = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleMapClick = (e) => {
    if (dragging) return
    if (!selected) return
    const { x, y } = getRelativePos(e)
    onPlace(x, y)
  }

  const handleMouseDown = (e, id) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    setDragging({
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: items.find(i => i.id === id).x,
      origY: items.find(i => i.id === id).y,
      width: rect.width,
      height: rect.height,
    })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const dx = ((e.clientX - dragging.startX) / dragging.width) * 100
    const dy = ((e.clientY - dragging.startY) / dragging.height) * 100
    onUpdate(dragging.id, {
      x: Math.max(0, Math.min(100, dragging.origX + dx)),
      y: Math.max(0, Math.min(100, dragging.origY + dy)),
    })
  }, [dragging, onUpdate])

  const handleMouseUp = () => setDragging(null)

  const changeSize = (id, delta) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, (item.size || 1) + delta))
    onUpdate(id, { size: newSize })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Info bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-800 text-white text-xs shrink-0">
        <span>📍 <b>{locationName || 'Brak nazwy'}</b></span>
        {coords && <span className="text-gray-400">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
        <span className="ml-auto text-gray-400">
          {selected ? `✏️ Kliknij na mapie aby umieścić: ${selected.emoji}` : 'Wybierz piktogram z lewego panelu'}
        </span>
      </div>

      {/* Mapa + overlay */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ cursor: selected ? 'crosshair' : 'default' }}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Mapa satelitarna */}
        {mapImageUrl ? (
          <img
            src={mapImageUrl}
            alt="mapa"
            className="absolute inset-0 w-full h-full object-fill"
            crossOrigin="anonymous"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
            Ładowanie mapy...
          </div>
        )}

        {/* Piktogramy */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute group"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: dragging?.id === item.id ? 100 : 10,
              cursor: 'grab',
            }}
            onMouseDown={e => handleMouseDown(e, item.id)}
          >
            {/* Symbol */}
            <div
              className="relative flex flex-col items-center"
              style={{ transform: `scale(${item.size || 1})`, transformOrigin: 'center bottom' }}
            >
              <span
                className="text-3xl leading-none drop-shadow-lg"
                style={item.type === 'arrow' ? { color: item.color, fontSize: `${2 * (item.size || 1)}rem` } : {}}
              >
                {item.emoji}
              </span>
              {item.label && (
                <span className="mt-0.5 px-1 bg-white/90 text-gray-900 text-xs rounded shadow whitespace-nowrap font-semibold">
                  {item.label}
                </span>
              )}
            </div>

            {/* Kontrolki (hover) */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 z-50 bg-white rounded shadow px-1 py-0.5">
              <button onClick={e => { e.stopPropagation(); changeSize(item.id, -SIZE_STEP) }}
                className="w-5 h-5 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center font-bold">−</button>
              <span className="text-xs self-center px-1">{((item.size || 1) * 100).toFixed(0)}%</span>
              <button onClick={e => { e.stopPropagation(); changeSize(item.id, SIZE_STEP) }}
                className="w-5 h-5 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center font-bold">+</button>
              <button onClick={e => { e.stopPropagation(); onDelete(item.id) }}
                className="w-5 h-5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center font-bold ml-1">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
