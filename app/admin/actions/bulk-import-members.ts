'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireLead } from '@/lib/admin/is-admin'
import { getSiteConfig } from '@/lib/data/site-config'
import { getCurrentRecruitRound } from '@/lib/recruit/queries'
import { identityKey } from '@/lib/members/identity'
import type { CohortMemberActionState } from './cohort-members-state'

/**
 * 등록 회신을 마친 최종 합격자 일괄 등록.
 *
 * 지원서에 이름·연락처·이메일이 이미 있으므로 어드민이 버튼 한 번으로
 * cohort_members에 옮긴다. 포털은 cohort_members.email로 사람을 알아보기
 * 때문에 이 등록이 끝나야 새 기수가 로그인할 수 있다.
 *
 * 대상 조건은 두 가지를 함께 건다.
 *   status = 'final_pass'        학회가 내린 심사 결과
 *   registration = 'registered'  본인이 낸 등록 회신
 * 예전에는 status만 봤다. 그래서 등록을 포기해 명부에서 지운 사람도 버튼을
 * 다시 누르면 되살아났다(44기에서 실제로 2명). 회신은 심사 결과와 다른 층의
 * 사실이므로 다른 컬럼에서 읽는다.
 *
 * registration이 'registered'가 아닌 값(pending·빈 값·모르는 값)은 전부
 * "회신 없음"으로 본다. 모르는 값을 등록으로 치면 이 액션이 다시 명부를
 * 되살리는 경로가 된다.
 *
 * 멱등성: 같은 기수에 같은 이메일(대소문자 무시)이 이미 있으면 건너뛴다.
 * 여러 번 눌러도, 자율 등록 승인과 겹쳐도 중복 행이 생기지 않는다.
 * 명부에 유니크 인덱스가 있는 경우를 대비해 23505는 한 건씩 재시도로 흡수한다.
 *
 * 대상 기수는 화면이 아니라 서버가 정한다(site_config + is_current 라운드).
 * 오래된 탭에서 눌러도 다른 기수로 새지 않는다.
 *
 * 명부에서 사람을 빼는 일은 이 액션의 몫이 아니다. 삭제는 학회원 화면에서만
 * 하고 0025·0026이 그 경로를 지킨다.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UNIQUE_VIOLATION = '23505'
// registration 마이그레이션이 아직 적용되지 않은 환경에서 select가 이 코드로 깨진다.
// "명단을 읽지 못했습니다"로 뭉뚱그리면 원인을 찾는 데 반나절이 든다.
const UNDEFINED_COLUMN = '42703'

type InsertRow = {
  cohort: number
  name: string
  role_tier: 'member'
  email: string
  phone: string | null
  published: true
}

/** 등록 회신 상태. 'registered'만 명부에 들어간다. */
type Reply = 'registered' | 'declined' | 'none'

function readReply(v: unknown): Reply {
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  if (s === 'registered') return 'registered'
  if (s === 'declined') return 'declined'
  return 'none'
}

/** 0명인 항목은 빼고 "(이미 명부에 있음 1명, 회신 없음 3명)" 꼴로 만든다. */
function skipDetail(parts: Array<[string, number]>): string {
  const kept = parts
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${label} ${n}명`)
  return kept.length > 0 ? ` (${kept.join(', ')})` : ''
}

export async function bulkImportFinalPassMembers(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireLead()
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

  // registration도 함께 읽어 온다. 서버에서 거르지 않고 가져와 버킷으로 나누는
  // 이유는 결과 보고 때문이다. 몇 명이 왜 빠졌는지를 숫자로 돌려주려면
  // 회신 없음과 등록 포기를 여기서 세어야 한다.
  const { data: apps, error: appErr } = await supabaseService
    .from('applications')
    .select('name, email, phone, registration')
    .eq('round_id', round.id)
    .eq('status', 'final_pass')
  if (appErr) {
    console.error('[bulkImportFinalPassMembers] applications read failed', appErr)
    if (appErr.code === UNDEFINED_COLUMN)
      return {
        status: 'error',
        message:
          '등록 회신 컬럼(applications.registration)이 아직 없습니다. 마이그레이션을 적용한 뒤 다시 시도해주세요.',
      }
    return { status: 'error', message: '합격자 명단을 읽지 못했습니다.' }
  }
  const candidates = (apps ?? []) as Record<string, unknown>[]
  if (candidates.length === 0)
    return {
      status: 'error',
      message: `${cohort}기 최종 합격 처리된 지원서가 없습니다. 리크루팅에서 합격 처리를 먼저 해주세요.`,
    }

  const registered: Record<string, unknown>[] = []
  let noReply = 0
  let declined = 0
  for (const app of candidates) {
    const reply = readReply(app.registration)
    if (reply === 'registered') registered.push(app)
    else if (reply === 'declined') declined += 1
    else noReply += 1
  }

  // 회신을 마친 사람이 하나도 없으면 아무것도 넣지 않는다. 조용히 0명 등록으로
  // 끝내면 누른 사람은 버튼이 고장 난 줄 안다.
  if (registered.length === 0)
    return {
      status: 'error',
      message:
        `${cohort}기 최종 합격자 ${candidates.length}명 중 등록 회신이 확인된 사람이 없습니다` +
        skipDetail([
          ['회신 없음', noReply],
          ['등록 포기', declined],
        ]) +
        '. 지원서에서 등록 회신을 표시한 뒤 다시 시도해주세요.',
    }

  const { data: existing, error: exErr } = await supabaseService
    .from('cohort_members')
    .select('email, name, phone')
    .eq('cohort', cohort)
  if (exErr) {
    console.error('[bulkImportFinalPassMembers] members read failed', exErr)
    return { status: 'error', message: '기존 명부를 읽지 못했습니다.' }
  }
  const taken = new Set<string>()
  // 이메일뿐 아니라 동일인(이름 + 전화 끝자리)으로도 거른다. 자율 등록
  // 승인이 먼저 돌면 그 사람은 지원서와 다른 이메일로 명단에 있다. 이메일만
  // 보면 여기서 지원서 주소로 한 번 더 들어가 같은 사람이 두 줄이 된다.
  // identityKey는 이름이나 전화가 빈 행을 null로 걸러, 전화 없는 서로 다른
  // 사람들이 하나로 뭉치는 오판을 막는다.
  const takenIdentity = new Set<string>()
  for (const row of (existing ?? []) as Record<string, unknown>[]) {
    const key = String(row.email ?? '')
      .trim()
      .toLowerCase()
    if (key) taken.add(key)
    const idKey = identityKey(row.name, row.phone)
    if (idKey) takenIdentity.add(idKey)
  }

  let alreadyIn = 0
  let invalid = 0
  const toInsert: InsertRow[] = []
  for (const app of registered) {
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
    const idKey = identityKey(name, app.phone)
    if (idKey && takenIdentity.has(idKey)) {
      alreadyIn += 1
      continue
    }
    taken.add(key) // 같은 배치 안의 중복 이메일도 한 번만
    if (idKey) takenIdentity.add(idKey)
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

  // 건너뛴 이유를 네 갈래로 나눠 돌려준다. 합계만 보고는 다음에 뭘 해야 할지
  // 알 수 없다. 회신을 표시해야 하는지, 명부를 손봐야 하는지가 갈린다.
  const skippedExisting = alreadyIn + conflicted
  const skipped = skippedExisting + invalid + noReply + declined
  const tail = skipDetail([
    ['이미 명부에 있음', skippedExisting],
    ['회신 없음', noReply],
    ['등록 포기', declined],
    ['이메일 확인 필요', invalid],
  ])
  const notes: string[] = []
  // 회신이 안 찍힌 합격자가 남아 있으면 반드시 말한다. 24명 중 21명만 들어간
  // 사실을 모른 채 넘어가면 남은 3명은 로그인하지 못한 채로 방치된다.
  if (noReply > 0)
    notes.push(
      `아직 등록 회신이 표시되지 않은 최종 합격자가 ${noReply}명 있습니다. 지원서에서 회신을 표시한 뒤 다시 눌러주세요.`,
    )
  if (invalid > 0)
    notes.push('이메일이 비었거나 형식이 이상한 건은 직접 추가해주세요.')
  const summary = `${inserted}명 등록, ${skipped}명 건너뜀${tail}`
  return {
    status: 'success',
    message: [summary, ...notes].join('. '),
  }
}
