import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PictogramPanel from './map/PictogramPanel'
import MapEditor from './map/MapEditor'
import { makePlacedItem, DEFAULT_ARROW_COLORS } from '../utils/mapPictograms'

// Napraw domyślne ikony Leaflet w Vite
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapEventsCapture({ onReady }) {
  const map = useMapEvents({
    moveend: () => onReady(map),
    zoomend: () => onReady(map),
  })
  useEffect(() => { onReady(map) }, [])
  return null
}

function esriUrl(bounds, w = 1200, h = 800) {
  const { _southWest: sw, _northEast: ne } = bounds
  const bbox = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`
  return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=${w},${h}&imageSR=4326&format=png32&f=image`
}

export default function MapTab() {
  const [step, setStep] = useState('coords')   // 'coords' | 'navigate' | 'edit'
  const [coords, setCoords] = useState({ lat: '', lng: '' })
  const [locationName, setLocationName] = useState('')
  const [mapRef, setMapRef] = useState(null)
  const [mapImageUrl, setMapImageUrl] = useState(null)
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [arrowColors, setArrowColors] = useState(DEFAULT_ARROW_COLORS)
  const [customPictograms, setCustomPictograms] = useState([])
  const [paths, setPaths]           = useState([])
  const [paintMode, setPaintMode]   = useState(false)
  const [paintColor, setPaintColor] = useState('#ef4444')
  const editorRef = useRef(null)

  const updateArrowColor = (id, label) =>
    setArrowColors(prev => prev.map(c => c.id === id ? { ...c, label } : c))

  // Walidacja współrzędnych
  const coordsOk = !isNaN(parseFloat(coords.lat)) && !isNaN(parseFloat(coords.lng))

  const handleStart = () => {
    if (!coordsOk) return
    setStep('navigate')
  }

  const handleGenerateMap = () => {
    if (!mapRef) return
    const bounds = mapRef.getBounds()
    const url = esriUrl(bounds)
    setMapImageUrl(url)
    setStep('edit')
  }

  const handlePlace = (x, y) => {
    if (!selected) return
    const item = makePlacedItem({ ...selected, x, y })
    setItems(prev => [...prev, item])
    // Nie resetuj selected — pozwól wstawiać wiele
  }

  const handleUpdate = (id, patch) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleExport = () => {
    const win = window.open('', '_blank')
    if (!win) { alert('Zezwól na popup'); return }

    const lat = parseFloat(coords.lat).toFixed(5)
    const lng = parseFloat(coords.lng).toFixed(5)

    // Symbole na mapie
    const itemsHtml = items.map(item => {
      const imgSrc = (item.type==='icon' && item.icon) || (item.type==='custom' && item.imageUrl)
      const isArrow = item.type === 'arrow'
      const symbol = imgSrc
        ? `<img src="${imgSrc}" style="width:2rem;height:2rem;object-fit:contain;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.6));" />`
        : isArrow
          ? `<svg viewBox="0 0 24 24" style="width:2rem;height:2rem;display:block;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.5));"><path fill="${item.color||'#ef4444'}" d="M12 2L4 10h5v12h6V10h5z"/></svg>`
          : `<span style="font-size:2rem;line-height:1;${item.color?`color:${item.color};`:''}display:inline-block;transform:rotate(${item.rotation||0}deg);filter:drop-shadow(1px 1px 2px rgba(0,0,0,.7));">${item.emoji||''}</span>`
      const labelHtml = item.showLabel!==false && item.label
        ? `<span style="background:rgba(255,255,255,.92);color:#111;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3);">${item.label}</span>` : ''
      return `<div style="position:absolute;left:${item.x}%;top:${item.y}%;transform:translate(-50%,-50%) scale(${item.size||1});transform-origin:center bottom;display:flex;flex-direction:column;align-items:center;pointer-events:none;">${symbol}${labelHtml}</div>`
    }).join('')

    // Ścieżki SVG
    const pathsSvg = paths.length ? `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${paths.map(p=>`<polyline points="${p.pts.map(pt=>`${pt.x},${pt.y}`).join(' ')}" fill="none" stroke="${p.color}" stroke-width="${p.width||3}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('')}
    </svg>` : ''

    // Legenda
    // Legenda — strzałki, ikony, kolory ścieżek
    const usedArrows     = arrowColors.filter(c => items.some(i=>i.type==='arrow'&&i.colorId===c.id))
    const usedIcons      = items.filter(i=>i.type==='icon'||i.type==='custom').reduce((a,i)=>a.find(x=>x.label===i.label)?a:[...a,i],[])
    const usedPathColors = [...new Set(paths.map(p=>p.color))].map(hex=>{
      const match = arrowColors.find(c=>c.hex===hex)
      return { hex, label: match?.label || `Linia ${hex}` }
    })

    const legendItems = [
      ...usedArrows.map(c=>`<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;"><svg viewBox="0 0 24 24" style="width:1rem;height:1rem;flex-shrink:0;"><path fill="${c.hex}" d="M12 2L4 10h5v12h6V10h5z"/></svg><span>${c.label}</span></div>`),
      ...usedPathColors.filter(p=>!usedArrows.find(a=>a.hex===p.hex)).map(p=>`<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;"><span style="display:inline-block;width:1.5rem;height:3px;background:${p.hex};border-radius:2px;flex-shrink:0;"></span><span>${p.label}</span></div>`),
      ...usedIcons.map(i=>{const s=i.icon||i.imageUrl; return `<div style="display:flex;align-items:center;gap:2mm;font-size:8pt;white-space:nowrap;">${s?`<img src="${s}" style="width:1rem;height:1rem;object-fit:contain;flex-shrink:0;"/>`:'<span>■</span>'}<span>${i.label}</span></div>`}),
    ]

    // A4 landscape: 297mm × 210mm — SZTYWNE wymiary
    win.document.write(`<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Mapa terenu</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body{width:297mm;height:210mm;overflow:hidden;font-family:Arial,sans-serif;}
      @media print{@page{size:297mm 210mm;margin:0;}html,body{width:297mm;height:210mm;}}
      .header{height:16mm;background:#2d6a2d;color:white;padding:0 8mm;display:flex;justify-content:space-between;align-items:center;}
      .map-wrap{height:170mm;position:relative;overflow:hidden;width:100%;}
      .footer{height:24mm;background:#f0f0f0;border-top:2px solid #2d6a2d;padding:2mm 8mm;display:flex;align-items:center;}
    </style></head><body>
    <div class="header">
      <div><b style="font-size:12pt;">Mapa terenu obozu</b>&nbsp;·&nbsp;<span style="font-size:9pt;opacity:.85;">${locationName||'—'}</span></div>
      <div style="text-align:right;font-size:8pt;opacity:.85;">Wsp.: ${lat}°N, ${lng}°E &nbsp;·&nbsp; Skauci Europy · by Aleksander Nasiłowski</div>
    </div>
    <div class="map-wrap">
      <img src="${mapImageUrl}" style="width:100%;height:100%;object-fit:fill;" crossorigin="anonymous"/>
      ${itemsHtml}
      ${pathsSvg}
    </div>
    <div class="footer">
      <b style="font-size:9pt;color:#1a4a1a;white-space:nowrap;margin-right:6mm;">Legenda:</b>
      <div style="display:flex;gap:5mm;flex-wrap:nowrap;overflow:hidden;align-items:center;">
        ${legendItems.join('')}
        ${legendItems.length===0?'<span style="font-size:8pt;color:#888;">Brak symboli na mapie</span>':''}
      </div>
    </div>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>`)
    win.document.close()
  }

  // ── KROK 1: Wpisz współrzędne ─────────────────────────────────────────
  if (step === 'coords') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🗺️</div>
            <h2 className="text-xl font-bold text-green-800">Mapa terenu obozu</h2>
            <p className="text-sm text-gray-500 mt-1">Wpisz lokalizację potencjalnego obozowiska</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nazwa miejscowości / terenu</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="np. Leśniczówka Pisary k. Nowego Sącza"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Szerokość geograficzna (N)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. 49.6285"
                  value={coords.lat}
                  onChange={e => setCoords(c => ({ ...c, lat: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Długość geograficzna (E)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="np. 20.7140"
                  value={coords.lng}
                  onChange={e => setCoords(c => ({ ...c, lng: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              💡 Współrzędne znajdziesz w Google Maps — kliknij prawym na wybranym miejscu → skopiuj
            </p>
            <button
              onClick={handleStart}
              disabled={!coordsOk}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-base hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition mt-2"
            >
              Otwórz mapę →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── KROK 2: Nawiguj po mapie ──────────────────────────────────────────
  if (step === 'navigate') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5 bg-green-800 text-white shrink-0">
          <button onClick={() => setStep('coords')} className="text-white/70 hover:text-white text-sm">← Wróć</button>
          <span className="font-semibold text-sm">📍 {locationName || 'Brak nazwy'}</span>
          <span className="text-green-300 text-xs">{coords.lat}, {coords.lng}</span>
          <div className="ml-auto flex gap-3 items-center">
            <p className="text-green-300 text-xs">Ustaw widok mapy, a następnie wygeneruj mapę obozu</p>
            <button
              onClick={handleGenerateMap}
              className="bg-white text-green-800 font-bold px-5 py-1.5 rounded-lg hover:bg-green-50 text-sm"
            >
              📸 Generuj mapę obozu
            </button>
          </div>
        </div>

        <MapContainer
          center={[parseFloat(coords.lat), parseFloat(coords.lng)]}
          zoom={15}
          style={{ flex: 1 }}
          className="flex-1"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
            maxZoom={19}
          />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            opacity={0.3}
          />
          <MapEventsCapture onReady={setMapRef} />
        </MapContainer>
      </div>
    )
  }

  // ── KROK 3: Edytor piktogramów ────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Lewy panel */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 p-3 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-green-800">🗂️ Piktogramy</h2>
          <button onClick={() => { setStep('navigate'); setItems([]) }}
            className="text-xs text-gray-400 hover:text-gray-700">← Zmień widok</button>
        </div>
        <PictogramPanel
            selected={selected}
            onSelect={setSelected}
            customPictograms={customPictograms}
            onAddCustom={p => setCustomPictograms(prev => [...prev, p])}
          />
      </aside>

      {/* Mapa + prawy panel */}
      <div className="flex-1 flex overflow-hidden" ref={editorRef}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <MapEditor
          mapImageUrl={mapImageUrl}
          items={items}
          selected={selected}
          onPlace={handlePlace}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          coords={{ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }}
          locationName={locationName}
          paths={paths}
          onAddPath={p => setPaths(prev => [...prev, p])}
          paintMode={paintMode}
          paintColor={paintColor}
        />

        {/* Prawy panel — strzałki + malowanie */}
        <div className="w-16 shrink-0 bg-white border-l border-gray-200 flex flex-col items-center py-2 gap-1.5 overflow-y-auto">

          {/* STRZAŁKI */}
          <p className="text-gray-400 text-center leading-tight" style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Strzałki</p>
          {arrowColors.map(color => {
            const isActive = selected?.type === 'arrow' && selected?.colorId === color.id
            return (
              <button key={color.id}
                onClick={() => { setSelected({ type:'arrow', color:color.hex, colorId:color.id, label:color.label }); setPaintMode(false) }}
                title={color.label}
                className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center transition ${
                  isActive ? 'border-gray-700 scale-110' : 'border-gray-200 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color.hex + '18' }}
              >
                <svg viewBox="0 0 24 24" style={{width:24,height:24}}>
                  <path fill={color.hex} d="M12 2L4 10h5v12h6V10h5z"/>
                </svg>
              </button>
            )
          })}

          <div className="w-10 border-t border-gray-200 my-1" />

          {/* MALOWANIE */}
          <p className="text-gray-400 text-center leading-tight" style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Maluj</p>
          <button
            onClick={() => { setPaintMode(m => !m); setSelected(null) }}
            title="Tryb malowania"
            className={`w-11 h-11 rounded-lg border-2 text-xl flex items-center justify-center transition ${
              paintMode ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 hover:border-purple-400'
            }`}
          >🖌️</button>

          {['#ef4444','#3b82f6','#22c55e','#f97316','#a855f7'].map(c => (
            <button key={c} onClick={() => { setPaintColor(c); setPaintMode(true); setSelected(null) }}
              title={c}
              className={`w-8 h-8 rounded-full border-2 transition ${paintColor===c && paintMode ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-400'}`}
              style={{ backgroundColor: c }} />
          ))}

          <div className="w-10 border-t border-gray-200 my-1" />

          <button onClick={() => setPaths(prev => prev.slice(0,-1))}
            title="Cofnij ostatnią linię"
            className="w-11 h-9 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 flex items-center justify-center">
            ↩
          </button>
          <button onClick={() => setPaths([])}
            title="Wyczyść rysunki"
            className="w-11 h-9 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 text-xs flex items-center justify-center">
            🗑
          </button>
        </div>

        {/* Dolny pasek */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-200 shrink-0">
          <button onClick={() => setItems([])}
            className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg">
            🗑 Wyczyść symbole
          </button>
          <button onClick={handleExport}
            className="bg-green-700 text-white font-bold px-5 py-1.5 rounded-lg hover:bg-green-800 text-sm">
            📄 Eksportuj mapę PDF
          </button>
        </div>
      </div>  {/* koniec flex-1 flex-col */}
      </div>  {/* koniec flex-1 flex (mapa + prawy panel) */}
    </div>
  )
}
