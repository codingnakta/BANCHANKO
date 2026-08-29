import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../api/dashboard'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { DashboardSummary } from '@/types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (classroomId: string) => [...dashboardKeys.all, 'summary', classroomId] as const,
}

/**
 * 홈 대시보드 요약 조회 (F-ZTJSNU).
 * 시간표·급식은 나이스 실시간 조회라 자주 다시 부를 이유가 없어 캐시를 길게 잡는다.
 */
export function useDashboard() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId

  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(classroomId ?? 'none'),
    queryFn: () => fetchDashboard(),
    enabled: Boolean(classroomId),
    staleTime: 5 * 60_000,
  })
}
