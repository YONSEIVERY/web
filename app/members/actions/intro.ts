'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getMemberByEmail, getPortalIdentityVerified } from '@/lib/portal/auth'
import type { IntroFormState } from './intro-state'

/**
 * 본인 자기소개 저장 (구조화 형식, 0030).
 *
 * 43기 노션 자기소개 형식을 따른다: 대표사진, MBTI, 잘하는 것 3가지,
 * 좋아하는 것 3가지, 자유로운 TMI, 개인 포트폴리오. body_md는 더 이상
 * 쓰지 않지만 지우지도 않는다. 화면이 폴백으로 아직 읽는다.
 *
 * 로그인 이메일 ↔ cohort_members 매칭으로 본인 행만 수정할 수 있다
 * (member_id를 폼에서 받지 않는다). 사진은 세션 기록과 같은 방식으로
 * 서버가 서명 업로드 티켓만 발급하고 브라우저가 스토리지에 직접 올린다
 * (서버 경유 시 Vercel 요청 본문 4.5MB 제한에 걸린다). 경로 검증이 방어선:
 * 티켓 발급과 저장 모두 `intros/{본인 member_id}/` 프리픽스를 강제해
 * 남의 사진 경로를 참조하거나 덮어쓸 수 없다.
 */

const BUCKET = 'portal-photos'
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])
const MAX_ITEMS = 3
const MAX_ITEM_TITLE = 60
const MAX_ITEM_BODY = 600
const MAX_TMI = 4000
const MAX_PORTFOLIO = 300
const MBTI_RE = /^[A-Za-z]{4}$/

export type IntroItemInput = { title: string; body: string }

export type IntroInput = {
  mbti: string
  strengths: IntroItemInput[]
  likes: IntroItemInput[]
  tmi: string
  portfolio: string
  /** null = 사진 없음(삭제 포함). 문자열 = 기존 유지 또는 새로 올린 경로. */
  photoPath: string | null
}

async function requireSelf() {
  const identity = await getPortalIdentityVerified()
  if (!identity) throw new Error('로그인이 필요합니다.')
  const member = await getMemberByEmail(identity.email)
  if (!member)
    throw new Error(
      '로그인 계정과 매칭되는 학회원 정보가 없습니다. 임원진에게 문의해주세요.',
    )
  return { identity, member }
}

export async function createIntroPhotoTicket(
  ext: string,
): Promise<
  { ok: true; path: string; token: string } | { ok: false; error: string }
> {
  try {
    const { identity, member } = await requireSelf()

    const clean = String(ext).toLowerCase()
    if (!IMAGE_EXTS.has(clean))
      return { ok: false, error: 'JPG/PNG/WEBP만 업로드할 수 있습니다.' }

    const rl = checkRateLimit(`intro-photo:${identity.email.toLowerCase()}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    })
    if (!rl.ok)
      return {
        ok: false,
        error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
      }

    const path = `intros/${member.id}/${crypto.randomUUID()}.${clean}`
    const { data, error } = await supabaseService.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)
    if (error || !data) {
      console.error('[createIntroPhotoTicket] sign failed', error)
      return { ok: false, error: '업로드 준비에 실패했습니다.' }
    }
    return { ok: true, path: data.path, token: data.token }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

/** 최대 3개, 양쪽 공백 제거, 빈 행 탈락. 형식이 틀리면 사유 문자열을 던진다. */
function cleanItems(raw: IntroItemInput[], label: string): IntroItemInput[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .map((it) => ({
      title: String(it?.title ?? '').trim(),
      body: String(it?.body ?? '').trim(),
    }))
    .filter((it) => it.title || it.body)
  if (items.length > MAX_ITEMS)
    throw new Error(`${label}은 ${MAX_ITEMS}가지까지만 적을 수 있습니다.`)
  for (const it of items) {
    if (!it.title)
      throw new Error(`${label}에 제목 없이 설명만 적힌 항목이 있습니다.`)
    if (it.title.length > MAX_ITEM_TITLE)
      throw new Error(`${label}의 제목은 ${MAX_ITEM_TITLE}자 이하로 적어주세요.`)
    if (it.body.length > MAX_ITEM_BODY)
      throw new Error(`${label}의 설명은 ${MAX_ITEM_BODY}자 이하로 적어주세요.`)
  }
  return items
}

export async function saveMyIntro(input: IntroInput): Promise<IntroFormState> {
  let member: Awaited<ReturnType<typeof requireSelf>>['member']
  try {
    ;({ member } = await requireSelf())
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : '로그인이 필요합니다.',
    }
  }

  const fail = (message: string): IntroFormState => ({
    status: 'error',
    message,
  })

  const mbtiRaw = String(input.mbti ?? '').trim()
  if (mbtiRaw && !MBTI_RE.test(mbtiRaw))
    return fail('MBTI는 ENTJ처럼 알파벳 4글자로 적어주세요.')
  const mbti = mbtiRaw.toUpperCase()

  let strengths: IntroItemInput[]
  let likes: IntroItemInput[]
  try {
    strengths = cleanItems(input.strengths, '잘하는 것')
    likes = cleanItems(input.likes, '좋아하는 것')
  } catch (err) {
    return fail(err instanceof Error ? err.message : '입력을 확인해주세요.')
  }

  const tmi = String(input.tmi ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (tmi.length > MAX_TMI)
    return fail(`TMI는 ${MAX_TMI.toLocaleString()}자 이하로 적어주세요.`)
  const portfolio = String(input.portfolio ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
  if (portfolio.length > MAX_PORTFOLIO)
    return fail(`포트폴리오는 ${MAX_PORTFOLIO}자 이하로 적어주세요.`)

  // 본인 프리픽스 밖의 경로는 무엇이든 거부한다.
  const prefix = `intros/${member.id}/`
  let photoPath: string | null = null
  if (input.photoPath) {
    const p = String(input.photoPath)
    if (!p.startsWith(prefix) || p.includes('..'))
      return fail('사진 경로가 올바르지 않습니다. 다시 업로드해주세요.')
    photoPath = p
  }

  // 교체·삭제된 옛 사진을 지우기 위해 현재 경로를 먼저 읽는다.
  const { data: current, error: curErr } = await supabaseService
    .from('member_intros')
    .select('photo_path')
    .eq('member_id', member.id)
    .maybeSingle()
  if (curErr) {
    console.error('[saveMyIntro] current photo lookup failed', curErr)
    return fail('저장에 실패했습니다. 다시 시도해주세요.')
  }
  const oldPath = (current?.photo_path as string | null) ?? null

  const { error } = await supabaseService.from('member_intros').upsert(
    {
      member_id: member.id,
      mbti: mbti || null,
      photo_path: photoPath,
      strengths,
      likes,
      tmi,
      portfolio,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_id' },
  )
  if (error) {
    console.error('[saveMyIntro] upsert failed', error)
    return { status: 'error', message: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  // 저장이 끝난 뒤에만 옛 파일을 지운다. 실패해도 저장은 유효하므로
  // 기록만 남긴다 (본인 프리픽스 안의 고아 파일일 뿐이다).
  if (oldPath && oldPath !== photoPath && oldPath.startsWith(prefix)) {
    try {
      const { error: rmErr } = await supabaseService.storage
        .from(BUCKET)
        .remove([oldPath])
      if (rmErr) console.error('[saveMyIntro] old photo cleanup failed', rmErr)
    } catch (rmErr) {
      console.error('[saveMyIntro] old photo cleanup threw', rmErr)
    }
  }

  revalidatePath('/members/people')
  revalidatePath(`/members/people/${member.id}`)
  revalidatePath('/members/profile')
  return { status: 'success' }
}
