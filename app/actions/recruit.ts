'use server'
import { headers } from 'next/headers'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendRecruitApplicationNotification } from '@/lib/email/notifications'
import { getCurrentRecruitRound, type RecruitRound } from '@/lib/recruit/queries'
import type { RecruitFormState, RecruitFormValues } from './recruit-state'

/**
 * 학회원 지원서 접수.
 *
 * 파일 3종(지원서 PDF 필수, 사업계획서 선택, 작업물 ZIP 선택)은 전부
 * 서명 업로드 티켓으로 브라우저에서 스토리지에 직접 올린다. 서버 액션
 * 경유 업로드는 Vercel 요청 본문 4.5MB 하드 제한에 걸리기 때문.
 *
 * 흐름: createRecruitUploadTickets(티켓 발급) → 클라이언트 직접 업로드 →
 * submitRecruitApplication(경로 검증 + 스토리지 실물 확인 + 접수 확정).
 * 경로는 `{cohort}/{submissionId}/{kind}.{ext}` 프리픽스를 강제해 타 제출물
 * 참조·덮어쓰기를 차단한다. 라운드당 이메일 1회는 DB 유니크(23505)가 보장.
 */

const BUCKET = 'recruit-applications'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/
const MAX_REASON_LENGTH = 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const KIND_RULES = {
  application: {
    exts: new Set(['pdf']),
    maxBytes: 10 * 1024 * 1024,
    label: '지원서',
  },
  business_plan: {
    exts: new Set(['pdf', 'doc', 'docx', 'hwp', 'hwpx', 'ppt', 'pptx']),
    maxBytes: 10 * 1024 * 1024,
    label: '사업계획서',
  },
  portfolio: {
    exts: new Set(['zip']),
    maxBytes: 30 * 1024 * 1024,
    label: '작업물',
  },
} as const

type UploadKind = keyof typeof KIND_RULES

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

function roundClosed(round: RecruitRound | null): string | null {
  if (!round || !round.apply_open)
    return '지금은 접수 기간이 아닙니다. 인스타그램으로 모집 일정을 확인해주세요.'
  if (
    round.apply_deadline &&
    Date.now() > new Date(round.apply_deadline).getTime()
  )
    return '접수가 마감되었습니다. 다음 시즌에 다시 만나요.'
  return null
}

type Ticket = { kind: UploadKind; path: string; token: string }

export async function createRecruitUploadTickets(
  files: { kind: string; ext: string }[],
): Promise<
  | { ok: true; submissionId: string; tickets: Ticket[] }
  | { ok: false; error: string }
> {
  const round = await getCurrentRecruitRound()
  const closed = roundClosed(round)
  if (closed || !round) return { ok: false, error: closed ?? '접수 불가' }

  if (!Array.isArray(files) || files.length === 0 || files.length > 3)
    return { ok: false, error: '업로드 파일 구성이 올바르지 않습니다.' }

  const kinds = files.map((f) => String(f.kind))
  if (
    kinds.filter((k) => k === 'application').length !== 1 ||
    kinds.some((k) => !(k in KIND_RULES)) ||
    new Set(kinds).size !== kinds.length
  )
    return { ok: false, error: '업로드 파일 구성이 올바르지 않습니다.' }

  for (const f of files) {
    const rule = KIND_RULES[f.kind as UploadKind]
    if (!rule.exts.has(String(f.ext).toLowerCase()))
      return {
        ok: false,
        error: `${rule.label} 파일 형식이 허용 목록에 없습니다.`,
      }
  }

  const rl = checkRateLimit(`recruit-tickets:${await clientKey()}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok)
    return {
      ok: false,
      error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
    }

  const submissionId = crypto.randomUUID()
  const tickets: Ticket[] = []
  for (const f of files) {
    const kind = f.kind as UploadKind
    const path = `${round.cohort}/${submissionId}/${kind}.${String(f.ext).toLowerCase()}`
    const { data, error } = await supabaseService.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)
    if (error || !data) {
      console.error('[createRecruitUploadTickets] sign failed', error)
      return { ok: false, error: '업로드 준비에 실패했습니다.' }
    }
    tickets.push({ kind, path: data.path, token: data.token })
  }
  return { ok: true, submissionId, tickets }
}

function sanitizeName(raw: FormDataEntryValue | null, fallback: string) {
  const s = String(raw ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, 150)
  return s || fallback
}

export async function submitRecruitApplication(
  _prev: RecruitFormState,
  formData: FormData,
): Promise<RecruitFormState> {
  // honeypot: bot이 채우면 조용히 success 시늉. 진단용 로그만 남긴다.
  const hp = String(formData.get('extra_field_hp') ?? '').trim()
  if (hp) {
    console.warn('submitRecruitApplication honeypot triggered', {
      length: hp.length,
    })
    return { status: 'success' }
  }

  const name = String(formData.get('name') ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const remoteReason = String(
    formData.get('remote_interview_reason') ?? '',
  ).trim()
  const noticeAck = formData.get('notice_ack') === 'on'
  const privacyConsent = formData.get('privacy_consent') === 'on'
  const submissionId = String(formData.get('submission_id') ?? '').trim()
  const applicationPath = String(formData.get('application_path') ?? '').trim()
  const businessPlanPath =
    String(formData.get('business_plan_path') ?? '').trim() || null
  const portfolioPath =
    String(formData.get('portfolio_path') ?? '').trim() || null

  const values: RecruitFormValues = { name, phone, email, remoteReason }
  const fail = (message: string): RecruitFormState => ({
    status: 'error',
    message,
    values,
  })

  const round = await getCurrentRecruitRound()
  const closed = roundClosed(round)
  if (closed || !round) return fail(closed ?? '접수 불가')

  if (!name || name.length > 80) return fail('성함을 확인해주세요.')
  if (!PHONE_RE.test(phone)) return fail('연락처 형식을 확인해주세요.')
  if (!EMAIL_RE.test(email)) return fail('이메일 형식을 확인해주세요.')
  if (remoteReason.length > MAX_REASON_LENGTH)
    return fail(
      `비대면 면접 사유는 ${MAX_REASON_LENGTH}자 이하로 작성해주세요.`,
    )
  if (!noticeAck) return fail('지원 전 유의사항을 확인해주세요.')
  if (!privacyConsent) return fail('개인정보 수집·이용에 동의해주세요.')

  // 경로 검증: 이 제출 세션의 프리픽스 안에서만, kind별 규칙대로
  if (!UUID_RE.test(submissionId))
    return fail('업로드 정보가 유효하지 않습니다. 파일을 다시 첨부해주세요.')
  const prefix = `${round.cohort}/${submissionId}/`
  const badPath = (path: string | null, kind: UploadKind): boolean => {
    if (!path) return false
    if (!path.startsWith(prefix) || path.includes('..')) return true
    const m = path.slice(prefix.length).match(/^([a-z_]+)\.([a-z0-9]+)$/)
    return !m || m[1] !== kind || !KIND_RULES[kind].exts.has(m[2] ?? '')
  }
  if (!applicationPath || badPath(applicationPath, 'application'))
    return fail('지원서 업로드 정보가 유효하지 않습니다. 다시 첨부해주세요.')
  if (badPath(businessPlanPath, 'business_plan'))
    return fail('사업계획서 업로드 정보가 유효하지 않습니다.')
  if (badPath(portfolioPath, 'portfolio'))
    return fail('작업물 업로드 정보가 유효하지 않습니다.')

  const rl = checkRateLimit(
    `recruit:${await clientKey()}:${email.toLowerCase()}`,
    { limit: 5, windowMs: 60 * 60 * 1000 },
  )
  if (!rl.ok)
    return fail(`잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`)

  // 스토리지 실물 확인 (존재 + 크기 상한)
  const { data: listed, error: listErr } = await supabaseService.storage
    .from(BUCKET)
    .list(`${round.cohort}/${submissionId}`)
  if (listErr) {
    console.error('submitRecruitApplication storage list failed', listErr)
    return fail('업로드 확인에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }
  const sizeByName = new Map(
    (listed ?? []).map((f) => [
      f.name,
      Number((f.metadata as { size?: number } | null)?.size ?? 0),
    ]),
  )
  const sizeProblem = (
    path: string | null,
    kind: UploadKind,
  ): string | null => {
    if (!path) return null
    const size = sizeByName.get(path.slice(prefix.length))
    if (!size || size <= 0)
      return `${KIND_RULES[kind].label} 파일이 업로드되지 않았습니다. 다시 첨부해주세요.`
    if (size > KIND_RULES[kind].maxBytes)
      return `${KIND_RULES[kind].label} 용량이 제한을 초과했습니다.`
    return null
  }
  const sizeErr =
    sizeProblem(applicationPath, 'application') ??
    sizeProblem(businessPlanPath, 'business_plan') ??
    sizeProblem(portfolioPath, 'portfolio')
  if (sizeErr) return fail(sizeErr)

  const applicationId = crypto.randomUUID()
  const applicationName = sanitizeName(
    formData.get('application_name'),
    `${name}.pdf`,
  )
  const { error: insErr } = await supabaseService.from('applications').insert({
    id: applicationId,
    round_id: round.id,
    name,
    phone,
    email,
    file_path: applicationPath,
    file_name: applicationName,
    business_plan_path: businessPlanPath,
    business_plan_name: businessPlanPath
      ? sanitizeName(formData.get('business_plan_name'), '사업계획서')
      : null,
    portfolio_path: portfolioPath,
    portfolio_name: portfolioPath
      ? sanitizeName(formData.get('portfolio_name'), '작업물.zip')
      : null,
    remote_interview_reason: remoteReason || null,
    notice_ack: true,
    privacy_consent: true,
  })
  if (insErr) {
    if (insErr.code === '23505') {
      // 중복 접수: 이번 제출 세션의 파일은 정리한다 (best-effort)
      try {
        const paths = [applicationPath, businessPlanPath, portfolioPath].filter(
          (p): p is string => Boolean(p),
        )
        const { error: rmErr } = await supabaseService.storage
          .from(BUCKET)
          .remove(paths)
        if (rmErr)
          console.error('submitRecruitApplication dup cleanup failed', rmErr)
      } catch (rmErr) {
        console.error('submitRecruitApplication dup cleanup threw', rmErr)
      }
      return fail(
        '이미 접수된 이메일입니다. 제출 내용 수정이 필요하면 yonseivery1997@gmail.com으로 연락해주세요.',
      )
    }
    console.error('submitRecruitApplication insert failed', insErr)
    return fail('저장에 실패했습니다.')
  }

  await sendRecruitApplicationNotification({
    applicationId,
    cohort: round.cohort,
    name,
    phone,
    email,
    remoteReason: remoteReason || null,
    fileName: applicationName,
  })

  return { status: 'success' }
}
