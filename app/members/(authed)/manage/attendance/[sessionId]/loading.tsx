/**
 * 현장 출결 입력 스켈레톤. 명단 행이 길게 이어지는 화면이라 목록 3줄짜리
 * 포털 공통 스켈레톤으로는 화면이 비어 보인다. 세션 현장에서 폰으로 여는
 * 화면이므로 카드 리듬(page.tsx의 md:hidden 카드)에 맞춘다.
 */
export default function ManageAttendanceLoading() {
  return (
    <div role="status" className="motion-safe:animate-pulse">
      <span className="sr-only">불러오는 중</span>
      <div aria-hidden>
        <div className="h-3 w-44 border border-border bg-border/30" />
        <div className="mt-2 h-9 w-2/3 border border-border bg-border/30 md:h-10" />
        <div className="mt-3 h-3 w-40 bg-border/30" />

        <ul className="mt-8 flex flex-col gap-3">
          {ROSTER_ROWS.map((row) => (
            <li
              key={row}
              className="flex flex-col gap-3 border border-border p-4"
            >
              <div className="h-4 w-24 bg-border/30" />
              <div className="flex gap-2">
                <div className="h-9 w-28 bg-border/30" />
                <div className="h-9 flex-1 bg-border/30" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const ROSTER_ROWS = [0, 1, 2, 3, 4]
