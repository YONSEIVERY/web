import 'server-only'

/**
 * 동일인 판정 정규화. 자율 등록 승인, 합격자 일괄 등록, 승인 심사 화면이
 * 같은 규칙을 써야 한다. 한 곳이라도 다르면 "이메일은 다른데 같은 사람"이
 * 어떤 경로에서는 걸리고 어떤 경로에서는 통과해 명단에 두 번 들어간다.
 */

/** 이름 비교용. 공백 표기 차이("김 철수" vs "김철수")를 흡수한다. */
export function normName(v: unknown): string {
  return String(v ?? '').replace(/\s+/g, '')
}

/**
 * 전화번호 비교용 끝 8자리. 010-1234-5678과 +82 10 1234 5678이 같은 번호인데
 * 표기만 다른 경우를 흡수한다. 8자리가 안 되면 있는 만큼 돌려준다.
 */
export function phoneTail(v: unknown): string {
  const digits = String(v ?? '').replace(/\D/g, '')
  return digits.length >= 8 ? digits.slice(-8) : digits
}

/**
 * 이름 + 전화 끝자리 동일인 키. 어느 한쪽이 비면 null을 돌려준다.
 *
 * 이 가드가 핵심이다. 빈 값을 그대로 키로 쓰면 전화가 없는 행들이
 * "이름|" 하나로 뭉쳐 서로 다른 사람이 중복으로 오판된다.
 */
export function identityKey(name: unknown, phone: unknown): string | null {
  const n = normName(name)
  const t = phoneTail(phone)
  if (!n || !t) return null
  return `${n}|${t}`
}
