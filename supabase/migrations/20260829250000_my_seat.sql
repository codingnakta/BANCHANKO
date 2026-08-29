-- ============================================================
-- 내 자리 — 학생이 자기 명단 정보를 볼 수 있게
--
-- 화면에는 구글 계정 이름이 아니라 선생님이 명단에 적은 학번·이름이
-- 떠야 한다. 그런데 classroom_roster 는 반 전체의 이메일·연락처가 있어
-- 교사만 읽는다. 자기 줄의 학번·이름만 내주는 뷰를 따로 둔다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

drop view if exists public.my_seat;

create view public.my_seat
with (security_invoker = off) as
select
  r.classroom_id,
  r.student_no,
  r.student_name,
  r.class_role
from public.classroom_roster r
where r.claimed_by = auth.uid();

comment on view public.my_seat is
  '로그인한 학생 자기 명단 한 줄. 학번·이름·1인1역만 내주고 이메일·연락처는 뺀다.';

grant select on public.my_seat to authenticated;
