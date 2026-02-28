// Direct fetch all OpenClaw docs pages without MCP
// Usage: node scripts/fetch-direct.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const urls = JSON.parse(readFileSync(join(__dirname, 'urls.json'), 'utf8'))
const rawDir = join(__dirname, '..', 'raw')

const CONCURRENCY = 10
const DELAY_MS = 100

async function fetchPage(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'text/markdown, text/plain, */*',
    }
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`)
  return resp.text()
}

async function processItem(item) {
  const filePath = join(rawDir, item.path + '.md')

  // Skip if already fetched
  if (existsSync(filePath)) {
    const stat = readFileSync(filePath, 'utf8')
    if (stat.length > 100) {
      return { path: item.path, status: 'skip', size: stat.length }
    }
  }

  try {
    const content = await fetchPage(item.url)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content)
    return { path: item.path, status: 'ok', size: content.length }
  } catch (err) {
    return { path: item.path, status: 'error', error: err.message }
  }
}

async function main() {
  console.log(`Fetching ${urls.length} pages (concurrency: ${CONCURRENCY})...`)

  let done = 0
  let errors = 0
  let skipped = 0

  // Process in batches
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(processItem))

    for (const r of results) {
      done++
      if (r.status === 'error') {
        errors++
        console.log(`  ERROR [${done}/${urls.length}] ${r.path}: ${r.error}`)
      } else if (r.status === 'skip') {
        skipped++
      } else {
        process.stdout.write(`  [${done}/${urls.length}] ${r.path} (${r.size} chars)\n`)
      }
    }

    // Small delay between batches
    if (i + CONCURRENCY < urls.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\nDone: ${done - errors - skipped} fetched, ${skipped} skipped, ${errors} errors`)
}

main().catch(console.error)
