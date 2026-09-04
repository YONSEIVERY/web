/**
 * 제출 마감 판정. 서버 액션(제출 차단)과 화면(마감 표시)이 반드시 같은
 * 답을 내야 하므로 한 곳에 둔다. 양쪽이 각자 시각을 비교하면 화면은
 * 열려 있는데 제출은 거절되는 상태가 생긴다.
 *
 * ClubSession을 통째로 받지 않고 값만 받는다. 타입 의존을 만들지 않아야
 * 서버 전용 모듈(queries.ts)을 끌고 들어오지 않는다.
 */
export function isSubmissionClosed(due: string | null): boolean {
  if (!due) return false
  const at = Date.parse(due)
  // 파싱에 실패한 값으로 제출을 막지 않는다. 잘못된 설정 때문에 아무도
  // 못 내는 편보다, 마감이 없는 것처럼 열어 두고 사람이 고치는 편이 낫다.
  if (Number.isNaN(at)) return false
  return at < Date.now()
}
