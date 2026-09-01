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
  type AttendanceRow,
  type RosterMember,
} from '@/lib/portal/queries'
import { setAttendance } from '@/app/members/actions/portal'
import { SaveButton } from './save-button'

export const dynamic = 'force-dynamic'

// 모바일에서 16px 미만이면 iOS가 포커스 시 화면을 확대한다. 표 밀도는 md 분기로 유지.
const CONTROL_CLASS =
  'bg-bg-base px-2 text-base text-fg-primary focus:border-fg-primary focus:outline-none md:text-xs'
/**
 * 데스크톱 표는 행 높이를 지금 그대로 두고, 서서 손으로 찍는 모바일 카드만
 * 44px 터치 타깃을 채운다. 한 문자열에 py 유틸을 겹쳐 쓰면 어느 쪽이 이길지
 * CSS 출력 순서에 달리므로 사용처별로 상수를 나눠 둔다.
 */
const SELECT_CLASS = `border ${CONTROL_CLASS} py-1.5`
const SELECT_CARD_CLASS = `border ${CONTROL_CLASS} min-h-11 py-2.5`
const NOTE_CLASS = `w-full border border-border ${CONTROL_CLASS} py-1.5`
const NOTE_CARD_CLASS = `w-full border border-border ${CONTROL_CLASS} min-h-11 py-2.5`
const NOTE_PLACEHOLDER = '사유 (학회원에게 공개)'

/** 미기록 행은 테두리를 세게 줘서 명단을 훑을 때 눈에 걸리게 한다. */
function statusBorder(recorded: boolean) {
  return recorded ? 'border-border' : 'border-border-strong'
}

/**
 * 세션별 출결 체크. 데스크톱은 그리드 테이블, 모바일(세션 현장)은 카드
 * 리스트로 분기한다. 행마다 개별 폼이고 저장은 upsert라 몇 번을 고쳐도
 * 안전하다. 두 레이아웃의 폼 id가 겹치지 않게 접두사를 달리한다.
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
          Vol.{session.cohort} 학회원 명단이 비어 있습니다.{' '}
          <Link
            href={'/admin/members' as Route}
            className="underline hover:text-fg-primary"
          >
            어드민 · 학회원
          </Link>
          에서 명단을 먼저 등록하세요.
        </p>
      ) : (
        <>
          {/* 비고가 당사자에게 보인다는 사실을 입력 전에 알린다(내부 메모 오기입 방지) */}
          <p className="mt-8 border border-border-strong px-3 py-2 text-xs text-fg-subtle">
            비고는 해당 학회원의 내 출결 화면에 그대로 표시됩니다. 내부 판단은
            적지 마세요.
          </p>

          {/* 모바일: 카드 리스트 */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {roster.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                row={byMember.get(m.id)}
                sessionId={session.id}
              />
            ))}
          </ul>

          {/* 데스크톱: 그리드 테이블 */}
          <div className="mt-6 hidden overflow-x-auto md:block">
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
                      {/* 행 헤더로 잡아야 표 모드에서 어느 학회원의 행인지 읽힌다 */}
                      <th
                        scope="row"
                        className="py-3 pr-4 text-left align-middle font-normal text-fg-subtle"
                      >
                        <MemberName member={m} />
                      </th>
                      <FormCells
                        formId={`att-d-${m.id}`}
                        sessionId={session.id}
                        memberId={m.id}
                        memberName={m.name}
                        row={row}
                      />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function MemberName({ member }: { member: RosterMember }) {
  return (
    <>
      <span className="font-display font-bold text-fg-primary">
        {member.name}
      </span>
      {member.role_tier !== 'member' && (
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted">
          {member.role_tier}
        </span>
      )}
    </>
  )
}

/** 모바일 카드. 세션 현장에서 폰으로 체크하는 흐름에 맞춘 레이아웃. */
function MemberCard({
  member,
  row,
  sessionId,
}: {
  member: RosterMember
  row: AttendanceRow | undefined
  sessionId: string
}) {
  const formId = `att-m-${member.id}`
  const recorded = Boolean(row)
  return (
    <li className="border border-border p-4">
      <form id={formId} action={setAttendance}>
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="member_id" value={member.id} />
      </form>
      <div className="flex items-center justify-between gap-3">
        <p>
          <MemberName member={member} />
        </p>
        <SaveButton
          formId={formId}
          recorded={recorded}
          memberName={member.name}
          className="min-h-11"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
        <select
          name="status"
          form={formId}
          defaultValue={row?.status ?? ''}
          required
          aria-label={`${member.name} 출결 상태`}
          className={`${SELECT_CARD_CLASS} ${statusBorder(recorded)}`}
        >
          <option value="" disabled>
            미기록
          </option>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ATTENDANCE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 font-display text-xs text-fg-subtle">
          <input
            type="checkbox"
            name="assignment_missing"
            form={formId}
            defaultChecked={row?.assignment_missing ?? false}
            className="h-4 w-4 border-border accent-fg-primary"
          />
          과제 미제출
        </label>
      </div>
      <input
        type="text"
        name="note"
        form={formId}
        defaultValue={row?.note ?? ''}
        maxLength={200}
        placeholder={NOTE_PLACEHOLDER}
        aria-label={`${member.name} 비고 (학회원에게 공개)`}
        className={`${NOTE_CARD_CLASS} mt-3`}
      />
    </li>
  )
}

/**
 * 데스크톱 표의 입력 셀. 셀마다 컨트롤이 홀로 놓여 이름 셀과 떨어지므로
 * 세 컨트롤 모두 학회원 이름을 담은 aria-label을 직접 단다.
 */
function FormCells({
  formId,
  sessionId,
  memberId,
  memberName,
  row,
}: {
  formId: string
  sessionId: string
  memberId: string
  memberName: string
  row: AttendanceRow | undefined
}) {
  const recorded = Boolean(row)
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
          defaultValue={row?.status ?? ''}
          required
          aria-label={`${memberName} 출결 상태`}
          className={`${SELECT_CLASS} ${statusBorder(recorded)}`}
        >
          <option value="" disabled>
            미기록
          </option>
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
          defaultChecked={row?.assignment_missing ?? false}
          aria-label={`${memberName} 과제 미제출`}
          className="h-4 w-4 border-border accent-fg-primary"
        />
      </Td>
      <Td>
        <input
          type="text"
          name="note"
          form={formId}
          defaultValue={row?.note ?? ''}
          maxLength={200}
          placeholder={NOTE_PLACEHOLDER}
          aria-label={`${memberName} 비고 (학회원에게 공개)`}
          className={`${NOTE_CLASS} max-w-[16rem]`}
        />
      </Td>
      <Td>
        <SaveButton
          formId={formId}
          recorded={recorded}
          memberName={memberName}
        />
      </Td>
    </>
  )
}

/** 열 제목이 한글이라 uppercase는 무효고 0.32em 자간은 글자를 흩어놓는다. */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] text-fg-muted py-3 pr-4">{children}</th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 align-middle text-fg-subtle">{children}</td>
}
