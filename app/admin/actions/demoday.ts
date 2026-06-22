'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import type { DemodayActionState } from './demoday-state'

/**
 * 데모데이 어드민 액션 모음. 회차 생성·편집·삭제, 포스터 업로드,
 * 신청 접수 토글, 현재 회차 전환을 모두 server-side에서 처리한다.
 *
 * `is_current=true`는 부분 유니크 인덱스로 1개만 허용되므로 전환 시
 * 트랜잭션 대신 "기존 current → false" → "대상 → true" 순서로 두 번
 * UPDATE한다. 인덱스 위반은 사용자 메시지로 surface.
 */

const POSTER_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_POSTER_BYTES = 5 * 1024 * 1024

function parseSchedule(raw: string) {
  if (!raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('not array')
    for (const item of parsed) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as { time?: unknown }).time !== 'string' ||
        typeof (item as { label?: unknown }).label !== 'string'
      ) {
        throw new Error('invalid item')
      }
    }
    return parsed
  } catch {
    throw new Error('일정 JSON 형식이 올바르지 않습니다.')
  }
}

function parseChoices(raw: string) {
  if (!raw.trim()) return { purposes: [], roles: [], sources: [] }
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('not object')
    const pick = (key: string): string[] => {
      const v = (parsed as Record<string, unknown>)[key]
      if (!Array.isArray(v)) return []
      return v.filter((x): x is string => typeof x === 'string')
    }
    return {
      purposes: pick('purposes'),
      roles: pick('roles'),
      sources: pick('sources'),
    }
  } catch {
    throw new Error('폼 옵션 JSON 형식이 올바르지 않습니다.')
  }
}

export async function createDemodayEvent(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const volume = Number(formData.get('volume'))
  const semester = String(formData.get('semester') ?? '').trim()
  if (!Number.isInteger(volume) || volume < 1 || volume > 100)
    return { status: 'error', message: '회차를 1~100 사이로 입력해주세요.' }
  if (semester !== '1학기' && semester !== '2학기')
    return { status: 'error', message: '학기를 선택해주세요.' }

  const { data, error } = await supabaseService
    .from('demoday_events')
    .insert({ volume, semester })
    .select('id')
    .maybeSingle()
  if (error || !data) {
    console.error('[createDemodayEvent] insert failed', error)
    return { status: 'error', message: '이미 같은 회차/학기가 있을 수 있습니다.' }
  }
  revalidatePath('/admin/demoday')
  redirect(`/admin/demoday/${(data as { id: string }).id}` as Route)
}

export async function updateDemodayEvent(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }

  const eventDateRaw = String(formData.get('event_date') ?? '').trim()
  const eventEndDateRaw = String(formData.get('event_end_date') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim() || null
  const locationNote =
    String(formData.get('location_note') ?? '').trim() || null
  const introText = String(formData.get('intro_text') ?? '').trim() || null

  let schedule: unknown
  let formChoices: unknown
  try {
    schedule = parseSchedule(String(formData.get('schedule') ?? ''))
    formChoices = parseChoices(String(formData.get('form_choices') ?? ''))
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }

  const eventDate = eventDateRaw ? new Date(eventDateRaw).toISOString() : null
  const eventEndDate = eventEndDateRaw
    ? new Date(eventEndDateRaw).toISOString()
    : null

  const { error } = await supabaseService
    .from('demoday_events')
    .update({
      event_date: eventDate,
      event_end_date: eventEndDate,
      location,
      location_note: locationNote,
      intro_text: introText,
      schedule,
      form_choices: formChoices,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[updateDemodayEvent] update failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/demoday')
  revalidatePath(`/admin/demoday/${id}`)
  revalidatePath('/demoday')
  return { status: 'success', message: '저장되었습니다.' }
}

export async function uploadDemodayPoster(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const file = formData.get('poster') as File | null
  if (!file || file.size === 0)
    return { status: 'error', message: '포스터 파일을 선택해주세요.' }
  if (file.size > MAX_POSTER_BYTES)
    return { status: 'error', message: '5MB 이하로 올려주세요.' }
  if (!POSTER_MIME.has(file.type))
    return { status: 'error', message: 'PNG/JPEG/WEBP만 허용됩니다.' }

  const supabase = await createClient()
  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${id}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from('demoday-posters')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upErr) {
    console.error('[uploadDemodayPoster] upload failed', upErr)
    return { status: 'error', message: '업로드에 실패했습니다.' }
  }
  const { data: pub } = supabase.storage
    .from('demoday-posters')
    .getPublicUrl(path)

  const { error: dbErr } = await supabaseService
    .from('demoday_events')
    .update({ poster_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbErr) {
    console.error('[uploadDemodayPoster] db update failed', dbErr)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/demoday')
  revalidatePath(`/admin/demoday/${id}`)
  revalidatePath('/demoday')
  return { status: 'success', message: '포스터가 교체되었습니다.' }
}

export async function toggleDemodayRegisterOpen(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  const value = String(formData.get('value') ?? '') === 'true'
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { error } = await supabaseService
    .from('demoday_events')
    .update({ register_open: value, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[toggleDemodayRegisterOpen] update failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/demoday')
  revalidatePath(`/admin/demoday/${id}`)
  revalidatePath('/demoday')
  return { status: 'success' }
}

export async function setDemodayCurrent(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  // 기존 current를 모두 false로 내림 (부분 유니크 인덱스 위반 방지)
  const { error: clearErr } = await supabaseService
    .from('demoday_events')
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq('is_current', true)
  if (clearErr) {
    console.error('[setDemodayCurrent] clear failed', clearErr)
    return { status: 'error', message: '현 회차 해제에 실패했습니다.' }
  }
  const { error } = await supabaseService
    .from('demoday_events')
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[setDemodayCurrent] set failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/demoday')
  revalidatePath(`/admin/demoday/${id}`)
  revalidatePath('/demoday')
  return { status: 'success' }
}

export async function deleteDemodayEvent(
  _prev: DemodayActionState,
  formData: FormData,
): Promise<DemodayActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { error } = await supabaseService
    .from('demoday_events')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('[deleteDemodayEvent] delete failed', error)
    return { status: 'error', message: '삭제에 실패했습니다.' }
  }
  revalidatePath('/admin/demoday')
  revalidatePath('/demoday')
  redirect('/admin/demoday' as Route)
}
