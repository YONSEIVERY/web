import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { NoiseLayer } from '@/components/ui/noise-layer'
import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'VERY ─ 연세대학교 창업학회', template: '%s · VERY' },
  description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
  metadataBase: new URL(process.env.SITE_URL ?? 'https://yonseivery.com'),
  openGraph: {
    title: 'VERY ─ 연세대학교 창업학회',
    description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
    siteName: 'VERY',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <NoiseLayer />
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
