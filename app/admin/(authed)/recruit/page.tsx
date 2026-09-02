import Link from 'next/link'
import { supabaseService } from '@/lib/supabase/service'
import {
  formatKstDateTime,
  formatKstDatetimeLocal,
} from '@/lib/utils/format-date'
import {
  getApplications,
  getCurrentRecruitRound,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from '@/lib/recruit/queries'
import {
  setApplicationStatus,
  setRecruitDeadline,
  toggleRecruitOpen,
} from '@/app/admin/actions/recruit'
import {
  REGISTRATION_VALUES,
  type RegistrationValue,
} from '@/app/admin/actions/applications-state'
import { DeleteButton } from '@/components/admin/delete-button'
import { SendResultsButton } from '@/components/admin/send-results-button'
import { CopyPhonesButton } from '@/components/admin/copy-phones-button'
import { RegistrationSelect } from '@/components/admin/registration-select'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60 // 1시간. 페이지를 새로고침하면 재발급된다.

/**
 * 등록 회신(applications.registration)을 지원서 id로 찾을 수 있게 읽어 온다.
 *
 * lib/recruit/queries.ts의 Application 타입에 얹지 않고 여기서 따로 읽는
 * 이유는 두 가지다. 그 파일은 공개 /recruit 화면도 함께 쓰고, 등록 회신은
 * 어드민에게만 의미가 있다. 그리고 컬럼이 아직 없는 환경에서도 이 화면이
 * 통째로 죽지 않아야 한다.
 *
 * 컬럼을 읽지 못하면 null을 돌려준다. 빈 Map으로 뭉뚱그리면 전원이 "회신
 * 없음"으로 보여 실제 회신이 지워진 것처럼 읽힌다.
 */
async function readRegistrations(
  roundId: string,
): Promise<Map<string, RegistrationValue> | null> {
  const { data, error } = await supabaseService
    .from('applications')
    .select('id, registration')
    .eq('round_id', roundId)
  if (error || !data) {
    console.error('[admin/recruit] registration read failed', error)
    return null
  }
  const map = new Map<string, RegistrationValue>()
  for (const row of data as Record<string, unknown>[]) {
    const v = String(row.registration ?? '')
    // 모르는 값은 회신 없음으로 본다. 일괄 등록(bulk-import-members.ts)의
    // 판정과 같아야 화면 인원과 실제 등록 인원이 어긋나지 않는다.
    map.set(
      String(row.id),
      REGISTRATION_VALUES.includes(v as RegistrationValue)
        ? (v as RegistrationValue)
        : 'pending',
    )
  }
  return map
}

export default async function AdminRecruitPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>
}) {
  const round = await getCurrentRecruitRound()

  if (!round) {
    return (
      <div>
        <Header />
        <p className="mt-10 text-fg-muted">
          현재 라운드가 없습니다. Supabase에서 recruit_rounds에 행을 추가하세요.
        </p>
      </div>
    )
  }

  const [applications, registrations] = await Promise.all([
    getApplications(round.id),
    readRegistrations(round.id),
  ])

  // 상태 필터는 표시용. 통보·문자 명단·집계·엑셀은 전체(applications) 기준.
  const rawStatus = (await searchParams).status
  const statusFilter = APPLICATION_STATUSES.includes(
    rawStatus as ApplicationStatus,
  )
    ? (rawStatus as ApplicationStatus)
    : null
  const visible = statusFilter
    ? applications.filter((a) => a.status === statusFilter)
    : applications

  // 서명 URL은 3종 첨부 전체를 배치 한 번으로 발급한다.
  const urlByPath = new Map<string, string>()
  const allPaths = applications.flatMap((a) =>
    [a.file_path, a.business_plan_path, a.portfolio_path].filter(
      (p): p is string => Boolean(p),
    ),
  )
  if (allPaths.length > 0) {
    const { data } = await supabaseService.storage
      .from('recruit-applications')
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SEC)
    if (data) {
      for (const d of data) {
        if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl)
      }
    }
  }

  const countByStatus = new Map<ApplicationStatus, number>()
  for (const a of applications) {
    countByStatus.set(a.status, (countByStatus.get(a.status) ?? 0) + 1)
  }

  // 결과 발송 대기 인원 (해당 단계 합불 상태이면서 미통보)
  const pending = {
    docsPass: applications.filter(
      (a) => a.status === 'docs_pass' && !a.docs_result_sent_at,
    ).length,
    docsFail: applications.filter(
      (a) => a.status === 'docs_fail' && !a.docs_result_sent_at,
    ).length,
    finalPass: applications.filter(
      (a) => a.status === 'final_pass' && !a.final_result_sent_at,
    ).length,
    finalFail: applications.filter(
      (a) => a.status === 'final_fail' && !a.final_result_sent_at,
    ).length,
  }
  const submittedCount = countByStatus.get('submitted') ?? 0

  return (
    <div>
      <Header />
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{round.cohort} 지원자 · 총 {applications.length}명
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span
          translate="no"
          className={`inline-flex items-center border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] ${
            round.apply_open
              ? 'border-green-600 text-green-600'
              : 'border-border text-fg-muted'
          }`}
        >
          {round.apply_open ? 'OPEN' : 'CLOSED'}
        </span>
        {round.apply_deadline && (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted">
            마감 {formatKstDateTime(round.apply_deadline)}
          </span>
        )}
        <form action={toggleRecruitOpen}>
          <input type="hidden" name="round_id" value={round.id} />
          <input
            type="hidden"
            name="next"
            value={round.apply_open ? 'close' : 'open'}
          />
          <button
            type="submit"
            className="border border-fg-primary px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
          >
            {round.apply_open ? '접수 닫기' : '접수 열기'}
          </button>
        </form>
        <a
          href={`/admin/recruit/export.xlsx?round=${round.id}`}
          className="border border-border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
        >
          엑셀 다운로드
        </a>
      </div>

      {/* 시즌 상태 컨트롤. 공개 /recruit 화면은 마감 시각 하나로 세 상태를
          오간다: 미래 마감이면 접수 화면, 지났으면 마감 안내 + 일정 유지,
          비어 있으면(그리고 접수 닫힘) 시즌 종료 안내. 이 컨트롤이 없을 때는
          발표가 끝나도 화면이 지난 시즌 일정에 멈춰 있었고 SQL로만 벗어날
          수 있었다. */}
      <form
        action={setRecruitDeadline}
        className="mt-4 flex flex-wrap items-end gap-3 border border-border p-4"
      >
        <input type="hidden" name="round_id" value={round.id} />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
            마감 시각 (KST)
          </span>
          <input
            type="datetime-local"
            name="deadline"
            required
            defaultValue={
              round.apply_deadline
                ? formatKstDatetimeLocal(round.apply_deadline)
                : ''
            }
            className="border border-border bg-bg-base px-3 py-1.5 font-mono text-base text-fg-primary focus:border-fg-primary focus:outline-none md:text-xs"
          />
        </label>
        <button
          type="submit"
          name="intent"
          value="set"
          className="border border-fg-primary px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
        >
          마감 저장
        </button>
        <button
          type="submit"
          name="intent"
          value="clear"
          formNoValidate
          className="border border-border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
        >
          마감 비우기 (시즌 종료 화면)
        </button>
        <p className="w-full font-display text-xs leading-relaxed text-fg-muted">
          발표까지 끝났으면 마감을 비우고 접수를 닫아두세요. 공개 화면이
          &quot;지금은 접수 기간이 아닙니다&quot;로 바뀌고 지난 시즌 일정이
          내려갑니다.
        </p>
      </form>

      {/* 상태별 집계 겸 필터. 칩을 누르면 목록이 해당 상태만 표시한다. */}
      {applications.length > 0 && (
        <nav
          aria-label="상태 필터"
          className="mt-5 flex flex-wrap gap-px border border-border bg-border"
        >
          <FilterChip
            label="전체"
            count={applications.length}
            active={statusFilter === null}
          />
          {APPLICATION_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={APPLICATION_STATUS_LABELS[s]}
              count={countByStatus.get(s) ?? 0}
              active={statusFilter === s}
              status={s}
            />
          ))}
        </nav>
      )}

      {/* 문자 발송 명단. 상태별 전화번호를 하이픈 없이 쉼표로 복사한다. */}
      {applications.length > 0 && (
        <div className="mt-8 border border-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">
            문자 발송 명단
          </p>
          <p className="mt-2 max-w-[64ch] text-xs leading-relaxed text-fg-subtle">
            버튼을 누르면 해당 상태의 전화번호가 쉼표 구분으로 복사됩니다.
            단체 문자 서비스에 그대로 붙여넣으세요. 발송 전 인원수가
            심사 결과와 일치하는지 2인이 확인하는 것을 권장합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {APPLICATION_STATUSES.map((s) => (
              <CopyPhonesButton
                key={s}
                label={APPLICATION_STATUS_LABELS[s]}
                phones={applications
                  .filter((a) => a.status === s)
                  .map((a) => a.phone)}
              />
            ))}
            <CopyPhonesButton
              label="전체"
              phones={applications.map((a) => a.phone)}
            />
          </div>
        </div>
      )}

      {/* 결과 통보. 심사 상태를 저장한 뒤 단계별로 일괄 발송한다. */}
      {applications.length > 0 && (
        <div className="mt-8 border border-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">
            결과 통보
          </p>
          <p className="mt-2 max-w-[64ch] text-xs leading-relaxed text-fg-subtle">
            해당 단계의 합불 상태가 저장된 지원자에게 결과 메일을 보냅니다.
            이미 통보된 지원자에게는 다시 발송되지 않으며, 검토 전 상태는
            제외됩니다.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <SendResultsButton
              stage="docs"
              passCount={pending.docsPass}
              failCount={pending.docsFail}
              excludedCount={submittedCount}
            />
            <SendResultsButton
              stage="final"
              passCount={pending.finalPass}
              failCount={pending.finalFail}
              excludedCount={submittedCount}
            />
          </div>
        </div>
      )}

      {registrations === null && (
        <p className="mt-8 border border-border px-5 py-4 text-xs leading-relaxed text-red-400">
          등록 회신을 읽지 못했습니다. applications.registration 컬럼
          마이그레이션이 적용됐는지 확인해주세요. 적용 전까지 등록 회신은
          표시되지 않습니다.
        </p>
      )}

      {/* 좁은 화면에서는 지원자 열을 고정한다. 오른쪽 끝 상태 열을 조작할 때
          대상이 누구인지 화면에서 사라지지 않게 하기 위함이다. */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th sticky>지원자</Th>
              <Th>첨부</Th>
              <Th>비대면 사유</Th>
              <Th>상태</Th>
              <Th>등록 회신</Th>
              <Th>삭제</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <ApplicationRow
                key={a.id}
                app={a}
                urls={urlByPath}
                registration={
                  registrations === null
                    ? null
                    : (registrations.get(a.id) ?? 'pending')
                }
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <p className="py-12 text-center text-fg-muted">
                    {applications.length === 0
                      ? '아직 지원자가 없습니다.'
                      : '해당 상태의 지원자가 없습니다.'}
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

function Header() {
  return (
    <p
      translate="no"
      className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
    >
      RECRUIT · APPLICATIONS
    </p>
  )
}

/** 집계 칩 겸 필터 링크. status 없이 쓰면 필터 해제(전체). */
function FilterChip({
  label,
  count,
  active,
  status,
}: {
  label: string
  count: number
  active: boolean
  status?: ApplicationStatus
}) {
  const tone = count > 0 ? 'text-fg-primary' : 'text-fg-muted'
  return (
    <Link
      href={{
        pathname: '/admin/recruit',
        ...(status ? { query: { status } } : {}),
      }}
      aria-current={active ? 'true' : undefined}
      className={`flex items-baseline gap-2 bg-bg-base px-4 py-2 transition-colors hover:bg-fg-primary/[0.04] ${
        active ? 'ring-1 ring-inset ring-fg-primary' : ''
      }`}
    >
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.2em] ${tone}`}
      >
        {label}
      </span>
      <span
        translate="no"
        className={`font-display text-sm font-bold tabular-nums ${tone}`}
      >
        {count}
      </span>
    </Link>
  )
}

/**
 * 첨부 슬롯. 제출됨=밑줄 링크, 미제출=흐린 라벨(선택 항목임을 드러낸다).
 * 스토리지 경로명(application.pdf 등) 대신 지원자가 낸 원본 파일명으로
 * 받아지도록 서명 URL에 download 파라미터를 붙인다.
 */
function FileSlot({
  path,
  urls,
  label,
  downloadName,
}: {
  path: string | null
  urls: Map<string, string>
  label: string
  downloadName: string
}) {
  const url = path ? urls.get(path) : null
  if (!path || !url)
    return (
      <span className="text-fg-muted opacity-40" title="미제출">
        {label}
      </span>
    )
  return (
    <a
      href={`${url}&download=${encodeURIComponent(downloadName)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={downloadName}
      className="underline underline-offset-4 hover:text-fg-primary"
    >
      {label}
    </a>
  )
}

function ApplicationRow({
  app,
  urls,
  registration,
}: {
  app: Application
  urls: Map<string, string>
  /** null이면 등록 회신 컬럼을 읽지 못한 것. 값이 비었다는 뜻이 아니다. */
  registration: RegistrationValue | null
}) {
  return (
    <tr className="border-b border-border align-top transition-colors hover:bg-fg-primary/[0.03]">
      <Td sticky>
        <p className="font-display font-bold text-fg-primary">{app.name}</p>
        <p className="mt-1 font-mono text-xs text-fg-muted">{app.email}</p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-fg-muted">
          {app.phone}
        </p>
        <p className="mt-1.5 whitespace-nowrap font-mono text-[10px] text-fg-muted opacity-70">
          {formatKstDateTime(app.created_at)} 접수
        </p>
      </Td>
      <Td>
        <div className="flex items-baseline gap-4 whitespace-nowrap">
          <FileSlot
            path={app.file_path}
            urls={urls}
            label="지원서"
            downloadName={app.file_name}
          />
          <FileSlot
            path={app.business_plan_path}
            urls={urls}
            label="계획서"
            downloadName={app.business_plan_name ?? `${app.name}_사업계획서`}
          />
          <FileSlot
            path={app.portfolio_path}
            urls={urls}
            label="작업물"
            downloadName={app.portfolio_name ?? `${app.name}_작업물.zip`}
          />
        </div>
      </Td>
      <Td>
        {app.remote_interview_reason ? (
          <p
            className="max-w-[26ch] line-clamp-3 leading-relaxed"
            title={app.remote_interview_reason}
          >
            {app.remote_interview_reason}
          </p>
        ) : (
          '-'
        )}
      </Td>
      <Td>
        <form
          action={setApplicationStatus}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="application_id" value={app.id} />
          <select
            name="status"
            defaultValue={app.status}
            aria-label={`${app.name} 심사 상태`}
            className="min-h-9 border border-border bg-bg-base px-2 py-2 text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-9 border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
          >
            저장
          </button>
        </form>
        {((app.status.startsWith('docs') && app.docs_result_sent_at) ||
          (app.status.startsWith('final') && app.final_result_sent_at)) && (
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted">
            통보됨
          </p>
        )}
      </Td>
      <Td>
        <RegistrationCell app={app} registration={registration} />
      </Td>
      <Td>
        <DeleteButton
          kind="application"
          id={app.id}
          label={`${app.name} (${app.email})`}
        />
      </Td>
    </tr>
  )
}

/**
 * 등록 회신 칸.
 *
 * 회신은 최종 합격자에게만 의미가 있다. 서류 불합격자 옆에 "회신 없음"이
 * 떠 있으면 아직 답을 기다리는 사람처럼 읽힌다. 그래서 최종 합격이 아니고
 * 값도 비어 있으면 컨트롤을 두지 않고 빈 칸으로 남긴다.
 *
 * 다만 최종 합격이 아닌데 값이 남아 있는 경우(합격 처리 후 회신을 받았다가
 * 심사 상태를 되돌린 경우)에는 반드시 보여 준다. 숨기면 화면에 없는 값이
 * 일괄 등록에만 영향을 주는 상태가 되어, 아무도 못 고친다.
 */
function RegistrationCell({
  app,
  registration,
}: {
  app: Application
  registration: RegistrationValue | null
}) {
  if (registration === null)
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
        미적용
      </span>
    )
  const finalPass = app.status === 'final_pass'
  if (!finalPass && registration === 'pending')
    return (
      <span className="text-fg-muted opacity-50" title="최종 합격자만 표시합니다">
        -
      </span>
    )
  return (
    <RegistrationSelect
      applicationId={app.id}
      applicantName={app.name}
      registration={registration}
      finalPass={finalPass}
    />
  )
}

/** 가로 스크롤이 생기는 좁은 화면에서만 열을 왼쪽에 고정한다. */
const STICKY_CELL = 'max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-bg-base'

function Th({
  children,
  sticky,
}: {
  children: React.ReactNode
  sticky?: boolean
}) {
  return (
    <th
      className={`font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4 ${
        sticky ? STICKY_CELL : ''
      }`}
    >
      {children}
    </th>
  )
}
function Td({
  children,
  colSpan,
  sticky,
}: {
  children: React.ReactNode
  colSpan?: number
  sticky?: boolean
}) {
  return (
    <td
      colSpan={colSpan}
      className={`py-4 pr-4 text-fg-subtle ${sticky ? STICKY_CELL : ''}`}
    >
      {children}
    </td>
  )
}
