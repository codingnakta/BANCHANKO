-- ============================================================
-- 학생 명단에 연락처를 더한다
--
-- 학생 정보 등록 페이지가 학번/이름/전화번호/학부모 전화번호를 받는다.
-- 연락처는 개인정보라 기존 roster_teacher_all 정책 그대로 해당 학급
-- 교사만 읽고 쓸 수 있다. 학생 본인도 직접 읽지 않는다
-- (claim_my_seat() 은 좌석 배정에만 쓰이고 연락처를 돌려주지 않는다).
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

alter table public.classroom_roster
  add column if not exists phone        text,
  add column if not exists parent_phone text;

comment on column public.classroom_roster.phone is '학생 전화번호 (교사만 열람)';
comment on column public.classroom_roster.parent_phone is '학부모 전화번호 (교사만 열람)';
