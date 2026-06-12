'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendAlumniRegistrationNotification } from '@/lib/email/notifications'
import type { AlumniFormState } from './alumni-state'

// anon `supabase` exercises Storage RLS (anon upload allowed by bucket
// policy). DB insert uses `supabaseService` with client-pre-generated UUIDs:
// alumni/alumni_companies SELECT policies filter to approved+published, so
// we don't rely on RETURNING. Rollback paths still call `supabaseService` —
// best-effort under anon; failures are logged, not surfaced.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STAGES = new Set(['idea', 'seed', 'seriesA', 'seriesB', 'growth', 'exit'])
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml'])

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function submitAlumniRegistration(
  _prev: AlumniFormState,
  formData: FormData,
): Promise<AlumniFormState> {
  // honeypot 제거: 브라우저 autofill이 hidden `website_hp`에 organization 값을
  // 강제로 채워 트리거가 발동하는 사례 발생. rate-limit + 폼 validation으로 대체.

  const name = String(formData.get('name') ?? '').trim()
  const cohortRaw = String(formData.get('cohort') ?? '').trim()
  const cohort = Number(cohortRaw)
  const email = String(formData.get('email') ?? '').trim()
  const job_title = String(formData.get('job_title') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const linkedin_url = String(formData.get('linkedin_url') ?? '').trim() || null

  if (!name || name.length > 80)
    return { status: 'error', message: '이름을 확인해주세요.' }
  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100)
    return { status: 'error', message: '기수를 1~100 사이로 입력해주세요.' }
  if (!EMAIL_RE.test(email))
    return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (!job_title || job_title.length > 120)
    return { status: 'error', message: '현재 활동/소속을 확인해주세요.' }
  if (!bio || bio.length > 200)
    return { status: 'error', message: '한 줄 소개는 200자 이하로 작성해주세요.' }

  const hasCompany = formData.get('has_company') === 'on'
  let company:
    | {
        name: string
        one_liner: string
        stage: string | null
        website_url: string | null
        logo: File
      }
    | null = null
  if (hasCompany) {
    const cName = String(formData.get('company_name') ?? '').trim()
    const cOne = String(formData.get('company_one_liner') ?? '').trim()
    const cStage = String(formData.get('company_stage') ?? '').trim() || null
    const cWeb = String(formData.get('company_website') ?? '').trim() || null
    const cLogo = formData.get('company_logo') as File | null
    if (!cName || cName.length > 120)
      return { status: 'error', message: '회사명을 확인해주세요.' }
    if (!cOne || cOne.length > 200)
      return { status: 'error', message: '회사 한 줄 설명을 확인해주세요.' }
    if (cStage && !STAGES.has(cStage))
      return { status: 'error', message: '단계 값이 올바르지 않습니다.' }
    if (!cLogo || cLogo.size === 0)
      return { status: 'error', message: '회사 로고는 필수입니다.' }
    if (cLogo.size > MAX_LOGO_BYTES)
      return { status: 'error', message: '로고는 2MB 이하만 가능합니다.' }
    if (!LOGO_MIME.has(cLogo.type))
      return { status: 'error', message: '로고는 PNG/JPEG/SVG만 허용됩니다.' }
    company = {
      name: cName,
      one_liner: cOne,
      stage: cStage,
      website_url: cWeb,
      logo: cLogo,
    }
  }

  const rl = checkRateLimit(`alumni:${await clientKey()}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok)
    return {
      status: 'error',
      message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
    }

  const supabase = await createClient()
  const alumniId = crypto.randomUUID()
  const { error: aErr } = await supabaseService
    .from('alumni')
    .insert({ id: alumniId, name, cohort, email, job_title, bio, linkedin_url })
  if (aErr) {
    console.error('submitAlumniRegistration alumni insert failed', aErr)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }

  let companyName: string | undefined
  let uploadedLogoPath: string | null = null
  if (company) {
    const ext =
      company.logo.type === 'image/svg+xml'
        ? 'svg'
        : company.logo.type === 'image/png'
          ? 'png'
          : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('alumni-company-logos')
      .upload(path, company.logo, {
        contentType: company.logo.type,
        upsert: false,
      })
    if (upErr) {
      console.error('submitAlumniRegistration logo upload failed', upErr)
      const { error: delErr } = await supabaseService
        .from('alumni')
        .delete()
        .eq('id', alumniId)
      if (delErr)
        console.error(
          'submitAlumniRegistration rollback delete failed',
          delErr,
        )
      return { status: 'error', message: '로고 업로드에 실패했습니다.' }
    }
    uploadedLogoPath = path
    const { data: pub } = supabase.storage
      .from('alumni-company-logos')
      .getPublicUrl(path)

    const { error: cErr } = await supabaseService
      .from('alumni_companies')
      .insert({
        founder_alumni_id: alumniId,
        name: company.name,
        logo_url: pub.publicUrl,
        one_liner: company.one_liner,
        stage: company.stage,
        website_url: company.website_url,
      })
    if (cErr) {
      console.error('submitAlumniRegistration company insert failed', cErr)
      const { error: delErr } = await supabaseService
        .from('alumni')
        .delete()
        .eq('id', alumniId)
      if (delErr)
        console.error(
          'submitAlumniRegistration rollback delete failed',
          delErr,
        )
      try {
        const { error: rmErr } = await supabaseService.storage
          .from('alumni-company-logos')
          .remove([uploadedLogoPath])
        if (rmErr)
          console.error(
            'submitAlumniRegistration orphan logo cleanup failed',
            rmErr,
          )
      } catch (rmErr) {
        console.error(
          'submitAlumniRegistration orphan logo cleanup threw',
          rmErr,
        )
      }
      return { status: 'error', message: '회사 정보 저장에 실패했습니다.' }
    }
    companyName = company.name
  }

  await sendAlumniRegistrationNotification({
    alumniId,
    name,
    cohort,
    job_title,
    bio,
    hasCompany: !!company,
    companyName,
  })

  return { status: 'success' }
}
