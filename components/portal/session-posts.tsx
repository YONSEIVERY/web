import { supabaseService } from '@/lib/supabase/service'
import {
  getPostsForSession,
  getRoster,
  type ClubSession,
  type SessionPost,
} from '@/lib/portal/queries'
import { isPastDue } from '@/lib/portal/deadline'
import { signDownload } from '@/lib/portal/file-upload'
import { fileExt } from '@/lib/portal/files'
import { formatKstDateTime } from '@/lib/utils/format-date'
import { Markdown } from '@/components/portal/markdown'
import { PostComposer } from '@/components/portal/post-composer'
import { DeleteButton } from '@/components/admin/delete-button'

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * 세션 하단 학회원 기록 피드 (RSC).
 *
 * 비정규 세션 세 종류를 이 한 화면이 받는다. 모양을 가르는 것은 세션
 * 설정 세 가지다.
 *   post_scope  individual(인사이트·컨벤션) / team / both(스터디)
 *   post_quota  인당 필요 건수. 컨벤션이 2
 *   post_teams  조 목록. 조 제출의 드롭다운이자 미제출 조 대조 기준
 *
 * 사진은 portal-photos, 첨부는 portal-files라 서명 URL을 따로 발급한다.
 * 첨부는 파일명을 살려야 해서 한 건씩 발급한다(복수 발급은 파일명을
 * 하나만 싣는다).
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
  const viewer = viewerEmail.toLowerCase()

  const teamPosts = posts.filter((p) => p.scope === 'team')
  const soloPosts = posts.filter((p) => p.scope === 'individual')
  const wantsTeam = session.post_scope === 'team' || session.post_scope === 'both'
  const wantsSolo =
    session.post_scope === 'individual' || session.post_scope === 'both'

  const imageUrls = new Map<string, string>()
  const allImages = posts.flatMap((p) => p.image_paths)
  if (allImages.length > 0) {
    const { data } = await supabaseService.storage
      .from('portal-photos')
      .createSignedUrls(allImages, SIGNED_URL_TTL_SEC)
    if (data) {
      for (const d of data) {
        if (d.path && d.signedUrl) imageUrls.set(d.path, d.signedUrl)
      }
    }
  }

  const fileUrls = new Map<string, string>()
  const fileJobs = posts.flatMap((p) =>
    p.file_paths.map((path, i) => ({
      path,
      fileName: p.file_names[i] ?? 'file',
    })),
  )
  if (fileJobs.length > 0) {
    const signed = await Promise.all(
      fileJobs.map((j) => signDownload(j.path, j.fileName)),
    )
    fileJobs.forEach((j, i) => {
      const url = signed[i]
      if (url) fileUrls.set(j.path, url)
    })
  }

  const myCount = soloPosts.filter(
    (p) => p.author_email.toLowerCase() === viewer,
  ).length

  // 미제출 대조는 임원진 화면에서만. 명단 전체가 드러나기 때문이다.
  let missingMembers: string[] = []
  let missingTeams: string[] = []
  if (viewerIsExec && session.post_due) {
    if (wantsSolo) {
      const countByMember = new Map<string, number>()
      for (const p of soloPosts) {
        if (!p.member_id) continue
        countByMember.set(p.member_id, (countByMember.get(p.member_id) ?? 0) + 1)
      }
      const roster = await getRoster(session.cohort)
      missingMembers = roster
        .filter((m) => (countByMember.get(m.id) ?? 0) < session.post_quota)
        .map((m) => m.name)
    }
    if (wantsTeam) {
      const done = new Set(
        teamPosts.map((p) => p.team_label).filter((v): v is string => Boolean(v)),
      )
      missingTeams = session.post_teams.filter((t) => !done.has(t))
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

      {session.post_note && (
        <p className="mt-3 whitespace-pre-line font-display text-sm text-fg-subtle">
          {session.post_note}
        </p>
      )}

      {/* 컨벤션처럼 여러 건을 요구하는 회차에서 본인 진행률을 보여준다. */}
      {wantsSolo && session.post_quota > 1 && (
        <p className="mt-3 font-display text-sm text-fg-subtle">
          내 제출 {myCount}건 / 필요 {session.post_quota}건
          {myCount >= session.post_quota && ' (완료)'}
        </p>
      )}

      {closed ? (
        <p className="mt-6 border border-border px-5 py-4 font-display text-sm text-fg-muted">
          마감되었습니다. 늦은 제출이 필요하면 임원진에게 문의해주세요.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {wantsTeam && (
            <PostComposer
              sessionId={session.id}
              scope="team"
              teams={session.post_teams}
              label="조 제출"
              placeholder="책 내용 정리, 토론 정리를 적고 인증샷과 녹음본을 함께 올려주세요."
            />
          )}
          {wantsSolo && (
            <PostComposer
              sessionId={session.id}
              scope="individual"
              label={session.post_scope === 'both' ? '개인 제출' : '기록 남기기'}
              placeholder={
                session.post_scope === 'both'
                  ? '후기와 배운 점을 남겨주세요.'
                  : '소감문, 내용 정리, 사진 한 줄 설명 등 자유롭게 남겨주세요. (마크다운 지원)'
              }
            />
          )}
        </div>
      )}

      {session.post_scope === 'both' ? (
        <>
          <SubHeading text={`조 제출 · ${teamPosts.length}`} />
          <PostList
            posts={teamPosts}
            imageUrls={imageUrls}
            fileUrls={fileUrls}
            viewer={viewer}
            viewerIsExec={viewerIsExec}
            emptyText="아직 조 제출이 없습니다."
          />
          <SubHeading text={`개인 제출 · ${soloPosts.length}`} />
          <PostList
            posts={soloPosts}
            imageUrls={imageUrls}
            fileUrls={fileUrls}
            viewer={viewer}
            viewerIsExec={viewerIsExec}
            emptyText="아직 개인 제출이 없습니다."
          />
        </>
      ) : (
        <PostList
          posts={posts}
          imageUrls={imageUrls}
          fileUrls={fileUrls}
          viewer={viewer}
          viewerIsExec={viewerIsExec}
          emptyText="아직 기록이 없습니다. 첫 기록을 남겨보세요."
        />
      )}

      {viewerIsExec && session.post_due && (
        <div className="mt-8 grid grid-cols-1 gap-4">
          {wantsSolo && (
            <MissingBox
              label={`미제출 · ${missingMembers.length}`}
              names={missingMembers}
              doneText="전원 제출했습니다."
            />
          )}
          {wantsTeam && (
            <MissingBox
              label={`미제출 조 · ${missingTeams.length}`}
              names={missingTeams}
              doneText="모든 조가 제출했습니다."
            />
          )}
        </div>
      )}
    </section>
  )
}

function SubHeading({ text }: { text: string }) {
  return (
    <p
      translate="no"
      className="mt-10 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
    >
      {text}
    </p>
  )
}

function MissingBox({
  label,
  names,
  doneText,
}: {
  label: string
  names: string[]
  doneText: string
}) {
  return (
    <div className="border border-border p-5">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        {label}
      </p>
      <p className="mt-3 font-display text-sm text-fg-subtle">
        {names.length > 0 ? names.join(', ') : doneText}
      </p>
      <p className="mt-3 font-mono text-[10px] text-fg-muted">
        임원진에게만 보입니다
      </p>
    </div>
  )
}

function PostList({
  posts,
  imageUrls,
  fileUrls,
  viewer,
  viewerIsExec,
  emptyText,
}: {
  posts: SessionPost[]
  imageUrls: Map<string, string>
  fileUrls: Map<string, string>
  viewer: string
  viewerIsExec: boolean
  emptyText: string
}) {
  return (
    <ul className="mt-6 space-y-6">
      {posts.map((post) => {
        const mine = post.author_email.toLowerCase() === viewer
        return (
          <li key={post.id} className="border border-border p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-sm font-bold text-fg-primary">
                {post.author_name}
              </span>
              {post.team_label && (
                <span
                  translate="no"
                  className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle"
                >
                  {post.team_label}
                </span>
              )}
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

            {post.file_paths.length > 0 && (
              <ul className="mt-4 divide-y divide-border border border-border">
                {post.file_paths.map((path, i) => {
                  const name = post.file_names[i] ?? 'file'
                  const url = fileUrls.get(path)
                  const ext = fileExt(name)
                  return (
                    <li
                      key={path}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
                    >
                      <span
                        translate="no"
                        aria-hidden
                        className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted"
                      >
                        {ext || 'FILE'}
                      </span>
                      {url ? (
                        <a
                          href={url}
                          className="font-display text-sm text-fg-primary underline decoration-border underline-offset-4 hover:decoration-fg-primary"
                        >
                          {name}
                        </a>
                      ) : (
                        <span className="font-display text-sm text-fg-muted">
                          {name} (링크 발급 실패)
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
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
          {emptyText}
        </li>
      )}
    </ul>
  )
}
