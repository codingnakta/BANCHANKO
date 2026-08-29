-- ============================================================
-- 학생도 과제를 올릴 수 있게
--
-- 과제는 선생님이 올리는 것이 기본이지만, 학생이 수업 시간에 받아 적은
-- 과제를 반에 공유할 수 있어야 한다(서비스 안내에 적어 둔 대로).
-- 공지·일정은 그대로 교사만 올린다.
--
-- 고치고 지우는 것은 기존 정책이 이미 '교사 또는 쓴 사람'으로 막고 있어
-- 학생은 자기가 올린 과제만 손댈 수 있다.
--
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- ============================================================

drop policy if exists posts_insert on public.posts;

create policy posts_insert on public.posts
  for insert with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.classrooms c
              where c.id = classroom_id and c.teacher_id = auth.uid())
      or (type = 'assignment' and classroom_id = public.my_classroom_id())
    )
  );
