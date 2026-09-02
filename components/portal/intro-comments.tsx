import { getIntroComments } from '@/lib/portal/queries'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { IntroCommentForm } from '@/components/portal/intro-comment-form'
import { DeleteButton } from '@/components/admin/delete-button'

/**
 * 자기소개 댓글 섹션 (RSC). 43기 노션의 소개 페이지 댓글을 잇는다.
 * 접근 통제는 상위 페이지(포털 게이트)가 이미 끝냈다. 삭제 버튼은
 * 본인 댓글 또는 임원진에게만 보이고, 서버 액션이 같은 규칙을 재검증한다.
 */
export async function IntroComments({
  profileId,
  viewerEmail,
  viewerIsExec,
}: {
  profileId: string
  viewerEmail: string
  viewerIsExec: boolean
}) {
  const comments = await getIntroComments(profileId)

  return (
    <section className="mt-14 border-t border-border pt-10">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        COMMENTS · {comments.length}
      </p>
      <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
        댓글
      </h2>

      {comments.length > 0 && (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => {
            const mine =
              c.author_email.toLowerCase() === viewerEmail.toLowerCase()
            return (
              <li key={c.id} className="border border-border p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-sm font-bold text-fg-primary">
                    {c.author_name}
                  </span>
                  <span className="font-mono text-[10px] text-fg-muted">
                    {formatKstDateTime(c.created_at)}
                  </span>
                  {(mine || viewerIsExec) && (
                    <span className="ml-auto">
                      <DeleteButton
                        kind="intro_comment"
                        id={c.id}
                        label={`${c.author_name}의 댓글`}
                      />
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-[68ch] whitespace-pre-line font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
                  {c.body}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6">
        <IntroCommentForm profileId={profileId} />
      </div>
    </section>
  )
}
