import { supabaseService } from '@/lib/supabase/service'
import { getPostsForSession } from '@/lib/portal/queries'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { Markdown } from '@/components/portal/markdown'
import { PostComposer } from '@/components/portal/post-composer'
import { DeleteButton } from '@/components/admin/delete-button'

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * 세션 하단 학회원 기록 피드 (RSC). 사진은 비공개 버킷이라 서명 읽기
 * URL을 배치로 발급해 렌더링한다. 삭제 버튼은 본인 글 또는 임원진에게만.
 */
export async function SessionPosts({
  sessionId,
  viewerEmail,
  viewerIsExec,
}: {
  sessionId: string
  viewerEmail: string
  viewerIsExec: boolean
}) {
  const posts = await getPostsForSession(sessionId)

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
        학회원 기록.
      </h2>

      <div className="mt-6">
        <PostComposer sessionId={sessionId} />
      </div>

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
    </section>
  )
}
