import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getApplicationDetail } from '@/lib/admin/queries'
import { PublishToggle } from '@/components/admin/publish-toggle'
import { DeleteButton } from '@/components/admin/delete-button'

export const dynamic = 'force-dynamic'

type AlumniRow = {
  id: string
  name: string
  cohort: number
  email: string | null
  job_title: string | null
  bio: string | null
  linkedin_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  published: boolean
  created_at: string
  updated_at: string | null
  approved_at: string | null
  alumni_companies?: AlumniCompany[] | null
}

type AlumniCompany = {
  id: string
  name: string
  logo_url: string | null
  one_liner: string | null
  stage: string | null
  website_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  published: boolean
  approved_at: string | null
}

export default async function AdminAlumniDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = (await getApplicationDetail('alumni', id)) as AlumniRow | null
  if (!data) notFound()

  return (
    <div className="max-w-3xl">
      <Link
        href={'/admin/alumni' as Route}
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted hover:text-fg-primary"
      >
        ← 알럼나이 목록
      </Link>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="font-display text-3xl text-fg-primary md:text-4xl">
          {data.name}
        </h1>
        <StatusBadge status={data.status} />
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs">
          {data.cohort}기
        </span>
      </div>

      <section className="mt-10 border-t border-border pt-6">
        <SectionEyebrow>기본 정보</SectionEyebrow>
        <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <Row label="이메일">
            {data.email ? (
              <a
                href={`mailto:${data.email}`}
                className="text-fg-subtle underline hover:text-fg-primary"
              >
                {data.email}
              </a>
            ) : (
              <Muted>—</Muted>
            )}
          </Row>
          <Row label="현재">
            {data.job_title || <Muted>—</Muted>}
          </Row>
          <Row label="LinkedIn">
            {data.linkedin_url ? (
              <a
                href={data.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-subtle underline hover:text-fg-primary"
              >
                {data.linkedin_url} ↗
              </a>
            ) : (
              <Muted>—</Muted>
            )}
          </Row>
          <Row label="Bio">
            {data.bio ? (
              <p className="whitespace-pre-wrap text-fg-subtle">{data.bio}</p>
            ) : (
              <Muted>—</Muted>
            )}
          </Row>
        </dl>
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <SectionEyebrow>창업 내역 · Alumni Companies</SectionEyebrow>
        {!data.alumni_companies || data.alumni_companies.length === 0 ? (
          <p className="mt-4 text-sm text-fg-muted">등록된 회사가 없습니다.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-6">
            {data.alumni_companies.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-4 border border-border p-4 sm:flex-row md:p-6"
              >
                {c.logo_url ? (
                  <div className="shrink-0">
                    <Image
                      src={c.logo_url}
                      alt={c.name}
                      width={80}
                      height={80}
                      className="border border-border object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-border text-[10px] uppercase text-fg-muted">
                    No Logo
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-display text-lg text-fg-primary">
                      {c.name}
                    </p>
                    <StatusBadge status={c.status} small />
                    {c.stage && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                        {c.stage}
                      </span>
                    )}
                  </div>
                  {c.one_liner && (
                    <p className="text-sm text-fg-subtle">{c.one_liner}</p>
                  )}
                  {c.website_url && (
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-fg-muted underline hover:text-fg-primary"
                    >
                      {c.website_url} ↗
                    </a>
                  )}
                  {c.status === 'approved' && (
                    <div className="pt-2">
                      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                        노출
                      </span>
                      <PublishToggle
                        kind="alumni_company"
                        id={c.id}
                        published={c.published}
                      />
                    </div>
                  )}
                  {c.status === 'rejected' && c.reject_reason && (
                    <p className="text-xs text-red-500">거절: {c.reject_reason}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <SectionEyebrow>메타</SectionEyebrow>
        <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <Row label="상태">
            <StatusBadge status={data.status} />
          </Row>
          {data.status === 'rejected' && data.reject_reason && (
            <Row label="거절 사유">
              <span className="text-red-500">{data.reject_reason}</span>
            </Row>
          )}
          <Row label="접수일">
            <Muted>{formatDateTime(data.created_at)}</Muted>
          </Row>
          {data.approved_at && (
            <Row label="승인일">
              <Muted>{formatDateTime(data.approved_at)}</Muted>
            </Row>
          )}
          {data.updated_at && (
            <Row label="수정일">
              <Muted>{formatDateTime(data.updated_at)}</Muted>
            </Row>
          )}
        </dl>
      </section>

      {data.status === 'pending' && (
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm text-fg-subtle">
            승인·거절 처리는 신청 큐에서 진행합니다.
          </p>
          <Link
            href={`/admin/applications/alumni/${data.id}` as Route}
            className="mt-3 inline-block font-mono text-xs uppercase tracking-[0.28em] text-fg-primary underline"
          >
            → 신청 큐 상세로 이동
          </Link>
        </div>
      )}

      {data.status === 'approved' && (
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                노출
              </span>
              <PublishToggle
                kind="alumni"
                id={data.id}
                published={data.published}
              />
            </div>
            <DeleteButton
              kind="alumni"
              id={data.id}
              label={`${data.name} (${data.cohort}기)`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
        {label}
      </dt>
      <dd className="text-fg-subtle">{children}</dd>
    </>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-fg-muted">{children}</span>
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">
      {children}
    </p>
  )
}

function StatusBadge({
  status,
  small = false,
}: {
  status: 'pending' | 'approved' | 'rejected'
  small?: boolean
}) {
  const map = {
    pending: { label: 'PENDING', color: 'text-amber-500' },
    approved: { label: 'APPROVED', color: 'text-green-500' },
    rejected: { label: 'REJECTED', color: 'text-red-500' },
  }
  const { label, color } = map[status]
  return (
    <span
      translate="no"
      className={`font-mono uppercase tracking-[0.28em] ${color} ${small ? 'text-[9px]' : 'text-[10px] md:text-xs'}`}
    >
      {label}
    </span>
  )
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch {
    return iso
  }
}
