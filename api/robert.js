// Robert — asystent skautowy
// BM25 keyword retrieval + DeepSeek chat API

import { readFileSync } from 'fs'
import { join } from 'path'

const SYSTEM_PROMPT = `Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach przeciwpożarowych, prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

Odpowiadaj po polsku, zwięźle i przyjaźnie. Jeśli kontekst zawiera odpowiedź — użyj go.
Jeśli nie jesteś pewien — powiedz to wprost. Nie wymyślaj przepisów ani dat.

Kontekst z dokumentów skautowych:
{context}

Jeśli kontekst nie zawiera odpowiedzi, odpowiedz na podstawie ogólnej wiedzy o harcerstwie.`

// ── Lazy load bazy wiedzy ─────────────────────────────────────────────────────
let _docsCache = null

function loadDocs() {
  if (_docsCache) return _docsCache
  try {
    const path = join(process.cwd(), 'src', 'data', 'robert-docs.json')
    _docsCache = JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    _docsCache = []
  }
  return _docsCache
}

// ── Keyword retrieval ─────────────────────────────────────────────────────────
function retrieve(docs, question, k = 8) {
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  return docs
    .map(d => {
      const content = d.pageContent?.toLowerCase() || ''
      const score = words.reduce((s, w) => s + (content.includes(w) ? 1 : 0), 0)
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// ── DeepSeek Chat API ─────────────────────────────────────────────────────────
async function deepseekChat(apiKey, systemPrompt, userPrompt, history) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userPrompt },
  ]

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, history = [] } = req.body || {}
  if (!question?.trim()) return res.status(400).json({ error: 'Brak pytania' })

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    const docs = loadDocs()
    const chunks = retrieve(docs, question, 8)
    const context = chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] (${c.metadata?.title || c.metadata?.source})\n${c.pageContent}`).join('\n\n')
      : 'Brak pasujących dokumentów w bazie wiedzy.'

    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)
    const answer = await deepseekChat(apiKey, systemPrompt, question, history)

    res.status(200).json({
      answer,
      sources: chunks.map(c => c.metadata?.title || c.metadata?.source),
    })
  } catch (err) {
    console.error('Robert error:', err.message)
    res.status(500).json({ error: err.message || 'Błąd serwera' })
  }
}
