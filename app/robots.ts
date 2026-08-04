import type { MetadataRoute } from 'next'

/**
 * 크롤러에게 허용/차단 경로를 알린다.
 * - /admin/* : PII·운영 도구. 항상 차단.
 * - /members/* : 학회원 포털(로그인 게이트 + noindex 메타). 크롤 진입 자체를 차단.
 * - 그 외 마케팅 경로는 모두 허용.
 *
 * sitemap 위치를 함께 노출해 색인 발견을 돕는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/members/'],
      },
    ],
    sitemap: 'https://yonseivery.com/sitemap.xml',
    host: 'https://yonseivery.com',
  }
}
