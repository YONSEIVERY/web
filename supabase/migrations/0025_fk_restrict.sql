-- ============================================================
-- 0025: 연쇄 삭제(CASCADE)를 차단(RESTRICT)으로
--
-- 문제
--   지금은 한 행을 지우면 연쇄로 번진다. 대시보드 테이블 편집기의
--   휴지통 한 번이 아래를 통째로 지운다.
--     recruit_rounds 1행 -> 지원서 전부
--     club_sessions  1행 -> 그 세션의 출결 전부 + 학회원이 쓴 기록 전부
--     cohort_members 1행 -> 그 사람의 출결 전 학기 + 자기소개
--   출결은 회칙상 제명 판정(환산 결석 3회)의 근거 데이터이고, 세션 기록은
--   학회원이 직접 쓴 글과 사진이라 재생성이 불가능하다.
--
--   이 프로젝트는 Supabase Free 플랜이라 플랫폼 자동 백업이 없다.
--   즉 연쇄 삭제가 한 번 일어나면 되돌릴 수단이 사실상 없다.
--   운영 중에도 웹·서버 보수를 계속하는 이상, 사고 확률이 아니라
--   사고가 났을 때의 크기를 줄여 두는 편이 맞다.
--
-- 조치
--   손실이 크고 복구가 불가능한 네 경로를 RESTRICT로 바꾼다.
--   조용한 참사가 오류 메시지로 바뀐다. 정말 지워야 한다면 딸린
--   데이터를 먼저 명시적으로 처리해야 하고, 그 과정에서 사람이
--   무엇을 지우는지 알게 된다.
--
-- 바꾸지 않는 것
--   session_posts.member_id, alumni_companies.founder_alumni_id는
--   이미 SET NULL이라 본문이 남는다. 손실이 없으므로 그대로 둔다.
--   demoday_attendees.event_id는 행사 신청자 명단이라 성격이 다르고
--   행사 삭제가 정상 운영 흐름이므로 CASCADE를 유지한다.
--   member_intros.member_id도 유지한다. attendance가 막아 주는 이상
--   출결이 있는 학회원은 애초에 삭제되지 않는다.
--
-- 애플리케이션 영향
--   출결이나 기록이 딸린 세션·학회원 삭제가 이제 실패한다. 의도한
--   동작이다. 다만 오류 문구가 Postgres 원문(23503)으로 나가므로
--   호출부에서 사람이 읽을 수 있는 문장으로 옮겨야 한다.
--   대상: app/admin/actions/cohort-members.ts, app/members/actions/portal.ts
-- ============================================================

alter table public.attendance
  drop constraint attendance_session_id_fkey,
  add constraint attendance_session_id_fkey
    foreign key (session_id) references public.club_sessions(id)
    on delete restrict;

alter table public.attendance
  drop constraint attendance_member_id_fkey,
  add constraint attendance_member_id_fkey
    foreign key (member_id) references public.cohort_members(id)
    on delete restrict;

alter table public.session_posts
  drop constraint session_posts_session_id_fkey,
  add constraint session_posts_session_id_fkey
    foreign key (session_id) references public.club_sessions(id)
    on delete restrict;

alter table public.applications
  drop constraint applications_round_id_fkey,
  add constraint applications_round_id_fkey
    foreign key (round_id) references public.recruit_rounds(id)
    on delete restrict;

select 'FK_RESTRICT_APPLIED' as result;
