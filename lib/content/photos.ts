/**
 * 홈 포토 밴드 슬롯.
 *
 * 실사진이 준비되면 `/public/photos/`에 파일을 넣고 src만 채우면 된다.
 * src가 null이면 자리 표시 패널이 대신 렌더링된다 (의도된 빈 자리로 보이게).
 *
 * 권장 스펙: 가로 사진, 긴 변 2000px 이상, jpg. 인물 중심.
 */
export type PhotoSlot = {
  /** `/photos/....jpg` 또는 null(미배치) */
  src: string | null
  alt: string
  /** 자리 표시 패널에 보여줄 슬롯 설명 */
  label: string
}

export const HOME_PHOTOS: {
  caption: string
  slots: readonly [PhotoSlot, PhotoSlot, PhotoSlot]
} = {
  caption: '43기 데모데이 VERIFY, 그리고 한 학기의 현장.',
  slots: [
    {
      src: '/photos/vol43-demoday.jpg',
      alt: '43기 데모데이 VERIFY를 마친 학회원 단체 사진',
      label: '데모데이 무대 (가로, 메인)',
    },
    {
      src: '/photos/vol43-session.jpg',
      alt: '43기 오리엔테이션에서 발표 중인 세션 현장',
      label: '세션 현장',
    },
    {
      src: '/photos/vol43-team.jpg',
      alt: '세션을 마치고 화이팅 포즈를 한 43기 학회원들',
      label: '단체 사진',
    },
  ],
} as const
