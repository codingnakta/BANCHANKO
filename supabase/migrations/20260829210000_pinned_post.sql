-- ============================================================
-- 홈에 띄울 항목을 계정에 저장한다
--
-- 핀은 사람마다 다른 선택이라 profiles 에 한 칸을 둔다.
-- 기기(localStorage)가 아니라 계정에 붙어 있어야 폰에서 꽂은 핀이
-- 태블릿에서도 그대로 보인다.
--
-- 글이 지워지면 핀도 조용히 풀린다 (on delete set null).
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

alter table public.profiles
  add column if not exists pinned_post_id uuid
    references public.posts (id) on delete set null;

comment on column public.profiles.pinned_post_id is
  '홈에 띄울 글 하나. 본인만 바꿀 수 있다.';

-- profiles 는 컬럼 단위로 수정 권한을 준다(init 에서 name 만 열어 둠).
-- 핀도 본인이 바꿀 수 있어야 하므로 같은 방식으로 한 칸만 더 연다.
-- 행 조건(id = auth.uid())은 기존 profiles_update_own 정책이 그대로 막아 준다.
grant update (pinned_post_id) on public.profiles to authenticated;
