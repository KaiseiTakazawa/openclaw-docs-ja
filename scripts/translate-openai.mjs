// Translate all MDX files from English to Japanese using OpenAI API
// Usage: node scripts/translate-openai.mjs [--section <name>] [--dry-run]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set')
  process.exit(1)
}

const MODEL = 'gpt-4o-mini'
const CONCURRENCY = 10
const DELAY_MS = 100

const args = process.argv.slice(2)
const sectionFilter = args.includes('--section') ? args[args.indexOf('--section') + 1] : null
const dryRun = args.includes('--dry-run')

const SYSTEM_PROMPT = `あなたは技術ドキュメントの英日翻訳者です。以下のルールに従って、与えられたMDXファイルの本文を日本語に翻訳してください。

ルール:
1. frontmatter (---で囲まれた部分) はそのまま維持
2. 本文テキストを自然な日本語に翻訳
3. 以下の技術用語はカタカナまたは英語のまま維持:
   Gateway, Agent, Session, WebSocket, API, CLI, JSON, JSON5, YAML, Docker, Node.js, npm, pnpm,
   Slack, Discord, LINE, Telegram, WhatsApp, iMessage, Signal, Chrome, macOS, Linux, Windows,
   Webhook, OAuth, JWT, SSL/TLS, HTTP, HTTPS, URL, DNS, IP, TCP, UDP, SSH, Git, GitHub,
   Vercel, Tailscale, Bonjour, MCP, LLM, OpenAI, Anthropic, Claude, TypeBox, TUI, TLA+, TLC,
   Homebrew, WSL2, Canvas, Xcode, Swift, SwiftUI, XPC, LaunchAgent, launchd, systemd,
   sandbox, daemon, exec, plugin, skill, token, pairing, heartbeat, cron, proxy,
   OpenClaw, ClawHub, Lobster, Peekaboo, BlueBubbles, Nostr, Mattermost, Matrix, Feishu, Tlon
4. コードブロック(\`\`\`で囲まれた部分)内のコードは翻訳しない（コメントのみ日本語化可）
5. インラインコード(\`で囲まれた部分)は翻訳しない
6. Markdownの構造（見出し、リスト、テーブル、リンク）はそのまま維持
7. URLは一切変更しない
8. MDXファイル全体を返してください（frontmatterも含む）
9. 余計な説明や注釈は付けず、翻訳結果のみを返してください`

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

function isAlreadyTranslated(content) {
  // Check if body text contains Japanese characters (beyond frontmatter)
  const body = content.replace(/^---[\s\S]*?---/, '')
  const jaChars = body.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g)
  // If more than 20 Japanese characters in body, consider it translated
  return jaChars && jaChars.length > 20
}

async function translateFile(content) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.3,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`API error ${resp.status}: ${err}`)
  }

  const data = await resp.json()
  return data.choices[0].message.content
}

async function processFile(filePath) {
  const relPath = relative(contentDir, filePath)
  const content = readFileSync(filePath, 'utf8')

  // Skip already translated files
  if (isAlreadyTranslated(content)) {
    return { path: relPath, status: 'skip-translated', tokens: 0 }
  }

  // Skip very short files (likely just a redirect or empty)
  if (content.length < 100) {
    return { path: relPath, status: 'skip-short', tokens: 0 }
  }

  if (dryRun) {
    return { path: relPath, status: 'dry-run', tokens: Math.ceil(content.length / 4) }
  }

  try {
    const translated = await translateFile(content)
    writeFileSync(filePath, translated)
    return { path: relPath, status: 'ok', tokens: Math.ceil(content.length / 4) }
  } catch (err) {
    return { path: relPath, status: 'error', error: err.message, tokens: 0 }
  }
}

async function main() {
  let files = getAllMdx(contentDir)

  // Filter by section if specified
  if (sectionFilter) {
    files = files.filter(f => {
      const rel = relative(contentDir, f)
      return rel.startsWith(sectionFilter + '/')
    })
  }

  // Skip index.mdx (already translated manually)
  files = files.filter(f => !f.endsWith('content/index.mdx'))

  console.log(`Translating ${files.length} files (model: ${MODEL}, concurrency: ${CONCURRENCY})`)
  if (dryRun) console.log('DRY RUN - no files will be modified')

  let done = 0
  let translated = 0
  let skipped = 0
  let errors = 0
  let totalTokens = 0

  // Process in batches
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(processFile))

    for (const r of results) {
      done++
      totalTokens += r.tokens
      if (r.status === 'ok') {
        translated++
        console.log(`  [${done}/${files.length}] ${r.path} ✓`)
      } else if (r.status === 'error') {
        errors++
        console.log(`  [${done}/${files.length}] ${r.path} ✗ ${r.error}`)
      } else if (r.status.startsWith('skip')) {
        skipped++
        console.log(`  [${done}/${files.length}] ${r.path} (${r.status})`)
      } else {
        console.log(`  [${done}/${files.length}] ${r.path} (${r.status})`)
      }
    }

    // Rate limit delay
    if (i + CONCURRENCY < files.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  const estCost = (totalTokens * 0.15 / 1_000_000) + (totalTokens * 0.8 * 0.60 / 1_000_000)
  console.log(`\nDone: ${translated} translated, ${skipped} skipped, ${errors} errors`)
  console.log(`Est. tokens: ~${totalTokens.toLocaleString()} input`)
  console.log(`Est. cost: ~$${estCost.toFixed(2)}`)
}

main().catch(console.error)
