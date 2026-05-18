import { useState } from 'react'
import { fetchAllGeoData } from '../utils/geoportal.js'

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

export default function LocalDataTab({ meta, onUpdateMeta, progress, onToggleProgress }) {
  const [geoLat, setGeoLat] = useState(meta.coords?.lat?.toString() || '')
  const [geoLng, setGeoLng] = useState(meta.coords?.lng?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleFetch = async () => {
    const lat = parseFloat(geoLat)
    const lng = parseFloat(geoLng)
    if (!lat || !lng) { alert('Wpisz poprawne współrzędne'); return }
    setLoading(true)
    try {
      const data = await fetchAllGeoData(lat, lng)
      setResults(data)
      const patch = {}
      if (data.geocode) {
        patch.gmina = data.geocode.gmina
        patch.powiat = data.geocode.powiat
        patch.wojewodztwo = data.geocode.wojewodztwo
      }
      if (data.forest) patch.nadlesnictwo = data.forest.name
      if (data.parcel) patch.nr_dzialki = 'Pobrano'
      if (data.nfz) { patch.przychodnia = data.nfz.name; patch.tel_przychodnia = data.nfz.phone }
      if (data.hospitals?.[0]) patch.szpital = data.hospitals[0].name
      if (data.police?.[0]) patch.policja = data.police[0].name
      if (data.fire?.[0]) patch.psp = data.fire[0].name
      if (data.clinics?.[0] && !patch.przychodnia) patch.przychodnia = data.clinics[0].name
      onUpdateMeta(patch)
    } catch { alert('Błąd pobierania danych') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-green-900">📍 Dane lokalne</h2>
          <button onClick={(e) => onToggleProgress?.('local', e)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
              progress?.local ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400'
            }`}>
            {progress?.local ? '✅' : '⬜'} Zrobione
          </button>
        </div>
        <p className="text-sm text-gray-500 -mt-4">
          Wpisz współrzędne i pobierz dane o służbach, nadleśnictwie i administracji
        </p>

        {/* Współrzędne + przycisk */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Szerokość (lat)</label>
              <input className={inputCls} placeholder="50.7658" value={geoLat} onChange={e => setGeoLat(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Długość (lng)</label>
              <input className={inputCls} placeholder="22.5287" value={geoLng} onChange={e => setGeoLng(e.target.value)} />
            </div>
            <button onClick={handleFetch} disabled={loading}
              className="shrink-0 bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? '⏳' : '📍'} Pobierz
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Pobieranie danych z API (OSRM, Overpass, Nominatim, NFZ, GUGiK)...</p>
          </div>
        )}

        {results && !loading && (
          <>
            {/* Szpitale */}
            {results.hospitals?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3">🏥 Szpitale (najbliższy realnym dojazdem)</h3>
                <div className="space-y-2">
                  {results.hospitals.map((h, i) => (
                    <label key={i} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition ${
                      meta.szpital === h.name ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="szpital" checked={meta.szpital === h.name || (i === 0 && !meta.szpital)}
                        onChange={() => onUpdateMeta({ szpital: h.name, szpital_tel: h.phone })}
                        className="accent-blue-600" />
                      <span className="font-medium flex-1 text-gray-700">{h.name}</span>
                      {h.phone && <span className="text-xs text-gray-400">📞 {h.phone}</span>}
                      <span className="text-xs text-gray-400">{h.duration_min} min · {h.distance_km} km</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* PSP */}
            {results.fire?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3">🚒 PSP ({meta.wojewodztwo || 'województwo'})</h3>
                <div className="space-y-2">
                  {results.fire.map((f, i) => (
                    <label key={i} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition ${
                      meta.psp === f.name ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="psp" checked={meta.psp === f.name || (i === 0 && !meta.psp)}
                        onChange={() => onUpdateMeta({ psp: f.name, psp_tel: f.phone })}
                        className="accent-blue-600" />
                      <span className="font-medium flex-1 text-gray-700">{f.name}</span>
                      <span className="text-xs text-gray-400">{f.duration_min} min · {f.distance_km} km</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Policja */}
            {results.police?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3">🚔 Policja ({meta.gmina || meta.powiat || 'najbliższa'})</h3>
                <div className="space-y-2">
                  {results.police.map((p, i) => (
                    <label key={i} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition ${
                      meta.policja === p.name ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="policja" checked={meta.policja === p.name || (i === 0 && !meta.policja)}
                        onChange={() => onUpdateMeta({ policja: p.name, policja_tel: p.phone })}
                        className="accent-blue-600" />
                      <span className="font-medium flex-1 text-gray-700">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.duration_min} min · {p.distance_km} km</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Przychodnie */}
            {(results.clinics?.length > 0 || results.nfz) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3">🩺 Przychodnie</h3>
                <div className="space-y-2">
                  {results.nfz && (
                    <label className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition ${
                      meta.przychodnia === results.nfz.name ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="przychodnia" checked={meta.przychodnia === results.nfz.name || (!meta.przychodnia)}
                        onChange={() => onUpdateMeta({ przychodnia: results.nfz.name, tel_przychodnia: results.nfz.phone })}
                        className="accent-blue-600" />
                      <span className="font-medium flex-1 text-gray-700">{results.nfz.name}</span>
                      {results.nfz.phone && <span className="text-xs text-gray-400">📞 {results.nfz.phone}</span>}
                    </label>
                  )}
                  {(results.clinics || []).slice(0, 3).map((c, i) => (
                    <label key={i} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition ${
                      meta.przychodnia === c.name ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="przychodnia" checked={meta.przychodnia === c.name}
                        onChange={() => onUpdateMeta({ przychodnia: c.name })}
                        className="accent-blue-600" />
                      <span className="font-medium flex-1 text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.duration_min} min · {c.distance_km} km</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Leśne + działka */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-800 mb-3">🌲 Dane leśne i działka</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nadleśnictwo</label>
                  <input className={inputCls} placeholder="Auto z GPS" value={meta.nadlesnictwo || ''}
                    onChange={e => onUpdateMeta({ nadlesnictwo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nr działki</label>
                  <input className={inputCls} placeholder="Auto z GPS" value={meta.nr_dzialki || ''}
                    onChange={e => onUpdateMeta({ nr_dzialki: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Leśnictwo</label>
                  <input className={inputCls} value={meta.lesnictwo || ''}
                    onChange={e => onUpdateMeta({ lesnictwo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Oddział leśny nr</label>
                  <input className={inputCls} value={meta.oddzial_lesny || ''}
                    onChange={e => onUpdateMeta({ oddzial_lesny: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Administracja */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-800 mb-3">🏛️ Administracja</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gmina</label>
                  <input className={inputCls} value={meta.gmina || ''}
                    onChange={e => onUpdateMeta({ gmina: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Powiat</label>
                  <input className={inputCls} value={meta.powiat || ''}
                    onChange={e => onUpdateMeta({ powiat: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Województwo</label>
                  <input className={inputCls} value={meta.wojewodztwo || ''}
                    onChange={e => onUpdateMeta({ wojewodztwo: e.target.value })} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
