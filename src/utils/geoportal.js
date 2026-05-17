// Funkcje do auto-pobierania danych z lokalizacji GPS
// Źródła: Nominatim (OSM), ULDK (GUGiK), NFZ API

// ── Konwersja wspórzędnych: WGS84 (EPSG:4326) → PUWG 1992 (EPSG:2180) ──────
// Uproszczona — dokładność ~1m dla Polski
function toEpsg2180(lat, lng) {
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  const a = 6378137.0
  const f = 1 / 298.257222101
  const e2 = 2 * f - f * f
  const lambda0 = (19 * Math.PI) / 180
  const phi0 = 0
  const k0 = 0.9993
  const FE = 500000
  const FN = -5300000

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2)
  const T = Math.tan(latRad) ** 2
  const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2
  const A = (lngRad - lambda0) * Math.cos(latRad)
  const M = a * ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latRad
    - ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * latRad)
    + ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latRad)
    - ((35 * e2 ** 3) / 3072) * Math.sin(6 * latRad))

  const x = FE + k0 * N * (A + (1 - T + C) * (A ** 3 / 6) + (5 - 18 * T + T ** 2 + 72 * C - 58 * e2) * (A ** 5 / 120))
  const y = FN + k0 * (M + N * Math.tan(latRad) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * (A ** 4 / 24) + (61 - 58 * T + T ** 2 + 600 * C - 330 * e2) * (A ** 6 / 720)))
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
}

// ── Nominatim reverse geocode ────────────────────────────────────────────────
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=13&accept-language=pl&addressdetails=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'CampOS-Skauting/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.error) return null
  const addr = data.address || {}
  return {
    display: data.display_name || '',
    gmina: addr.municipality || addr.county || addr.city_district || '',
    powiat: addr.county || '',
    wojewodztwo: addr.state || '',
    miejscowosc: addr.town || addr.village || addr.city || addr.hamlet || '',
    kod_pocztowy: addr.postcode || '',
  }
}

// ── Nominatim search nearest ─────────────────────────────────────────────────
async function searchNearby(lat, lng, query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=pl&bounded=1&viewbox=${lng - 0.15},${lat - 0.1},${lng + 0.15},${lat + 0.1}`
  const res = await fetch(url, { headers: { 'User-Agent': 'CampOS-Skauting/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.length === 0) return null
  const item = data[0]
  return {
    name: item.display_name?.split(',')[0]?.trim() || '',
    address: item.display_name || '',
  }
}

export async function findPolice(lat, lng) {
  return searchNearby(lat, lng, 'komenda policji')
}

export async function findFireStation(lat, lng) {
  return searchNearby(lat, lng, 'straż pożarna PSP')
}

export async function findHospital(lat, lng) {
  return searchNearby(lat, lng, 'szpital')
}

export async function findClinic(lat, lng) {
  return searchNearby(lat, lng, 'przychodnia POZ')
}

export async function findForestDistrict(lat, lng) {
  return searchNearby(lat, lng, 'nadleśnictwo')
}

// ── NFZ API — telefony przychodni ────────────────────────────────────────────
export async function findNfzClinic(lat, lng) {
  try {
    const url = `https://api.nfz.gov.pl/app-itl-api/queues?page=1&limit=3&format=json&api-version=1.3&sort=geodistance&lat=${lat}&lng=${lng}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const entries = json?.data?.rows || []
    if (entries.length === 0) return null
    const e = entries[0]
    return {
      name: e.provider_name || '',
      address: [e.address, e.city].filter(Boolean).join(', ') || '',
      phone: e.phone || e.provider_phone || '',
    }
  } catch { return null }
}

// ── ULDK — numer działki z GPS ──────────────────────────────────────────────
export async function getParcelNumber(lat, lng) {
  const { x, y } = toEpsg2180(lat, lng)
  const url = `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${x},${y}&srs=EPSG:2180`
  const res = await fetch(url)
  if (!res.ok) return null
  const text = await res.text()
  if (!text || text.startsWith('-1') || text.startsWith('0\n')) {
    // spróbuj snapToPoint
    const snapUrl = `https://uldk.gugik.gov.pl/?request=SnapToPoint&xy=${x},${y}&radius=50&srs=EPSG:2180`
    const snapRes = await fetch(snapUrl)
    if (!snapRes.ok) return null
    const snapText = await snapRes.text()
    const lines = snapText.trim().split('\n')
    if (lines[0] !== '0') return null
    return parseParcelFromWkb(lines[1])
  }
  return parseParcelFromWkb(text.split('\n')[1])
}

function parseParcelFromWkb(hex) {
  if (!hex || hex.length < 20) return null
  try {
    const srid = parseInt(hex.substring(0, 8), 16)
    return { srid, wkbHex: hex }
  } catch { return null }
}

// ── Pobierz wszystko naraz ───────────────────────────────────────────────────
export async function fetchAllGeoData(lat, lng) {
  const [geo, police, fire, hospital, clinic, nfz, forest, parcel] = await Promise.allSettled([
    reverseGeocode(lat, lng),
    findPolice(lat, lng),
    findFireStation(lat, lng),
    findHospital(lat, lng),
    findClinic(lat, lng),
    findNfzClinic(lat, lng),
    findForestDistrict(lat, lng),
    getParcelNumber(lat, lng),
  ])

  return {
    geocode:     geo.value,
    police:      police.value,
    fire:        fire.value,
    hospital:    hospital.value,
    clinic:      clinic.value,
    nfz:         nfz.value,
    forest:      forest.value,
    parcel:      parcel.value,
  }
}
