// Translate large MDX files by splitting into chunks
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set')
  process.exit(1)
}

const MODEL = 'gpt-4o-mini'
const MAX_CHUNK_SIZE = 12000

const SYSTEM_PROMPT = `あなたは技術ドキュメントの英日翻訳者です。以下のルールに従って、与えられたMDXファイルの部分を日本語に翻訳してください。

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
8. 与えられた部分のみを翻訳して返してください
9. 余計な説明や注釈は付けず、翻訳結果のみを返してください`

function splitIntoChunks(content) {
  const chunks = []
  const lines = content.split('\n')

  // Extract frontmatter
  let frontmatter = ''
  let bodyStart = 0
  if (lines[0] === '---') {
    const endIdx = lines.indexOf('---', 1)
    if (endIdx !== -1) {
      frontmatter = lines.slice(0, endIdx + 1).join('\n')
      bodyStart = endIdx + 1
    }
  }

  // Split body by headings (## or ###)
  let currentChunk = ''
  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i]
    if ((line.startsWith('## ') || line.startsWith('### ')) && currentChunk.length > MAX_CHUNK_SIZE) {
      chunks.push(currentChunk)
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk)
  }

  return { frontmatter, chunks }
}

async function translateChunk(content, idx, total) {
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
      max_tokens: 16000,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`API error ${resp.status}: ${err}`)
  }

  const data = await resp.json()
  console.log(`  Chunk ${idx + 1}/${total} done (${data.usage?.total_tokens || '?'} tokens)`)
  return data.choices[0].message.content
}

async function translateLargeFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  console.log(`\nTranslating: ${filePath} (${content.length} chars)`)

  const { frontmatter, chunks } = splitIntoChunks(content)
  console.log(`Split into ${chunks.length} chunks`)

  const translatedChunks = []
  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateChunk(chunks[i], i, chunks.length)
    translatedChunks.push(translated)
    // Rate limit
    await new Promise(r => setTimeout(r, 200))
  }

  const result = frontmatter + '\n' + translatedChunks.join('\n')
  writeFileSync(filePath, result)
  console.log(`Saved: ${filePath}`)
}

const files = [
  join(contentDir, 'gateway/security/index.mdx'),
  join(contentDir, 'help/faq.mdx'),
]

for (const f of files) {
  await translateLargeFile(f)
}

console.log('\nDone!')
