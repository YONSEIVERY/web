import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getAdminMemberById } from '@/lib/cohort-members/queries'
import { MemberForm } from '@/components/admin/cohort-members/member-form'
import {
  DeleteMemberForm,
  DeletePhotoForm,
  PhotoUploadForm,
} from '@/components/admin/cohort-members/photo-form'

export const dynamic = 'force-dynamic'

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getAdminMemberById(id)
  if (!member) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        EDIT MEMBER
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {member.name}
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={`/admin/members?cohort=${member.cohort}` as Route}
          className="underline"
        >
          ← {member.cohort}기 학회원 목록
        </Link>
      </p>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          PHOTO
        </h2>
        {member.photo_url ? (
          <div className="mt-4">
            <Image
              src={member.photo_url}
              alt={member.name}
              width={200}
              height={280}
              className="h-64 w-auto border border-border object-cover"
            />
            <DeletePhotoForm id={member.id} />
          </div>
        ) : (
          <p className="mt-4 text-xs text-fg-muted">
            아직 프로필 사진이 없습니다. 아래에서 업로드해주세요.
          </p>
        )}
        <p className="mt-4 text-[10px] text-fg-muted">
          PNG · JPEG · WEBP · 최대 5MB. 세로 프로필(2:3 비율) 권장.
        </p>
        <PhotoUploadForm id={member.id} />
      </section>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          DETAILS
        </h2>
        <MemberForm
          initial={{
            id: member.id,
            cohort: member.cohort,
            name: member.name,
            mono_name: member.mono_name ?? '',
            role_tier: member.role_tier,
            role_label: member.role_label ?? '',
            team: member.team ?? '',
            college: member.college ?? '',
            major: member.major ?? '',
            status: member.status ?? '',
            bio: member.bio ?? '',
            email: member.email ?? '',
            phone: member.phone ?? '',
            student_id: member.student_id ?? '',
            birth: member.birth ?? '',
            sort_order: member.sort_order,
            published: member.published,
          }}
        />
      </section>

      <section className="mt-10 max-w-2xl border border-red-300 p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-700"
        >
          DANGER · DELETE
        </h2>
        <p className="mt-2 text-xs text-fg-muted">
          이 회원을 명단에서 완전히 삭제합니다. 프로필 사진도 함께 정리됩니다.
        </p>
        <DeleteMemberForm
          id={member.id}
          label={`${member.name} (${member.cohort}기 · ${member.role_label ?? member.role_tier})`}
        />
      </section>
    </div>
  )
}
