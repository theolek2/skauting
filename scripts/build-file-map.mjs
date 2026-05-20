// Krok 3: Generuj file-map.json + kopiuj PDFy do public/docs/
// Uruchamiany automatycznie przez: npm run build:docs
// Czyta: docs_txt/ (skonwertowane TXT) + docs/ (szuka oryginalnych PDF)
// Wynik: src/data/file-map.json + public/docs/*.pdf

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname, extname, relative, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT       = join(__dirname, '..')
const DOCS_DIR   = join(ROOT, 'docs')
const TXT_DIR    = join(ROOT, 'docs_txt')
const PUBLIC_DIR = join(ROOT, 'public', 'docs')
const OUT_PATH   = join(ROOT, 'src', 'data', 'file-map.json')

// Rekurencyjne zbieranie plików
function collectFiles(dir, exts) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, exts))
    } else if (exts.includes(extname(entry).toLowerCase())) {
      results.push(full)
    }
  }
  return results
}

const fileMap = {}

// 1. Skanuj docs_txt/ — każdy .txt odpowiada jakiemuś oryginałowi
const txtFiles = collectFiles(TXT_DIR, ['.txt', '.md'])
for (const txtPath of txtFiles) {
  const relTxt  = relative(TXT_DIR, txtPath)           // np. "Regulamin obozu.txt"
  const title   = relTxt.replace(/\.[^.]+$/, '')        // np. "Regulamin obozu"
  const baseName = basename(relTxt, extname(relTxt))    // np. "Regulamin obozu"

  // Szukaj oryginalnego PDF w docs/ (ta sama ścieżka, inne rozszerzenie)
  const relDir   = dirname(relTxt)                      // "." lub "podfolder"
  const pdfPath  = join(DOCS_DIR, relDir === '.' ? '' : relDir, baseName + '.pdf')
  const docxPath = join(DOCS_DIR, relDir === '.' ? '' : relDir, baseName + '.docx')

  if (existsSync(pdfPath)) {
    // Kopiuj PDF do public/docs/ zachowując strukturę folderów
    const destDir  = join(PUBLIC_DIR, relDir === '.' ? '' : relDir)
    const destPath = join(destDir, baseName + '.pdf')
    mkdirSync(destDir, { recursive: true })

    if (!existsSync(destPath)) {
      copyFileSync(pdfPath, destPath)
      console.log(`📄 Skopiowano: ${baseName}.pdf → public/docs/`)
    }

    const urlRel = relDir === '.' ? baseName + '.pdf' : relDir + '/' + baseName + '.pdf'
    fileMap[title] = {
      title,
      file: baseName + '.pdf',
      url:  '/docs/' + urlRel.split('/').map(encodeURIComponent).join('/'),
    }
  } else if (existsSync(docxPath)) {
    // DOCX — etykieta bez linku (nie serwujemy DOCX jako download)
    fileMap[title] = { title, file: baseName + '.docx', url: null }
    console.log(`📝 Etykieta (brak PDF): ${baseName}`)
  } else {
    // TXT bez oryginału (np. prawo-harcerskie.txt wpisane ręcznie)
    fileMap[title] = { title, file: baseName + '.txt', url: null }
  }
}

// 2. Dołącz też pliki .txt z docs/ (oryginalne, nie skonwertowane)
const rawTxtFiles = collectFiles(DOCS_DIR, ['.txt', '.md'])
for (const txtPath of rawTxtFiles) {
  const relTxt = relative(DOCS_DIR, txtPath)
  const title  = relTxt.replace(/\.[^.]+$/, '')
  if (!fileMap[title]) {
    fileMap[title] = { title, file: basename(relTxt), url: null }
  }
}

// 3. Zapisz file-map.json
writeFileSync(OUT_PATH, JSON.stringify(fileMap, null, 2), 'utf-8')

const withUrl   = Object.values(fileMap).filter(e => e.url).length
const withoutUrl = Object.values(fileMap).filter(e => !e.url).length
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 file-map.json: ${Object.keys(fileMap).length} wpisów
   📥 Z linkiem PDF : ${withUrl}
   📄 Etykieta tylko: ${withoutUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
