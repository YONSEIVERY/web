import { requireExec } from '@/lib/portal/auth'
import { getSiteConfig } from '@/lib/data/site-config'
import { createSession } from '@/app/members/actions/portal'
import { SessionForm } from '@/components/portal/session-form'

export const dynamic = 'force-dynamic'

export default async function NewSessionPage() {
  await requireExec()
  const siteConfig = await getSiteConfig()
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · NEW SESSION
      </p>
      <h1 className="mb-10 mt-2 font-display text-3xl text-fg-primary">
        새 세션
      </h1>
      <SessionForm
        action={createSession}
        defaultCohort={siteConfig.cohort}
        submitLabel="세션 만들기"
      />
    </div>
  )
}
