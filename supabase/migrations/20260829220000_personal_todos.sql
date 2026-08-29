-- ============================================================
-- 내 할일 — 학생이 스스로 적는 개인 할 일
--
-- 우리반 과제는 교사가 올리고 학급 전체가 본다. 그와 별개로 학생이
-- 자기 할 일을 적어 두는 자리를 만든다. 본인 말고는 아무도 못 본다.
--
-- 홈에 띄우는 핀도 둘로 나뉜다.
--   profiles.pinned_post_id  학급 과제 (파란 핀)
--   profiles.pinned_todo_id  내 할일 (핑크 핀)
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

create table if not exists public.personal_todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  /** 마감일 (선택) */
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists personal_todos_user_idx
  on public.personal_todos (user_id, created_at desc);

comment on table public.personal_todos is
  '학생이 직접 적는 개인 할 일. 작성한 본인만 읽고 쓴다.';

-- ── RLS ─────────────────────────────────────────────────────
-- 학급과 무관하게 오직 본인 것만. 교사도 학생의 개인 할 일은 볼 수 없다.

alter table public.personal_todos enable row level security;

drop policy if exists personal_todos_own on public.personal_todos;

create policy personal_todos_own on public.personal_todos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 핑크 핀 ─────────────────────────────────────────────────

alter table public.profiles
  add column if not exists pinned_todo_id uuid
    references public.personal_todos (id) on delete set null;

comment on column public.profiles.pinned_todo_id is
  '홈에 띄울 내 할일 하나. 본인만 바꿀 수 있다.';

grant update (pinned_todo_id) on public.profiles to authenticated;
