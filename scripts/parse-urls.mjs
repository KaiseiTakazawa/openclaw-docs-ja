import { writeFileSync, readFileSync } from 'fs'

// Parse llms.txt content to extract URLs
const llmsTxt = readFileSync(process.argv[2] || '/dev/stdin', 'utf8')

const urls = []
const urlRegex = /\[([^\]]*)\]\((https:\/\/docs\.openclaw\.ai\/[^)]+\.md)\)/g
let match

while ((match = urlRegex.exec(llmsTxt)) !== null) {
  const title = match[1]
  const url = match[2]
  const path = url.replace('https://docs.openclaw.ai/', '').replace('.md', '')
  urls.push({ title, url, path })
}

writeFileSync(
  new URL('./urls.json', import.meta.url),
  JSON.stringify(urls, null, 2)
)

console.log(`Extracted ${urls.length} URLs`)

// Print section summary
const sections = {}
for (const u of urls) {
  const section = u.path.split('/')[0]
  sections[section] = (sections[section] || 0) + 1
}
console.log('\nSections:')
for (const [s, c] of Object.entries(sections).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${c} pages`)
}
