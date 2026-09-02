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
   - **첫 통보 전에 리허설을 한 번 돌릴 것.** 운영진 본인 이메일로 지원서를 1건 제출하고, 어드민에서 그 건만 합격으로 바꾼 뒤 "결과 통보"를 눌러 메일 도착과 발송 기록을 확인하고, 끝나면 어드민 삭제 버튼으로 그 행을 지운다 (SQL로 지우면 스토리지 첨부가 남는다). 메일은 되돌릴 수 없는데 이 경로는 시즌에 두 번밖에 쓰지 않아, 실전이 첫 실행이 되기 쉽다
   - 심사 전 지원자는 status가 submitted라 발송 대상에서 빠진다. 리허설 전에 합불 상태인 실제 지원자가 없는지만 확인하면 메일이 섞일 일은 없다 (2026-08-09 리허설로 검증: 테스트 1건에만 기록이 찍히고 submitted 지원자는 그대로, 재클릭 대상은 0건)
5. 최종 통보 후: 등록 회신을 받는 대로 어드민 리크루팅 목록에서 지원자별로 회신 없음 · 최종등록 · 최종미등록을 표시한다. 심사 결과(status)와 분리된 `applications.registration` 컬럼이다(0028). **이 표시를 끝낸 뒤에 6번을 누른다.** 일괄 등록은 최종등록만 명부에 넣으므로, 등록을 포기한 사람은 최종미등록으로 두면 다시 눌러도 되살아나지 않는다 (합불 상태는 심사 기록이니 되돌리지 않는다)
6. 합격자 확정 후: 어드민 학회원 메뉴에서 새 기수 명단 등록 (**이메일 필수**, 포털 로그인 자격). 등록 즉시 포털 멤버 디렉토리·자기소개 자동 오픈

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

**이 프로젝트는 Supabase Free 플랜이라 플랫폼 자동 백업이 없다.** 일 1회 자동
백업은 Pro 이상이고, 공식 문서도 Free 프로젝트는 직접 export해 외부에 보관하라고
안내한다. 아래 드라이브 백업이 사고 시 되돌릴 수 있는 유일한 지점이다.

학회 계정의 Apps Script(트리거 매일)가 아래 넷을 `CRON_SECRET` Bearer로 호출해
드라이브에 증분 저장한다. 서버는 드라이브 자격증명을 갖지 않는다 (격리 원칙).

| 엔드포인트 | 내용 | 저장 폴더 |
|---|---|---|
| `/api/backup-recruit` | 지원자 명단 엑셀 (사람이 읽는 용도) | VERY 지원자 백업 |
| `/api/backup-recruit/files` | 지원서 첨부 서명 URL 목록 | VERY 지원자 백업 |
| `/api/backup-portal` | **전 테이블 JSON 덤프 (복원용)** | VERY 포털 백업 |
| `/api/backup-portal/files` | 세션 기록 사진 서명 URL + 공개 자산 URL | VERY 포털 백업 |

- 백업 실패 시 Apps Script가 학회 Gmail로 경고 메일을 보낸다
- `/api/backup-portal` 응답 헤더 `x-total-rows`, `x-table-count`, `x-failed-count`로
  본문을 파싱하지 않고 이상을 감지할 수 있다. **`x-failed-count`가 0이 아니거나
  `x-total-rows`가 전날보다 크게 줄면 경고를 보내도록 Apps Script에 조건을 둘 것**
- 백업 대상 테이블은 `lib/portal/backup.ts`의 `BACKUP_TABLES`다. 새 테이블을
  만들고 여기에 넣지 않으면 조용히 백업에서 빠지므로,
  `scripts/check-backup-tables.mjs`가 빌드에서 마이그레이션과 대조해 막는다
- 시크릿 교체 시 Vercel env와 Apps Script 상수를 함께 갱신할 것
- 매일 도는 이 호출은 Free 플랜의 7일 무활동 일시정지도 함께 막는다.
  방학 중 포털 접속이 끊겨도 프로젝트가 멈추지 않는다

**점검 주기**: 매달 1일, 드라이브 폴더의 최신 파일 날짜가 어제인지 확인한다.
백업은 조용히 죽는다. 확인하지 않으면 필요할 때 비어 있다.

포털 백업 Apps Script 코드와 설치 절차는 `docs/apps-script-backup.md`에 있다.

## 4.6 위험 작업 절차 (DB를 직접 만질 때)

운영 중 보수·개선은 계속 하되, 아래는 예외 없이 지킨다. 2026-08-09의 지원서
소실 의심은 테스트 건이었던 것으로 종결됐지만, 그 판정에 3주가 걸렸고 근거는
사람의 기억뿐이었다. 기록이 있었다면 당일에 끝났을 일이다.

1. **영향 범위를 먼저 센다.** DELETE·UPDATE를 실행하기 전에 같은 `where`로
   `select count(*)`를 돌려 몇 행이 걸리는지 확인한다. 예상과 다르면 멈춘다
2. **트랜잭션으로 감싼다.** `begin;` 실행 후 결과를 확인하고 `commit;`.
   이상하면 `rollback;`. SQL Editor는 자동 커밋이므로 이 습관이 유일한 방어다
3. **스키마를 바꾸기 전에 백업을 한 번 당긴다.** `/api/backup-portal`을 수동
   호출해 그 시점 덤프를 드라이브에 남긴 뒤 마이그레이션을 실행한다
4. **마이그레이션은 파일로 남긴다.** SQL Editor에 즉석으로 친 문장은 이력이
   없다. `supabase/migrations/`에 번호를 붙여 커밋한 뒤 그 파일을 실행한다
5. **삭제는 마지막 수단이다.** 세션은 `is_published=false` 아카이브,
   학회원은 명단 이관으로 대부분 해결된다

0025 이후 출결·기록이 딸린 세션과 학회원은 삭제 자체가 막힌다(RESTRICT).
0026 이후 모든 삭제는 `audit_log`에 원본 행째로 남고 TRUNCATE는 차단된다.
누가 지웠는지 확인하려면:

```sql
select occurred_at, table_name, actor, actor_role, old_row
from audit_log order by occurred_at desc limit 50;
```

`actor_role`이 `service_role`이면 웹 화면 경유, `direct`이면 대시보드 수동 SQL이다.

## 5. 마이그레이션 이력 (운영 DB 적용 완료: 0001~0031. 다음 번호는 0032부터)

핵심만: 0011 학회원 명단 / 0013 리크루팅 / 0014 학회원 포털 / 0016 첨부 확장 /
0017 자기소개 / 0018 RLS 하드닝 / 0019 어드민 화이트리스트 / 0020 결과 통보 기록 /
0021 portal_role 익명 실행권 회수 / 0022 is_admin 경화(search_path 고정 +
portal_role과 동일한 대소문자 무시 이메일 비교) / 0023 is_admin·portal_role
무인자 버전 추가(세션 이메일을 함수가 직접 읽어 임의 주소 조회를 차단) /
0024 인자 있는 두 함수 드롭 / **0025 연쇄 삭제 차단(출결·기록·지원서를 딸린
세션·학회원·라운드와 함께 지우지 못하게 RESTRICT로 전환)** / **0026 삭제 감사
기록과 TRUNCATE 차단** / **0027 학회원 자율 등록 신청 대기열(member_signups,
정책 0개 · 기수당 이메일 1회 · 0026 트리거 부착)** / **0028 등록 회신 분리
(applications.registration = pending/registered/declined. 심사 결과인 status와
지원자 회신을 두 축으로 나눠, 합격 후 등록 포기자가 일괄 등록으로 되살아나지
않게 한다)** / **0029 member_signups 생년월일(birth)** / **0030 자기소개 구조화
(member_intros에 대표사진·MBTI·잘하는 것·좋아하는 것·TMI·포트폴리오,
body_md는 폴백으로 유지)** / **0031 자기소개 댓글(intro_comments, 정책 0개 ·
0026 트리거 부착 · 백업 목록 등록)**.
새 마이그레이션은 파일 추가 후 Supabase SQL Editor에서 수동 실행한다.
**어느 세션이 만들든 다음 번호는 0032부터다** (Operator 인계분 포함. 0029~0031은
2026-09-02에 Builder가 사용했다).

**0025·0026 적용 순서**: 0025 먼저, 0026 다음. 각각 `begin;`으로 감싸고 끝의
`select ... as result`가 기대한 문자열을 돌려주는지 확인한 뒤 `commit;` 한다.
0025 적용 후 `deleteSession`과 학회원 삭제가 딸린 데이터가 있으면 실패하게
되는데, 이는 의도한 동작이다.

**0027은 0026 다음**: 0027이 0026의 `log_row_delete()`·`block_truncate()`를
재사용하므로, 0026 없이 실행하면 트리거 생성 단계에서 멈춘다(안전한 실패다).
끝의 결과가 `MEMBER_SIGNUPS_INSTALLED` · `policies = 0` · `guards = 2`인지
확인한 뒤 `commit;` 한다. `policies`가 0이 아니면 신청자 이름·이메일·전화번호가
익명 REST로 열린 상태이므로 즉시 `rollback;` 한다.
(2026-09-02 카탈로그 조회로 적용 확인: member_signups 존재 · policies 0 · guards 2)

**0028은 단독 실행**: 0027과 의존 관계가 없다. `begin;`으로 감싸고 끝의 결과가
`REGISTRATION_INSTALLED` · `cohort = 44` · `registered = 22` · `declined = 2` ·
`pending = 12`인지 확인한 뒤 `commit;` 한다. registered와 declined가 둘 다 0이면
백필이 걸리지 않은 것이므로(기수 불일치 등) `rollback;` 한다. 이 기대값은
같은 판정식을 SELECT로 미리 돌려 얻은 2026-09-02 실측치다. 그 사이 심사 상태나
명단이 바뀌었다면 숫자 자체보다 세 값의 합이 44기 라운드 지원서 수(당시 36)와
맞는지로 판정한다.

**백필은 한 번만 유효하다.** registration이 하나라도 기본값(pending)이 아니면
마이그레이션이 백필 블록을 통째로 건너뛴다. 사람이 어드민에서 고쳐 놓은 회신
값을 재실행이 덮어쓰지 않게 하려는 것이다. 따라서 적용 후 회신 표시를 바로잡는
일은 SQL이 아니라 어드민 화면에서 한다.
(0028은 2026-09-02 적용 완료: registered 22 · declined 2 · pending 12 확인.
0029~0031도 같은 날 적용 완료: birth_column 1 · new_columns 6 ·
intro_comments policies 0 · guards 2 확인)

**적용 후 검증 (읽기 전용, 개인정보 조회 없음)**

세 쿼리 모두 기대값과 일치해야 한다. 하나라도 어긋나면 적용이 덜 된 것이다.

```sql
-- 1) 연쇄 삭제가 실제로 막혔는가. 4행 전부 RESTRICT여야 한다
select tc.table_name, kcu.column_name, rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.constraint_name in (
    'attendance_session_id_fkey', 'attendance_member_id_fkey',
    'session_posts_session_id_fkey', 'applications_round_id_fkey');

-- 2) 감사 트리거가 붙었는가. audit_delete 11, no_truncate 11이어야 한다.
--    information_schema.triggers를 쓰지 말 것. 그 뷰는 TRUNCATE 트리거를
--    표시하지 않아 no_truncate가 통째로 빠지고, 22가 아니라 11이 나온다.
--    적용이 덜 된 것으로 오판하기 쉽다. pg_trigger를 직접 본다.
select t.tgname, count(*) as n
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and t.tgname in ('audit_delete', 'no_truncate')
group by t.tgname order by t.tgname;

-- 3) audit_log가 전면 차단인가. rls=true, policies=0이어야 한다
select c.relrowsecurity as rls,
       (select count(*) from pg_policies where tablename = 'audit_log') as policies
from pg_class c where c.relname = 'audit_log';
```

**실전 삭제로 시험하지 말 것.** "출결이 있는 세션을 지워 보고 오류가 나는지"
같은 확인은 하지 않는다. 0025가 적용됐다면 막히지만, **적용되지 않았다면 그
시험이 곧 사고다.** 트랜잭션으로 감싸도 롤백을 빠뜨리면 끝이다. 위 카탈로그
조회로 충분하다.

**함수 권한을 다룰 때 주의**: Supabase는 public 스키마에 default privileges가
걸려 있어, 새로 만든 함수에 anon·authenticated·service_role 실행권이 자동으로
붙는다. `revoke all ... from public`은 PUBLIC 롤만 회수하므로 anon 직접 권한이
그대로 남는다. anon을 막으려면 `revoke execute ... from anon`을 따로 써야 한다
(0023 최초 적용 때 실제로 anon 호출이 통과했다).

## 6. 알려진 사항·백로그

- 자동화 브라우저에서 서버 액션 POST가 간헐 503 (실사용자 영향 보고 없음.
  이제 실패 시 recruit_submit_failed 이벤트가 stage와 함께 남으므로,
  Vercel Analytics에서 ticket·submit 단계 실패가 잡히면 실사용자 영향으로 판정)
- advisor의 "Signed-In Users Can Execute SECURITY DEFINER Function" WARN 2건은
  앞으로도 남는다 (is_admin, portal_role). 이 lint는 authenticated가 SECURITY
  DEFINER 함수를 실행할 수 있다는 사실 자체를 지적하는데, 두 함수는 미들웨어가
  로그인 세션으로 호출해야 하므로 의도된 설계다. 조치 불필요
- Auth 유출 비밀번호 보호 비활성 (advisor WARN). 로그인은 Google OAuth 전용이라
  실효가 낮다. 콘솔에서 Email provider가 꺼져 있는지만 확인하면 충분
- 상단 탭 구조 재논의 (착수 시점 제약 없음, 대표 결정 사항)
- 개강 후: 소모임·조별 과제 구조는 수요 확인 후 결정

해소된 항목: portal_role 익명 호출은 0021로 차단(2026-08-08). /recruit 본문
중앙 정렬은 같은 날 반영. is_admin search_path는 0022로 고정(2026-08-08).
임의 이메일로 운영진·학회원 여부를 조회하던 경로는 0023(무인자 전환)과
0024(인자 버전 드롭)로 차단(2026-08-09). 결과 통보 전 구간은 같은 날
리허설로 검증했다.
