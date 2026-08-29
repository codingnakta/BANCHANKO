-- ============================================================
-- 교사 학급 운영 기능
--
-- 추가하는 것:
--  1. classrooms.rules        — 학급 규칙 (F-RONORQ)
--  2. timetable_entries       — 검수·공개하는 주간 시간표 (F-OHHQTM)
--  3. attendance / attendance_history — 출결과 변경 이력 (F-ZOJYKF)
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

-- ── 1. 학급 규칙 ─────────────────────────────────────────────

alter table public.classrooms
  add column if not exists rules text[] not null default '{}';

-- 나이스에서 받아온 시간표를 교사가 검수해 공개했는지 여부.
-- false 면 학생 화면은 나이스 실시간 조회 결과를 그대로 쓴다.
alter table public.classrooms
  add column if not exists timetable_published boolean not null default false;

-- ── 2. 주간 시간표 ───────────────────────────────────────────

-- 교사가 검수·수정한 시간표. 나이스가 시간표를 주지 않는 학교는 여기에 직접 입력한다.
-- weekday: 1=월 ~ 5=금 (주말 수업은 다루지 않는다)
create table if not exists public.timetable_entries (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 5),
  period       smallint not null check (period between 1 and 10),
  subject      text not null default '',
  primary key (classroom_id, weekday, period)
);

-- ── 3. 출결 ──────────────────────────────────────────────────

create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  date         date not null,
  status       text not null check (status in ('present','absent','late','early_leave','excused')),
  reason       text,
  updated_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (classroom_id, student_id, date)
);

create index if not exists attendance_classroom_date_idx
  on public.attendance (classroom_id, date desc);

-- 정정 근거를 남긴다. 변경 전후 값·수정자·수정 시각 (F-ZOJYKF 수락 기준)
create table if not exists public.attendance_history (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance (id) on delete cascade,
  before_status text,
  before_reason text,
  after_status  text not null,
  after_reason  text,
  changed_by    uuid references public.profiles (id) on delete set null,
  changed_at    timestamptz not null default now()
);

create index if not exists attendance_history_attendance_idx
  on public.attendance_history (attendance_id, changed_at desc);

-- 출결이 바뀌면 이력을 자동으로 남긴다. 화면에서 빠뜨릴 여지를 없앤다.
create or replace function public.log_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into attendance_history (attendance_id, after_status, after_reason, changed_by)
    values (new.id, new.status, new.reason, new.updated_by);
    return new;
  end if;

  -- 실제로 달라진 것이 없으면 이력을 남기지 않는다
  if new.status is distinct from old.status or new.reason is distinct from old.reason then
    new.updated_at := now();
    insert into attendance_history (
      attendance_id, before_status, before_reason, after_status, after_reason, changed_by
    )
    values (new.id, old.status, old.reason, new.status, new.reason, new.updated_by);
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_log_insert on public.attendance;
create trigger attendance_log_insert
  after insert on public.attendance
  for each row execute function public.log_attendance_change();

drop trigger if exists attendance_log_update on public.attendance;
create trigger attendance_log_update
  before update on public.attendance
  for each row execute function public.log_attendance_change();

-- ── 4. RLS ──────────────────────────────────────────────────

alter table public.timetable_entries enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_history enable row level security;

-- 시간표: 학급 구성원은 조회, 관리는 담임교사만
create policy timetable_select on public.timetable_entries
  for select using (classroom_id = public.my_classroom_id());

create policy timetable_write on public.timetable_entries
  for all using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );

-- 출결: 담임교사는 학급 전체, 학생은 자기 것만.
-- 다른 학생의 상태·사유는 볼 수 없어야 한다 (F-ZOJYKF 권한).
create policy attendance_select on public.attendance
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.classrooms c
               where c.id = classroom_id and c.teacher_id = auth.uid())
  );

create policy attendance_write on public.attendance
  for all using (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.classrooms c
            where c.id = classroom_id and c.teacher_id = auth.uid())
  );

-- 이력은 담임교사만 조회한다. 트리거(security definer)가 쓰므로 쓰기 정책은 두지 않는다.
create policy attendance_history_select on public.attendance_history
  for select using (
    exists (
      select 1 from public.attendance a
      join public.classrooms c on c.id = a.classroom_id
      where a.id = attendance_id and c.teacher_id = auth.uid()
    )
  );
