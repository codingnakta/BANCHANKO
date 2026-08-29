-- ============================================================
-- 1인1역을 명단(classroom_roster)으로 옮기고, 과제 작성 권한과 분리한다
--
-- 전에는 classroom_members.helper_subject 하나가 두 가지를 겸했다.
--   1) 우리반 화면에 보여줄 1인1역
--   2) 그 과목 과제를 학생이 직접 등록할 수 있는 권한 (posts_insert)
-- 그래서 (가) 구글 로그인을 마친 학생에게만 역할을 줄 수 있었고,
-- (나) 역할 이름이 곧 권한이 되어 버렸다.
--
-- 이제 역할은 명단 한 줄의 속성(classroom_roster.class_role)이라
-- 아직 로그인하지 않은 학생에게도 미리 정해둘 수 있고, 엑셀 명단에
-- 열 하나로 같이 올릴 수 있다. 과제 작성은 교사만 한다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

-- ── 1. 명단에 1인1역 열 추가 ─────────────────────────────────

alter table public.classroom_roster
  add column if not exists class_role text;

comment on column public.classroom_roster.class_role is
  '1인1역. 교사가 명단에 등록할 때 정하며, 로그인 전 학생에게도 지정할 수 있다.';

-- 기존에 지정해둔 값을 옮긴다 (좌석을 이미 차지한 학생만 짝을 지을 수 있다)
update public.classroom_roster r
   set class_role = m.helper_subject
  from public.classroom_members m
 where m.student_id = r.claimed_by
   and m.helper_subject is not null
   and r.class_role is null;

comment on column public.classroom_members.helper_subject is
  '더 이상 쓰지 않는다. 1인1역은 classroom_roster.class_role 로 옮겼고, 과제 작성은 교사만 한다.';

-- ── 2. 학생·학부모에게 보여줄 1인1역 목록 ────────────────────
--
-- classroom_roster 는 이메일·연락처가 들어 있어 교사만 읽을 수 있다.
-- 이 뷰는 이름과 역할만 남기고, 자기 학급 것만 보이도록 걸러 준다.
-- (뷰 소유자 권한으로 실행되므로 기반 테이블의 RLS 를 타지 않는다)

drop view if exists public.class_roles;

create view public.class_roles
with (security_invoker = off) as
select
  r.classroom_id,
  r.student_no,
  r.student_name,
  r.class_role
from public.classroom_roster r
where r.class_role is not null
  and r.classroom_id = public.my_classroom_id();

comment on view public.class_roles is
  '우리반 1인1역 목록. 이름과 역할만 공개하고 이메일·연락처는 내보내지 않는다.';

grant select on public.class_roles to authenticated;

-- ── 3. 과제 작성 권한에서 도우미를 뺀다 ──────────────────────

drop policy if exists posts_insert on public.posts;

create policy posts_insert on public.posts
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.classrooms c
                where c.id = classroom_id and c.teacher_id = auth.uid())
  );
