import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 데모데이는 매학기 진행되는 행사다. 회차(volume)별로 `demoday_events`
 * 한 행을 두고, 어드민이 다음 회차를 만들 때 `is_current=true`를 옮긴다.
 * 부분 유니크 인덱스(`is_current=true` 1개만 허용) 덕에 동시 토글이
 * 발생해도 두 회차가 동시에 현재로 떠 있는 일은 없다.
 *
 * 폼 옵션(`form_choices`)과 일정(`schedule`)은 jsonb에 보관해 코드 배포
 * 없이 학기마다 새로 짤 수 있다.
 */

export type DemodayScheduleItem = {
  time: string
  label: string
}

export type DemodayFormChoices = {
  purposes: string[]
  roles: string[]
  sources: string[]
}

export type DemodayEvent = {
  id: string
  volume: number
  semester: '1학기' | '2학기'
  is_current: boolean
  register_open: boolean
  event_date: string | null
  event_end_date: string | null
  location: string | null
  location_note: string | null
  intro_text: string | null
  poster_url: string | null
  schedule: DemodayScheduleItem[]
  form_choices: DemodayFormChoices
  created_at: string
  updated_at: string
}

const EMPTY_CHOICES: DemodayFormChoices = {
  purposes: [],
  roles: [],
  sources: [],
}

function normalizeSchedule(raw: unknown): DemodayScheduleItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): DemodayScheduleItem[] => {
    if (!item || typeof item !== 'object') return []
    const time = (item as { time?: unknown }).time
    const label = (item as { label?: unknown }).label
    if (typeof time !== 'string' || typeof label !== 'string') return []
    return [{ time, label }]
  })
}

function normalizeChoices(raw: unknown): DemodayFormChoices {
  if (!raw || typeof raw !== 'object') return EMPTY_CHOICES
  const obj = raw as Record<string, unknown>
  const pick = (key: string): string[] =>
    Array.isArray(obj[key])
      ? (obj[key] as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
  return {
    purposes: pick('purposes'),
    roles: pick('roles'),
    sources: pick('sources'),
  }
}

function toDemodayEvent(row: Record<string, unknown>): DemodayEvent {
  return {
    id: String(row.id),
    volume: Number(row.volume),
    semester: row.semester === '2학기' ? '2학기' : '1학기',
    is_current: Boolean(row.is_current),
    register_open: Boolean(row.register_open),
    event_date: (row.event_date as string | null) ?? null,
    event_end_date: (row.event_end_date as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    location_note: (row.location_note as string | null) ?? null,
    intro_text: (row.intro_text as string | null) ?? null,
    poster_url: (row.poster_url as string | null) ?? null,
    schedule: normalizeSchedule(row.schedule),
    form_choices: normalizeChoices(row.form_choices),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getCurrentDemoday(): Promise<DemodayEvent | null> {
  const { data } = await supabaseService
    .from('demoday_events')
    .select('*')
    .eq('is_current', true)
    .maybeSingle()
  if (!data) return null
  return toDemodayEvent(data as Record<string, unknown>)
}

export async function getDemodayVolumes(): Promise<DemodayEvent[]> {
  const { data } = await supabaseService
    .from('demoday_events')
    .select('*')
    .order('volume', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toDemodayEvent)
}

export async function getDemodayById(id: string): Promise<DemodayEvent | null> {
  const { data } = await supabaseService
    .from('demoday_events')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toDemodayEvent(data as Record<string, unknown>)
}

export async function getDemodayAttendeeCount(eventId: string): Promise<number> {
  const { count } = await supabaseService
    .from('demoday_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
  return count ?? 0
}

export type DemodayAttendee = {
  id: string
  event_id: string
  name: string
  affiliation: string
  phone: string
  email: string
  is_very_alumni: boolean
  very_cohort: number | null
  attend_afterparty: boolean | null
  purposes: string[]
  role: string
  referral_sources: string[]
  privacy_consent: boolean
  created_at: string
}

export async function getDemodayAttendees(
  eventId: string,
): Promise<DemodayAttendee[]> {
  const { data } = await supabaseService
    .from('demoday_attendees')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    event_id: String(row.event_id),
    name: String(row.name),
    affiliation: String(row.affiliation),
    phone: String(row.phone),
    email: String(row.email),
    is_very_alumni: Boolean(row.is_very_alumni),
    very_cohort: row.very_cohort == null ? null : Number(row.very_cohort),
    attend_afterparty:
      row.attend_afterparty == null ? null : Boolean(row.attend_afterparty),
    purposes: Array.isArray(row.purposes)
      ? (row.purposes as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [],
    role: String(row.role ?? ''),
    referral_sources: Array.isArray(row.referral_sources)
      ? (row.referral_sources as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [],
    privacy_consent: Boolean(row.privacy_consent),
    created_at: String(row.created_at),
  }))
}
