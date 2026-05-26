'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendPartnerApplicationNotification } from '@/lib/email/notifications'

// Two clients: anon `supabase` exercises Storage RLS (anon upload allowed by
// bucket policy); `supabaseService` does the DB insert because partners SELECT
// policy `(status='approved' and published=true)` filters the RETURNING clause
// on the just-inserted pending row → would yield empty. `.insert({...})`
// hardcodes the field list, so defaults still enforce pending+unpublished.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml'])

export type PartnerFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const PARTNER_INITIAL_STATE: PartnerFormState = { status: 'idle' }

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function submitPartnerApplication(
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  if (formData.get('website_hp')) return { status: 'success' }

  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const one_liner = String(formData.get('one_liner') ?? '').trim()
  const applicant_name = String(formData.get('applicant_name') ?? '').trim()
  const applicant_email = String(formData.get('applicant_email') ?? '').trim()
  const applicant_note =
    String(formData.get('applicant_note') ?? '').trim() || null
  const logo = formData.get('logo') as File | null

  if (!name || name.length > 120)
    return { status: 'error', message: '회사명을 확인해주세요.' }
  if (!['CORPORATE', 'CAPITAL', 'ACADEMIC'].includes(category))
    return { status: 'error', message: '카테고리를 선택해주세요.' }
  if (!one_liner || one_liner.length > 200)
    return { status: 'error', message: '한 줄 설명을 확인해주세요.' }
  if (!applicant_name || applicant_name.length > 80)
    return { status: 'error', message: '신청자 이름을 확인해주세요.' }
  if (!EMAIL_RE.test(applicant_email))
    return { status: 'error', message: '신청자 이메일 형식을 확인해주세요.' }
  if (applicant_note && applicant_note.length > 2000)
    return { status: 'error', message: '추가 메모는 2000자 이하로 작성해주세요.' }

  const rl = checkRateLimit(`partner:${await clientKey()}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok)
    return {
      status: 'error',
      message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
    }

  const supabase = await createClient()

  let logo_url: string | null = null
  let uploadedPath: string | null = null
  if (logo && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES)
      return { status: 'error', message: '로고는 2MB 이하만 가능합니다.' }
    if (!LOGO_MIME.has(logo.type))
      return { status: 'error', message: '로고는 PNG/JPEG/SVG만 허용됩니다.' }
    const ext =
      logo.type === 'image/svg+xml'
        ? 'svg'
        : logo.type === 'image/png'
          ? 'png'
          : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('partner-logos')
      .upload(path, logo, {
        contentType: logo.type,
        upsert: false,
      })
    if (upErr) return { status: 'error', message: '로고 업로드에 실패했습니다.' }
    uploadedPath = path
    const { data: pub } = supabase.storage
      .from('partner-logos')
      .getPublicUrl(path)
    logo_url = pub.publicUrl
  }

  const { data, error } = await supabaseService
    .from('partners')
    .insert({
      name,
      category,
      one_liner,
      logo_url,
      applicant_name,
      applicant_email,
      applicant_note,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('submitPartnerApplication insert failed', error)
    if (uploadedPath) {
      try {
        const { error: rmErr } = await supabaseService.storage
          .from('partner-logos')
          .remove([uploadedPath])
        if (rmErr)
          console.error('submitPartnerApplication orphan logo cleanup failed', rmErr)
      } catch (rmErr) {
        console.error('submitPartnerApplication orphan logo cleanup threw', rmErr)
      }
    }
    return { status: 'error', message: '저장에 실패했습니다.' }
  }

  await sendPartnerApplicationNotification({
    id: data.id,
    name,
    category,
    one_liner,
    applicant_name,
    applicant_email,
    applicant_note,
  })

  return { status: 'success' }
}
