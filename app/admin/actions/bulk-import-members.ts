'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { getSiteConfig } from '@/lib/data/site-config'
import { getCurrentRecruitRound } from '@/lib/recruit/queries'
import type { CohortMemberActionState } from './cohort-members-state'

/**
 * 최종 합격자(applications.status='final_pass') 일괄 등록.
 *
 * 지원서에 이름·연락처·이메일이 이미 있으므로 어드민이 버튼 한 번으로
 * cohort_members에 옮긴다. 포털은 cohort_members.email로 사람을 알아보기
 * 때문에 이 등록이 끝나야 44기가 로그인할 수 있다.
 *
 * 멱등성: 같은 기수에 같은 이메일(대소문자 무시)이 이미 있으면 건너뛴다.
 * 여러 번 눌러도, 자율 등록 승인과 겹쳐도 중복 행이 생기지 않는다.
 * 명부에 유니크 인덱스가 있는 경우를 대비해 23505는 한 건씩 재시도로 흡수한다.
 *
 * 대상 기수는 화면이 아니라 서버가 정한다(site_config + is_current 라운드).
 * 오래된 탭에서 눌러도 다른 기수로 새지 않는다.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UNIQUE_VIOLATION = '23505'

type InsertRow = {
  cohort: number
  name: string
  role_tier: 'member'
  email: string
  phone: string | null
  published: true
}

function normalizeEmail(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

export async function bulkImportFinalPassMembers(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }

  const [config, round] = await Promise.all([
    getSiteConfig(),
    getCurrentRecruitRound(),
  ])
  if (!round)
    return {
      status: 'error',
      message: '진행 중인 모집 라운드가 없습니다. 리크루팅에서 현재 라운드를 지정해주세요.',
    }
  // 두 출처가 어긋난 상태에서 넣으면 합격자가 엉뚱한 기수로 들어간다. 멈추고 알린다.
  if (round.cohort !== config.cohort)
    return {
      status: 'error',
      message: `현재 기수(${config.cohort}기)와 진행 중인 모집 라운드(${round.cohort}기)가 다릅니다. 둘을 맞춘 뒤 다시 시도해주세요.`,
    }
  const cohort = config.cohort

  // 오래된 탭 방지: 화면이 보고 있던 기수와 서버가 정한 기수가 다르면 멈춘다.
  const claimed = Number.parseInt(String(formData.get('cohort') ?? ''), 10)
  if (Number.isInteger(claimed) && claimed !== cohort)
    return {
      status: 'error',
      message: `화면의 기수(${claimed}기)와 현재 기수(${cohort}기)가 다릅니다. 새로고침 후 다시 시도해주세요.`,
    }

  const { data: apps, error: appErr } = await supabaseService
    .from('applications')
    .select('name, email, phone')
    .eq('round_id', round.id)
    .eq('status', 'final_pass')
  if (appErr) {
    console.error('[bulkImportFinalPassMembers] applications read failed', appErr)
    return { status: 'error', message: '합격자 명단을 읽지 못했습니다.' }
  }
  const candidates = (apps ?? []) as Record<string, unknown>[]
  if (candidates.length === 0)
    return {
      status: 'error',
      message: `${cohort}기 최종 합격 처리된 지원서가 없습니다. 리크루팅에서 합격 처리를 먼저 해주세요.`,
    }

  const { data: existing, error: exErr } = await supabaseService
    .from('cohort_members')
    .select('email')
    .eq('cohort', cohort)
  if (exErr) {
    console.error('[bulkImportFinalPassMembers] members read failed', exErr)
    return { status: 'error', message: '기존 명부를 읽지 못했습니다.' }
  }
  const taken = new Set<string>()
  for (const row of (existing ?? []) as Record<string, unknown>[]) {
    const key = normalizeEmail(row.email)
    if (key) taken.add(key)
  }

  let alreadyIn = 0
  let invalid = 0
  const toInsert: InsertRow[] = []
  for (const app of candidates) {
    const name = String(app.name ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    const email = String(app.email ?? '').trim()
    const key = email.toLowerCase()
    // 지원서 이메일이 비었거나 형식이 깨진 건은 손으로 넣게 남긴다.
    if (!name || !EMAIL_RE.test(email)) {
      invalid += 1
      continue
    }
    if (taken.has(key)) {
      alreadyIn += 1
      continue
    }
    taken.add(key) // 같은 배치 안의 중복 이메일도 한 번만
    const phone = String(app.phone ?? '').trim()
    toInsert.push({
      cohort,
      name,
      role_tier: 'member',
      // 자율 등록 승인(approveMemberSignup)과 같은 모양으로 저장한다.
      // 포털 판정은 lower() 비교라 대소문자 자체는 무해하지만, 두 경로가
      // 다른 모양을 남기면 나중에 명단을 대조할 때마다 정규화가 필요해진다.
      email: key,
      phone: phone || null,
      published: true,
    })
  }

  let inserted = 0
  let conflicted = 0
  let partialError = false
  if (toInsert.length > 0) {
    const { error } = await supabaseService.from('cohort_members').insert(toInsert)
    if (!error) {
      inserted = toInsert.length
    } else if (error.code === UNIQUE_VIOLATION) {
      // 배열 insert는 한 문장이라 통째로 실패한다. 한 건씩 넣어 충돌만 걸러낸다.
      for (const row of toInsert) {
        const { error: rowErr } = await supabaseService
          .from('cohort_members')
          .insert(row)
        if (!rowErr) {
          inserted += 1
        } else if (rowErr.code === UNIQUE_VIOLATION) {
          conflicted += 1
        } else {
          console.error('[bulkImportFinalPassMembers] row insert failed', rowErr)
          partialError = true
          break
        }
      }
    } else {
      console.error('[bulkImportFinalPassMembers] insert failed', error)
      return { status: 'error', message: '등록에 실패했습니다.' }
    }
  }

  if (inserted > 0) {
    revalidatePath('/admin/members')
    revalidatePath('/about')
    revalidatePath('/cohorts')
    revalidatePath(`/cohorts/${cohort}`)
  }

  if (partialError)
    return {
      status: 'error',
      message: `${inserted}명까지 등록한 뒤 오류가 났습니다. 다시 누르면 남은 인원만 등록됩니다.`,
    }

  const skippedExisting = alreadyIn + conflicted
  const detail: string[] = []
  if (skippedExisting > 0) detail.push(`이미 등록 ${skippedExisting}명`)
  if (invalid > 0) detail.push(`이메일 확인 필요 ${invalid}명`)
  const skipped = skippedExisting + invalid
  const tail = detail.length > 0 ? ` (${detail.join(', ')})` : ''
  const summary = `${inserted}명 등록, ${skipped}명 건너뜀${tail}`
  return {
    status: 'success',
    message:
      invalid > 0
        ? `${summary}. 이메일이 비었거나 형식이 이상한 건은 직접 추가해주세요.`
        : summary,
  }
}
