export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat/lng required' })

  // EPSG:4326 → EPSG:2180
  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  const a = 6378137.0, f = 1 / 298.257222101
  const e2 = 2 * f - f * f
  const lambda0 = (19 * Math.PI) / 180, k0 = 0.9993
  const FE = 500000, FN = -5300000
  const latR = latRad
  const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2)
  const T = Math.tan(latR) ** 2
  const C = (e2 / (1 - e2)) * Math.cos(latR) ** 2
  const A = (lngRad - lambda0) * Math.cos(latR)
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latR
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latR)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latR)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latR))
  const x = FE + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * e2) * A ** 5 / 120)
  const y = FN + k0 * (M + N * Math.tan(latR) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * e2) * A ** 6 / 720))

  try {
    const url = `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${x.toFixed(2)},${y.toFixed(2)}&srs=EPSG:2180`
    const resp = await fetch(url)
    const text = await resp.text()
    res.json({ raw: text })
  } catch (e) {
    res.status(500).json({ error: 'ULDK failed' })
  }
}
