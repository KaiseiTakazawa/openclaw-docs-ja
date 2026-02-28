// Save fetched batch content to raw/ directory
// Usage: echo '<json>' | node scripts/save-batch.mjs
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawDir = join(__dirname, '..', 'raw')

// Read from stdin or file argument
let input = ''
if (process.argv[2]) {
  input = require('fs').readFileSync(process.argv[2], 'utf8')
} else {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  input = Buffer.concat(chunks).toString()
}

const data = JSON.parse(input)

// data is array of {url, path, content}
for (const item of data) {
  const filePath = join(rawDir, item.path + '.md')
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, item.content)
  console.log(`Saved: ${item.path}.md (${item.content.length} chars)`)
}
