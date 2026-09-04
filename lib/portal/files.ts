/**
 * 포털 파일 첨부 공용 규칙. 서버 액션(검증)과 클라이언트 업로더(사전 차단)가
 * 같은 목록을 봐야 하므로 'server-only'를 붙이지 않는다.
 *
 * 방어선은 서버다. 클라이언트 검증은 사용자가 50MB를 다 올린 뒤에야
 * 거절당하는 일을 막기 위한 편의일 뿐, 신뢰의 근거가 아니다.
 */

export const FILES_BUCKET = 'portal-files'

/** 버킷 file_size_limit(0033)과 같은 값. 어긋나면 스토리지가 먼저 거절한다. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

/**
 * 발표자료와 세션 자료로 오갈 만한 형식. 실행 파일과 스크립트는 넣지 않는다.
 * 목록에 없는 형식은 zip으로 묶어 올리면 된다.
 */
export const ALLOWED_FILE_EXTS = [
  'pdf',
  'ppt',
  'pptx',
  'key',
  'doc',
  'docx',
  'hwp',
  'hwpx',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'md',
  'zip',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
] as const

const EXT_SET = new Set<string>(ALLOWED_FILE_EXTS)

/** 파일 선택 대화상자를 목록으로 좁힌다. 우회가 가능하므로 검증은 서버가 다시 한다. */
export const FILE_ACCEPT = ALLOWED_FILE_EXTS.map((e) => `.${e}`).join(',')

/** 확장자를 소문자로. 점이 없거나 마지막이 점이면 빈 문자열. */
export function fileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function isAllowedExt(ext: string): boolean {
  return EXT_SET.has(ext.toLowerCase())
}

/**
 * 표시·내려받기용 파일명 정리.
 *
 * 이 값은 서명 URL의 download 파라미터로 실려 Content-Disposition 헤더가
 * 되므로, 인용부호와 제어문자가 남으면 헤더가 깨진다. 경로 구분자도
 * 지운다: 저장 경로는 서버가 UUID로 따로 만들지만, 원본 이름에 남은
 * 구분자가 화면에서 경로처럼 읽히면 오해를 부른다.
 */
export function sanitizeFileName(raw: string): string {
  const base = String(raw ?? '')
    .split(/[/\\]/)
    .pop()
  const cleaned = (base ?? '')
    .replace(/[\u0000-\u001f\u007f"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .trim()
  if (!cleaned) return 'file'
  return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
