import { ChatGroq } from '@langchain/groq'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import docs from '../src/data/robert-docs.json' assert { type: 'json' }

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'

const SYSTEM_PROMPT = `Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach przeciwpożarowych, prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

Odpowiadaj po polsku, zwięźle i przyjaźnie. Jeśli kontekst zawiera odpowiedź — użyj go.
Jeśli nie jesteś pewien — powiedz to wprost. Nie wymyślaj przepisów ani dat.

Kontekst z dokumentów skautowych:
{context}

Jeśli kontekst nie zawiera odpowiedzi, odpowiedz na podstawie ogólnej wiedzy o harcerstwie.`

// Cosine similarity między dwoma wektorami
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

// Pobierz embedding z HuggingFace
async function getEmbedding(text, hfToken) {
  const res = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
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

// BM25-style keyword fallback gdy brak embeddingów
function keywordRetrieve(query, k = 4) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  return docs
    .map(d => {
      const content = d.pageContent.toLowerCase()
      const score = words.reduce((s, w) => s + (content.includes(w) ? 1 : 0), 0)
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// Wybierz top-k chunków
async function retrieve(question, hfToken, k = 4) {
  const hasEmbeddings = docs.some(d => d.embedding)

  if (hasEmbeddings && hfToken) {
    try {
      const qEmb = await getEmbedding(question, hfToken)
      return docs
        .filter(d => d.embedding)
        .map(d => ({ ...d, score: cosineSim(qEmb, d.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
    } catch (e) {
      console.warn('Embedding fallback do BM25:', e.message)
    }
  }

  return keywordRetrieve(question, k)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, history = [] } = req.body
  if (!question?.trim()) return res.status(400).json({ error: 'Brak pytania' })

  const groqKey = process.env.GROQ_API_KEY
  const hfToken = process.env.HF_TOKEN

  if (!groqKey) return res.status(500).json({ error: 'Brak GROQ_API_KEY' })

  try {
    // 1. Retrieving
    const chunks = await retrieve(question, hfToken)
    const context = chunks.length > 0
      ? chunks.map((c, i) => `[${i + 1}] (${c.metadata?.title || c.metadata?.source})\n${c.pageContent}`).join('\n\n')
      : 'Brak pasujących dokumentów w bazie wiedzy.'

    // 2. LLM
    const llm = new ChatGroq({ model: 'llama3-8b-8192', apiKey: groqKey, temperature: 0.3, maxTokens: 1024 })

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ])

    const chain = prompt.pipe(llm).pipe(new StringOutputParser())

    const chatHistory = history.slice(-6).map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    )

    const answer = await chain.invoke({ context, input: question, chat_history: chatHistory })

    res.status(200).json({ answer, sources: chunks.map(c => c.metadata?.title || c.metadata?.source) })
  } catch (err) {
    console.error('Robert error:', err)
    res.status(500).json({ error: err.message || 'Błąd serwera' })
  }
}
