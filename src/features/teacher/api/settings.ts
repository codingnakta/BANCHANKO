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

/**
 * 청소 당번 계획.
 *
 * 구역은 학급이 정해두고 요일마다 바뀌지 않는다(복도, 교실 뒤, 화장실…).
 * 요일마다 달라지는 건 그 구역을 누가 맡느냐다. 그래서 구역 목록은 하나만 두고
 * 학생 이름만 요일별로 갖는다.
 */
export interface DutyPlan {
  /** 모든 요일이 함께 쓰는 구역 목록 */
  areas: string[]
  /** 요일(1~5) → 구역과 같은 순서의 담당 학생 (쉼표로 구분) */
  names: Record<number, string[]>
}

export function emptyDutyPlan(): DutyPlan {
  return {
    areas: [],
    names: Object.fromEntries(WEEKDAYS.map((day) => [day.value, []])),
  }
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

/**
 * 저장된 행들을 계획으로 되돌린다.
 * 구역 목록은 sort_order 순서로 모든 요일에서 모아 중복을 없앤다.
 */
export function toDutyPlan(rows: DutyRow[]): DutyPlan {
  const plan = emptyDutyPlan()

  const ordered = [...rows].sort((a, b) => a.sort_order - b.sort_order)
  for (const row of ordered) {
    const area = (row.task ?? '').trim()
    if (area && !plan.areas.includes(area)) plan.areas.push(area)
  }

  for (const day of WEEKDAYS) {
    plan.names[day.value] = plan.areas.map(
      (area) =>
        rows.find((row) => row.weekday === day.value && (row.task ?? '').trim() === area)
          ?.student_names ?? '',
    )
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
  // 구역은 요일마다 한 줄씩 남긴다. 담당 학생이 비어 있어도 구역 자체는 유지해야
  // 다음에 열었을 때 구역 목록이 그대로 보인다.
  const rows = WEEKDAYS.flatMap((day) =>
    plan.areas
      .map((area, index) => ({ area: area.trim(), index }))
      .filter((entry) => entry.area)
      .map((entry) => ({
        classroom_id: classroomId,
        weekday: day.value,
        task: entry.area,
        student_names: (plan.names[day.value]?.[entry.index] ?? '').trim(),
        sort_order: entry.index,
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
