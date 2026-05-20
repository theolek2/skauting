// Robert — asystent skautowy
// Jina embeddings + keyword fallback + linki do dokumentów w apce

import { readFileSync } from 'fs'
import { join } from 'path'

const SYSTEM_PROMPT = `Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach przeciwpożarowych, prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

Odpowiadaj po polsku, zwięźle i przyjaźnie. Jeśli kontekst zawiera odpowiedź — użyj go.
Jeśli nie jesteś pewien — powiedz to wprost. Nie wymyślaj przepisów ani dat.

Kontekst z dokumentów skautowych:
{context}

Jeśli kontekst nie zawiera odpowiedzi, poproś o doprecyzowanie pytania.`

// ── Mapowanie źródeł → linki w apce ───────────────────────────────────────────
const LINK_MAP = [
  { match: /pismo|przewodnie|psp|straż|pozarna/i,        label: 'Pismo przewodnie (PSP)', tab: 'docs', template: 'przewodnie' },
  { match: /zawiadomienie|obozie/i,                        label: 'Zawiadomienie o obozie', tab: 'docs', template: 'zawiadomienie' },
  { match: /wójt|wojt|gmin|latryn/i,                       label: 'Pismo do Wójta', tab: 'docs', template: 'wojt' },
  { match: /nadleśnictw|lesnictw|leśn/i,                   label: 'Wniosek do Nadleśnictwa', tab: 'docs', template: 'nadlesnictwo' },
  { match: /szkol|pomieszczeń/i,                            label: 'Wniosek o pomieszczenia szkolne', tab: 'docs', template: 'szkola' },
  { match: /pojazd|samochod|użyczenia/i,                   label: 'Umowa użyczenia pojazdu', tab: 'docs', template: 'pojazd' },
  { match: /schronienie|tymczasow/i,                        label: 'Umowa tymcz. schronienie', tab: 'docs', template: 'schronienie' },
  { match: /oświadczenie|właściciel/i,                      label: 'Oświadczenie właściciela', tab: 'docs', template: 'oswiadczenie' },
  { match: /kontaktowa|lista kontakt/i,                     label: 'Lista kontaktowa', tab: 'docs', template: 'kontaktowa' },
  { match: /regulamin oboz|regulaminu oboz/i,               label: 'Regulamin obozu', tab: 'docs', template: 'regulamin' },
  { match: /ppoż|przeciwpoż|bezpieczeństw.*poż/i,          label: 'Instrukcja ppoż.', tab: 'docs', template: 'ppoz' },
  { match: /sanepid|sanitarn|higien/i,                      label: 'Dokumenty', tab: 'docs' },
  { match: /dane obozu|danych obozu|kadr|wychowawc/i,      label: 'Dane obozu', tab: 'camp' },
  { match: /mapa terenu|mapę terenu|mapy terenu/i,          label: 'Mapa terenu', tab: 'map' },
  { match: /plan zajęć|planu zajęć|dzień/i,                 label: 'Plan zajęć', tab: 'plan' },
  { match: /jadłospis|posiłk|zakupy|składnik/i,            label: 'Jadłospis', tab: 'jadlospis' },
  { match: /dziennik zajęć|dziennika/i,                     label: 'Dziennik zajęć', tab: 'diary' },
  { match: /instrukcj/i,                                     label: 'Instrukcje', tab: 'instructions' },
]

function getLinks(question, sources) {
  const links = []
  const seen = new Set()
  // Sprawdź każdy source i pytanie
  for (const rule of LINK_MAP) {
    if (seen.has(rule.label)) continue
    const matchesSource = sources.some(s => rule.match.test(s.toLowerCase()))
    const matchesQuestion = rule.match.test(question.toLowerCase())
    if (matchesSource || matchesQuestion) {
      seen.add(rule.label)
      links.push({ label: rule.label, tab: rule.tab, template: rule.template || null })
    }
  }
  return links.slice(0, 4)
}

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

// ── Jina embedding dla zapytania ──────────────────────────────────────────────
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

// ── Retrieval (cosine na embeddingach + BM25 fallback) ────────────────────────
function keywordRetrieve(docs, question, k = 4) {
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

async function retrieve(docs, question, jinaKey) {
  const hasEmbeddings = docs.some(d => d.embedding)

  if (hasEmbeddings && jinaKey) {
    const qEmb = await queryEmbedding(question, jinaKey)
    if (qEmb) {
      return docs
        .filter(d => d.embedding)
        .map(d => ({ ...d, score: cosineSim(qEmb, d.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
    }
  }

  return keywordRetrieve(docs, question, 8)
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
  const jinaKey = process.env.JINA_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Brak DEEPSEEK_API_KEY' })

  try {
    const docs = loadDocs()
    const chunks = await retrieve(docs, question, jinaKey)
    const context = chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] (${c.metadata?.title || c.metadata?.source})\n${c.pageContent}`).join('\n\n')
      : 'Brak pasujących dokumentów w bazie wiedzy.'

    const sources = [...new Set(chunks.map(c => c.metadata?.title || c.metadata?.source).filter(Boolean))]
    const links = getLinks(question, sources)

    const systemPrompt = SYSTEM_PROMPT.replace('{context}', context)
    const answer = await deepseekChat(apiKey, systemPrompt, question, history)

    res.status(200).json({
      answer,
      sources,
      links,
    })
  } catch (err) {
    console.error('Robert error:', err.message)
    res.status(500).json({ error: err.message || 'Błąd serwera' })
  }
}
