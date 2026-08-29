import { useQuery } from '@tanstack/react-query'
import { MOCK_DASHBOARD } from '../api/dashboard.mock'
import type { DashboardSummary } from '@/types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (classroomId: string) => [...dashboardKeys.all, 'summary', classroomId] as const,
}

/**
 * 홈 대시보드 요약 조회 (F-ZTJSNU).
 * TODO: Supabase 연동 시 queryFn 을 실제 쿼리로 교체한다.
 *       공개 전환되지 않은 외부 연동(시간표·급식) 데이터는 제외해야 한다.
 */
export function useDashboard(classroomId = 'mock-classroom') {
  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(classroomId),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      return MOCK_DASHBOARD
    },
  })
}
