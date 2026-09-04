import {
  getRoster,
  getSubmissionsForSession,
  type ClubSession,
} from '@/lib/portal/queries'
import { signDownload } from '@/lib/portal/file-upload'
import { fileExt, formatFileSize } from '@/lib/portal/files'
import { isSubmissionClosed } from '@/lib/portal/submission-window'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { DeleteButton } from '@/components/admin/delete-button'
import { SubmissionComposer } from '@/components/portal/submission-composer'

/**
 * 발표자료 제출 섹터 (RSC).
 *
 * 가시성 규칙이 이 컴포넌트의 핵심이다.
 *   임원진            : 전원의 제출물 + 미제출자 명단
 *   본인              : 자기 제출물은 언제나
 *   다른 학회원의 것  : session.submissions_visible이 켜졌을 때만
 *
 * 기본이 비공개인 이유는 발표 전 자료가 팀의 결과물이고 10만플처럼
 * 경쟁이 걸린 회차가 있기 때문이다. 공유가 필요한 회차는 임원진이
 * 세션 설정에서 켠다.
 *
 * 비공개일 때도 제출 건수는 보여준다. 숫자만으로는 누가 냈는지 알 수
 * 없고, 마감 앞에서 "나만 안 낸 건가"를 가늠할 근거는 있어야 한다.
 */
export async function SessionSubmissions({
  session,
  viewerEmail,
  viewerIsExec,
}: {
  session: ClubSession
  viewerEmail: string
  viewerIsExec: boolean
}) {
  const all = await getSubmissionsForSession(session.id)
  const viewer = viewerEmail.toLowerCase()
  const mine = all.filter((s) => s.submitter_email.toLowerCase() === viewer)

  const seesAll = viewerIsExec || session.submissions_visible
  const visible = seesAll ? all : mine
  const urls = await Promise.all(
    visible.map((s) => signDownload(s.file_path, s.file_name)),
  )

  const closed = isSubmissionClosed(session.submission_due)

  // 미제출자 대조는 임원진 화면에서만. 명단 전체가 드러나기 때문이다.
  let missing: string[] = []
  if (viewerIsExec) {
    const submitted = new Set(
      all.map((s) => s.member_id).filter((v): v is string => Boolean(v)),
    )
    const roster = await getRoster(session.cohort)
    missing = roster.filter((m) => !submitted.has(m.id)).map((m) => m.name)
  }

  return (
    <section className="mt-14 border-t border-border pt-10">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        SUBMISSIONS · {all.length}
      </p>
      <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
        발표자료 제출
      </h2>

      {session.submission_due && (
        <p
          className={`mt-3 font-display text-sm ${closed ? 'text-red-400' : 'text-fg-subtle'}`}
        >
          마감 {formatKstDateTime(session.submission_due)}
          {closed && ' (마감됨)'}
        </p>
      )}

      {session.submission_note && (
        <p className="mt-3 whitespace-pre-line font-display text-sm text-fg-subtle">
          {session.submission_note}
        </p>
      )}

      {closed ? (
        <p className="mt-6 border border-border px-5 py-4 font-display text-sm text-fg-muted">
          제출이 마감되었습니다. 늦은 제출이 필요하면 임원진에게 문의해주세요.
        </p>
      ) : (
        <div className="mt-6">
          <SubmissionComposer sessionId={session.id} />
        </div>
      )}

      {!viewerIsExec && !session.submissions_visible && (
        <p className="mt-6 font-display text-xs text-fg-muted">
          제출물은 임원진과 본인에게만 보입니다. 지금까지 {all.length}건
          제출되었습니다.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {visible.map((s, i) => {
          const url = urls[i]
          const isMine = s.submitter_email.toLowerCase() === viewer
          const ext = fileExt(s.file_name)
          const size = formatFileSize(s.file_size)
          return (
            <li key={s.id} className="border border-border p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-sm font-bold text-fg-primary">
                  {s.submitter_name}
                </span>
                {s.team_label && (
                  <span
                    translate="no"
                    className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle"
                  >
                    {s.team_label}
                  </span>
                )}
                <span className="font-mono text-[10px] text-fg-muted">
                  {formatKstDateTime(s.created_at)}
                </span>
                {(isMine || viewerIsExec) && (
                  <span className="ml-auto">
                    <DeleteButton
                      kind="session_submission"
                      id={s.id}
                      label={`${s.submitter_name}의 제출물`}
                    />
                  </span>
                )}
              </div>

              {s.title && (
                <p className="mt-3 font-display text-base text-fg-primary">
                  {s.title}
                </p>
              )}
              {s.note && (
                <p className="mt-2 whitespace-pre-line font-display text-sm text-fg-subtle">
                  {s.note}
                </p>
              )}

              <p className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  translate="no"
                  aria-hidden
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted"
                >
                  {ext || 'FILE'}
                </span>
                {url ? (
                  <a
                    href={url}
                    className="font-display text-sm text-fg-primary underline decoration-border underline-offset-4 hover:decoration-fg-primary"
                  >
                    {s.file_name}
                  </a>
                ) : (
                  <span className="font-display text-sm text-fg-muted">
                    {s.file_name} (링크 발급 실패)
                  </span>
                )}
                {size && (
                  <span className="font-mono text-[10px] text-fg-muted">
                    {size}
                  </span>
                )}
              </p>
            </li>
          )
        })}
        {visible.length === 0 && (
          <li className="border border-border p-8 text-center font-display text-sm text-fg-muted">
            {viewerIsExec || session.submissions_visible
              ? '아직 제출된 자료가 없습니다.'
              : '아직 제출하지 않으셨습니다.'}
          </li>
        )}
      </ul>

      {viewerIsExec && (
        <div className="mt-8 border border-border p-5">
          <p
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
          >
            미제출 · {missing.length}
          </p>
          <p className="mt-3 font-display text-sm text-fg-subtle">
            {missing.length > 0 ? missing.join(', ') : '전원 제출했습니다.'}
          </p>
          <p className="mt-3 font-mono text-[10px] text-fg-muted">
            임원진에게만 보입니다
          </p>
        </div>
      )}
    </section>
  )
}
