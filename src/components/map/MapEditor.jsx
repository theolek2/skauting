import { useRef, useState, useCallback } from 'react'

const MIN_SIZE = 0.5
const MAX_SIZE = 3.0
const SIZE_STEP = 0.25

export default function MapEditor({ mapImageUrl, items, selected, onPlace, onUpdate, onDelete, coords, locationName }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const getPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    }
  }

  const handleMapClick = (e) => {
    if (dragging) return
    if (activeId) { setActiveId(null); return }
    if (!selected) return
    const { x, y } = getPos(e)
    onPlace(x, y)
  }

  const handleItemClick = (e, id) => {
    e.stopPropagation()
    if (dragging) return
    setActiveId(prev => prev === id ? null : id)
  }

  const handleMouseDown = (e, id) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    const item = items.find(i => i.id === id)
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y, W: rect.width, H: rect.height })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const dx = ((e.clientX - dragging.startX) / dragging.W) * 100
    const dy = ((e.clientY - dragging.startY) / dragging.H) * 100
    onUpdate(dragging.id, {
      x: Math.max(0, Math.min(100, dragging.origX + dx)),
      y: Math.max(0, Math.min(100, dragging.origY + dy)),
    })
  }, [dragging, onUpdate])

  const handleMouseUp = () => setDragging(null)

  const changeSize = (e, id, delta) => {
    e.stopPropagation()
    const item = items.find(i => i.id === id)
    if (!item) return
    const s = parseFloat(Math.max(MIN_SIZE, Math.min(MAX_SIZE, (item.size || 1) + delta)).toFixed(2))
    onUpdate(id, { size: s })
  }

  const changeRotation = (e, id, deg) => {
    e.stopPropagation()
    const item = items.find(i => i.id === id)
    if (!item) return
    onUpdate(id, { rotation: ((item.rotation || 0) + deg + 360) % 360 })
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    setActiveId(null)
    onDelete(id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-800 text-white text-xs shrink-0">
        <span>📍 <b>{locationName || '—'}</b></span>
        {coords && <span className="text-gray-400">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
        <span className="ml-auto text-gray-400">
          {activeId ? 'Kliknij mapę aby odznaczyć' : selected ? `Kliknij mapę: ${selected.emoji || '📌'}` : 'Wybierz piktogram z lewego panelu'}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ cursor: selected && !activeId ? 'crosshair' : 'default' }}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {mapImageUrl
          ? <img src={mapImageUrl} alt="mapa" className="absolute inset-0 w-full h-full object-fill" crossOrigin="anonymous" draggable={false} />
          : <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">Ładowanie mapy...</div>
        }

        {items.map(item => {
          const isActive = activeId === item.id
          const isArrow  = item.type === 'arrow'
          return (
            <div key={item.id} className="absolute"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%,-50%)', zIndex: isActive ? 100 : 10, cursor: dragging?.id === item.id ? 'grabbing' : 'grab' }}
              onClick={e => handleItemClick(e, item.id)}
              onMouseDown={e => handleMouseDown(e, item.id)}
            >
              {/* Pasek kontrolny */}
              {isActive && (
                <div
                  className="absolute flex gap-1 z-50 bg-white rounded-xl shadow-lg px-2 py-1.5 border border-gray-200"
                  style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Rozmiar */}
                  <button onClick={e => changeSize(e, item.id, -SIZE_STEP)} disabled={(item.size||1) <= MIN_SIZE}
                    className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm flex items-center justify-center disabled:opacity-30">−</button>
                  <span className="text-xs self-center px-1 font-mono min-w-[2.5rem] text-center">{Math.round((item.size||1)*100)}%</span>
                  <button onClick={e => changeSize(e, item.id, SIZE_STEP)} disabled={(item.size||1) >= MAX_SIZE}
                    className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm flex items-center justify-center disabled:opacity-30">+</button>

                  {/* Obrót — tylko dla strzałek */}
                  {isArrow && <>
                    <div className="w-px bg-gray-200 mx-1" />
                    <button onClick={e => changeRotation(e, item.id, -45)}
                      className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-sm flex items-center justify-center">↺</button>
                    <span className="text-xs self-center px-1 font-mono min-w-[2.5rem] text-center">{item.rotation || 0}°</span>
                    <button onClick={e => changeRotation(e, item.id, 45)}
                      className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-sm flex items-center justify-center">↻</button>
                  </>}

                  <div className="w-px bg-gray-200 mx-1" />
                  <button onClick={e => handleDelete(e, item.id)}
                    className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded font-bold text-sm flex items-center justify-center">×</button>
                </div>
              )}

              {/* Symbol */}
              <div style={{
                transform: `scale(${item.size||1})`,
                transformOrigin: 'center bottom',
                outline: isActive ? '2px dashed #3b82f6' : 'none',
                borderRadius: '4px', padding: '2px',
              }}>
                {item.type === 'custom' && item.imageUrl
                  ? <img src={item.imageUrl} alt={item.label} className="w-10 h-10 object-contain drop-shadow-lg" />
                  : <span className="text-3xl leading-none drop-shadow-lg block"
                      style={{
                        color: item.color || undefined,
                        display: 'inline-block',
                        transform: isArrow ? `rotate(${item.rotation || 0}deg)` : 'none',
                      }}>
                      {item.emoji}
                    </span>
                }
                {item.label && (
                  <span className="mt-0.5 px-1.5 bg-white/90 text-gray-900 text-xs rounded shadow whitespace-nowrap font-semibold block text-center">
                    {item.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
