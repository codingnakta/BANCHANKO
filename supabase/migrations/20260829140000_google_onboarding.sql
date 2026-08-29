-- ============================================================
-- 구글 로그인 온보딩 + 이메일 명단 기반 학생 배정
--
-- 바뀌는 것:
--  1. 초대코드 방식 폐기 (invite_code 컬럼·관련 함수 제거)
--  2. profiles.role 을 nullable 로 — NULL = "아직 역할을 안 정함"
--  3. classroom_roster 신설 — 교사가 학생 이메일을 미리 등록해두는 명단
--  4. set_my_role() / claim_my_seat() RPC
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

-- ── 1. 초대코드 방식 제거 ────────────────────────────────────

drop function if exists public.join_classroom(text);
drop function if exists public.find_classroom_by_invite_code(text);

-- 컬럼의 default 가 generate_invite_code() 를 참조하므로 컬럼을 먼저 지운다
alter table public.classrooms drop column if exists invite_code;
drop function if exists public.generate_invite_code();

-- ── 2. 역할 "미정" 상태 도입 ─────────────────────────────────

-- NULL 은 CHECK 제약을 통과하므로(UNKNOWN) 기존 check 는 그대로 둔다.
alter table public.profiles alter column role drop not null;

-- 구글 OAuth 는 signUp options.data 를 넘길 수 없어 가입 시점에 역할을 알 수 없다.
-- 이름만 채우고 역할은 비워둔 뒤, 로그인 후 set_my_role() 또는 claim_my_seat() 이 정한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    null,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      '이름 없음'
    )
  );
  return new;
end;
$$;

-- ── 3. 학생 명단 (roster) ────────────────────────────────────

-- 교사가 학급을 만들 때 학생의 학교 구글 계정을 미리 등록해두는 "빈 좌석" 테이블.
-- 가입 전 학생은 auth 계정이 없어 classroom_members 에 넣을 수 없으므로 이메일을 키로 쓴다.
-- email 을 전역 unique 로 두어 "학생 1명 = 학급 1개" 규칙을 명단 단계에서부터 강제한다.
create table public.classroom_roster (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  email        text not null unique,
  student_no   text,
  student_name text,
  claimed_by   uuid references public.profiles (id) on delete set null,
  claimed_at   timestamptz,
  created_at   timestamptz not null default now(),
  primary key (classroom_id, email)
);

create index classroom_roster_email_idx on public.classroom_roster (email);

comment on table public.classroom_roster is
  '교사가 미리 등록하는 학생 이메일 명단. claim_my_seat() 이 로그인한 학생을 여기에 맞춰 학급에 배정한다.';

-- ── 4. RPC ──────────────────────────────────────────────────

-- 역할을 한 번만 정한다. 이미 정해졌으면 거부해 학생→교사 권한 상승을 막는다.
create or replace function public.set_my_role(p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if p_role not in ('teacher', 'student') then
    raise exception '올바르지 않은 역할입니다';
  end if;

  select role into v_current from profiles where id = auth.uid();
  if v_current is not null then
    raise exception '역할은 한 번만 정할 수 있어요';
  end if;

  update profiles set role = p_role where id = auth.uid();
  return p_role;
end;
$$;

-- 로그인한 사용자의 이메일로 명단을 찾아 학급에 배정한다.
-- 멱등하다 — 매 로그인마다 호출해도 안전하고, 교사가 나중에 등록해도 다음 호출에서 잡힌다.
-- 반환값: 배정된(또는 이미 소속인) 학급 id. 해당 없으면 null.
create or replace function public.claim_my_seat()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_email     text;
  v_role      text;
  v_existing  uuid;
  v_classroom uuid;
begin
  if v_uid is null then
    return null;
  end if;

  select role into v_role from profiles where id = v_uid;

  -- 교사는 명단 배정 대상이 아니다
  if v_role = 'teacher' then
    return (select id from classrooms where teacher_id = v_uid);
  end if;

  -- 이미 소속된 학급이 있으면 그대로 반환
  select classroom_id into v_existing from classroom_members where student_id = v_uid;
  if v_existing is not null then
    return v_existing;
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return null;
  end if;
  v_email := lower(trim(v_email));

  -- 아직 아무도 앉지 않은 좌석만 잡는다
  select classroom_id into v_classroom
  from classroom_roster
  where email = v_email and claimed_by is null;

  if v_classroom is null then
    return null;
  end if;

  insert into classroom_members (classroom_id, student_id)
  values (v_classroom, v_uid);

  update classroom_roster
  set claimed_by = v_uid, claimed_at = now()
  where classroom_id = v_classroom and email = v_email;

  -- 명단에 있다는 것 자체가 학생이라는 뜻
  if v_role is null then
    update profiles set role = 'student' where id = v_uid;
  end if;

  return v_classroom;
exception
  when unique_violation then
    -- 동시 호출 등으로 이미 배정된 경우
    return (select classroom_id from classroom_members where student_id = v_uid);
end;
$$;

revoke execute on function public.set_my_role(text) from anon, public;
revoke execute on function public.claim_my_seat() from anon, public;
grant execute on function public.set_my_role(text) to authenticated;
grant execute on function public.claim_my_seat() to authenticated;

-- ── 5. RLS (roster) ─────────────────────────────────────────

alter table public.classroom_roster enable row level security;

-- 명단 전체를 읽는 것은 반 전체 이메일 열람이므로 해당 학급 교사에게만 허용한다.
-- 학생은 claim_my_seat() (security definer) 을 통해서만 자기 좌석에 접근한다.
create policy roster_teacher_all on public.classroom_roster
  for all using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );
