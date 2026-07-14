import Link from 'next/link'
import type { Route } from 'next'
import { MemberForm } from '@/components/admin/cohort-members/member-form'

export const dynamic = 'force-dynamic'

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const params = await searchParams
  const cohort = params.cohort ? Number.parseInt(params.cohort, 10) : NaN
  const initialCohort = Number.isInteger(cohort) && cohort > 0 ? cohort : 43
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        NEW MEMBER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        학회원 추가
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={`/admin/members?cohort=${initialCohort}` as Route}
          className="underline"
        >
          ← 학회원 목록
        </Link>
      </p>

      <MemberForm
        initial={{
          cohort: initialCohort,
          name: '',
          mono_name: '',
          role_tier: 'member',
          role_label: '학회원',
          team: '',
          college: '',
          major: '',
          status: '재학',
          bio: '',
          email: '',
          phone: '',
          student_id: '',
          birth: '',
          sort_order: 100,
          published: true,
        }}
      />
    </div>
  )
}
