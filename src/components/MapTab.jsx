import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PictogramPanel from './map/PictogramPanel'
import MapEditor from './map/MapEditor'
import { makePlacedItem } from '../utils/mapPictograms'

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
  const editorRef = useRef(null)

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
    // Buduj legendę
    const legend = items.reduce((acc, item) => {
      const key = `${item.emoji} ${item.label || item.direction || ''}`
      if (!acc.includes(key)) acc.push(key)
      return acc
    }, [])

    const win = window.open('', '_blank')
    if (!win) { alert('Zezwól na popup'); return }

    // Pozycje piktogramów jako elementy HTML nakładamy na obraz
    const itemsHtml = items.map(item => `
      <div style="
        position: absolute;
        left: ${item.x}%;
        top: ${item.y}%;
        transform: translate(-50%, -50%) scale(${item.size || 1});
        transform-origin: center bottom;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      ">
        <span style="
          font-size: 2rem;
          line-height: 1;
          filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.7));
          ${item.color ? `color: ${item.color};` : ''}
        ">${item.emoji}</span>
        ${item.label ? `<span style="
          background: rgba(255,255,255,0.9);
          color: #111;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
          margin-top: 2px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${item.label}</span>` : ''}
      </div>
    `).join('')

    const legendHtml = legend.length > 0 ? `
      <div style="padding: 8mm 15mm; background: #f9f9f9; border-top: 2px solid #2d6a2d;">
        <h3 style="font-size: 11pt; margin: 0 0 4mm; color: #1a4a1a;">Legenda</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 4mm 8mm;">
          ${legend.map(l => `<span style="font-size: 10pt;">${l}</span>`).join('')}
        </div>
      </div>
    ` : ''

    win.document.write(`<!DOCTYPE html><html lang="pl"><head>
      <meta charset="UTF-8">
      <title>Mapa terenu obozu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { margin: 0; }
        }
      </style>
    </head><body>
      <div style="padding: 5mm 15mm 3mm; background: #2d6a2d; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 16pt; font-weight: bold;">Mapa terenu obozu</h1>
          <p style="font-size: 10pt; opacity: 0.85;">${locationName || '—'}</p>
        </div>
        <div style="text-align: right; font-size: 9pt; opacity: 0.8;">
          Współrzędne: ${parseFloat(coords.lat).toFixed(5)}°N, ${parseFloat(coords.lng).toFixed(5)}°E<br>
          Skauci Europy · by Aleksander Nasiłowski
        </div>
      </div>
      <div style="position: relative; width: 100%; aspect-ratio: 3/2; overflow: hidden;">
        <img src="${mapImageUrl}" style="width: 100%; height: 100%; object-fit: fill;" crossorigin="anonymous" />
        ${itemsHtml}
      </div>
      ${legendHtml}
      <script>window.onload = () => window.print();<\/script>
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
        <PictogramPanel selected={selected} onSelect={setSelected} />
      </aside>

      {/* Mapa */}
      <div className="flex-1 flex flex-col overflow-hidden" ref={editorRef}>
        <MapEditor
          mapImageUrl={mapImageUrl}
          items={items}
          selected={selected}
          onPlace={handlePlace}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          coords={{ lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }}
          locationName={locationName}
        />

        {/* Dolny pasek */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-t border-gray-200 shrink-0">
          <button onClick={() => setSelected(null)}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg">
            🖱️ Tryb przeciągania
          </button>
          <span className="text-xs text-gray-400">Najedź na symbol aby zmienić rozmiar (−/+) lub usunąć (×)</span>
          <button onClick={() => setItems([])}
            className="text-xs text-red-400 hover:text-red-600 ml-auto border border-red-200 px-3 py-1.5 rounded-lg">
            🗑 Wyczyść wszystko
          </button>
          <button
            onClick={handleExport}
            className="bg-green-700 text-white font-bold px-5 py-1.5 rounded-lg hover:bg-green-800 text-sm"
          >
            📄 Eksportuj mapę PDF
          </button>
        </div>
      </div>
    </div>
  )
}
