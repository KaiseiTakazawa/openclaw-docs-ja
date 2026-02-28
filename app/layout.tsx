import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import 'nextra-theme-docs/style.css'
import './global.css'

export const metadata: Metadata = {
  title: {
    default: 'OpenClaw ドキュメント 日本語版',
    template: '%s | OpenClaw Docs JP',
  },
  description: 'OpenClaw の公式ドキュメント日本語翻訳',
}

const logo = (
  <span style={{ fontWeight: 700, fontSize: '1.1em' }}>
    🦞 OpenClaw <span style={{ color: 'var(--nextra-primary-color)', fontWeight: 400 }}>ドキュメント</span>
  </span>
)

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Layout
          navbar={<Navbar logo={logo} />}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/michibiku/openclaw-docs-ja/tree/main"
          footer={
            <Footer>
              <p>OpenClaw ドキュメント 日本語翻訳 — Michibiku Group</p>
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
