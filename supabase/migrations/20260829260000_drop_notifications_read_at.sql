-- ============================================================
-- 쓰지 않는 칸 정리
--
-- 알림 읽음을 프로필의 시각 한 칸으로 다루다가 notification_reads 로
-- 옮겼다. 남겨 두면 다음에 보는 사람이 둘 중 무엇이 진짜인지 헷갈린다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

alter table public.profiles drop column if exists notifications_read_at;
