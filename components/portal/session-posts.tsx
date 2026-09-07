import { supabaseService } from '@/lib/supabase/service'
import {
  getPostsForSession,
  getRoster,
  type ClubSession,
} from '@/lib/portal/queries'
import { isPastDue } from '@/lib/portal/deadline'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { Markdown } from '@/components/portal/markdown'
import { PostComposer } from '@/components/portal/post-composer'
import { DeleteButton } from '@/components/admin/delete-button'

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * 세션 하단 학회원 기록 피드 (RSC). 사진은 비공개 버킷이라 서명 읽기
 * URL을 배치로 발급해 렌더링한다. 삭제 버튼은 본인 글 또는 임원진에게만.
 *
 * 마감(post_due)이 걸린 회차는 인사이트 과제 제출 칸으로 쓰인다. 소감문은
 * 파일이 아니라 글이라 발표자료 제출이 아니라 이쪽이 제자리다. 마감이
 * 지나면 새 기록을 막고 임원진에게 미작성자 명단을 보여준다.
 */
export async function SessionPosts({
  session,
  viewerEmail,
  viewerIsExec,
}: {
  session: ClubSession
  viewerEmail: string
  viewerIsExec: boolean
}) {
  const posts = await getPostsForSession(session.id)
  const closed = isPastDue(session.post_due)

  // 미작성자 대조는 마감이 걸린 과제 회차에서만. 명단 전체가 드러나므로
  // 임원진 화면에 한정한다.
  let missing: string[] = []
  if (viewerIsExec && session.post_due) {
    const written = new Set(
      posts.map((p) => p.member_id).filter((v): v is string => Boolean(v)),
    )
    const roster = await getRoster(session.cohort)
    missing = roster.filter((m) => !written.has(m.id)).map((m) => m.name)
  }

  const imageUrls = new Map<string, string>()
  const allPaths = posts.flatMap((p) => p.image_paths)
  if (allPaths.length > 0) {
    const { data } = await supabaseService.storage
      .from('portal-photos')
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SEC)
    if (data) {
      for (const d of data) {
        if (d.path && d.signedUrl) imageUrls.set(d.path, d.signedUrl)
      }
    }
  }

  return (
    <section className="mt-14 border-t border-border pt-10">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        MEMBER NOTES · {posts.length}
      </p>
      <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
        학회원 기록
      </h2>

      {session.post_due && (
        <p
          className={`mt-3 font-display text-sm ${closed ? 'text-red-400' : 'text-fg-subtle'}`}
        >
          마감 {formatKstDateTime(session.post_due)}
          {closed && ' (마감됨)'}
        </p>
      )}

      {closed ? (
        <p className="mt-6 border border-border px-5 py-4 font-display text-sm text-fg-muted">
          마감되었습니다. 늦은 제출이 필요하면 임원진에게 문의해주세요.
        </p>
      ) : (
        <div className="mt-6">
          <PostComposer sessionId={session.id} />
        </div>
      )}

      <ul className="mt-8 space-y-6">
        {posts.map((post) => {
          const mine =
            post.author_email.toLowerCase() === viewerEmail.toLowerCase()
          return (
            <li key={post.id} className="border border-border p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-sm font-bold text-fg-primary">
                  {post.author_name}
                </span>
                <span className="font-mono text-[10px] text-fg-muted">
                  {formatKstDateTime(post.created_at)}
                </span>
                {(mine || viewerIsExec) && (
                  <span className="ml-auto">
                    <DeleteButton
                      kind="session_post"
                      id={post.id}
                      label={`${post.author_name}의 기록`}
                    />
                  </span>
                )}
              </div>
              {post.content_md && (
                <div className="mt-3">
                  <Markdown content={post.content_md} />
                </div>
              )}
              {post.image_paths.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {post.image_paths.map((path) => {
                    const url = imageUrls.get(path)
                    if (!url) return null
                    return (
                      <a
                        key={path}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden border border-border"
                      >
                        {/* 서명 URL은 만료가 있어 next/image 캐시와 맞지 않는다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${post.author_name}의 사진`}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                      </a>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
        {posts.length === 0 && (
          <li className="border border-border p-8 text-center font-display text-sm text-fg-muted">
            아직 기록이 없습니다. 첫 기록을 남겨보세요.
          </li>
        )}
      </ul>

      {viewerIsExec && session.post_due && (
        <div className="mt-8 border border-border p-5">
          <p
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
          >
            미작성 · {missing.length}
          </p>
          <p className="mt-3 font-display text-sm text-fg-subtle">
            {missing.length > 0 ? missing.join(', ') : '전원 작성했습니다.'}
          </p>
          <p className="mt-3 font-mono text-[10px] text-fg-muted">
            임원진에게만 보입니다
          </p>
        </div>
      )}
    </section>
  )
}
