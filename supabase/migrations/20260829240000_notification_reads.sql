-- ============================================================
-- 알림 읽음 — 한 줄씩
--
-- 앞서 프로필에 '마지막으로 확인한 시각' 한 칸을 두었더니, 목록을 열기만
-- 해도 안 읽은 알림이 한꺼번에 읽음이 됐다. 내용을 본 것만 읽음이 되도록
-- 학생이 연 글을 한 줄씩 기록한다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

create table if not exists public.notification_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

comment on table public.notification_reads is
  '알림(교사가 올린 글)을 누가 언제 읽었는지. 본인 것만 읽고 쓴다.';

-- 본인 것만. 남이 무엇을 읽었는지는 볼 수 없다.
alter table public.notification_reads enable row level security;

drop policy if exists notification_reads_own on public.notification_reads;

create policy notification_reads_own on public.notification_reads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 프로필의 notifications_read_at 은 더 이상 쓰지 않는다 ('모두 읽음'의 기준으로만 남겨 둔다)
comment on column public.profiles.notifications_read_at is
  '더 이상 쓰지 않는다. 읽음은 notification_reads 에 한 줄씩 남는다.';
