import { getMaterialsForSession } from '@/lib/portal/queries'
import { signDownload } from '@/lib/portal/file-upload'
import { fileExt, formatFileSize } from '@/lib/portal/files'
import { DeleteButton } from '@/components/admin/delete-button'

/**
 * 세션 자료 목록 (RSC). 버킷이 private라 항목마다 서명 URL을 발급한다.
 * 복수 발급(createSignedUrls)은 파일명을 하나만 실을 수 있어 쓰지 않는다.
 * UUID 경로로 저장되므로 파일명을 못 실으면 알아볼 수 없는 이름으로
 * 저장된다. 세션당 20개 상한이라 병렬 발급으로 충분하다.
 *
 * manage=true면 편집 화면. 삭제 버튼이 붙고, 비어 있어도 자리를 지킨다.
 */
export async function SessionMaterials({
  sessionId,
  manage = false,
}: {
  sessionId: string
  manage?: boolean
}) {
  const materials = await getMaterialsForSession(sessionId)
  if (materials.length === 0 && !manage) return null

  const urls = await Promise.all(
    materials.map((m) => signDownload(m.file_path, m.file_name)),
  )

  return (
    <section className={manage ? '' : 'mt-10 border-t border-border pt-8'}>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted"
      >
        MATERIALS · {materials.length}
      </p>
      <h2 className="mt-3 font-display text-lg font-bold tracking-tight text-fg-primary md:text-xl">
        세션 자료
      </h2>

      <ul className="mt-5 divide-y divide-border border border-border">
        {materials.map((m, i) => {
          const url = urls[i]
          const ext = fileExt(m.file_name)
          const size = formatFileSize(m.file_size)
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
            >
              <span
                translate="no"
                aria-hidden
                className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted"
              >
                {ext || 'FILE'}
              </span>
              <span className="min-w-0 flex-1">
                {url ? (
                  <a
                    href={url}
                    className="font-display text-sm text-fg-primary underline decoration-border underline-offset-4 hover:decoration-fg-primary"
                  >
                    {m.label || m.file_name}
                  </a>
                ) : (
                  <span className="font-display text-sm text-fg-muted">
                    {m.label || m.file_name} (링크 발급 실패)
                  </span>
                )}
                {m.label && (
                  <span className="ml-2 font-mono text-[10px] text-fg-muted">
                    {m.file_name}
                  </span>
                )}
              </span>
              {size && (
                <span className="font-mono text-[10px] text-fg-muted">
                  {size}
                </span>
              )}
              {manage && (
                <DeleteButton
                  kind="session_material"
                  id={m.id}
                  label={m.label || m.file_name}
                />
              )}
            </li>
          )
        })}
        {materials.length === 0 && (
          <li className="px-5 py-8 text-center font-display text-sm text-fg-muted">
            아직 올린 자료가 없습니다.
          </li>
        )}
      </ul>
    </section>
  )
}
