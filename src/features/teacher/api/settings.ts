import { supabase } from '@/lib/supabase'
import type { DutyRow } from '@/lib/supabase/database.types'

export const settingsKeys = {
  all: ['classSettings'] as const,
  duties: (classroomId: string) => [...settingsKeys.all, 'duties', classroomId] as const,
}

/** 0=일 ~ 6=토. 청소 당번은 평일만 다룬다. */
export const WEEKDAYS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
] as const

/** 한 요일의 청소 구역 한 줄 */
export interface DutyRowInput {
  area: string
  /** 쉼표로 구분한 학생 이름 */
  studentNames: string
}

/** 요일(1~5)별 구역 목록 */
export type DutyPlan = Record<number, DutyRowInput[]>

export function emptyDutyPlan(): DutyPlan {
  return Object.fromEntries(WEEKDAYS.map((day) => [day.value, []]))
}

export async function fetchDuties(classroomId: string): Promise<DutyRow[]> {
  const { data, error } = await supabase
    .from('duties')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('weekday')
    .order('sort_order')

  if (error) {
    console.error('[settings] 청소 당번 조회 실패', error)
    throw new Error('청소 당번을 불러오지 못했어요.')
  }
  return data ?? []
}

/** 저장된 행들을 요일별 묶음으로 바꾼다. */
export function toDutyPlan(rows: DutyRow[]): DutyPlan {
  const plan = emptyDutyPlan()
  for (const row of rows) {
    if (!plan[row.weekday]) plan[row.weekday] = []
    plan[row.weekday].push({ area: row.task ?? '', studentNames: row.student_names })
  }
  return plan
}

/**
 * 학급의 청소 당번을 통째로 갈아끼운다.
 *
 * 요일마다 구역 수가 달라지고 줄을 지울 수도 있어서, 부분 갱신보다
 * 전체를 지우고 다시 넣는 쪽이 어긋날 여지가 없다.
 */
export async function saveDuties(classroomId: string, plan: DutyPlan): Promise<void> {
  const rows = WEEKDAYS.flatMap((day) =>
    (plan[day.value] ?? [])
      .filter((row) => row.area.trim() || row.studentNames.trim())
      .map((row, index) => ({
        classroom_id: classroomId,
        weekday: day.value,
        task: row.area.trim() || null,
        student_names: row.studentNames.trim(),
        sort_order: index,
      })),
  )

  const { error: deleteError } = await supabase
    .from('duties')
    .delete()
    .eq('classroom_id', classroomId)
  if (deleteError) {
    console.error('[settings] 청소 당번 초기화 실패', deleteError)
    throw new Error('청소 당번을 저장하지 못했어요.')
  }

  if (rows.length === 0) return

  const { error } = await supabase.from('duties').insert(rows)
  if (error) {
    console.error('[settings] 청소 당번 저장 실패', error)
    throw new Error('청소 당번을 저장하지 못했어요.')
  }
}

export async function saveClassroomBasics(
  classroomId: string,
  values: { name: string; rules: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('classrooms')
    .update({
      name: values.name.trim(),
      rules: values.rules.map((rule) => rule.trim()).filter(Boolean),
    })
    .eq('id', classroomId)

  if (error) {
    console.error('[settings] 학급 정보 저장 실패', error)
    throw new Error('학급 정보를 저장하지 못했어요.')
  }
}
