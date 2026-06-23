import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { NoiseLayer } from '@/components/ui/noise-layer'

const geist = Geist({ subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'VERY ─ 연세대학교 창업학회', template: '%s · VERY' },
  description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
  // OG/Twitter 절대 URL의 기준. 과거 SITE_URL env 값이 localhost로 남아 있어
  // 메신저 미리보기가 깨졌었기에, production 도메인을 하드코딩한다.
  metadataBase: new URL('https://yonseivery.com'),
  openGraph: {
    title: 'VERY ─ 연세대학교 창업학회',
    description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
    siteName: 'VERY',
    locale: 'ko_KR',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1080,
        height: 1080,
        alt: 'VERY ─ 연세대학교 창업학회',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERY ─ 연세대학교 창업학회',
    description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
    images: ['/opengraph-image.png'],
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
        {children}
      </body>
    </html>
  )
}
