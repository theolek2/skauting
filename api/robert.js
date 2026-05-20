// Robert — asystent skautowy
// Bez langchain, bez statycznego importu JSON (Vercel-friendly)

import { readFileSync } from 'fs'
import { join } from 'path'

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'

// ── Embedding (DeepSeek z HF fallback) ────────────────────────────────────────
async function getEmbedding(text, apiKey, hfToken) {
  // Prefer DeepSeek jeśli klucz dostępny
  if (apiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', input: text.slice(0, 2000) }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.data?.[0]?.embedding || null
      }
    } catch {}
  }
  // HF fallback
  if (!hfToken) return null
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text.slice(0, 512), options: { wait_for_model: true } }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data[0]) ? data[0] : data
  } catch { return null }
}
  return _docsCache
}

// ── Cosine similarity ─────────────────────────────────────────────────────────
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10)
}

// ── HuggingFace embedding ─────────────────────────────────────────────────────
async function getEmbedding(text, hfToken) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text.slice(0, 512), options: { wait_for_model: true } }),
    }
  )
  if (!res.ok) throw new Error(`HF API: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data[0]) ? data[0] : data
}

// ── BM25 keyword fallback ─────────────────────────────────────────────────────
function keywordRetrieve(docs, query, k = 4) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
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

// ── Retrieval (cosine + BM25 fallback) ────────────────────────────────────────
async function retrieve(docs, question, apiKey, hfToken, k = 4) {
  const hasEmbeddings = docs.some(d => d.embedding)

  if (hasEmbeddings && (apiKey || hfToken)) {
    try {
      const qEmb = await getEmbedding(question, apiKey, hfToken)
      return docs
        .filter(d => d.embedding)
        .map(d => ({ ...d, score: cosineSim(qEmb, d.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
    } catch {}
  }

  return keywordRetrieve(docs, question, k)
}

// ── DeepSeek API (OpenAI-compatible) ──────────────────────────────────────────
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
  const hfToken = process.env.HF_TOKEN

  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    // 1. Wczytaj bazę wiedzy (dynamicznie, nie jako import)
    const docs = loadDocs()

    // 2. Retrieval
    const chunks = await retrieve(docs, question, apiKey, hfToken, 4)
    const context = chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] (${c.metadata?.title || c.metadata?.source})\n${c.pageContent}`).join('\n\n')
      : 'Brak pasujących dokumentów w bazie wiedzy.'

    // 3. System prompt z kontekstem
    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)

    // 4. DeepSeek LLM
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
