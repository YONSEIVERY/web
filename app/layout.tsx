import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { NoiseLayer } from '@/components/ui/noise-layer'

// fallback에 Pretendard를 넣는 이유: next/font가 <html>에 --font-display를
// 레이어 밖 규칙으로 다시 선언해 globals.css의 @theme 값을 덮는다. 그래서
// 한글 폴백은 여기서만 지정할 수 있고, 빠지면 font-display를 쓰는 본문
// 한글이 전부 기기 기본 글꼴로 떨어진다. 라틴은 Geist가 먼저 잡는다.
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-display',
  fallback: ['Pretendard Variable', 'system-ui', 'sans-serif'],
})
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: 'VERY · 연세대학교 창업학회', template: '%s · VERY' },
  description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
  // OG/Twitter 절대 URL의 기준. 과거 SITE_URL env 값이 localhost로 남아 있어
  // 메신저 미리보기가 깨졌었기에, production 도메인을 하드코딩한다.
  metadataBase: new URL('https://yonseivery.com'),
  openGraph: {
    title: 'VERY · 연세대학교 창업학회',
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
        alt: 'VERY · 연세대학교 창업학회',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERY · 연세대학교 창업학회',
    description: '1997년부터 시작된 연세대학교의 가장 뿌리깊은 창업학회.',
    images: ['/opengraph-image.png'],
  },
  // Search Console / Naver Webmaster / Bing 소유권 확인용 meta.
  // 각 사이트에서 발급받은 코드를 Vercel env로 주입한다. 값이 없으면
  // meta 자체가 렌더되지 않아 무해.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NAVER_SITE_VERIFICATION
        ? { 'naver-site-verification': process.env.NAVER_SITE_VERIFICATION }
        : {}),
    },
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
        <Analytics />
      </body>
    </html>
  )
}
