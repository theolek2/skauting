// Upload PDF-ów z docs/ do Supabase Storage + generuje file-map.json
// Uruchom: node scripts/upload-docs.mjs
// Wymaga: SUPABASE_SERVICE_KEY w .env.local

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, basename, extname, relative } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:\/)/, '$1')
const ROOT = join(__dirname, '..')
const DOCS_DIR = join(ROOT, 'docs')

// Wczytaj env
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

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Brak VITE_SUPABASE_URL lub SUPABASE_SERVICE_KEY w .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const BUCKET = 'docs-source'

// Upewnij się że bucket istnieje
try {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    console.log(`Tworzę bucket '${BUCKET}'...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw error
  }
  console.log(`✅ Bucket '${BUCKET}' gotowy`)
} catch (e) {
  console.warn('⚠️  Bucket:', e.message)
}

// Wczytaj źródła z robert-docs.json
let sources
try {
  const docs = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'robert-docs.json'), 'utf-8'))
  sources = [...new Set(docs.map(c => c.metadata?.source).filter(Boolean))]
} catch {
  console.error('❌ Brak robert-docs.json')
  process.exit(1)
}

console.log(`\n${sources.length} unikalnych źródeł w bazie Roberta\n`)

// Znajdź oryginalny plik PDF/DOCX/DOC/ODT dla każdego źródła TXT
function findOriginal(txtSource) {
  // txtSource format: "Instrukcja Sanepid 2025.txt" lub "folder/plik.txt"
  const baseName = txtSource.replace(/\.txt$/, '')
  const extensions = ['.pdf', '.docx', '.doc', '.odt', '.PDF', '.DOCX', '.DOC']

  // Szukaj w głównym docs/ i podfolderach
  function search(dir) {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      if (full.includes('docs_txt')) continue
      try {
        if (statSync(full).isDirectory()) {
          const found = search(full)
          if (found) return found
        } else {
          const name = basename(entry, extname(entry))
          if (name === baseName && extensions.includes(extname(entry).toLowerCase())) {
            return full
          }
          // Porównaj znormalizowane
          const normEntry = name.toLowerCase().replace(/\s+/g, ' ')
          const normBase = baseName.toLowerCase().replace(/\s+/g, ' ')
          if (normEntry === normBase && extensions.includes(extname(entry).toLowerCase())) {
            return full
          }
        }
      } catch {}
    }
    return null
  }

  return search(DOCS_DIR)
}

// Upload i buduj mapę
const fileMap = {}
let uploaded = 0, skipped = 0, notFound = 0

for (const source of sources) {
  if (source === 'dokumenty-szablony.js') {
    fileMap[source] = { title: 'Szablony dokumentów', file: null, url: null }
    skipped++
    continue
  }

  const original = findOriginal(source)
  if (!original) {
    fileMap[source] = { title: source.replace(/\.txt$/, ''), file: null, url: null }
    notFound++
    if (notFound <= 5) console.log(`  ⚠️  Nie znaleziono oryginału dla: ${source}`)
    continue
  }

  const fileName = basename(original)
  const storagePath = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')

  // Sprawdź czy już jest w buckecie
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: storagePath })
  if (existing?.length) {
    const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
    fileMap[source] = { title: source.replace(/\.txt$/, ''), file: fileName, url }
    skipped++
    continue
  }

  // Upload
  try {
    const fileBuffer = readFileSync(original)
    // Free tier limit: 50MB, pomiń wszystko >45MB dla bezpieczeństwa
    if (fileBuffer.length > 45 * 1024 * 1024) {
      console.log(`  ⚠️  ${fileName}: za duży (${(fileBuffer.length/1024/1024).toFixed(0)}MB)`)
      fileMap[source] = { title: source.replace(/\.txt$/, ''), file: fileName, url: null }
      notFound++
      continue
    }
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
      contentType: original.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
      upsert: true,
    })
    if (error) throw error
    const url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
    fileMap[source] = { title: source.replace(/\.txt$/, ''), file: fileName, url }
    uploaded++
    console.log(`  ✅ ${fileName}`)
  } catch (e) {
    console.log(`  ❌ ${fileName}: ${e.message}`)
    fileMap[source] = { title: source.replace(/\.txt$/, ''), file: fileName, url: null }
    notFound++
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`✅ Wgrano      : ${uploaded}`)
console.log(`⏭️  Już było    : ${skipped}`)
console.log(`⚠️  Brak/error  : ${notFound}`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`)

// Zapisz mapę
const mapPath = join(ROOT, 'src', 'data', 'file-map.json')
writeFileSync(mapPath, JSON.stringify(fileMap, null, 2), 'utf-8')
console.log(`\n💾 Zapisano → src/data/file-map.json`)
