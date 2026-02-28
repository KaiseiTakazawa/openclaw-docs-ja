// Translate raw markdown files to Japanese MDX
// Usage: node scripts/translate-batch.mjs <section>
// This copies raw files to content/ as .mdx with frontmatter
// Actual translation is done by Codex or AI
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { dirname, join, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawDir = join(__dirname, '..', 'raw')
const contentDir = join(__dirname, '..', 'content')

const section = process.argv[2]

function getAllFiles(dir, prefix = '') {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = prefix ? `${prefix}/${entry}` : entry
    if (statSync(full).isDirectory()) {
      files.push(...getAllFiles(full, rel))
    } else if (entry.endsWith('.md')) {
      files.push(rel)
    }
  }
  return files
}

function addFrontmatter(content, path) {
  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : basename(path, '.md')

  // Remove the doc index banner that appears at the top
  let cleaned = content.replace(/^>\s+##\s+Documentation Index[\s\S]*?(?=\n[^>])/m, '')
  cleaned = cleaned.trim()

  return `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${cleaned}\n`
}

if (section) {
  const sectionDir = join(rawDir, section)
  const files = getAllFiles(sectionDir)
  console.log(`Section: ${section} (${files.length} files)`)
  for (const file of files) {
    const raw = readFileSync(join(sectionDir, file), 'utf8')
    const mdx = addFrontmatter(raw, file)
    const outPath = join(contentDir, section, file.replace('.md', '.mdx'))
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, mdx)
    console.log(`  ${file} -> ${outPath}`)
  }
} else {
  // Process all sections
  const sections = readdirSync(rawDir).filter(d =>
    statSync(join(rawDir, d)).isDirectory()
  )

  // Also handle root files
  const rootFiles = readdirSync(rawDir).filter(f => f.endsWith('.md'))
  for (const file of rootFiles) {
    const raw = readFileSync(join(rawDir, file), 'utf8')
    const mdx = addFrontmatter(raw, file)
    const outPath = join(contentDir, file.replace('.md', '.mdx'))
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, mdx)
    console.log(`Root: ${file}`)
  }

  for (const section of sections) {
    const files = getAllFiles(join(rawDir, section))
    console.log(`${section}: ${files.length} files`)
    for (const file of files) {
      const raw = readFileSync(join(rawDir, section, file), 'utf8')
      const mdx = addFrontmatter(raw, file)
      const outPath = join(contentDir, section, file.replace('.md', '.mdx'))
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, mdx)
    }
  }

  console.log(`\nTotal sections: ${sections.length}`)
  console.log(`Total root files: ${rootFiles.length}`)
}
