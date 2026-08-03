import Image from 'next/image'
import { HOME_PHOTOS, type PhotoSlot } from '@/lib/content/photos'

/**
 * Photo Band. 매니페스토와 스탯 사이에서 텍스트의 흐름을 끊는
 * 풀블리드 사진 스트립. 비대칭 2:1 그리드(메인 와이드 + 세로 2단).
 *
 * 사진이 아직 없으면 슬롯별 자리 표시 패널을 렌더링한다.
 * lib/content/photos.ts에서 src만 채우면 교체된다.
 */
export function PhotoBand() {
  const { caption, slots } = HOME_PHOTOS
  const [main, top, bottom] = slots

  return (
    <section aria-label="활동 사진" className="px-6 pb-32 md:px-10 md:pb-40">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-2 md:gap-4">
        <div className="md:col-span-2 md:row-span-2">
          <PhotoCell slot={main} ratio="aspect-[16/10]" mdRatio="md:aspect-auto md:h-full" priorityHint />
        </div>
        <PhotoCell slot={top} ratio="aspect-[4/3]" />
        <PhotoCell slot={bottom} ratio="aspect-[4/3]" />
      </div>
      <p className="mt-4 font-display text-sm text-fg-muted">{caption}</p>
    </section>
  )
}

function PhotoCell({
  slot,
  ratio,
  mdRatio = '',
  priorityHint = false,
}: {
  slot: PhotoSlot
  ratio: string
  mdRatio?: string
  priorityHint?: boolean
}) {
  if (slot.src) {
    return (
      <figure className={`relative overflow-hidden ${ratio} ${mdRatio}`}>
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          priority={priorityHint}
          className="object-cover"
        />
      </figure>
    )
  }
  // 자리 표시: 사진 교체 전까지 의도된 빈 패널로 보이게 한다.
  return (
    <div
      className={`relative flex items-end overflow-hidden border border-border bg-bg-elev p-5 ${ratio} ${mdRatio}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(135deg, transparent 0 14px, var(--color-border) 14px 15px)',
          opacity: 0.35,
        }}
      />
      <span className="relative font-display text-xs text-fg-muted">
        {slot.label}
      </span>
    </div>
  )
}
