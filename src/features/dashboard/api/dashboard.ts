import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getNow } from '@/lib/date'
import { fetchMyClassroom } from '@/features/classroom/api/myClassroom'
import type { ClassroomRow, PostRow } from '@/lib/supabase/database.types'
import type {
  CleaningDuty,
  DashboardSummary,
  MealMenu,
  Notice,
  TimetableEntry,
  TodayTask,
} from '@/types'

/** 나이스 연동 응답 (Edge Function 이 정규화해 내려준다) */
interface NeisTimetable {
  entries: { period: number; subject: string }[]
}
interface NeisMeal {
  meal: { date: string; items: string[]; calorie: string | null } | null
}

export function toNotice(row: PostRow): Notice {
  return {
    id: row.id,
    type: row.type === 'assignment' ? 'assignment' : 'notice',
    title: row.title,
    body: row.body ?? '',
    externalUrl: row.link_url ?? undefined,
    status: 'published',
    publishedAt: row.created_at,
    // due_date 는 날짜만 있는 값이라 그 날 자정 기준으로 본다
    dueAt: row.due_date ? `${row.due_date}T00:00:00` : undefined,
    // 읽음 추적은 아직 스키마에 없다. 전부 미확인으로 둔다.
    isRead: false,
  }
}

/**
 * 나이스 시간표·급식은 학급에 학교 코드가 저장돼 있어야 조회할 수 있다.
 * 학교를 건너뛰고 만든 학급이면 null 을 돌려 화면이 빈 상태를 보여주게 한다.
 */
export async function fetchNeis(
  classroom: ClassroomRow,
  isoDate: string,
): Promise<{ timetable: TimetableEntry[] | null; meal: MealMenu | null }> {
  if (!classroom.office_code || !classroom.school_code) {
    return { timetable: null, meal: null }
  }

  const common = {
    office: classroom.office_code,
    school: classroom.school_code,
    date: isoDate,
  }

  const [timetableResult, mealResult] = await Promise.allSettled([
    supabase.functions.invoke<NeisTimetable>(
      `neis?${new URLSearchParams({
        ...common,
        action: 'timetable',
        level: classroom.school_level ?? 'high',
        grade: String(classroom.grade),
        classNo: String(classroom.class_no),
      })}`,
      { method: 'GET' },
    ),
    supabase.functions.invoke<NeisMeal>(
      `neis?${new URLSearchParams({ ...common, action: 'meal' })}`,
      { method: 'GET' },
    ),
  ])

  // 한쪽이 실패해도 나머지는 보여준다 (F-OHHQTM 예외 처리)
  const entries =
    timetableResult.status === 'fulfilled'
      ? (timetableResult.value.data?.entries ?? null)
      : null
  const rawMeal =
    mealResult.status === 'fulfilled' ? (mealResult.value.data?.meal ?? null) : null

  return {
    timetable:
      entries && entries.length > 0
        ? entries.map((entry) => ({
            id: `period-${entry.period}`,
            period: entry.period,
            subject: entry.subject,
          }))
        : null,
    meal: rawMeal
      ? {
          id: `meal-${rawMeal.date}`,
          date: rawMeal.date,
          items: rawMeal.items,
          syncedAt: new Date().toISOString(),
        }
      : null,
  }
}

/**
 * 홈 대시보드 (F-ZTJSNU).
 *
 * 시간표·급식은 나이스에서 실시간 조회하고(해커톤 범위상 캐시 테이블 없음),
 * 공지·과제·청소 당번은 학급 데이터에서 읽는다.
 * 학급 행사는 아직 테이블이 없어 항상 빈 배열이다.
 */
export async function fetchDashboard(now: Date = getNow()): Promise<DashboardSummary> {
  const classroom = await fetchMyClassroom()
  if (!classroom) {
    throw new Error('소속된 학급이 없어요.')
  }

  // "오늘"은 브라우저 로컬 시각 기준이어야 한다 (서버는 UTC)
  const isoDate = format(now, 'yyyy-MM-dd')

  const [neis, postsResult, dutiesResult] = await Promise.all([
    fetchNeis(classroom, isoDate),
    supabase
      .from('posts')
      .select('*')
      .eq('classroom_id', classroom.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('duties')
      .select('*')
      .eq('classroom_id', classroom.id)
      .eq('weekday', now.getDay()),
  ])

  // 조용히 빈 화면을 보여주면 "등록했는데 안 뜬다"의 원인을 알 수 없다. 그대로 드러낸다.
  if (postsResult.error) {
    console.error('[dashboard] 공지·과제 조회 실패', postsResult.error)
    throw new Error(`공지·과제를 불러오지 못했어요. (${postsResult.error.message})`)
  }
  if (dutiesResult.error) {
    console.error('[dashboard] 청소 당번 조회 실패', dutiesResult.error)
  }

  const posts = postsResult.data ?? []
  const notices = posts.filter((post) => post.type === 'notice').map(toNotice)
  // 마감이 지난 과제도 숨기지 않는다. 등록한 게 홈에서 사라지면 교사가 당황한다.
  // 대신 임박한 순서로 세우고, 지난 것은 화면에서 '기한 지남'으로 구분해 보여준다.
  const assignments = posts
    .filter((post) => post.type === 'assignment')
    .map(toNotice)
    .sort((a, b) => {
      const upcoming = (notice: Notice) =>
        !notice.dueAt || notice.dueAt.slice(0, 10) >= isoDate ? 0 : 1
      return upcoming(a) - upcoming(b) || (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999')
    })

  // 행사는 posts 의 한 유형이다 (due_date 가 행사 날짜). 지난 행사만 뺀다.
  const upcomingEvents = posts
    .filter((post) => post.type === 'event' && (!post.due_date || post.due_date >= isoDate))
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .map((post) => ({
      id: post.id,
      title: post.title,
      // 날짜를 안 넣고 등록한 행사는 올린 날을 기준으로 본다
      startAt: post.due_date ? `${post.due_date}T00:00:00` : post.created_at,
      description: post.body ?? undefined,
      isPublic: true,
    }))

  // 담당을 정하지 않은 구역은 오늘 당번에서 뺀다
  const cleaningDuties: CleaningDuty[] = (dutiesResult.data ?? [])
    .map((duty) => ({
      id: duty.id,
      area: duty.task ?? '청소',
      studentNames: duty.student_names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    }))
    .filter((duty) => duty.studentNames.length > 0)

  return {
    classroomName: classroom.name,
    todayTasks: buildTodayTasks(assignments, cleaningDuties, isoDate),
    currentPeriod: undefined,
    timetable: neis.timetable,
    meal: neis.meal,
    cleaningDuties,
    unreadNotices: notices.slice(0, 3),
    upcomingAssignments: assignments,
    upcomingEvents,
    hasUnreadNotification: false,
  }
}

/**
 * "오늘 뭐 하지?" 카드 내용.
 * AI 생성(F-NXPULH)은 아직이라, 오늘 마감인 과제와 오늘 청소 당번을 그대로 모아 보여준다.
 */
function buildTodayTasks(
  assignments: Notice[],
  duties: CleaningDuty[],
  isoDate: string,
): TodayTask[] {
  const tasks: TodayTask[] = assignments
    .filter((assignment) => assignment.dueAt?.slice(0, 10) === isoDate)
    .map((assignment) => ({ id: assignment.id, label: assignment.title }))

  for (const duty of duties) {
    tasks.push({ id: duty.id, label: `${duty.area} 당번` })
  }
  return tasks
}
