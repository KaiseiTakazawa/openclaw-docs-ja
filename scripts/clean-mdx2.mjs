// Second pass: remove remaining Mintlify components
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')

function getAllMdx(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...getAllMdx(full))
    } else if (entry.endsWith('.mdx')) {
      files.push(full)
    }
  }
  return files
}

function cleanMdx(content) {
  let c = content

  // Replace <Tooltip ...>text</Tooltip> with just the text
  c = c.replace(/<Tooltip[^>]*>([\s\S]*?)<\/Tooltip>/g, '$1')

  // Replace <CodeGroup> tags
  c = c.replace(/<\/?CodeGroup>/g, '')

  // Remove any remaining JSX-like component tags that Nextra doesn't know about
  const unknownComponents = [
    'Tooltip', 'CodeBlock', 'ResponseField', 'Expandable',
    'ParamField', 'RequestExample', 'ResponseExample', 'Snippet',
    'Frame', 'Icon', 'Update', 'Param', 'Properties',
  ]

  for (const tag of unknownComponents) {
    // Self-closing
    c = c.replace(new RegExp(`<${tag}\\s[^>]*/\\s*>`, 'g'), '')
    // Opening tag with content
    c = c.replace(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'), '$1')
    // Opening/closing without content
    c = c.replace(new RegExp(`</?${tag}[^>]*>`, 'g'), '')
  }

  return c
}

const files = getAllMdx(contentDir)
let modified = 0

for (const file of files) {
  if (file.endsWith('content/index.mdx')) continue
  const original = readFileSync(file, 'utf8')
  const cleaned = cleanMdx(original)
  if (cleaned !== original) {
    writeFileSync(file, cleaned)
    modified++
  }
}

console.log(`Cleaned ${modified}/${files.length} MDX files (pass 2)`)
