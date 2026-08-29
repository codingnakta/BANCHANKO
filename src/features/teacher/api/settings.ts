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

export interface DutyInput {
  weekday: number
  task: string
  studentNames: string
}

export async function fetchDuties(classroomId: string): Promise<DutyRow[]> {
  const { data, error } = await supabase
    .from('duties')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('weekday')

  if (error) {
    console.error('[settings] 청소 당번 조회 실패', error)
    throw new Error('청소 당번을 불러오지 못했어요.')
  }
  return data ?? []
}

/** 요일별로 한 행씩 통째로 덮어쓴다. 내용이 비면 그 요일은 지운다. */
export async function saveDuties(classroomId: string, duties: DutyInput[]): Promise<void> {
  const filled = duties.filter((duty) => duty.studentNames.trim() || duty.task.trim())
  const emptyWeekdays = duties
    .filter((duty) => !duty.studentNames.trim() && !duty.task.trim())
    .map((duty) => duty.weekday)

  if (emptyWeekdays.length > 0) {
    const { error } = await supabase
      .from('duties')
      .delete()
      .eq('classroom_id', classroomId)
      .in('weekday', emptyWeekdays)
    if (error) {
      console.error('[settings] 청소 당번 삭제 실패', error)
      throw new Error('청소 당번을 저장하지 못했어요.')
    }
  }

  if (filled.length > 0) {
    const { error } = await supabase.from('duties').upsert(
      filled.map((duty) => ({
        classroom_id: classroomId,
        weekday: duty.weekday,
        task: duty.task.trim() || null,
        student_names: duty.studentNames.trim(),
      })),
      { onConflict: 'classroom_id,weekday' },
    )
    if (error) {
      console.error('[settings] 청소 당번 저장 실패', error)
      throw new Error('청소 당번을 저장하지 못했어요.')
    }
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
