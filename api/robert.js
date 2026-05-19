import { ChatGroq } from '@langchain/groq'
import { BM25Retriever } from '@langchain/community/retrievers/bm25'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { createRetrievalChain } from 'langchain/chains/retrieval'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import docs from '../src/data/robert-docs.json' assert { type: 'json' }

const SYSTEM_PROMPT = `Jesteś Robertem — przyjaznym asystentem skautowym Stowarzyszenia Harcerstwa Katolickiego „Zawisza" (Skauci Europy).

Pomagasz drużynowym i komendantom w organizacji obozów harcerskich: dokumentach urzędowych, przepisach przeciwpożarowych, prawie harcerskim, planowaniu obozu, bezpieczeństwie uczestników.

Odpowiadaj po polsku, zwięźle i przyjaźnie. Używaj kontekstu z dokumentów jeśli jest dostępny.
Jeśli nie jesteś pewien — powiedz to wprost. Nie wymyślaj przepisów ani dat.

Kontekst z dokumentów skautowych:
{context}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, history = [] } = req.body
  if (!question?.trim()) {
    return res.status(400).json({ error: 'Brak pytania' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza GROQ_API_KEY' })
  }

  try {
    const retriever = BM25Retriever.fromDocuments(docs, { k: 4 })

    const llm = new ChatGroq({
      model: 'llama3-8b-8192',
      apiKey,
      temperature: 0.3,
      maxTokens: 1024,
    })

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ])

    const combineChain = await createStuffDocumentsChain({ llm, prompt })
    const chain = await createRetrievalChain({ retriever, combineChain })

    const chatHistory = history.slice(-6).map(m =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    )

    const result = await chain.invoke({
      input: question,
      chat_history: chatHistory,
    })

    res.status(200).json({ answer: result.answer })
  } catch (err) {
    console.error('Robert error:', err)
    res.status(500).json({ error: err.message || 'Błąd serwera' })
  }
}
