import { supabase } from '@/lib/supabase'
import type { ClassroomRow } from '@/lib/supabase/database.types'

export const myClassroomKeys = {
  all: ['myClassroom'] as const,
  detail: (userId: string) => [...myClassroomKeys.all, userId] as const,
}

/**
 * 내 학급.
 *
 * RLS(classrooms_select)가 교사는 자기 학급, 학생은 소속 학급만 보이게 하므로
 * 조건 없이 한 건만 가져오면 된다.
 */
export async function fetchMyClassroom(): Promise<ClassroomRow | null> {
  const { data, error } = await supabase.from('classrooms').select('*').limit(1).maybeSingle()

  if (error) {
    console.error('[classroom] 조회 실패', error)
    throw new Error('학급 정보를 불러오지 못했어요.')
  }
  return data
}
