// Parsuje długości wszystkich GIF-ów w public/filmiki/ używając omggif
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { GifReader } from 'omggif'

const DIR = 'public/filmiki'

const files = readdirSync(DIR).filter(f => f.endsWith('.gif'))
const map = {}
for (const file of files) {
  const buf = readFileSync(join(DIR, file))
  try {
    const reader = new GifReader(buf)
    let totalMs = 0
    for (let i = 0; i < reader.numFrames(); i++) {
      const info = reader.frameInfo(i)
      totalMs += info.delay * 10 // delay in hundredths → ms
    }
    map[file] = totalMs
    console.log(`${file}: ${(totalMs / 1000).toFixed(1)}s (${reader.numFrames()} klatek)`)
  } catch {
    console.log(`${file}: BŁĄD odczytu`)
    map[file] = 8000
  }
}

writeFileSync('src/data/gif-durations.json', JSON.stringify(map, null, 2), 'utf-8')
console.log(`\nZapisano do src/data/gif-durations.json`)
