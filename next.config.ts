import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  // exceljs는 dynamic require(archiver/unzipper 등)를 써서 Next.js 서버 번들에
  // 포함되면 런타임에 500으로 실패한다. 외부 패키지로 표시해 native require로
  // 로드하도록 한다.
  serverExternalPackages: ['exceljs'],
  // 포스터 업로드(server action)는 최대 5MB까지 허용한다(uploadDemodayPoster).
  // Next.js 기본 1MB 한도 그대로면 파일이 server action에 도달하지 못해 400으로 막힌다.
  experimental: {
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    // /admin/leadership · 하위 페이지는 P7에서 cohort_members로 통합되며
    // 삭제됨. 북마크·이전 세션 링크가 남아 있어도 이 리다이렉트가 처리한다.
    return [
      {
        source: '/admin/leadership',
        destination: '/admin/members',
        permanent: true,
      },
      {
        source: '/admin/leadership/:path*',
        destination: '/admin/members',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
