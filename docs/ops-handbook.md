# VERY 웹 운영 핸드북 (44기 → 45기 인수인계 겸용)

작성 2026-08-04 · 기준 커밋 main. 시즌 운영자와 차기 인수자가 이 문서 하나로
전체 구조를 파악하는 것이 목적이다.

## 1. 계정 체계 (인수인계의 전부)

모든 인프라가 학회 계정으로 통일되어 있다. **45기 인수인계 = 학회 Gmail +
학회 GitHub 계정 인계로 끝난다.**

| 서비스 | 계정 | 역할 |
|---|---|---|
| Gmail | yonseivery1997@gmail.com | 마스터 키. 알림 수신, 각 서비스 로그인 |
| GitHub | yonseivery1997-cmyk (org YONSEIVERY) | 저장소 web, Vercel 연동 |
| Vercel | 학회 Gmail 가입 | 호스팅, 도메인 yonseivery.com(자동갱신 2027-05), 환경변수, 애널리틱스 |
| Supabase | 학회 GitHub OAuth | 프로젝트 very-yonseivery (서울 리전), DB·스토리지·인증 |
| Resend | 학회 Gmail 가입 | 메일 발송. yonseivery.com 도메인 인증됨, 발신 noreply@ |

- 어드민 화이트리스트: `admins` 테이블 (마이그레이션 0019 참고). 추가·제거는 Supabase SQL Editor.
- 배포: main 브랜치 push = 자동 배포. develop 브랜치는 폐기된 노션 시절 코드라 사용 금지.

## 2. 시즌 운영 절차 (반복 작업)

**모집 시즌 (매 학기 초)**
1. `recruit_rounds`에 새 라운드 삽입 (`is_current=true`, 마감 `apply_deadline` KST로), `site_config`의 cohort·semester 갱신, `lib/content/recruit.ts` 일정 카피 수정
2. 지원서 양식 파일 교체: `public/downloads/very44-application.docx` (파일명·다운로드명은 recruit.ts)
3. 접수 열기: /admin/recruit 토글. 마감은 apply_deadline이 자동 차단
4. 심사: 상태 저장 → "결과 통보" 버튼으로 서류·최종 단계별 일괄 발송 (0020의 발송 기록 컬럼이 중복 발송을 차단)
5. 합격자 확정 후: 어드민 학회원 메뉴에서 새 기수 명단 등록 (**이메일 필수**, 포털 로그인 자격). 등록 즉시 포털 멤버 디렉토리·자기소개 자동 오픈

**데모데이 시즌 (매 학기 말)**
- /admin/demoday에서 새 회차 생성 (is_current 이동), 참관 신청 토글. 행사일이 지나면 사이트가 자동으로 종료 상태(ENDED) 처리

**기수 전환 체크리스트**
- site_config 갱신, 신규 recruit_rounds, admins 화이트리스트 교체, 지원서 양식 교체, STATS.cohorts(lib/content/site.ts) 갱신, 데모데이 회차 생성

## 3. 데이터·보안 불변식 (건드리지 말 것)

- 모든 테이블 읽기·쓰기는 서버(service_role) 경유. **anon 정책을 새로 열지 않는다** (0018에서 PII 노출 통로를 전부 닫았음. 익명 REST로 이메일·전화가 노출된 사고 이력 있음)
- `applications`·`member_intros`·PII 테이블은 RLS 정책 0개(전면 차단)가 정상 상태
- `recruit-applications` 버킷은 private + 서명 URL만. 업로드는 서명 티켓(4.5MB 서버 한도 우회 설계)
- 지원서 자료는 모집 종료 후 1년 뒤 파기 (개인정보처리방침 /privacy에 공개된 약속. 매년 여름 정리)
- 개인정보 수집 항목·보유기간을 바꾸면 /privacy(lib/content/privacy.ts)와 각 폼 동의문을 함께 갱신

## 4. 메일

- 발신: noreply@yonseivery.com (Resend 도메인 인증, DNS는 Vercel에 등록됨)
- 운영진 알림(접수·문의·신청) → 학회 Gmail. 지원자 접수 확인·결과 통보 → 지원자에게 자동 발송
- 알림이 끊기면: Resend Domains 인증 상태 → Vercel 환경변수 RESEND_API_KEY 순으로 확인

## 4.5 백업 (pull 구조)

- 학회 계정의 Apps Script(트리거 매일)가 `/api/backup-recruit`(명단 엑셀)와
  `/api/backup-recruit/files`(첨부 서명 URL 목록)를 `CRON_SECRET` Bearer로
  호출해 드라이브 "VERY 지원자 백업" 폴더에 증분 저장한다
- 서버는 드라이브 자격증명을 갖지 않는다 (격리 원칙). 백업 실패 시 Apps
  Script가 학회 Gmail로 경고 메일을 보낸다
- 시크릿 교체 시 Vercel env와 Apps Script 상수를 함께 갱신할 것

## 5. 마이그레이션 이력 (운영 DB 적용 완료: 0001~0023)

핵심만: 0011 학회원 명단 / 0013 리크루팅 / 0014 학회원 포털 / 0016 첨부 확장 /
0017 자기소개 / 0018 RLS 하드닝 / 0019 어드민 화이트리스트 / 0020 결과 통보 기록 /
0021 portal_role 익명 실행권 회수 / 0022 is_admin 경화(search_path 고정 +
portal_role과 동일한 대소문자 무시 이메일 비교) / 0023 is_admin·portal_role
무인자 버전 추가(세션 이메일을 함수가 직접 읽어 임의 주소 조회를 차단).
새 마이그레이션은 파일 추가 후 Supabase SQL Editor에서 수동 실행한다.

**함수 권한을 다룰 때 주의**: Supabase는 public 스키마에 default privileges가
걸려 있어, 새로 만든 함수에 anon·authenticated·service_role 실행권이 자동으로
붙는다. `revoke all ... from public`은 PUBLIC 롤만 회수하므로 anon 직접 권한이
그대로 남는다. anon을 막으려면 `revoke execute ... from anon`을 따로 써야 한다
(0023 최초 적용 때 실제로 anon 호출이 통과했다).

## 6. 알려진 사항·백로그

- 자동화 브라우저에서 서버 액션 POST가 간헐 503 (실사용자 영향 보고 없음.
  이제 실패 시 recruit_submit_failed 이벤트가 stage와 함께 남으므로,
  Vercel Analytics에서 ticket·submit 단계 실패가 잡히면 실사용자 영향으로 판정)
- 인자 있는 is_admin(text)·portal_role(text)이 아직 남아 있다. 0023이 무인자
  버전을 올리고 호출부 4곳(미들웨어 2곳, getPortalIdentity, requireAdmin)을
  그쪽으로 옮겼으므로, 배포가 정상 동작하는 것을 확인한 뒤 0024로 인자 버전을
  드롭하면 끝난다. 드롭 전까지는 authenticated가 임의 이메일로 조회할 수 있는
  상태가 유지된다. 순서를 뒤집으면(드롭 먼저) 배포 사이에 어드민·포털이 잠긴다.
  참고: advisor의 "Signed-In Users Can Execute SECURITY DEFINER Function" WARN은
  드롭 후에도 남는다. 이 lint는 authenticated가 SECURITY DEFINER 함수를 실행할 수
  있다는 사실 자체를 지적하는데, 두 함수는 미들웨어가 로그인 세션으로 호출해야 해서
  의도된 설계다. 0023이 닫는 것은 advisor 점수가 아니라 남의 주소 조회 가능성이다
- Auth 유출 비밀번호 보호 비활성 (advisor WARN). 로그인은 Google OAuth 전용이라
  실효가 낮다. 콘솔에서 Email provider가 꺼져 있는지만 확인하면 충분
- 상단 탭 구조 재논의 (착수 시점 제약 없음, 대표 결정 사항)
- 개강 후: 소모임·조별 과제 구조는 수요 확인 후 결정

해소된 항목: portal_role 익명 호출은 0021로 차단(2026-08-08). /recruit 본문
중앙 정렬은 같은 날 반영. is_admin search_path는 0022로 고정(2026-08-08).
