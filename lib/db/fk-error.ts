import 'server-only'

/** Postgres foreign_key_violation. 0025가 CASCADE를 RESTRICT로 바꾼 뒤 나온다. */
const FK_VIOLATION = '23503'

type PostgrestLike = { code?: string | null } | null | undefined

/**
 * 삭제가 딸린 데이터 때문에 막혔는지 판정한다.
 *
 * 0025 이후 출결이나 기록이 있는 세션·학회원은 지워지지 않는다. 의도한
 * 동작이지만 그대로 두면 사용자에게 Postgres 원문이 나간다. 무엇이
 * 막았고 무엇을 먼저 해야 하는지 알려주는 문장으로 바꾼다.
 *
 * 막힌 경우 사람이 읽을 문장을, 아니면 null을 돌려준다.
 */
export function deleteBlockedMessage(
  error: PostgrestLike,
  what: string,
  dependents: string,
): string | null {
  if (error?.code !== FK_VIOLATION) return null
  return `${dependents}이(가) 남아 있어 ${what}을(를) 지울 수 없습니다. 먼저 정리한 뒤 다시 시도하십시오.`
}
