// Auto-translate MDX content from English to Japanese
// Simple pattern-based translation for headings, common phrases, and frontmatter
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const contentDir = join(__dirname, '..', 'content')

// Common phrase translations
const phraseMap = new Map([
  // Section headers
  ['Quick setup', 'クイックセットアップ'],
  ['Quick start', 'クイックスタート'],
  ['Prerequisites', '前提条件'],
  ['Requirements', '要件'],
  ['Installation', 'インストール'],
  ['Configuration', '設定'],
  ['Usage', '使い方'],
  ['Examples', '例'],
  ['Example', '例'],
  ['Common commands', 'よく使うコマンド'],
  ['Common flags', '共通フラグ'],
  ['Common options', '共通オプション'],
  ['Troubleshooting', 'トラブルシューティング'],
  ['Notes', '注意事項'],
  ['Note', '注意'],
  ['See also', '関連項目'],
  ['Related', '関連'],
  ['Related docs', '関連ドキュメント'],
  ['Overview', '概要'],
  ['Introduction', 'はじめに'],
  ['Getting Started', 'はじめに'],
  ['How it works', '仕組み'],
  ['Features', '機能'],
  ['Options', 'オプション'],
  ['Parameters', 'パラメーター'],
  ['Migration', '移行'],
  ['Migration Guide', '移行ガイド'],
  ['Subcommands', 'サブコマンド'],
  ['Environment Variables', '環境変数'],
  ['Security', 'セキュリティ'],
  ['Authentication', '認証'],
  ['Limitations', '制限事項'],
  ['Known issues', '既知の問題'],
  ['FAQ', 'よくある質問'],
  ['Summary', 'まとめ'],
  ['Architecture', 'アーキテクチャ'],
  ['Debugging', 'デバッグ'],
  ['Testing', 'テスト'],
  ['What is OpenClaw?', 'OpenClaw とは？'],
  ['Key capabilities', '主な機能'],
  ['Dashboard', 'ダッシュボード'],
  ['Prefer', '推奨'],
  ['Learn more', '詳しくはこちら'],
  ['Start here', 'ここから始める'],
  ['Routing bindings', 'ルーティングバインディング'],
  ['Identity files', 'アイデンティティファイル'],
  ['Set identity', 'アイデンティティ設定'],
  ['Binding scope behavior', 'バインディングスコープの動作'],
  ['Profiles', 'プロファイル'],
  ['Tabs', 'タブ'],
  ['Remote browser control', 'リモートブラウザ制御'],
  ['Config sample', '設定サンプル'],
  ['Replace approvals from a file', 'ファイルからの承認置換'],
  ['Allowlist helpers', 'アローリストヘルパー'],
  ['Capabilities probe', 'ケーパビリティプローブ'],
  ['Resolve names to IDs', '名前からIDへの解決'],
  ['Add / remove accounts', 'アカウントの追加/削除'],
  ['Login / logout (interactive)', 'ログイン/ログアウト (対話式)'],
  ['Common edits', '一般的な編集'],
  ['Values', '値'],
  ['Paths', 'パス'],
  ['Snapshot / screenshot / actions', 'スナップショット/スクリーンショット/アクション'],
  ['Chrome extension relay (attach via toolbar button)', 'Chrome 拡張リレー (ツールバーボタンから接続)'],
])

// Heading translation map for frontmatter titles
const titleMap = new Map([
  ['Auth Monitoring', '認証モニタリング'],
  ['Cron Jobs', 'Cron ジョブ'],
  ['Cron vs Heartbeat', 'Cron vs Heartbeat'],
  ['Gmail PubSub', 'Gmail PubSub'],
  ['Hooks', 'フック'],
  ['Polls', 'ポーリング'],
  ['Automation Troubleshooting', '自動化トラブルシューティング'],
  ['Webhooks', 'Webhook'],
  ['Chat Channels', 'チャットチャネル'],
  ['Channel Routing', 'チャネルルーティング'],
  ['Broadcast Groups', 'ブロードキャストグループ'],
  ['Group Messages', 'グループメッセージ'],
  ['Groups', 'グループ'],
  ['Channel Location Parsing', 'チャネル位置情報パース'],
  ['Pairing', 'ペアリング'],
  ['Channel Troubleshooting', 'チャネルトラブルシューティング'],
  ['CLI Reference', 'CLI リファレンス'],
  ['Agent Runtime', 'エージェントランタイム'],
  ['Agent Loop', 'エージェントループ'],
  ['Agent Workspace', 'エージェントワークスペース'],
  ['Gateway Architecture', 'ゲートウェイアーキテクチャ'],
  ['Compaction', 'コンパクション'],
  ['Context', 'コンテキスト'],
  ['Features', '機能一覧'],
  ['Markdown Formatting', 'Markdown フォーマット'],
  ['Memory', 'メモリ'],
  ['Messages', 'メッセージ'],
  ['Model Failover', 'モデルフェイルオーバー'],
  ['Model Providers', 'モデルプロバイダー'],
  ['Models CLI', 'モデル CLI'],
  ['Multi-Agent Routing', 'マルチエージェントルーティング'],
  ['Presence', 'プレゼンス'],
  ['Command Queue', 'コマンドキュー'],
  ['Retry Policy', 'リトライポリシー'],
  ['Session Management', 'セッション管理'],
  ['Session Pruning', 'セッションプルーニング'],
  ['Session Tools', 'セッションツール'],
  ['Sessions', 'セッション'],
  ['Streaming and Chunking', 'ストリーミングとチャンキング'],
  ['System Prompt', 'システムプロンプト'],
  ['Timezones', 'タイムゾーン'],
  ['Typing Indicators', 'タイピングインジケーター'],
  ['Usage Tracking', '使用量トラッキング'],
  ['Configuration', '設定'],
  ['Configuration Reference', '設定リファレンス'],
  ['Configuration Examples', '設定例'],
  ['Authentication', '認証'],
  ['Background Exec and Process Tool', 'バックグラウンド実行とプロセスツール'],
  ['Bonjour Discovery', 'Bonjour ディスカバリー'],
  ['Bridge Protocol', 'ブリッジプロトコル'],
  ['CLI Backends', 'CLI バックエンド'],
  ['Discovery and Transports', 'ディスカバリーとトランスポート'],
  ['Gateway Lock', 'ゲートウェイロック'],
  ['Health Checks', 'ヘルスチェック'],
  ['Heartbeat', 'ハートビート'],
  ['Gateway Runbook', 'ゲートウェイランブック'],
  ['Local Models', 'ローカルモデル'],
  ['Logging', 'ロギング'],
  ['Multiple Gateways', 'マルチゲートウェイ'],
  ['Network model', 'ネットワークモデル'],
  ['OpenAI Chat Completions', 'OpenAI Chat Completions'],
  ['Gateway-Owned Pairing', 'ゲートウェイペアリング'],
  ['Gateway Protocol', 'ゲートウェイプロトコル'],
  ['Remote Access', 'リモートアクセス'],
  ['Remote Gateway Setup', 'リモートゲートウェイ設定'],
  ['Sandbox vs Tool Policy vs Elevated', 'Sandbox vs Tool Policy vs Elevated'],
  ['Sandboxing', 'サンドボックス'],
  ['Secrets Management', 'シークレット管理'],
  ['Secrets Apply Plan Contract', 'シークレットプランコントラクト'],
  ['Security', 'セキュリティ'],
  ['Tools Invoke API', 'Tools Invoke API'],
  ['Troubleshooting', 'トラブルシューティング'],
  ['Trusted Proxy Auth', 'Trusted Proxy Auth'],
  ['Debugging', 'デバッグ'],
  ['Environment Variables', '環境変数'],
  ['Help', 'ヘルプ'],
  ['Scripts', 'スクリプト'],
  ['Testing', 'テスト'],
  ['Install', 'インストール'],
  ['Installer Internals', 'インストーラー内部'],
  ['Development Channels', '開発チャネル'],
  ['Migration Guide', '移行ガイド'],
  ['Updating', 'アップデート'],
  ['Uninstall', 'アンインストール'],
  ['Audio and Voice Notes', 'オーディオとボイスメモ'],
  ['Camera Capture', 'カメラキャプチャ'],
  ['Image and Media Support', '画像とメディアサポート'],
  ['Nodes', 'ノード'],
  ['Location Command', '位置情報コマンド'],
  ['Talk Mode', 'Talk モード'],
  ['Node Troubleshooting', 'ノードトラブルシューティング'],
  ['Voice Wake', 'Voice Wake'],
  ['Platforms', 'プラットフォーム'],
  ['Community plugins', 'コミュニティプラグイン'],
  ['Voice Call Plugin', 'Voice Call プラグイン'],
  ['Zalo Personal Plugin', 'Zalo Personal プラグイン'],
  ['Model Provider Quickstart', 'モデルプロバイダークイックスタート'],
  ['Default AGENTS.md', 'デフォルト AGENTS.md'],
  ['Release Checklist', 'リリースチェックリスト'],
  ['Credits', 'クレジット'],
  ['Device Model Database', 'デバイスモデルデータベース'],
  ['Prompt Caching', 'プロンプトキャッシング'],
  ['RPC Adapters', 'RPC アダプター'],
  ['Session Management Deep Dive', 'セッション管理詳解'],
  ['Tests', 'テスト'],
  ['Token Use and Costs', 'トークン使用量とコスト'],
  ['Onboarding Wizard Reference', 'オンボーディングウィザードリファレンス'],
  ['Formal Verification (Security Models)', '形式検証 (セキュリティモデル)'],
  ['Formal Verification', '形式検証'],
  ['Agent Bootstrapping', 'エージェントブートストラップ'],
  ['Docs directory', 'ドキュメントディレクトリ'],
  ['Getting Started', 'はじめに'],
  ['Docs Hubs', 'ドキュメントハブ'],
  ['OpenClaw Lore', 'OpenClaw の由来'],
  ['Onboarding (macOS App)', 'オンボーディング (macOS アプリ)'],
  ['Onboarding Overview', 'オンボーディング概要'],
  ['Personal Assistant Setup', 'パーソナルアシスタント設定'],
  ['Setup', 'セットアップ'],
  ['Showcase', 'ショーケース'],
  ['Onboarding Wizard (CLI)', 'オンボーディングウィザード (CLI)'],
  ['Tools', 'ツール'],
  ['ACP Agents', 'ACP エージェント'],
  ['Agent Send', 'Agent Send'],
  ['apply_patch Tool', 'apply_patch ツール'],
  ['Browser (OpenClaw-managed)', 'ブラウザ (OpenClaw 管理)'],
  ['Browser', 'ブラウザ'],
  ['Browser Troubleshooting', 'ブラウザトラブルシューティング'],
  ['Browser Login', 'ブラウザログイン'],
  ['Chrome Extension', 'Chrome 拡張機能'],
  ['Elevated Mode', 'Elevated モード'],
  ['Exec Tool', 'Exec ツール'],
  ['LLM Task', 'LLM タスク'],
  ['Multi-Agent Sandbox & Tools', 'マルチエージェントサンドボックス & ツール'],
  ['Plugins', 'プラグイン'],
  ['Reactions', 'リアクション'],
  ['Skills', 'スキル'],
  ['Skills Config', 'スキル設定'],
  ['Slash Commands', 'スラッシュコマンド'],
  ['Sub-Agents', 'サブエージェント'],
  ['Thinking Levels', 'Thinking レベル'],
  ['Web Tools', 'Web ツール'],
  ['Control UI', 'Control UI'],
  ['Dashboard', 'ダッシュボード'],
  ['Web', 'Web UI'],
  ['WebChat', 'WebChat'],
  ['TUI', 'TUI'],
  ['CI Pipeline', 'CI パイプライン'],
  ['Onboarding and Config Protocol', 'オンボーディングと設定プロトコル'],
  ['Model Config Exploration', 'モデル設定探索'],
  ['Workspace Memory Research', 'ワークスペースメモリ研究'],
  ['macOS App', 'macOS アプリ'],
  ['Android App', 'Android アプリ'],
  ['iOS App', 'iOS アプリ'],
  ['Linux App', 'Linux アプリ'],
  ['Windows (WSL2)', 'Windows (WSL2)'],
  ['Gateway on macOS', 'macOS のゲートウェイ'],
  ['Canvas', 'Canvas'],
  ['Gateway Lifecycle', 'ゲートウェイライフサイクル'],
  ['macOS Dev Setup', 'macOS 開発セットアップ'],
  ['Menu Bar Icon', 'メニューバーアイコン'],
  ['macOS Logging', 'macOS ロギング'],
  ['Menu Bar', 'メニューバー'],
  ['Peekaboo Bridge', 'Peekaboo Bridge'],
  ['macOS Permissions', 'macOS 権限'],
  ['macOS Release', 'macOS リリース'],
  ['Remote Control', 'リモートコントロール'],
  ['macOS Signing', 'macOS 署名'],
  ['Voice Overlay', 'Voice Overlay'],
  ['macOS IPC', 'macOS IPC'],
])

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

function translateFile(content) {
  let c = content

  // Translate frontmatter title
  c = c.replace(/^(---\ntitle: ")([^"]+)(")/m, (match, pre, title, post) => {
    const translated = titleMap.get(title) || title
    return `${pre}${translated}${post}`
  })

  // Translate headings (but not inside code blocks)
  const lines = c.split('\n')
  let inCodeBlock = false
  const translatedLines = lines.map(line => {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      return line
    }
    if (inCodeBlock) return line

    // Translate heading text
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1]
      const text = headingMatch[2].trim()
      // Check exact match in titleMap or phraseMap
      const translated = titleMap.get(text) || phraseMap.get(text) || text
      return `${level} ${translated}`
    }

    return line
  })

  return translatedLines.join('\n')
}

const files = getAllMdx(contentDir)
let modified = 0

for (const file of files) {
  if (file.endsWith('content/index.mdx')) continue
  const original = readFileSync(file, 'utf8')
  const translated = translateFile(original)
  if (translated !== original) {
    writeFileSync(file, translated)
    modified++
  }
}

console.log(`Translated ${modified}/${files.length} MDX files (headings + titles)`)
