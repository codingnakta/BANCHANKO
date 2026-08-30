-- ============================================================
-- 테스트 데이터 지우기
--
-- ⚠️ 되돌릴 수 없다. 지운 데이터는 복구할 방법이 없다.
--    표(스키마)와 정책은 그대로 두고 안에 든 내용만 비운다.
--
-- 쓰는 법: Supabase 대시보드 → SQL Editor 에 필요한 단계만 붙여넣고 실행
-- 이 파일은 마이그레이션이 아니다. supabase/migrations 에 두면 배포할 때마다
-- 데이터가 날아가므로 여기(scripts)에 따로 둔다.
-- ============================================================


-- ── 1단계: 학급 데이터만 비우기 ──────────────────────────────
-- 계정(로그인)은 남는다. 교사는 다시 로그인하면 학급 개설부터 시작한다.
-- 학급을 지우면 명단·구성원·공지·과제·당번·시간표·출결이 함께 지워진다(연쇄 삭제).

delete from public.notification_reads;
delete from public.personal_todos;
delete from public.classrooms;

-- 혹시 학급에 딸리지 않은 찌꺼기가 남았다면 함께
delete from public.attendance_history;
delete from public.attendance;
delete from public.timetable_entries;
delete from public.duties;
delete from public.posts;
delete from public.classroom_roster;
delete from public.classroom_members;


-- ── 2단계: 계정까지 완전히 처음으로 (원할 때만) ──────────────
-- 여기까지 실행하면 구글 로그인부터 다시 시작한다. 역할 선택 화면부터 나온다.
-- 1단계를 먼저 실행한 뒤에 돌린다.

-- delete from public.profiles;
-- delete from auth.users;


-- ── 확인 ────────────────────────────────────────────────────
-- 각 표가 비었는지 세어 본다.

select 'classrooms' as 표, count(*) from public.classrooms
union all select 'classroom_members', count(*) from public.classroom_members
union all select 'classroom_roster', count(*) from public.classroom_roster
union all select 'posts', count(*) from public.posts
union all select 'duties', count(*) from public.duties
union all select 'timetable_entries', count(*) from public.timetable_entries
union all select 'attendance', count(*) from public.attendance
union all select 'attendance_history', count(*) from public.attendance_history
union all select 'personal_todos', count(*) from public.personal_todos
union all select 'notification_reads', count(*) from public.notification_reads
union all select 'profiles', count(*) from public.profiles;
