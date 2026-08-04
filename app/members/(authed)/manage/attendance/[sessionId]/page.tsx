import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { requireExec } from '@/lib/portal/auth'
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  getAttendanceForSession,
  getRoster,
  getSessionById,
} from '@/lib/portal/queries'
import { setAttendance } from '@/app/members/actions/portal'

export const dynamic = 'force-dynamic'

/**
 * 세션별 출결 체크 그리드. 행마다 개별 폼: 상태 셀렉트 + 과제 미제출
 * 체크 + 비고 + 저장. 저장 시 upsert라 몇 번을 고쳐도 안전하다.
 */
export default async function ManageAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await requireExec()
  const { sessionId } = await params
  const session = await getSessionById(sessionId)
  if (!session) notFound()

  const [roster, rows] = await Promise.all([
    getRoster(session.cohort),
    getAttendanceForSession(session.id),
  ])
  const byMember = new Map(rows.map((r) => [r.member_id, r]))

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · ATTENDANCE
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {session.week !== null ? `${session.week}주차 · ` : ''}
        {session.title}
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={'/members/manage/attendance' as Route}
          className="underline"
        >
          ← 세션 선택
        </Link>
        {' · '}기록 {rows.length}/{roster.length}명
      </p>

      {roster.length === 0 ? (
        <p className="mt-16 text-center font-display text-sm text-fg-muted">
          Vol.{session.cohort} 학회원 명단이 비어 있습니다. 어드민(학회원
          메뉴)에서 명단을 먼저 등록하세요.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>이름</Th>
              <Th>출결</Th>
              <Th>과제 미제출</Th>
              <Th>비고</Th>
              <Th>저장</Th>
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => {
              const row = byMember.get(m.id)
              return (
                <tr
                  key={m.id}
                  className="border-b border-border transition-colors hover:bg-fg-primary/[0.03]"
                >
                  <Td>
                    <span className="font-display font-bold text-fg-primary">
                      {m.name}
                    </span>
                    {m.role_tier !== 'member' && (
                      <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted">
                        {m.role_tier}
                      </span>
                    )}
                  </Td>
                  <FormCells
                    sessionId={session.id}
                    memberId={m.id}
                    status={row?.status}
                    assignmentMissing={row?.assignment_missing ?? false}
                    note={row?.note ?? ''}
                    recorded={Boolean(row)}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

function FormCells({
  sessionId,
  memberId,
  status,
  assignmentMissing,
  note,
  recorded,
}: {
  sessionId: string
  memberId: string
  status?: string
  assignmentMissing: boolean
  note: string
  recorded: boolean
}) {
  const formId = `att-${memberId}`
  return (
    <>
      <Td>
        <form id={formId} action={setAttendance}>
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="member_id" value={memberId} />
        </form>
        <select
          name="status"
          form={formId}
          defaultValue={status ?? 'present'}
          className="border border-border bg-bg-base px-2 py-1.5 text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
        >
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ATTENDANCE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Td>
      <Td>
        <input
          type="checkbox"
          name="assignment_missing"
          form={formId}
          defaultChecked={assignmentMissing}
          className="h-4 w-4 border-border accent-fg-primary"
        />
      </Td>
      <Td>
        <input
          type="text"
          name="note"
          form={formId}
          defaultValue={note}
          maxLength={200}
          placeholder="-"
          className="w-full max-w-[16rem] border border-border bg-bg-base px-2 py-1.5 text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
        />
      </Td>
      <Td>
        <button
          type="submit"
          form={formId}
          className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
            recorded
              ? 'border-border text-fg-subtle hover:border-fg-primary hover:text-fg-primary'
              : 'border-fg-primary text-fg-primary hover:bg-fg-primary hover:text-bg-base'
          }`}
        >
          {recorded ? '수정' : '기록'}
        </button>
      </Td>
    </>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">
      {children}
    </th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 align-middle text-fg-subtle">{children}</td>
}
