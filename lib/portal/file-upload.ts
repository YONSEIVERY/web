import 'server-only'
import { supabaseService } from '@/lib/supabase/service'
import {
  FILES_BUCKET,
  MAX_FILE_BYTES,
  fileExt,
  isAllowedExt,
  sanitizeFileName,
} from '@/lib/portal/files'

/**
 * portal-files 버킷 업로드 공용 절차. 세션 자료(임원진)와 발표자료
 * 제출(학회원)이 같은 흐름을 쓴다.
 *
 *   1. signUpload()  서버가 서명 업로드 티켓을 낸다. 저장 경로는 서버가
 *                    정한다: 호출자가 경로를 고르게 두면 남의 파일을
 *                    덮어쓸 수 있다.
 *   2. 브라우저가 supabase-js로 스토리지에 직접 올린다. 서버를 거치지
 *      않아야 Vercel 요청 본문 4.5MB 제한에 걸리지 않는다.
 *   3. confirmUpload() 행을 만들기 전에 객체가 실제로 있는지 확인한다.
 *      이 단계가 없으면 티켓만 받고 업로드에 실패한 뒤 행을 만들 수
 *      있고, 화면에는 "제출됨"으로 보이는데 받을 파일이 없게 된다.
 *      크기도 여기서 스토리지 값을 취한다. 클라이언트가 보고한 숫자를
 *      기록으로 남길 이유가 없다.
 */

export type UploadTicket = {
  path: string
  token: string
  /** 정리된 원본 파일명. 확정 요청이 이 값을 그대로 돌려준다. */
  fileName: string
}

export type UploadResult<T> = { ok: true; value: T } | { ok: false; error: string }

/** `prefix`는 항상 슬래시로 끝나야 한다. 경로 소유권 검증의 기준이다. */
export async function signUpload(
  prefix: string,
  rawFileName: string,
): Promise<UploadResult<UploadTicket>> {
  const fileName = sanitizeFileName(rawFileName)
  const ext = fileExt(fileName)
  if (!ext) return { ok: false, error: '확장자가 없는 파일은 올릴 수 없습니다.' }
  if (!isAllowedExt(ext))
    return {
      ok: false,
      error: `${ext.toUpperCase()} 형식은 올릴 수 없습니다. 필요하면 ZIP으로 묶어주세요.`,
    }

  const path = `${prefix}${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabaseService.storage
    .from(FILES_BUCKET)
    .createSignedUploadUrl(path)
  if (error || !data) {
    console.error('[signUpload] sign failed', error)
    return { ok: false, error: '업로드 준비에 실패했습니다.' }
  }
  return { ok: true, value: { path: data.path, token: data.token, fileName } }
}

/**
 * 업로드 결과를 확정한다. 경로가 프리픽스 밖이거나 객체가 없으면 거절하고,
 * 크기가 어긋나면 올라온 파일을 지운 뒤 거절한다.
 */
export async function confirmUpload(
  path: string,
  prefix: string,
): Promise<UploadResult<{ size: number }>> {
  if (typeof path !== 'string' || !path.startsWith(prefix) || path.includes('..'))
    return { ok: false, error: '파일 경로가 올바르지 않습니다.' }

  const { data, error } = await supabaseService.storage
    .from(FILES_BUCKET)
    .info(path)
  if (error || !data) {
    console.error('[confirmUpload] info failed', error)
    return { ok: false, error: '업로드된 파일을 찾지 못했습니다. 다시 시도해주세요.' }
  }

  const size = Number(data.size ?? 0)
  if (!Number.isFinite(size) || size <= 0) {
    await removeFiles([path])
    return { ok: false, error: '빈 파일은 올릴 수 없습니다.' }
  }
  if (size > MAX_FILE_BYTES) {
    await removeFiles([path])
    return {
      ok: false,
      error: `파일은 ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB 이하만 올릴 수 있습니다.`,
    }
  }
  return { ok: true, value: { size } }
}

/** 행 삭제 뒤 뒤따르는 정리. 실패해도 흐름을 막지 않는다(고아 파일 < 삭제 실패). */
export async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    const { error } = await supabaseService.storage
      .from(FILES_BUCKET)
      .remove(paths)
    if (error) console.error('[removeFiles] cleanup failed', error)
  } catch (err) {
    console.error('[removeFiles] cleanup threw', err)
  }
}

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * 내려받기 링크. 원본 파일명을 실어 발급한다. 저장 경로는 UUID라
 * 그냥 열면 사람이 알아볼 수 없는 이름으로 저장된다.
 *
 * 버킷이 다른 오리진이라 HTML download 속성은 무시된다. 파일명을 살리려면
 * 서명 URL 자체에 실어야 한다.
 */
export async function signDownload(
  path: string,
  fileName: string,
): Promise<string | null> {
  const { data, error } = await supabaseService.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC, { download: fileName })
  if (error || !data) {
    console.error('[signDownload] sign failed', path, error)
    return null
  }
  return data.signedUrl
}
