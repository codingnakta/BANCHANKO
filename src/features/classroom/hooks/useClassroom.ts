import { useQuery } from '@tanstack/react-query'
import { fetchClassroomDetail } from '../api/classroomDetail'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { ClassroomDetail } from '@/types'

export const classroomKeys = {
  all: ['classroom'] as const,
  detail: (classroomId: string) => [...classroomKeys.all, 'detail', classroomId] as const,
}

/** 우리반 탭 학급 정보 조회 (S2-4). */
export function useClassroom() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId

  return useQuery<ClassroomDetail>({
    queryKey: classroomKeys.detail(classroomId ?? 'none'),
    queryFn: () => fetchClassroomDetail(),
    enabled: Boolean(classroomId),
    staleTime: 5 * 60_000,
  })
}
