import Link from 'next/link'
import type { Route } from 'next'
import { requireExec } from '@/lib/portal/auth'
import { getSiteConfig } from '@/lib/data/site-config'
import {
  getSessions,
  SESSION_KIND_LABELS,
} from '@/lib/portal/queries'

export const dynamic = 'force-dynamic'

export default async function ManageSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  await requireExec()
  const [{ cohort: cohortParam }, siteConfig] = await Promise.all([
    searchParams,
    getSiteConfig(),
  ])
  const cohort = cohortParam ? Number(cohortParam) : siteConfig.cohort
  const sessions = await getSessions({ cohort, publishedOnly: false })

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · SESSIONS
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{cohort} 세션 관리 · {sessions.length}개
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={'/members/manage/sessions/new' as Route}
          className="border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
        >
          새 세션
        </Link>
        <Link
          href={`/members/manage/sessions?cohort=${cohort - 1}` as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          {cohort - 1}기 보기
        </Link>
        {cohort !== siteConfig.cohort && (
          <Link
            href={'/members/manage/sessions' as Route}
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
          >
            현재 기수로
          </Link>
        )}
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>유형</Th>
              <Th>주차</Th>
              <Th>제목</Th>
              <Th>상태</Th>
              <Th>편집</Th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border transition-colors hover:bg-fg-primary/[0.03]"
              >
                <Td>
                  <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
                    {SESSION_KIND_LABELS[s.kind]}
                  </span>
                </Td>
                <Td>{s.week ?? '-'}</Td>
                <Td>
                  <span className="font-display font-bold text-fg-primary">
                    {s.title}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ${
                      s.is_published
                        ? 'border-fg-primary text-fg-primary'
                        : 'border-border text-fg-muted'
                    }`}
                  >
                    {s.is_published ? '공개' : '초안'}
                  </span>
                </Td>
                <Td>
                  <Link
                    href={`/members/manage/sessions/${s.id}` as Route}
                    className="inline-block border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
                  >
                    편집
                  </Link>
                </Td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <Td colSpan={5}>
                  <p className="py-12 text-center text-fg-muted">
                    등록된 세션이 없습니다. 위의 새 세션 버튼으로 첫 세션을
                    만드세요.
                  </p>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** 열 제목이 한글이라 uppercase는 무효고 0.32em 자간은 글자를 흩어놓는다. */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] text-fg-muted py-3 pr-4">{children}</th>
  )
}
function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className="py-3 pr-4 text-fg-subtle">
      {children}
    </td>
  )
}
