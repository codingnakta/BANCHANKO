import { addDays, format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getNow } from '@/lib/date'
import { fetchNeis, toNotice } from '@/features/dashboard/api/dashboard'
import { fetchMyClassroom } from './myClassroom'
import type { CleaningDuty, MealMenu, Notice, TimetableEntry } from '@/types'
import type { ClassroomRow } from '@/lib/supabase/database.types'

export const boardKeys = {
  all: ['classroomBoard'] as const,
  detail: (classroomId: string) => [...boardKeys.all, classroomId] as const,
}

/** 1인1역 — 학생이 맡은 역할 */
export interface ClassRole {
  studentNo: string
  name: string
  role: string
}

export interface ScheduleItem {
  date: string
  title: string
  isHoliday: boolean
  /** 교사가 직접 올린 행사인지 (나이스 학사일정과 구분) */
  isClassEvent: boolean
}

/** 요일별 전체 시간표 (1=월 ~ 5=금) */
export type WeekTimetable = Record<number, { period: number; subject: string }[]>

export interface ClassroomBoard {
  classroom: ClassroomRow
  teacherName: string
  notices: Notice[]
  duties: (CleaningDuty & { weekday: number })[]
  roles: ClassRole[]
  weekTimetable: WeekTimetable | null
  todayTimetable: TimetableEntry[] | null
  meal: MealMenu | null
  schedule: ScheduleItem[]
  rules: string[]
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5]

/**
 * 우리반 화면 데이터.
 *
 * 전체 시간표는 교사가 검수해 저장한 것(timetable_entries)을 우선 쓰고,
 * 아직 공개하지 않았으면 비워 둔다. 오늘 시간표·급식은 나이스에서 그대로 읽는다.
 * 학사일정은 나이스 것과 교사가 등록한 행사를 한 줄로 합친다.
 */
export async function fetchClassroomBoard(now: Date = getNow()): Promise<ClassroomBoard> {
  const classroom = await fetchMyClassroom()
  if (!classroom) throw new Error('소속된 학급이 없어요.')

  const isoDate = format(now, 'yyyy-MM-dd')
  const scheduleTo = format(addDays(now, 60), 'yyyy-MM-dd')

  const [neis, teacherResult, postsResult, dutiesResult, rolesResult, timetableResult, scheduleResult] =
    await Promise.all([
      fetchNeis(classroom, isoDate),
      supabase.from('profiles').select('name').eq('id', classroom.teacher_id).maybeSingle(),
      supabase
        .from('posts')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('duties')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('weekday')
        .order('sort_order'),
      supabase
        .from('class_roles')
        .select('student_no, student_name, class_role')
        .eq('classroom_id', classroom.id)
        .order('student_no'),
      supabase
        .from('timetable_entries')
        .select('weekday, period, subject')
        .eq('classroom_id', classroom.id)
        .order('period'),
      fetchNeisSchedule(classroom, isoDate, scheduleTo),
    ])

  if (postsResult.error) {
    throw new Error(`공지를 불러오지 못했어요. (${postsResult.error.message})`)
  }

  const posts = postsResult.data ?? []

  // 교사가 검수·공개한 시간표가 있을 때만 전체 시간표를 보여준다 (F-OHHQTM)
  const savedEntries = timetableResult.data ?? []
  const weekTimetable: WeekTimetable | null =
    classroom.timetable_published && savedEntries.length > 0
      ? WEEKDAY_ORDER.reduce<WeekTimetable>((acc, weekday) => {
          acc[weekday] = savedEntries
            .filter((entry) => entry.weekday === weekday)
            .map((entry) => ({ period: entry.period, subject: entry.subject }))
          return acc
        }, {})
      : null

  const classEvents: ScheduleItem[] = posts
    .filter((post) => post.type === 'event')
    .map((post) => ({
      date: post.due_date ?? post.created_at.slice(0, 10),
      title: post.title,
      isHoliday: false,
      isClassEvent: true,
    }))

  const schedule = [...scheduleResult, ...classEvents]
    .filter((item) => item.date >= isoDate)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    classroom,
    teacherName: teacherResult.data?.name ?? '',
    notices: posts.filter((post) => post.type !== 'event').map(toNotice),
    duties: (dutiesResult.data ?? []).map((duty) => ({
      id: duty.id,
      weekday: duty.weekday,
      area: duty.task ?? '청소',
      studentNames: duty.student_names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    })),
    roles: (rolesResult.data ?? []).map((row) => ({
      studentNo: row.student_no ?? '',
      name: row.student_name ?? '이름 없음',
      role: row.class_role ?? '',
    })),
    weekTimetable,
    todayTimetable: neis.timetable,
    meal: neis.meal,
    schedule,
    rules: classroom.rules,
  }
}

/** 나이스 학사일정. 학교 코드가 없으면 조용히 빈 목록. */
async function fetchNeisSchedule(
  classroom: ClassroomRow,
  from: string,
  to: string,
): Promise<ScheduleItem[]> {
  if (!classroom.office_code || !classroom.school_code) return []

  const { data, error } = await supabase.functions.invoke<{
    schedule: { date: string; title: string; isHoliday: boolean }[]
  }>(
    `neis?${new URLSearchParams({
      action: 'schedule',
      office: classroom.office_code,
      school: classroom.school_code,
      from,
      to,
    })}`,
    { method: 'GET' },
  )

  if (error) {
    console.error('[board] 학사일정 조회 실패', error)
    return []
  }

  return (data?.schedule ?? []).map((item) => ({ ...item, isClassEvent: false }))
}

/** 요일별 청소 당번 표기용 (duties.weekday: 1=월) */
export const WEEKDAY_NAMES: Record<number, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
}
