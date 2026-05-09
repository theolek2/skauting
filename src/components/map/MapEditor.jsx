import { useRef, useState, useCallback, useEffect } from 'react'

const BASE_PX = 48  // rozmiar bazowy symbolu w px

export default function MapEditor({ mapImageUrl, items, selected, onPlace, onUpdate, onDelete, coords, locationName }) {
  const containerRef = useRef(null)
  const [activeId, setActiveId]   = useState(null)
  const [drag, setDrag]           = useState(null)  // { type: 'move'|'resize'|'rotate', ... }

  // ── Helpery ──────────────────────────────────────────────────────────────
  const getContainerRect = () => containerRef.current?.getBoundingClientRect() || { left:0, top:0, width:1, height:1 }

  const pct2px = ({ x, y }) => {
    const r = getContainerRect()
    return { px: r.left + x / 100 * r.width, py: r.top + y / 100 * r.height }
  }

  // ── Global mouse events ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!drag) return
    const r = getContainerRect()

    if (drag.type === 'move') {
      const dx = (e.clientX - drag.startX) / r.width  * 100
      const dy = (e.clientY - drag.startY) / r.height * 100
      onUpdate(drag.id, {
        x: Math.max(0, Math.min(100, drag.ox + dx)),
        y: Math.max(0, Math.min(100, drag.oy + dy)),
      })
    }

    if (drag.type === 'resize') {
      // Odległość od centrum elementu do myszy → skaluj
      const item = items.find(i => i.id === drag.id)
      if (!item) return
      const cx = r.left + item.x / 100 * r.width
      const cy = r.top  + item.y / 100 * r.height
      const dist = Math.sqrt((e.clientX - cx)**2 + (e.clientY - cy)**2)
      const newSize = Math.max(0.3, Math.min(5, dist / drag.baseDist * drag.origSize))
      onUpdate(drag.id, { size: parseFloat(newSize.toFixed(2)) })
    }

    if (drag.type === 'rotate') {
      const item = items.find(i => i.id === drag.id)
      if (!item) return
      const cx = r.left + item.x / 100 * r.width
      const cy = r.top  + item.y / 100 * r.height
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90
      onUpdate(drag.id, { rotation: Math.round(angle) % 360 })
    }
  }, [drag, items, onUpdate])

  const handleMouseUp = useCallback(() => setDrag(null), [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // ── Klik w mapę ───────────────────────────────────────────────────────────
  const handleMapClick = (e) => {
    if (drag) return
    if (activeId) { setActiveId(null); return }
    if (!selected) return
    const r = getContainerRect()
    const x = (e.clientX - r.left) / r.width  * 100
    const y = (e.clientY - r.top)  / r.height * 100
    onPlace(x, y)
  }

  const handleItemClick = (e, id) => {
    e.stopPropagation()
    setActiveId(prev => prev === id ? null : id)
  }

  const startMove = (e, item) => {
    e.stopPropagation()
    setDrag({ type: 'move', id: item.id, startX: e.clientX, startY: e.clientY, ox: item.x, oy: item.y })
  }

  const startResize = (e, item) => {
    e.stopPropagation()
    e.preventDefault()
    const r = getContainerRect()
    const cx = r.left + item.x / 100 * r.width
    const cy = r.top  + item.y / 100 * r.height
    const dist = Math.sqrt((e.clientX - cx)**2 + (e.clientY - cy)**2)
    setDrag({ type: 'resize', id: item.id, baseDist: dist || 1, origSize: item.size || 1 })
  }

  const startRotate = (e, item) => {
    e.stopPropagation()
    e.preventDefault()
    setDrag({ type: 'rotate', id: item.id })
  }

  // ── Rozmiar bazowy ────────────────────────────────────────────────────────
  const itemSize = (item) => `${BASE_PX * (item.size || 1)}px`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Info bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-800 text-white text-xs shrink-0">
        <span>📍 <b>{locationName || '—'}</b></span>
        {coords && <span className="text-gray-400">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
        <span className="ml-auto text-gray-400">
          {activeId ? 'Przeciągnij symbol · uchwyty do skalowania · ⟳ do rotacji'
            : selected ? `Kliknij mapę: ${selected.emoji || '📌'}`
            : 'Wybierz piktogram z lewego panelu'}
        </span>
      </div>

      {/* Canvas obszar */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: selected && !activeId ? 'crosshair' : 'default', userSelect: 'none' }}
        onClick={handleMapClick}
      >
        {/* Mapa satelitarna */}
        {mapImageUrl
          ? <img src={mapImageUrl} alt="mapa" className="absolute inset-0 w-full h-full object-fill" crossOrigin="anonymous" draggable={false} />
          : <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">Ładowanie mapy...</div>
        }

        {/* Piktogramy */}
        {items.map(item => {
          const isActive = activeId === item.id
          const sz = (item.size || 1) * BASE_PX
          const isArrow = item.type === 'arrow'

          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: `${item.x}%`,
                top:  `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 200 : 10,
                cursor: drag?.id === item.id && drag?.type === 'move' ? 'grabbing' : 'grab',
              }}
              onClick={e => handleItemClick(e, item.id)}
              onMouseDown={e => isActive && startMove(e, item)}
            >
              {/* Symbol */}
              <div style={{
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                outline: isActive ? '2px dashed #3b82f6' : 'none',
                outlineOffset: '4px',
                borderRadius: '4px',
                padding: '2px',
              }}>
                {(item.type === 'icon' && item.icon) || (item.type === 'custom' && item.imageUrl)
                  ? <img src={item.icon || item.imageUrl} alt={item.label} style={{ width: sz, height: sz, objectFit: 'contain', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))', transform: `rotate(${item.rotation||0}deg)` }} draggable={false} />
                  : <span style={{
                      fontSize: sz,
                      lineHeight: 1,
                      display: 'inline-block',
                      color: item.color || undefined,
                      transform: isArrow ? `rotate(${item.rotation || 0}deg)` : 'none',
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
                    }}>
                      {item.emoji}
                    </span>
                }
                {item.showLabel !== false && item.label && (
                  <span style={{
                    marginTop: 2,
                    padding: '1px 5px',
                    background: 'rgba(255,255,255,0.92)',
                    color: '#111',
                    fontSize: Math.max(9, sz * 0.28),
                    fontWeight: 700,
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}>
                    {item.label}
                  </span>
                )}
              </div>

              {/* ── Uchwyty Canva (tylko gdy aktywny) ── */}
              {isActive && (() => {
                const half = sz / 2 + 4
                const corners = [[-1,-1],[1,-1],[1,1],[-1,1]]
                const edges   = [[0,-1],[1,0],[0,1],[-1,0]]
                return <>
                  {/* Narożniki — skalowanie */}
                  {corners.map(([cx, cy], i) => (
                    <div key={`c${i}`}
                      onMouseDown={e => startResize(e, item)}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${cx * half}px)`,
                        top:  `calc(50% + ${cy * half}px)`,
                        transform: 'translate(-50%,-50%)',
                        width: 12, height: 12,
                        background: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '50%',
                        cursor: 'nwse-resize',
                        zIndex: 300,
                      }}
                    />
                  ))}
                  {/* Środki krawędzi — skalowanie */}
                  {edges.map(([cx, cy], i) => (
                    <div key={`e${i}`}
                      onMouseDown={e => startResize(e, item)}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${cx * half}px)`,
                        top:  `calc(50% + ${cy * half}px)`,
                        transform: 'translate(-50%,-50%)',
                        width: 10, height: 10,
                        background: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: 2,
                        cursor: cx === 0 ? 'ns-resize' : 'ew-resize',
                        zIndex: 300,
                      }}
                    />
                  ))}

                  {/* Uchwyt rotacji (góra) */}
                  <div
                    onMouseDown={e => startRotate(e, item)}
                    title="Obróć"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: `calc(50% - ${half + 20}px)`,
                      transform: 'translate(-50%,-50%)',
                      width: 16, height: 16,
                      background: '#3b82f6',
                      borderRadius: '50%',
                      cursor: 'grab',
                      zIndex: 300,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 10,
                    }}
                  >↻</div>

                  {/* Pasek akcji */}
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: `calc(100% + ${half}px)`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      padding: '4px 8px',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      zIndex: 400,
                    }}
                  >
                    {/* Rotacja stopnie */}
                    {item.rotation !== undefined && (
                      <span style={{ fontSize: 11, color: '#555', minWidth: 36, textAlign: 'center' }}>
                        {item.rotation || 0}°
                      </span>
                    )}

                    {/* Toggle etykiety */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, cursor: 'pointer', color: '#555' }}>
                      <input
                        type="checkbox"
                        checked={item.showLabel !== false}
                        onChange={e => onUpdate(item.id, { showLabel: e.target.checked })}
                        style={{ width: 12, height: 12 }}
                      />
                      Opis
                    </label>

                    <div style={{ width: 1, background: '#e5e7eb', height: 16 }} />

                    {/* Usuń */}
                    <button
                      onClick={e => { e.stopPropagation(); setActiveId(null); onDelete(item.id) }}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    >×</button>
                  </div>
                </>
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
