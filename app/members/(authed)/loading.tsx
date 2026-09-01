/**
 * 포털 공통 스켈레톤. 포털 라우트가 전부 force-dynamic이라 fallback이 없으면
 * 링크를 눌러도 서버 응답이 올 때까지 이전 화면이 그대로 남는다(모바일
 * 드로어는 즉시 닫히므로 아무 일도 안 일어난 것처럼 보인다).
 *
 * 단 같은 세그먼트 layout.tsx의 인증 왕복은 덮지 못한다(loading.md의 caveat).
 * 즉 포털 첫 진입이 아니라 포털 안에서 화면을 옮겨 다닐 때 뜬다.
 */
export default function PortalLoading() {
  return (
    <div role="status" className="motion-safe:animate-pulse">
      <span className="sr-only">불러오는 중</span>
      <div aria-hidden>
        <div className="h-3 w-40 border border-border bg-border/30" />
        <div className="mt-3 h-9 w-64 border border-border bg-border/30 md:h-10 md:w-80" />
        <ul className="mt-10 flex flex-col gap-px border border-border bg-border">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className="flex flex-col gap-3 bg-bg-base p-5">
              <div className="h-2.5 w-24 bg-border/30" />
              <div className="h-4 w-2/3 bg-border/30" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SKELETON_ROWS = [0, 1, 2]
