// Robert — asystent skautowy
// Jina embeddings + keyword fallback + linki do plików PDF

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SYSTEM_PROMPT = `Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach przeciwpożarowych, prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

WAŻNE — zasady odpowiadania:
- Odpowiadaj WYŁĄCZNIE na podstawie dostarczonego kontekstu gdy pytanie dotyczy wymagań urzędowych, dokumentów, terminów lub przepisów prawnych.
- NIE twierdzisz, że "nie trzeba wysyłać dokumentów" ani że "brak wymagań" jeśli kontekst tego wprost i jednoznacznie nie stwierdza. Brak informacji w kontekście ≠ brak obowiązku.
- Jeśli kontekst jest niewystarczający, napisz: "Nie mam pewności co do tego wymagania — sprawdź aktualne przepisy lub zapytaj hufcowego."
- Nie wymyślaj przepisów, terminów ani numerów aktów prawnych.

Kontekst z dokumentów skautowych:
{context}

Jeśli kontekst nie zawiera odpowiedzi — powiedz to wprost i poproś o doprecyzowanie pytania.`

// ── Ładowanie danych (z cache) ────────────────────────────────────────────────
let _fileMap = null
let _docsCache = null

function loadFileMap() {
  if (_fileMap) return _fileMap
  try { _fileMap = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'file-map.json'), 'utf-8')) }
  catch { _fileMap = {} }
  return _fileMap
}

function loadDocs() {
  if (_docsCache) return _docsCache
  try { _docsCache = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'robert-docs.json'), 'utf-8')) }
  catch { _docsCache = [] }
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

// ── Jina embedding ────────────────────────────────────────────────────────────
async function queryEmbedding(text, jinaKey) {
  if (!jinaKey) return null
  try {
    const res = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jinaKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jina-embeddings-v3', input: text.slice(0, 2000) }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch { return null }
}

// ── Hybrid retrieval: 60% semantic + 40% keyword ─────────────────────────────
async function retrieve(docs, question, jinaKey, k = 8) {
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2)

  // Keyword scores (zawsze, 0–1)
  const kwMap = new Map(docs.map(d => {
    const c = d.pageContent?.toLowerCase() || ''
    const hits = words.reduce((s, w) => s + (c.includes(w) ? 1 : 0), 0)
    return [d, words.length > 0 ? hits / words.length : 0]
  }))

  // Semantic scores (jeśli embeddingi dostępne)
  let semMap = new Map(docs.map(d => [d, 0]))
  if (docs.some(d => d.embedding) && jinaKey) {
    const qEmb = await queryEmbedding(question, jinaKey)
    if (qEmb) {
      semMap = new Map(docs.map(d => [d, d.embedding ? cosineSim(qEmb, d.embedding) : 0]))
    }
  }

  // Scal: 60% semantic + 40% keyword
  return docs
    .map(d => ({ ...d, score: 0.6 * (semMap.get(d) || 0) + 0.4 * (kwMap.get(d) || 0) }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// ── Źródła plików (URL-e do PDF-ów) ────────────────────────────────────────────
function getSources(rawSources) {
  const map = loadFileMap()
  const results = []
  const seen = new Set()
  for (const src of rawSources) {
    // Próbuj klucz z rozszerzeniem i bez (metadata.title może nie mieć .txt)
    const entry = map[src] || map[src + '.txt'] || map[src + '.md'] || map[src + '.pdf']
    if (!entry || seen.has(entry.title)) continue
    seen.add(entry.title)
    results.push({ title: entry.title, file: entry.file, url: entry.url || null })
  }
  return results.slice(0, 5)
}

// ── DeepSeek Chat API ─────────────────────────────────────────────────────────
async function deepseekChat(apiKey, systemPrompt, userPrompt, history) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant', content: m.content,
    })),
    { role: 'user', content: userPrompt },
  ]
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.3, max_tokens: 1500 }),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`DeepSeek ${res.status}: ${t.slice(0, 200)}`) }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, history = [] } = req.body || {}
  if (!question?.trim()) return res.status(400).json({ error: 'Brak pytania' })

  const apiKey = process.env.DEEPSEEK_API_KEY
  const jinaKey = process.env.JINA_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    const docs = loadDocs()
    const chunks = await retrieve(docs, question, jinaKey)
    const context = chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] (${c.metadata?.title || c.metadata?.source})\n${c.pageContent}`).join('\n\n')
      : 'Brak pasujących dokumentów w bazie wiedzy.'

    const rawSources = [...new Set(chunks.map(c => c.metadata?.title || c.metadata?.source).filter(Boolean))]
    const sources = getSources(rawSources)

    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)
    const answer = await deepseekChat(apiKey, systemPrompt, question, history)

    res.status(200).json({ answer, sources })
  } catch (err) {
    console.error('Robert error:', err.message)
    res.status(500).json({ error: err.message || 'Błąd serwera' })
  }
}
