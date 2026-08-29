import { useQuery } from '@tanstack/react-query'
import { fetchMyClassroom, myClassroomKeys } from '@/features/classroom/api/myClassroom'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { ClassroomRow } from '@/lib/supabase/database.types'

/**
 * 교사 화면에서 쓰는 학급 원본 행.
 * 우리반 탭용 ClassroomDetail 과 달리 DB 컬럼을 그대로 다뤄야 저장이 편하다.
 */
export function useMyClassroomRow() {
  const user = useCurrentUser()

  return useQuery<ClassroomRow | null>({
    queryKey: myClassroomKeys.detail(user?.id ?? 'none'),
    queryFn: fetchMyClassroom,
    enabled: Boolean(user?.classroomId),
  })
}
