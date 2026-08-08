import Link from 'next/link'
import { supabaseService } from '@/lib/supabase/service'
import { formatKstDateTime } from '@/lib/utils/format-date'
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
  toggleRecruitOpen,
} from '@/app/admin/actions/recruit'
import { DeleteButton } from '@/components/admin/delete-button'
import { SendResultsButton } from '@/components/admin/send-results-button'
import { CopyPhonesButton } from '@/components/admin/copy-phones-button'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60 // 1시간. 페이지를 새로고침하면 재발급된다.

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

  const applications = await getApplications(round.id)

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

      {/* 좁은 화면에서는 지원자 열을 고정한다. 오른쪽 끝 상태 열을 조작할 때
          대상이 누구인지 화면에서 사라지지 않게 하기 위함이다. */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th sticky>지원자</Th>
              <Th>첨부</Th>
              <Th>비대면 사유</Th>
              <Th>상태</Th>
              <Th>삭제</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <ApplicationRow key={a.id} app={a} urls={urlByPath} />
            ))}
            {visible.length === 0 && (
              <tr>
                <Td colSpan={5}>
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
}: {
  app: Application
  urls: Map<string, string>
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
        <DeleteButton
          kind="application"
          id={app.id}
          label={`${app.name} (${app.email})`}
        />
      </Td>
    </tr>
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
