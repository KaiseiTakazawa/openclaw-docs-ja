// Clean Mintlify-specific components from MDX files for Nextra compatibility
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

  // Remove Mintlify components: <Columns>, <Card>, <Steps>, <Step>, <Tabs>, <Tab>,
  // <AccordionGroup>, <Accordion>, <Note>, <Warning>, <Info>, <Tip>, <Check>
  const selfClosingTags = ['Card', 'CardGroup']
  const wrapperTags = ['Columns', 'Steps', 'Step', 'Tabs', 'Tab',
    'AccordionGroup', 'Accordion', 'Note', 'Warning', 'Info', 'Tip', 'Check',
    'CardGroup', 'Frame', 'ResponseField', 'Expandable', 'ParamField']

  // Remove self-closing component tags with attributes
  for (const tag of selfClosingTags) {
    c = c.replace(new RegExp(`<${tag}[^>]*/\\s*>`, 'g'), '')
  }

  // Remove opening and closing wrapper tags (keep content between)
  for (const tag of wrapperTags) {
    c = c.replace(new RegExp(`<${tag}[^>]*>`, 'g'), '')
    c = c.replace(new RegExp(`</${tag}>`, 'g'), '')
  }

  // Remove Card components (may span lines)
  c = c.replace(/<Card[^>]*>[\s\S]*?<\/Card>/g, '')
  c = c.replace(/<Card[^>]*\/>/g, '')

  // Clean up theme annotations in code blocks: ```bash theme={...}
  c = c.replace(/```(\w+)\s+theme=\{[^}]*\{[^}]*\}[^}]*\}/g, '```$1')

  // Remove data attributes from img tags
  c = c.replace(/\s+data-[\w-]+="[^"]*"/g, '')

  // Remove srcset from img tags (very long)
  c = c.replace(/\s+srcset="[^"]*"/g, '')

  // Clean up multiple blank lines
  c = c.replace(/\n{4,}/g, '\n\n\n')

  // Fix escaped characters that shouldn't be escaped in MDX
  // But be careful not to break code blocks

  return c
}

const files = getAllMdx(contentDir)
let modified = 0

for (const file of files) {
  if (file.endsWith('content/index.mdx')) continue // Skip custom index
  const original = readFileSync(file, 'utf8')
  const cleaned = cleanMdx(original)
  if (cleaned !== original) {
    writeFileSync(file, cleaned)
    modified++
  }
}

console.log(`Cleaned ${modified}/${files.length} MDX files`)
