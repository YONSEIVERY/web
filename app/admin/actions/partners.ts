'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { SITE } from '@/lib/content/site'
import type { PartnerActionState } from './partners-state'

/**
 * 파트너 직접 등록/편집. 공개 신청 폼(pending → 승인 → approved) 흐름과
 * 별개로, 어드민이 확정된 파트너를 바로 approved+published로 등록/수정할
 * 수 있게 한다. applicant_* 필드는 NOT NULL이므로 어드민 등록 시
 * sentinel 값(name=ADMIN, email=SITE.email)으로 채운다.
 */

const CATEGORIES = new Set(['CORPORATE', 'CAPITAL', 'ACADEMIC'])

type Parsed = {
  name: string
  category: string
  oneLiner: string
  logoUrl: string | null
  marqueeLogoUrl: string | null
  sortOrder: number
  published: boolean
}

function parseCommon(formData: FormData): Parsed {
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const oneLiner = String(formData.get('one_liner') ?? '').trim()
  const logoUrl = String(formData.get('logo_url') ?? '').trim() || null
  const marqueeLogoUrl =
    String(formData.get('marquee_logo_url') ?? '').trim() || null
  const sortOrderRaw = String(formData.get('sort_order') ?? '100').trim()
  const sortOrder = Number.parseInt(sortOrderRaw, 10)
  const published = formData.get('published') === 'on'
  if (!name) throw new Error('회사명을 입력해주세요.')
  if (!CATEGORIES.has(category))
    throw new Error('카테고리(CORPORATE/CAPITAL/ACADEMIC)를 선택해주세요.')
  if (!oneLiner) throw new Error('한 줄 소개를 입력해주세요.')
  if (!Number.isFinite(sortOrder))
    throw new Error('정렬 순서를 숫자로 입력해주세요.')
  return {
    name,
    category,
    oneLiner,
    logoUrl,
    marqueeLogoUrl,
    sortOrder,
    published,
  }
}

export async function createPartner(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  let parsed: Parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const nowIso = new Date().toISOString()
  const { error } = await supabaseService.from('partners').insert({
    name: parsed.name,
    category: parsed.category,
    one_liner: parsed.oneLiner,
    logo_url: parsed.logoUrl,
    marquee_logo_url: parsed.marqueeLogoUrl,
    sort_order: parsed.sortOrder,
    applicant_name: 'ADMIN',
    applicant_email: SITE.email,
    status: 'approved',
    published: parsed.published,
    approved_at: nowIso,
  })
  if (error) {
    console.error('[createPartner] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/', 'layout')
  redirect('/admin/partners' as Route)
}

export async function updatePartner(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  let parsed: Parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const { error } = await supabaseService
    .from('partners')
    .update({
      name: parsed.name,
      category: parsed.category,
      one_liner: parsed.oneLiner,
      logo_url: parsed.logoUrl,
      marquee_logo_url: parsed.marqueeLogoUrl,
      sort_order: parsed.sortOrder,
      published: parsed.published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[updatePartner] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/', 'layout')
  return { status: 'success', message: '저장되었습니다.' }
}
