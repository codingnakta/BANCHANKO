-- ============================================================
-- 알림 읽은 시각
--
-- 알림 테이블을 따로 두지 않고, 교사가 올린 글(posts)을 그대로 알림으로 본다.
-- 학생마다 "어디까지 봤는지"만 알면 새 글을 가려낼 수 있어 칸 하나로 충분하다.
-- 이 시각 뒤에 올라온 글이 안 읽은 알림이다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

alter table public.profiles
  add column if not exists notifications_read_at timestamptz;

comment on column public.profiles.notifications_read_at is
  '알림 목록을 마지막으로 확인한 시각. 이 뒤에 올라온 글이 안 읽은 알림이다.';

grant update (notifications_read_at) on public.profiles to authenticated;
