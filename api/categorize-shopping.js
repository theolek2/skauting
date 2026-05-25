// POST /api/categorize-shopping — AI kategoryzuje składniki
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ingredients } = req.body || {}
  if (!ingredients?.length) return res.status(400).json({ error: 'Brak składników' })

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    const ingList = ingredients.map(i => `${i.name} ${i.qty}${i.unit || 'szt'}`).join(', ')
    const prompt = `Masz listę składników: ${ingList}. Podziel je na kategorie sklepowe. Zwróć TYLKO JSON: [{"category":"Nabiał","items":[{"name":"mleko","qty":5,"unit":"L"}]}]. Kategorie: Nabiał, Pieczywo, Mięso i wędliny, Warzywa i owoce, Produkty sypkie, Przyprawy, Napoje, Słodycze i przekąski, Chemia i higiena, Inne. Nie zmieniaj nazw ani ilości, tylko pogrupuj.`

    const res2 = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 1000 }),
    })

    if (!res2.ok) { const t = await res2.text(); return res.status(500).json({ error: t.slice(0, 100) }) }
    const data = await res2.json()
    const text = data.choices?.[0]?.message?.content || ''

    // Wyciągnij JSON (może być w markdown ```json ... ```)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\[[\s\S]*\]/)
    let categories = []
    try {
      categories = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text)
    } catch {
      // Fallback: zwróć jako jedną kategorię "Wszystko"
      categories = [{ category: 'Wszystko', items: ingredients }]
    }

    return res.status(200).json({ categories })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
