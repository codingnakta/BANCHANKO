import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MOCK_NOTIFICATIONS } from '../api/notifications.mock'
import type { AppNotification } from '@/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
}

/**
 * 인앱 알림 목록 (F-IAXPMY).
 *
 * 읽음 상태를 여러 화면(더보기 배지, 알림 목록, 헤더 벨)이 함께 봐야 하므로
 * 로컬 state 대신 React Query 캐시에 담아 공유한다.
 *
 * TODO: Supabase 연동 시 조회·읽음 처리를 실제 쿼리/뮤테이션으로 교체한다.
 *       학생은 자신에게 생성된 알림만 조회·읽음 처리할 수 있어야 한다(RLS).
 *       알림 기록은 생성일로부터 90일 보관 후 식별 정보를 삭제한다(F-ETJOMB).
 */
export function useNotifications(userId = 'mock-student') {
  const queryClient = useQueryClient()
  const queryKey = notificationKeys.list(userId)

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey,
    queryFn: async () => MOCK_NOTIFICATIONS,
    staleTime: Infinity,
  })

  const unreadCount = notifications.filter((n) => !n.readAt).length

  /** 알림을 열면 읽음 상태를 갱신한다 */
  const markAsRead = useCallback(
    (id: string) => {
      queryClient.setQueryData<AppNotification[]>(queryKey, (prev) =>
        prev?.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
      )
    },
    [queryClient, queryKey],
  )

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString()
    queryClient.setQueryData<AppNotification[]>(queryKey, (prev) =>
      prev?.map((n) => (n.readAt ? n : { ...n, readAt: now })),
    )
  }, [queryClient, queryKey])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
