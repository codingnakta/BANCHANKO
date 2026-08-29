-- ============================================================
-- posts 에 '행사' 유형 추가
--
-- 행사 전용 테이블을 새로 만드는 대신 posts 의 type 을 넓힌다.
-- RLS·조회·작성 화면을 공지·과제와 그대로 공유할 수 있다.
-- 행사 날짜는 due_date 를 그대로 쓴다.
-- ============================================================

alter table public.posts drop constraint if exists posts_type_check;

alter table public.posts
  add constraint posts_type_check check (type in ('notice', 'assignment', 'event'));

-- 과목은 여전히 과제에만 붙는다
alter table public.posts drop constraint if exists notice_has_no_subject;

alter table public.posts
  add constraint notice_has_no_subject check (type = 'assignment' or subject is null);
