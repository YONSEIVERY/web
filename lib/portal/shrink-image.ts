/**
 * 사진을 브라우저에서 줄여 WebP로 바꾼다 (portal-photos 업로드 전용).
 *
 * 원본(폰 사진 장당 1~5MB)을 그대로 올리면 화면에 띄울 때마다 원본이
 * 내려간다. 2026-09 디렉토리 페이지 하나가 대표사진 32장, 41MB를 받아
 * Supabase Free 이그레스(월 5GB)를 18GB까지 넘겼다. Free에는 이미지
 * 변환 기능이 없으므로 줄이는 일은 올리는 쪽에서 한다.
 *
 * GIF는 움직임이 깨지므로 그대로 둔다. 디코딩이나 인코딩에 실패하거나
 * 결과가 원본보다 크면 원본을 돌려준다. 업로드가 막히는 것보다 낫다.
 * WebP 인코딩을 못 하는 브라우저는 JPEG로 내려간다.
 */
export async function shrinkImage(file: File, maxEdge: number): Promise<File> {
  if (file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // JPEG로 내려갈 때 투명 영역이 검게 나오지 않게 흰 바탕을 깐다
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    for (const type of ['image/webp', 'image/jpeg']) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, 0.82),
      )
      // 인코딩을 못 하는 형식이면 toBlob이 PNG를 돌려준다
      if (!blob || blob.type !== type) continue
      if (blob.size >= file.size) return file
      const ext = type === 'image/webp' ? 'webp' : 'jpg'
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${ext}`, {
        type,
      })
    }
    return file
  } catch {
    return file
  }
}
