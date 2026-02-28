// Fetch all OpenClaw docs pages and save as markdown files
// Usage: node scripts/fetch-all.mjs
// Reads urls.json, fetches each URL, saves to raw/ directory

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const urls = JSON.parse(readFileSync(join(__dirname, 'urls.json'), 'utf8'))
const rawDir = join(__dirname, '..', 'raw')

// Create directory structure
for (const { path } of urls) {
  const dir = join(rawDir, dirname(path))
  mkdirSync(dir, { recursive: true })
}

// Generate batch list for Scrapling MCP bulk_get
const BATCH_SIZE = 10
const batches = []
for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  batches.push(urls.slice(i, i + BATCH_SIZE))
}

console.log(`Total: ${urls.length} pages in ${batches.length} batches of ${BATCH_SIZE}`)
console.log('\nBatches:')
batches.forEach((batch, i) => {
  console.log(`  Batch ${i + 1}: ${batch.map(u => u.path).join(', ')}`)
})

// Export for use
writeFileSync(
  join(__dirname, 'batches.json'),
  JSON.stringify(batches, null, 2)
)
console.log('\nSaved batches.json')
