import { useQuery } from '@tanstack/react-query'
import { MOCK_CLASSROOM } from '../api/classroom.mock'
import type { ClassroomDetail } from '@/types'

export const classroomKeys = {
  all: ['classroom'] as const,
  detail: (classroomId: string) => [...classroomKeys.all, 'detail', classroomId] as const,
}

/**
 * 우리반 탭의 학급 정보 조회 (F-RONORQ · F-ZYSPUS).
 * TODO: Supabase 연동 시 queryFn 을 실제 쿼리로 교체한다.
 *       시간표·급식은 교사 검수·공개된 것만, 일정은 공개된 것만 내려와야 한다.
 */
export function useClassroom(classroomId = 'mock-classroom') {
  return useQuery<ClassroomDetail>({
    queryKey: classroomKeys.detail(classroomId),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
      return MOCK_CLASSROOM
    },
  })
}
