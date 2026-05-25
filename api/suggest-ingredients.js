// POST /api/suggest-ingredients — DeepSeek podpowiada składniki
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { meal, peopleCount = 1 } = req.body || {}
  if (!meal?.trim()) return res.status(400).json({ error: 'Brak nazwy dania' })

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    const prompt = `Jesteś ekspertem kulinarnym. Podaj listę składników potrzebnych do przygotowania dania: "${meal}" dla ${peopleCount} ${peopleCount === 1 ? 'osoby' : peopleCount > 4 ? 'osób' : 'osoby'}.

    Format odpowiedzi (TYLKO lista, bez dodatkowego tekstu):
    składnik | ilość | jednostka

    Przykład:
    mleko 3.2% | 250 | ml
    płatki owsiane | 60 | g
    banan | 1 | szt

    Ilości mają być realistyczne na JEDNĄ osobę. Używaj prostych jednostek: g, ml, szt, łyżka, łyżeczka, szklanka, opakowanie.
    Nie dodawaj przypraw (sól, pieprz) chyba że są kluczowe dla dania.
    Podaj maksymalnie 10 składników.`

    const res2 = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400,
      }),
    })

    if (!res2.ok) { const t = await res2.text(); return res.status(500).json({ error: `DeepSeek: ${t.slice(0, 100)}` }) }
    const data = await res2.json()
    const text = data.choices?.[0]?.message?.content || ''

    // Parsuj odpowiedź: "nazwa | ilość | jednostka"
    const ingredients = text.split('\n')
      .map(line => {
        const parts = line.split('|').map(p => p.trim())
        if (parts.length < 2) return null
        const qty = parseFloat(parts[1]?.replace(',', '.'))
        if (isNaN(qty)) return null
        return { name: parts[0], qty, unit: parts[2] || 'szt' }
      })
      .filter(Boolean)

    if (!ingredients.length) return res.status(200).json({ ingredients: [], raw: text })

    return res.status(200).json({ ingredients })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
