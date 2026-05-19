# VERY 웹사이트 — 진행 상황 (2026-05-19 기준)

> 임원진 검수 피드백을 받기 전 컨텍스트 휘발 방지용 스냅샷.
> 페이지/구조/디자인 시스템·미해결 사항·작업 흐름을 한 장으로 정리.

## 1. 배포된 라우트 (7개)

| Path | 상태 | 섹션 구조 |
| --- | --- | --- |
| `/` | live | Hero · Manifesto · STATS (By The Numbers) · Footer |
| `/about` | live | Hero("졸업하지 않는다, 누적될 뿐이다") · Origin(Since 1997) · WhatWeDo(SESSIONS/DEMODAY/ALUMNI/PARTNERS) · Leadership(43기 회장단) · Closing |
| `/curriculum` | live | Hero("한 학기, 한 권의 잡지") · Format(12주·3시간·4단계) · Phases(Onboarding→Domain Research→Idea Sprint→Demoday Prep) · Workshops · Closing |
| `/demoday` | live | Hero("학기 끝, 그리고 표지") · About · Format(1일·10팀+·3막) · Volumes(Vol.43 UPCOMING / 42·41 CLOSED) · Audience(Alumni/Investors/Faculty) · Closing |
| `/alumni` | live | Hero("졸업은 끝이 아니라, 다음 권의 시작") · Network · Stats · Spotlight(TBA placeholders) · Pathways(MENTORSHIP/FOLLOW-ON/CAPITAL) · Closing |
| `/partners` | live | Hero("책장 바깥에서, 같이 들고 가는 손") · Why · Categories(CORPORATE/CAPITAL/ACADEMIC) · Roster(TBA) · Engage(BRIEF/PROGRAM/STAGE) · Closing |
| `/contact` | live | Hero("편지의 받는 사람") · "폼은 두지 않습니다" 안내 · Channels(EMAIL/INSTAGRAM/RECRUIT) · Tracks(RECRUIT/PARTNERSHIP/PRESS) · FAQ(`<details>` 3개) · Closing |

## 2. 글로벌 컴포넌트

- **`SiteNav`** (`components/site/site-nav.tsx`) — fixed top, RSC 쉘. 좌측 `brand/very-mark.png` 로고 (h-6/md:h-7). 우측 6-link mono caps. 모바일은 `<details>/<summary>` 토글.
- **`SiteNavLinks`** (`components/site/site-nav-links.tsx`) — client island. `usePathname` + `aria-current="page"` + 색 플립으로 active 표시. 모바일 링크 클릭 시 부모 `<details>.open=false`.
- **`SiteFooter`** (`components/site/site-footer.tsx`) — magazine colophon. masthead(로고 + slogan + VOL.43/2026—1) + EXPLORE/CONTACT/VISIT 3 컬럼 (4-2-3-3 그리드) + 하단 © + Yonsei attribution. VISIT 주소: 연세대학교 신촌캠퍼스 / 제1공학관 A119호.
- **`NoiseLayer`** — 전역 노이즈 텍스처 오버레이.

## 3. 컨텐츠 트리 (편집 단일 진입점)

```
lib/content/
├── site.ts        # SITE(name, since, email, instagram, currentCohort) · STATS
├── nav.ts         # NAV_ITEMS (6개, monoLabel 포함)
├── manifesto.ts   # 홈 manifesto 텍스트
├── about.ts
├── curriculum.ts
├── demoday.ts
├── alumni.ts
├── partners.ts
└── contact.ts
```

각 페이지(`app/(marketing)/*/page.tsx`)는 컨텐츠 트리를 import하는 얇은 마크업 레이어. 카피 수정은 `lib/content/*.ts` 한 곳에서만.

## 4. 디자인 시스템 · 모션

- **Tailwind v4 토큰** (`@theme`, `app/globals.css`)
  - `bg-base`, `fg-primary/subtle/muted`, `border`, `border-strong`, `accent`
  - `font-display` (제목), `font-mono` (eyebrow/라벨)
- **모션 namespace** (모두 CSS-only, `prefers-reduced-motion: no-preference` 가드)
  - `.about-anim-*` — 페이지 hero/section 스태거 (about/curriculum/demoday/alumni/partners/contact 공용)
  - `.stats-anim-*` — 홈 STATS 밴드
  - `.site-nav-bg` — scroll-driven 배경 페이드인 (hero 이후)
- **공통 섹션 리듬** — `grid-cols-12 gap-x-8 md:gap-x-12 px-6 md:px-10 py-24 md:py-32`. 좌측 라벨(col-span-3) + 우측 컨텐츠(col-start-5 col-span-8).

## 5. 기술 스택

- Next.js 16.2.6 (App Router, Turbopack, typedRoutes)
- React 19.2.4
- TypeScript strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- Tailwind CSS v4 (`@theme` 토큰)
- Vercel: develop = preview, main = production. develop push → 자동 preview; main fast-forward push → 자동 production.

## 6. 미해결 사항 (검수 피드백 받으면 같이 처리)

- **임원진 검수 대기** — 컨텐츠/구성 수정 항목 일괄 수합 예정.
- **알럼나이 스타트업 로스터** — Notion DB 연동 미정. 현재 spotlight 4-카드 TBA placeholder.
- **파트너 로스터** — 학기 중반 공식 공지 시점에 갱신. 현재 6행 TBA + 연세대학교 placeholder.
- **데모데이 Vol.41/42 정식 리캡** — 향후 아카이브 페이지로.
- **/curriculum 12주·3시간·4단계 수치** — 실제 학회 기준치 확인 필요.
- **사이트 메타 자산** — `opengraph-image.tsx`, `icon.tsx`, `robots.ts`, `sitemap.ts` 아직 안 만듦.
- **커스텀 `/not-found`** — Next.js 기본 404 사용 중.

## 7. 최근 커밋 흐름

```
3f50949 chore(brand): swap nav + footer wordmark for very-mark logo; fix visit address
2232af8 refactor(nav): split link list into client island for active + auto-close
578f1eb feat(contact): add /contact page
b3c7e96 feat(partners): add /partners page
98b10f2 feat(alumni): add /alumni page
530579c feat(demoday): add /demoday semester finale page
414f813 feat(curriculum): add /curriculum semester program page
6ad0f4c feat(about): add /about society profile page
7e4169f feat(home): add By The Numbers stats band
f656ec3 feat(footer): add magazine colophon footer
cc99252 feat(nav): add global site nav across the 8-page IA
```

## 8. 배포 흐름 메모

```bash
# 1) 작업
npm run build           # 통과 확인
git add <files>
git commit -m "..."

# 2) preview 배포
git push origin develop

# 3) production fast-forward
git checkout main
git merge --ff-only develop
git push origin main
git checkout develop
```

## 9. 결정한 톤·원칙 메모

- **잡지 메타포** — 학기 = 한 권의 잡지, 데모데이 = 표지, 알럼나이 = 누적된 책장.
- **누적성 강조** — "졸업하지 않는다, 누적될 뿐이다" 헤드라인. STATS에 yearsActive/cohorts/alumniCount/startupsCount.
- **정직한 placeholder** — 미정 데이터는 TBA + "노션 DB 연동 시 자동 갱신" 안내. 폼 대신 실제 채널만.
- **RSC 우선** — 클라이언트 컴포넌트는 꼭 필요한 island(nav active state)만.
- **CSS-only 모션** — JS 없이 scroll-driven + reveal, `prefers-reduced-motion` 가드.
