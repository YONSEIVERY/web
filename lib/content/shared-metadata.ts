import type { Metadata } from 'next'

/**
 * 공개 페이지 공통 메타데이터 빌더.
 *
 * 지금까지 각 페이지가 title·description만 선언해 openGraph는 루트
 * 레이아웃 것이 그대로 남았다. Next의 메타데이터 병합은 필드 단위 얕은
 * 병합이라, 카톡에 어느 링크를 공유해도 미리보기가 전부 홈 카드로 떴다.
 *
 * OG 이미지는 여기서 지정하지 않는다. app/opengraph-image.png 파일 규약이
 * 전 라우트에 자동 적용되고, 파일 기반 이미지가 설정 기반보다 우선한다.
 */
export function pageMeta({
  title,
  description,
  path,
  robots,
}: {
  title: string
  description: string
  /** 캐노니컬과 OG url에 쓰는 절대 경로. 예: '/recruit' */
  path: string
  robots?: Metadata['robots']
}): Metadata {
  return {
    title,
    description,
    ...(robots ? { robots } : {}),
    alternates: { canonical: path },
    openGraph: {
      // 루트의 title.template은 openGraph에 적용되지 않으므로 직접 붙인다.
      title: `${title} · VERY`,
      description,
      url: path,
      siteName: 'VERY',
      locale: 'ko_KR',
      type: 'website',
    },
  }
}
