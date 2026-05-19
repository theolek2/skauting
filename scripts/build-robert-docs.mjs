// Skrypt budujący bazę wiedzy Roberta
// Uruchom: npm run build:docs
// Czyta: docs/*.txt, docs/*.md + szablony z dokumenty-szablony.js
// Zapisuje: src/data/robert-docs.json

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Usuń tagi HTML z tekstu
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\{[^}]+\}\}/g, ' ')  // usuń placeholdery
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Podziel tekst na chunki ~500 słów z overlappem ~50 słów
function splitIntoChunks(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const chunks = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 30) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}

const allDocs = []

// 1. Czytaj pliki z folderu docs/
const docsDir = join(ROOT, 'docs')
try {
  const files = readdirSync(docsDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'))
  for (const file of files) {
    const text = readFileSync(join(docsDir, file), 'utf-8')
    const chunks = splitIntoChunks(text)
    chunks.forEach((chunk, i) => {
      allDocs.push({
        pageContent: chunk,
        metadata: { source: file, title: file.replace(/\.[^.]+$/, ''), chunk: i }
      })
    })
    console.log(`✅ ${file}: ${chunks.length} chunków`)
  }
} catch (e) {
  console.warn('Brak folderu docs/ lub błąd czytania:', e.message)
}

// 2. Wyciągnij treść z dokumenty-szablony.js
try {
  const szablonyPath = join(ROOT, 'src', 'data', 'dokumenty-szablony.js')
  const szablonyRaw = readFileSync(szablonyPath, 'utf-8')

  // Wyciągnij wszystkie wartości html: `...`
  const htmlMatches = [...szablonyRaw.matchAll(/html:\s*`([\s\S]*?)`\s*,?\s*\n\s*[},]/g)]
  // Wyciągnij labele
  const labelMatches = [...szablonyRaw.matchAll(/label:\s*'([^']+)'/g)]

  htmlMatches.forEach((match, i) => {
    const label = labelMatches[i]?.captures?.[0] || labelMatches[i]?.[1] || `szablon_${i}`
    const text = stripHtml(match[1])
    const chunks = splitIntoChunks(text, 400)
    chunks.forEach((chunk, j) => {
      allDocs.push({
        pageContent: chunk,
        metadata: { source: 'dokumenty-szablony.js', title: label, chunk: j }
      })
    })
  })

  // Alternatywne parsowanie — szukaj pól html w każdym bloku kluczowym
  const blockRegex = /(\w+):\s*\{[\s\S]*?html:\s*`([\s\S]*?)`/g
  let blockMatch
  const seen = new Set()
  while ((blockMatch = blockRegex.exec(szablonyRaw)) !== null) {
    const key = blockMatch[1]
    if (seen.has(key)) continue
    seen.add(key)
    const text = stripHtml(blockMatch[2])
    if (text.length < 50) continue
    const chunks = splitIntoChunks(text, 400)
    chunks.forEach((chunk, j) => {
      allDocs.push({
        pageContent: chunk,
        metadata: { source: 'dokumenty-szablony.js', title: key, chunk: j }
      })
    })
  }

  console.log(`✅ dokumenty-szablony.js: ${allDocs.filter(d => d.metadata.source === 'dokumenty-szablony.js').length} chunków`)
} catch (e) {
  console.warn('Błąd czytania dokumenty-szablony.js:', e.message)
}

// Usuń duplikaty po pageContent
const unique = []
const seen = new Set()
for (const doc of allDocs) {
  const key = doc.pageContent.slice(0, 100)
  if (!seen.has(key) && doc.pageContent.length > 30) {
    seen.add(key)
    unique.push(doc)
  }
}

const outPath = join(ROOT, 'src', 'data', 'robert-docs.json')
writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf-8')
console.log(`\n📚 Zapisano ${unique.length} chunków → src/data/robert-docs.json`)
