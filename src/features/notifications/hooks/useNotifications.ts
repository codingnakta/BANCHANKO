import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  fetchNotifications,
  fetchNotificationsReadAt,
  markNotificationsRead,
} from '../api/notifications'
import type { AppNotification } from '@/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
  readAt: (userId: string) => [...notificationKeys.all, 'readAt', userId] as const,
}

/**
 * 인앱 알림 (F-IAXPMY).
 *
 * 교사가 올린 공지·과제가 그대로 알림이 된다. 마지막으로 확인한 시각 뒤에
 * 올라온 것이 안 읽은 알림이고, 목록을 열면 다 본 것으로 표시한다.
 */
export function useNotifications() {
  const user = useCurrentUser()
  const userId = user?.id ?? ''
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const { data: readAt = null } = useQuery({
    queryKey: notificationKeys.readAt(userId),
    queryFn: () => fetchNotificationsReadAt(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: [...notificationKeys.list(userId), readAt],
    queryFn: () => fetchNotifications(classroomId, readAt),
    enabled: Boolean(userId && classroomId),
    staleTime: 30_000,
  })

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return
    await markNotificationsRead(userId)
    await queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }, [queryClient, unreadCount, userId])

  return { notifications, unreadCount, markAllAsRead }
}
