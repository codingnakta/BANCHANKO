import { useQuery } from '@tanstack/react-query'
import { boardKeys, fetchClassroomBoard } from '../api/classroomBoard'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'

/** 우리반 목록·하위 화면이 함께 쓰는 학급 정보 조회. */
export function useClassroomBoard() {
  const user = useCurrentUser()

  return useQuery({
    queryKey: boardKeys.detail(user?.classroomId ?? 'none'),
    queryFn: () => fetchClassroomBoard(),
    enabled: Boolean(user?.classroomId),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
}
