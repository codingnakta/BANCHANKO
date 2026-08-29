-- ============================================================
-- 반창고 MVP 초기 스키마 (해커톤 PRD 7장 기준)
-- 테이블: profiles, classrooms, classroom_members, posts, duties(S1)
-- 적용 방법: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
--           (또는 supabase CLI: supabase link 후 supabase db push)
-- ============================================================

-- ── 1. 테이블 ────────────────────────────────────────────────

-- 가입한 사용자 프로필. auth.users 가입 트리거로 자동 생성된다.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('teacher', 'student')),
  name       text not null,
  created_at timestamptz not null default now()
);

-- 초대코드 생성기. 헷갈리는 문자(0/O, 1/I/L)를 뺀 6자리.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from classrooms where invite_code = code);
  end loop;
  return code;
end;
$$;

-- 학급. 교사 1명당 1개 (teacher_id unique).
-- office_code·school_code·school_level 은 나이스 시간표·급식 조회의 필수 파라미터.
-- 학교 미선택(나이스 미제공 학교)도 허용해야 하므로 nullable.
create table public.classrooms (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null unique references public.profiles (id) on delete cascade,
  name         text not null,
  school_name  text,
  office_code  text,
  school_code  text,
  school_level text check (school_level in ('middle', 'high')),
  grade        smallint not null,
  class_no     smallint not null,
  invite_code  text not null unique default public.generate_invite_code(),
  created_at   timestamptz not null default now()
);

-- 학생 소속. student_id unique = 학생 1명은 학급 1개에만 소속.
-- helper_subject 가 있으면 그 과목의 과제 작성 권한을 가진 과목도우미.
create table public.classroom_members (
  classroom_id   uuid not null references public.classrooms (id) on delete cascade,
  student_id     uuid not null unique references public.profiles (id) on delete cascade,
  helper_subject text,
  joined_at      timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

-- 공지(notice)와 과제(assignment)를 한 테이블로. subject 는 과제에만 존재.
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  type         text not null check (type in ('notice', 'assignment')),
  subject      text,
  title        text not null,
  body         text,
  due_date     date,
  link_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint notice_has_no_subject check (type = 'assignment' or subject is null)
);

create index posts_classroom_created_idx on public.posts (classroom_id, created_at desc);
create index classroom_members_classroom_idx on public.classroom_members (classroom_id);

-- 요일별 청소 당번 (S1). weekday: 0=일 ~ 6=토.
create table public.duties (
  classroom_id  uuid not null references public.classrooms (id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  student_names text not null default '',
  task          text,
  primary key (classroom_id, weekday)
);

-- ── 2. 트리거 ────────────────────────────────────────────────

-- 가입 시 profiles 자동 생성. 역할·이름은 signUp options.data 로 전달한다:
--   supabase.auth.signUp({ email, password, options: { data: { role, name } } })
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
    case when new.raw_user_meta_data ->> 'role' in ('teacher', 'student')
         then new.raw_user_meta_data ->> 'role'
         else 'student' end,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- posts 수정 시각 자동 갱신 (챗봇 답변의 "최종 갱신 시각" 근거)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ── 3. 헬퍼 함수 (RLS 재귀 방지용 security definer) ──────────

-- 현재 사용자의 학급 id. 교사면 자기 학급, 학생이면 소속 학급, 없으면 null.
create or replace function public.my_classroom_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select c.id from classrooms c where c.teacher_id = auth.uid()),
    (select m.classroom_id from classroom_members m where m.student_id = auth.uid())
  );
$$;

-- 초대코드로 학급 확인 (참여 전 "○○학교 3학년 4반에 참여할까요?" 표시용)
create or replace function public.find_classroom_by_invite_code(p_code text)
returns table (id uuid, name text, school_name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.school_name
  from classrooms c
  where c.invite_code = upper(trim(p_code));
$$;

-- 초대코드로 학급 참여. 성공 시 학급 id 반환.
create or replace function public.join_classroom(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom uuid;
  v_role text;
begin
  select p.role into v_role from profiles p where p.id = auth.uid();
  if v_role is distinct from 'student' then
    raise exception '학생 계정만 초대코드로 참여할 수 있어요';
  end if;

  select c.id into v_classroom
  from classrooms c
  where c.invite_code = upper(trim(p_code));
  if v_classroom is null then
    raise exception '코드를 다시 확인해주세요';
  end if;

  insert into classroom_members (classroom_id, student_id)
  values (v_classroom, auth.uid());
  return v_classroom;
exception
  when unique_violation then
    raise exception '이미 참여 중인 학급이 있어요';
end;
$$;

revoke execute on function public.join_classroom(text) from anon, public;
revoke execute on function public.find_classroom_by_invite_code(text) from anon, public;
grant execute on function public.join_classroom(text) to authenticated;
grant execute on function public.find_classroom_by_invite_code(text) to authenticated;

-- ── 4. RLS ──────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.posts enable row level security;
alter table public.duties enable row level security;

-- profiles: 본인 + 같은 학급 구성원(교사 포함)만 조회.
-- 수정은 name 컬럼만 허용 — role 을 스스로 teacher 로 바꾸는 권한 상승을 막는다.
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or id in (select m.student_id from public.classroom_members m
              where m.classroom_id = public.my_classroom_id())
    or id = (select c.teacher_id from public.classrooms c
             where c.id = public.my_classroom_id())
  );

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- classrooms: 소속 구성원만 조회, 생성·수정·삭제는 교사 본인만.
create policy classrooms_select on public.classrooms
  for select using (
    teacher_id = auth.uid() or id = public.my_classroom_id()
  );

create policy classrooms_insert on public.classrooms
  for insert with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'teacher')
  );

create policy classrooms_update on public.classrooms
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy classrooms_delete on public.classrooms
  for delete using (teacher_id = auth.uid());

-- classroom_members: 같은 학급 구성원만 조회(당번·도우미 표시용).
-- 참여는 join_classroom() RPC 로만, 도우미 지정(update)·해제(delete)는 교사만.
-- 학생 본인의 탈퇴(delete)도 허용.
create policy members_select on public.classroom_members
  for select using (classroom_id = public.my_classroom_id());

create policy members_insert_by_teacher on public.classroom_members
  for insert with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );

create policy members_update_by_teacher on public.classroom_members
  for update using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );

create policy members_delete on public.classroom_members
  for delete using (
    student_id = auth.uid()
    or exists (select 1 from public.classrooms c
               where c.id = classroom_id and c.teacher_id = auth.uid())
  );

-- posts: 소속 구성원만 조회.
-- 공지 작성은 교사만, 과제 작성은 교사 또는 담당 과목이 일치하는 과목도우미만.
create policy posts_select on public.posts
  for select using (classroom_id = public.my_classroom_id());

create policy posts_insert on public.posts
  for insert with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.classrooms c
              where c.id = classroom_id and c.teacher_id = auth.uid())
      or (
        type = 'assignment'
        and exists (select 1 from public.classroom_members m
                    where m.classroom_id = posts.classroom_id
                      and m.student_id = auth.uid()
                      and m.helper_subject is not null
                      and m.helper_subject = posts.subject)
      )
    )
  );

-- 수정·삭제: 교사는 학급의 모든 글, 도우미는 본인이 쓴 글만.
create policy posts_update on public.posts
  for update using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
    or author_id = auth.uid()
  ) with check (
    classroom_id = public.my_classroom_id()
  );

create policy posts_delete on public.posts
  for delete using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
    or author_id = auth.uid()
  );

-- duties: 같은 학급 구성원만 조회, 관리는 교사만.
create policy duties_select on public.duties
  for select using (classroom_id = public.my_classroom_id());

create policy duties_write on public.duties
  for all using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );
