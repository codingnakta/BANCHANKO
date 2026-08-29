import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  fetchNotifications,
  markNotificationRead,
  markNotificationsRead,
} from '../api/notifications'
import type { AppNotification } from '@/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, 'list', userId] as const,
}

/**
 * 인앱 알림 (F-IAXPMY).
 *
 * 교사가 올린 공지·과제가 그대로 알림이 된다.
 * 읽음은 한 줄씩 — 목록을 열어 본 것만으로는 읽음이 되지 않고,
 * 그 알림을 눌러 내용을 봐야 읽음으로 남는다.
 */
export function useNotifications() {
  const user = useCurrentUser()
  const userId = user?.id ?? ''
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: notificationKeys.list(userId),
    queryFn: () => fetchNotifications(classroomId, userId),
    enabled: Boolean(userId && classroomId),
    staleTime: 30_000,
  })

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const markAsRead = useCallback(
    async (postId: string) => {
      if (!userId) return
      await markNotificationRead(userId, postId)
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    [queryClient, userId],
  )

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.readAt).map((item) => item.id)
    if (!userId || unread.length === 0) return

    await markNotificationsRead(userId, unread)
    await queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }, [notifications, queryClient, userId])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
