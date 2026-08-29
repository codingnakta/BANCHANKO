import { supabase } from '@/lib/supabase'
import type { ClassroomRow } from '@/lib/supabase/database.types'

export const timetableKeys = {
  all: ['teacherTimetable'] as const,
  detail: (classroomId: string) => [...timetableKeys.all, classroomId] as const,
}

export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const
export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'] as const

/** [요일 1~5][교시 1~7] 과목명 */
export type TimetableGrid = Record<number, Record<number, string>>

export function emptyGrid(): TimetableGrid {
  const grid: TimetableGrid = {}
  for (let weekday = 1; weekday <= 5; weekday += 1) {
    grid[weekday] = {}
    for (const period of PERIODS) grid[weekday][period] = ''
  }
  return grid
}

/** 저장된 검수본 */
export async function fetchSavedTimetable(classroomId: string): Promise<TimetableGrid> {
  const { data, error } = await supabase
    .from('timetable_entries')
    .select('weekday, period, subject')
    .eq('classroom_id', classroomId)

  if (error) {
    console.error('[timetable] 조회 실패', error)
    throw new Error('시간표를 불러오지 못했어요.')
  }

  const grid = emptyGrid()
  for (const row of data ?? []) {
    if (grid[row.weekday]) grid[row.weekday][row.period] = row.subject
  }
  return grid
}

/**
 * 나이스에서 이번 주 시간표를 받아온다 (검수 대기 자료).
 *
 * Edge Function 은 하루씩 조회하므로 월~금 다섯 번 부른다.
 * 시간표를 공개하지 않는 학교는 빈 격자가 돌아오고, 교사가 직접 입력하면 된다.
 */
export async function fetchNeisWeek(
  classroom: ClassroomRow,
  monday: Date,
): Promise<TimetableGrid> {
  const grid = emptyGrid()
  if (!classroom.office_code || !classroom.school_code) return grid

  const requests = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    const isoDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`

    return supabase.functions.invoke<{ entries: { period: number; subject: string }[] }>(
      `neis?${new URLSearchParams({
        action: 'timetable',
        office: classroom.office_code!,
        school: classroom.school_code!,
        level: classroom.school_level ?? 'high',
        grade: String(classroom.grade),
        classNo: String(classroom.class_no),
        date: isoDate,
      })}`,
      { method: 'GET' },
    )
  })

  const results = await Promise.allSettled(requests)
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    for (const entry of result.value.data?.entries ?? []) {
      if (grid[index + 1] && entry.period >= 1 && entry.period <= 7) {
        grid[index + 1][entry.period] = entry.subject
      }
    }
  })

  return grid
}

/** 검수한 시간표를 저장하고 학생에게 공개한다 (F-OHHQTM). */
export async function publishTimetable(
  classroomId: string,
  grid: TimetableGrid,
): Promise<void> {
  const rows = []
  for (let weekday = 1; weekday <= 5; weekday += 1) {
    for (const period of PERIODS) {
      const subject = (grid[weekday]?.[period] ?? '').trim()
      if (subject) rows.push({ classroom_id: classroomId, weekday, period, subject })
    }
  }

  // 통째로 갈아끼운다 — 지운 칸이 남아 있으면 안 된다
  const { error: deleteError } = await supabase
    .from('timetable_entries')
    .delete()
    .eq('classroom_id', classroomId)
  if (deleteError) {
    console.error('[timetable] 초기화 실패', deleteError)
    throw new Error('시간표를 저장하지 못했어요.')
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('timetable_entries').insert(rows)
    if (error) {
      console.error('[timetable] 저장 실패', error)
      throw new Error('시간표를 저장하지 못했어요.')
    }
  }

  const { error: publishError } = await supabase
    .from('classrooms')
    .update({ timetable_published: rows.length > 0 })
    .eq('id', classroomId)

  if (publishError) {
    console.error('[timetable] 공개 전환 실패', publishError)
    throw new Error('시간표를 공개하지 못했어요.')
  }
}

/** 이번 주 월요일 */
export function mondayOf(date: Date): Date {
  const monday = new Date(date)
  const offset = (date.getDay() + 6) % 7
  monday.setDate(date.getDate() - offset)
  monday.setHours(0, 0, 0, 0)
  return monday
}
