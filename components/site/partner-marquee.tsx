/**
 * Partner marquee — pre-footer band.
 *
 * partners 테이블에서 approved+published+marquee_logo_url 있는 파트너만
 * sort_order 순으로 조회해 하단 스트립에 노출. 어드민에서 파트너 추가/
 * 노출 토글/삭제하면 즉시 반영된다(관련 action은 revalidatePath('/',
 * 'layout')으로 layout 트리 전체 재검증).
 *
 * 로고 자산: `marquee_logo_url`은 다크 배경용 흑백 실루엣 SVG를 권장
 * 하지만, 원본 로고와 별개 컬럼이라 어드민이 배너용 로고를 카드용과
 * 다르게 지정할 수 있다. 값이 null이면 마퀴에 노출되지 않는다.
 *
 * Rendering:
 * - `<img>` (SVG 최적화 대상 아님 + intrinsic aspect 유지)
 * - 토큰 2회 반복 → CSS translateX(-50%) 루프 seamless
 * - prefers-reduced-motion은 globals.css에서 처리
 * - 파트너 이름은 sr-only 리스트로 한 번만 노출
 */
import { getMarqueePartners } from '@/lib/partners/queries'

export async function PartnerMarquee() {
  const logos = await getMarqueePartners()
  if (logos.length === 0) return null
  return (
    <section
      aria-label="이번 학기 협력사"
      className="relative overflow-hidden border-y border-border bg-bg-base py-6 md:py-10"
    >
      <div className="mb-4 flex items-center justify-between px-6 md:mb-6 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted md:text-xs">
          Partners — Vol.43
        </p>
        <p className="text-xs text-fg-muted md:text-sm">
          이번 학기를 함께 받치는 협력사
        </p>
      </div>
      <div
        className="very-marquee-track flex w-max items-center gap-14 md:gap-24"
        aria-hidden
      >
        {[...logos, ...logos].map((logo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${logo.id}-${i}`}
            src={logo.marquee_logo_url}
            alt=""
            className="block h-12 w-auto shrink-0 md:h-20"
          />
        ))}
      </div>
      <ul className="sr-only">
        {logos.map((logo) => (
          <li key={logo.id}>{logo.name}</li>
        ))}
      </ul>
    </section>
  )
}
