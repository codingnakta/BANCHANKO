import { supabase } from '@/lib/supabase'
import type { ClassroomRow } from '@/lib/supabase/database.types'

export const mealKeys = {
  all: ['meal'] as const,
  onDate: (classroomId: string, isoDate: string) => [...mealKeys.all, classroomId, isoDate] as const,
}

/**
 * 하루치 급식.
 *
 * 홈은 오늘 것만 보면 되지만 우리반 › 급식은 날짜를 넘겨 가며 보므로
 * 그날 하나만 따로 부른다. (시간표까지 같이 부르는 fetchNeis 와 다르다)
 * 학교 코드가 없으면 조용히 null.
 */
export async function fetchMealByDate(
  classroom: ClassroomRow,
  isoDate: string,
): Promise<string[] | null> {
  if (!classroom.office_code || !classroom.school_code) return null

  const { data, error } = await supabase.functions.invoke<{
    meal: { date: string; items: string[]; calorie: string | null } | null
  }>(
    `neis?${new URLSearchParams({
      action: 'meal',
      office: classroom.office_code,
      school: classroom.school_code,
      date: isoDate,
    })}`,
    { method: 'GET' },
  )

  if (error) {
    console.error('[급식] 조회 실패', error)
    return null
  }
  return data?.meal?.items ?? null
}
