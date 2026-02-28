// Save Scrapling bulk_get result file to raw/ directory
// Usage: node scripts/save-scrapling-result.mjs <result-file>
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawDir = join(__dirname, '..', 'raw')
const resultFile = process.argv[2]

if (!resultFile) {
  console.error('Usage: node save-scrapling-result.mjs <result-file>')
  process.exit(1)
}

const data = JSON.parse(readFileSync(resultFile, 'utf8'))
const results = data.result || data

let saved = 0
let skipped = 0

for (const item of results) {
  if (item.status !== 200) {
    console.log(`SKIP: ${item.url} (status ${item.status})`)
    skipped++
    continue
  }
  const urlPath = item.url.replace('https://docs.openclaw.ai/', '').replace('.md', '')
  const filePath = join(rawDir, urlPath + '.md')
  mkdirSync(dirname(filePath), { recursive: true })
  const content = Array.isArray(item.content) ? item.content.join('') : item.content
  writeFileSync(filePath, content)
  saved++
}

console.log(`Saved: ${saved}, Skipped: ${skipped}`)
