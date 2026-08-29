import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getNow } from '@/lib/date'
import { fetchNeis, toNotice } from '@/features/dashboard/api/dashboard'
import { fetchMyClassroom } from './myClassroom'
import type { CleaningDuty, ClassroomDetail } from '@/types'

/**
 * 우리반 탭 데이터 (S2-4).
 *
 * 홈과 같은 학급 데이터를 보지만, 홈이 '오늘·임박'만 추리는 것과 달리
 * 여기서는 공개된 전체 목록을 보여준다.
 */
export async function fetchClassroomDetail(now: Date = getNow()): Promise<ClassroomDetail> {
  const classroom = await fetchMyClassroom()
  if (!classroom) {
    throw new Error('소속된 학급이 없어요.')
  }

  const isoDate = format(now, 'yyyy-MM-dd')

  const [neis, teacherResult, postsResult, dutiesResult, memberCount] = await Promise.all([
    fetchNeis(classroom, isoDate),
    supabase.from('profiles').select('name').eq('id', classroom.teacher_id).maybeSingle(),
    supabase
      .from('posts')
      .select('*')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),
    supabase.from('duties').select('*').eq('classroom_id', classroom.id).order('weekday'),
    // 실제로 로그인해 학급에 들어온 학생 수 (명단에만 있고 아직 안 들어온 학생은 제외)
    supabase
      .from('classroom_members')
      .select('student_id', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id),
  ])

  const cleaningDuties: CleaningDuty[] = (dutiesResult.data ?? []).map((duty) => ({
    id: `duty-${duty.classroom_id}-${duty.weekday}`,
    area: duty.task ?? '청소',
    studentNames: duty.student_names
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  }))

  return {
    classroom: {
      id: classroom.id,
      name: classroom.name,
      teacherName: teacherResult.data?.name ?? '',
      // 학급 규칙은 아직 저장할 컬럼이 없다 (학급 기본 정보 화면과 함께 붙일 예정)
      rules: [],
    },
    studentCount: memberCount.count ?? 0,
    timetable: neis.timetable,
    meal: neis.meal,
    cleaningDuties,
    notices: (postsResult.data ?? []).map(toNotice),
    events: [],
  }
}
