// Krok 1: Konwertuj PDF/DOCX → TXT
// Uruchom: npm run extract
// Wynik: docs_txt/ (lustrzana struktura docs/ ale wszystko jako .txt)
// Potem możesz edytować pliki .txt przed npm run build:docs

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname, extname, basename, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DOCS_DIR = join(ROOT, 'docs')
const OUT_DIR  = join(ROOT, 'docs_txt')

// Wycisz ostrzeżenia pdf2json
const origStderr = process.stderr.write.bind(process.stderr)
const silenceStderr = () => { process.stderr.write = () => true }
const restoreStderr = () => { process.stderr.write = origStderr }

async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase()

  if (ext === '.txt' || ext === '.md') {
    return readFileSync(filePath, 'utf-8')
  }

  if (ext === '.pdf') {
    const { default: PDFParser } = await import('pdf2json')
    return new Promise((resolve, reject) => {
      silenceStderr()
      const origWarn = console.warn; console.warn = () => {}
      const parser = new PDFParser(null, true)
      const restore = () => { restoreStderr(); console.warn = origWarn }
      parser.on('pdfParser_dataReady', data => {
        restore()
        const text = (data.Pages || []).flatMap(page =>
          (page.Texts || []).map(t =>
            decodeURIComponent(t.R?.map(r => r.T).join('') || '')
          )
        ).join(' ').replace(/\s{2,}/g, ' ').trim()
        resolve(text)
      })
      parser.on('pdfParser_dataError', err => { restore(); reject(new Error(err.parserError)) })
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

function collectFiles(dir) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        results.push(...collectFiles(full))
      } else if (['.pdf', '.docx', '.doc', '.txt', '.md'].includes(extname(entry).toLowerCase())) {
        results.push(full)
      }
    }
  } catch {}
  return results
}

// ── Główna logika ─────────────────────────────────────────────────────────────

if (!existsSync(DOCS_DIR)) {
  console.error('❌ Brak folderu docs/')
  process.exit(1)
}

const files = collectFiles(DOCS_DIR)
if (files.length === 0) {
  console.log('ℹ️  Brak plików w docs/')
  process.exit(0)
}

console.log(`\n🔄 Konwertuję ${files.length} plików docs/ → docs_txt/\n`)

let ok = 0, skip = 0, fail = 0

for (const filePath of files) {
  const rel     = relative(DOCS_DIR, filePath)
  const ext     = extname(rel).toLowerCase()
  const outRel  = rel.replace(/\.[^.]+$/, '.txt')
  const outPath = join(OUT_DIR, outRel)
  const outDir  = dirname(outPath)

  // TXT/MD → kopiuj bez zmian (bez duplikowania)
  if (ext === '.txt' || ext === '.md') {
    // Pomiń — plik .txt jest już w docs/, nie duplikujemy
    skip++
    continue
  }

  // Sprawdź czy już skonwertowany
  if (existsSync(outPath)) {
    console.log(`⏭️  ${rel} (już istnieje → ${outRel})`)
    skip++
    continue
  }

  try {
    const text = await extractText(filePath)
    if (!text || text.trim().length < 20) {
      console.log(`⚠️  ${rel}: za mało tekstu (${text?.trim().length || 0} znaków) — pomiń`)
      fail++
      continue
    }
    mkdirSync(outDir, { recursive: true })
    writeFileSync(outPath, text, 'utf-8')
    console.log(`✅ ${rel} → docs_txt/${outRel}`)
    ok++
  } catch (e) {
    console.log(`❌ ${rel}: ${e.message}`)
    fail++
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Skonwertowano : ${ok}
⏭️  Pominięto     : ${skip}
❌ Błąd/brak tekstu: ${fail}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Pliki TXT w: docs_txt/
   → Możesz je teraz przejrzeć i edytować
   → Potem uruchom: npm run build:docs
`)
