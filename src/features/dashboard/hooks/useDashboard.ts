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
 *
 * 홈에 들어올 때마다 다시 읽는다. 캐시를 길게 잡았더니 방금 등록한 공지·과제가
 * 한동안 안 보여서, 나이스 호출을 몇 번 더 하더라도 최신 상태를 우선한다.
 */
export function useDashboard() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId

  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(classroomId ?? 'none'),
    // 오늘 할 일은 보는 사람에 따라 달라진다 (내 당번만 보여준다)
    queryFn: () => fetchDashboard(undefined, { name: user?.name ?? '', role: user?.role ?? null }),
    enabled: Boolean(classroomId),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
}
