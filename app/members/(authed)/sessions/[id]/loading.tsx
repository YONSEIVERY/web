/**
 * 세션 상세 스켈레톤. 목록형인 포털 공통 스켈레톤과 모양이 크게 달라
 * (메타 박스 + 긴 본문) 세그먼트별로 하나 더 둔다. 골격은 page.tsx의
 * max-w-3xl 리듬을 그대로 따른다.
 */
export default function SessionLoading() {
  return (
    <div role="status" className="max-w-3xl motion-safe:animate-pulse">
      <span className="sr-only">불러오는 중</span>
      <div aria-hidden>
        <div className="h-3 w-48 border border-border bg-border/30" />
        <div className="mt-3 h-9 w-3/4 border border-border bg-border/30 md:h-10" />

        <div className="mt-6 grid grid-cols-1 gap-3 border border-border p-5 sm:grid-cols-2">
          {META_ROWS.map((row) => (
            <div key={row} className="flex gap-3">
              <div className="h-3 w-12 shrink-0 bg-border/30" />
              <div className="h-3 w-32 bg-border/30" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {BODY_ROWS.map((row) => (
            <div key={row} className="h-3.5 bg-border/30 last:w-1/2" />
          ))}
        </div>
      </div>
    </div>
  )
}

const META_ROWS = [0, 1, 2, 3]
const BODY_ROWS = [0, 1, 2, 3, 4, 5]
