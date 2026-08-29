import type { QueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/features/dashboard/hooks/useDashboard'
import { classroomKeys } from '@/features/classroom/hooks/useClassroom'
import { myClassroomKeys } from '@/features/classroom/api/myClassroom'

/**
 * 학급 데이터를 바꿨을 때 다시 읽어야 하는 화면들.
 *
 * 홈·우리반은 공지·과제·당번·시간표를 함께 보여주므로, 어느 하나를 고치면
 * 이 캐시들을 모두 무효화해야 한다. 대시보드는 staleTime 이 길어서
 * 무효화하지 않으면 방금 등록한 글이 한동안 안 보인다.
 */
export function invalidateClassroomViews(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    queryClient.invalidateQueries({ queryKey: classroomKeys.all }),
    queryClient.invalidateQueries({ queryKey: myClassroomKeys.all }),
  ])
}
