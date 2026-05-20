// Skrypt budujący bazę wiedzy Roberta z embeddingami HuggingFace
// Uruchom: npm run build:docs
// Obsługuje: .txt, .md, .pdf, .docx
// Wymaga: HF_TOKEN w .env.local lub zmiennej środowiskowej

// Polyfill DOMMatrix dla pdf-parse w środowisku Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0 }
    static fromMatrix(m) { return new DOMMatrix() }
    invertSelf() { return this }
    multiplySelf() { return this }
    translateSelf() { return this }
    scaleSelf() { return this }
  }
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(w, h) { this.width=w; this.height=h; this.data=new Uint8ClampedArray(w*h*4) }
  }
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {}
}

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Wczytaj HF_TOKEN z .env.local
function loadEnv() {
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf-8')
    for (const line of env.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k?.trim() && v.length) process.env[k.trim()] = v.join('=').trim()
    }
  } catch {}
}
loadEnv()

const HF_TOKEN = process.env.HF_TOKEN
const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'

if (!HF_TOKEN) {
  console.warn('⚠️  Brak HF_TOKEN — chunki zostaną zapisane BEZ embeddingów (BM25 fallback).')
  console.warn('   Dodaj HF_TOKEN=hf_... do .env.local\n')
}

// Pobierz embedding z HuggingFace Inference API
async function getEmbedding(text) {
  if (!HF_TOKEN) return null
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text.slice(0, 512), options: { wait_for_model: true } }),
      }
    )
    if (!res.ok) {
      console.warn(`HF API błąd ${res.status}: ${await res.text()}`)
      return null
    }
    const data = await res.json()
    // Wynik może być [[...]] lub [...] zależnie od wersji API
    return Array.isArray(data[0]) ? data[0] : data
  } catch (e) {
    console.warn('HF embedding błąd:', e.message)
    return null
  }
}

// Usuń tagi HTML i placeholdery
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\{[^}]+\}\}/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ').trim()
}

// Podziel tekst na chunki z overlappem
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

// Wyciągnij tekst z pliku wg rozszerzenia
async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase()

  if (ext === '.txt' || ext === '.md') {
    return readFileSync(filePath, 'utf-8')
  }

  if (ext === '.pdf') {
    const { default: PDFParser } = await import('pdf2json')
    return new Promise((resolve, reject) => {
      // Wycisz ostrzeżenia SMask/TilingType (nieszkodliwe — brak obsługi grafik w pdf2json)
      const origStderr = process.stderr.write.bind(process.stderr)
      process.stderr.write = () => true
      const origWarn = console.warn
      console.warn = () => {}
      const parser = new PDFParser(null, true)
      const restore = () => { process.stderr.write = origStderr; console.warn = origWarn }
      parser.on('pdfParser_dataReady', data => {
        restore()
        const text = (data.Pages || []).flatMap(page =>
          (page.Texts || []).map(t =>
            decodeURIComponent(t.R?.map(r => r.T).join('') || '')
          )
        ).join(' ')
        resolve(text)
      })
      parser.on('pdfParser_dataError', err => {
        restore()
        reject(new Error(err.parserError || 'PDF parse error'))
      })
      parser.loadPDF(filePath)
    })
  }

  if (ext === '.docx' || ext === '.doc') {
    const mammothMod = await import('mammoth')
    const mammoth = mammothMod.default || mammothMod
    const { value } = await mammoth.extractRawText({ path: filePath })
    return value
  }

  return null
}

// ── Główna logika ──────────────────────────────────────────────────────────────

const allChunks = []

// Rekurencyjne zbieranie plików z folderu i podfolderów
function collectFiles(dir) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        results.push(...collectFiles(full))
      } else if (['.txt', '.md', '.pdf', '.docx', '.doc'].includes(extname(entry).toLowerCase())) {
        results.push(full)
      }
    }
  } catch {}
  return results
}

// Pomocnik: załaduj TXT z folderu
async function loadTxtFolder(dir, label) {
  try {
    const files = collectFiles(dir).filter(f =>
      ['.txt', '.md'].includes(extname(f).toLowerCase())
    )
    for (const filePath of files) {
      const file = filePath.replace(dir + '\\', '').replace(dir + '/', '')
      try {
        const text = readFileSync(filePath, 'utf-8')
        if (!text.trim()) continue
        const chunks = splitIntoChunks(text)
        chunks.forEach((chunk, i) => allChunks.push({
          pageContent: chunk,
          metadata: { source: file, title: file.replace(/\.[^.]+$/, ''), chunk: i }
        }))
        console.log(`✅ [${label}] ${file}: ${chunks.length} chunków`)
      } catch (e) {
        console.warn(`⚠️  Błąd ${file}:`, e.message)
      }
    }
  } catch {}
}

// 1a. docs_txt/ — skonwertowane pliki (z npm run extract)
const docsTxtDir = join(ROOT, 'docs_txt')
await loadTxtFolder(docsTxtDir, 'docs_txt')

// 1b. docs/ — oryginalne pliki .txt i .md (bez PDF/DOCX — już skonwertowane)
const docsDir = join(ROOT, 'docs')
await loadTxtFolder(docsDir, 'docs')

// 2. Szablony z dokumenty-szablony.js
try {
  const szablonyPath = join(ROOT, 'src', 'data', 'dokumenty-szablony.js')
  const raw = readFileSync(szablonyPath, 'utf-8')
  const blockRegex = /(\w+):\s*\{[\s\S]*?html:\s*`([\s\S]*?)`/g
  let m
  const seen = new Set()
  while ((m = blockRegex.exec(raw)) !== null) {
    const key = m[1]
    if (seen.has(key) || ['const', 'let', 'var'].includes(key)) continue
    seen.add(key)
    const text = stripHtml(m[2])
    if (text.length < 50) continue
    const chunks = splitIntoChunks(text, 400)
    chunks.forEach((chunk, i) => allChunks.push({
      pageContent: chunk,
      metadata: { source: 'dokumenty-szablony.js', title: key, chunk: i }
    }))
  }
  const szCount = allChunks.filter(d => d.metadata.source === 'dokumenty-szablony.js').length
  console.log(`✅ dokumenty-szablony.js: ${szCount} chunków`)
} catch (e) {
  console.warn('Błąd dokumenty-szablony.js:', e.message)
}

// Usuń duplikaty
const unique = []
const seenContent = new Set()
for (const doc of allChunks) {
  const key = doc.pageContent.slice(0, 100)
  if (!seenContent.has(key) && doc.pageContent.length > 30) {
    seenContent.add(key)
    unique.push(doc)
  }
}

console.log(`\n📚 ${unique.length} unikalnych chunków — obliczam embeddingi...\n`)

// 3. Embeddingi HuggingFace (z rate limiting)
let embedded = 0, failed = 0
for (let i = 0; i < unique.length; i++) {
  const doc = unique[i]
  const emb = await getEmbedding(doc.pageContent)
  if (emb) {
    doc.embedding = emb
    embedded++
  } else {
    failed++
  }
  // Krótka pauza żeby nie przekroczyć rate limit HF
  if (HF_TOKEN && i < unique.length - 1) await new Promise(r => setTimeout(r, 200))
  process.stdout.write(`\r  [${i + 1}/${unique.length}] ✅ ${embedded} embeddingów, ⚠️ ${failed} bez`)
}
console.log('\n')

// 4. Zapisz
const outPath = join(ROOT, 'src', 'data', 'robert-docs.json')
writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf-8')
console.log(`💾 Zapisano → src/data/robert-docs.json`)
console.log(`   ${embedded} chunków z embeddingami, ${failed} bez (BM25 fallback)`)
if (failed > 0 && !HF_TOKEN) {
  console.log('\n👉 Aby dodać embeddingi: ustaw HF_TOKEN w .env.local i uruchom ponownie')
}
