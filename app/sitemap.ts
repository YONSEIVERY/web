import type { MetadataRoute } from 'next'

/**
 * Google/Naver 검색 엔진이 색인할 공개 URL 목록. 각 페이지의
 * lastModified와 changeFrequency 우선순위는 콘텐츠 성격에 맞춰
 * 지정한다. 정적 페이지는 monthly, 회차·신청 페이지는 weekly로.
 *
 * Next.js 16 App Router 파일 컨벤션: 이 파일이 있으면 자동으로
 * /sitemap.xml 라우트가 생성된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://yonseivery.com'
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/curriculum`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/demoday`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/demoday/register`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/alumni`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/alumni/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
