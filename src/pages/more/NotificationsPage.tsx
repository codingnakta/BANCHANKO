import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell, CalendarDays, ChevronLeft, Megaphone, NotebookPen, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useNotifications } from '@/features/notifications'
import { formatDate, formatTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { AppNotification, NotificationType } from '@/types'

const TYPE_META: Record<NotificationType, { label: string; icon: typeof Bell }> = {
  notice: { label: '공지', icon: Megaphone },
  assignment_due: { label: '과제 마감', icon: NotebookPen },
  cleaning_duty: { label: '청소 당번', icon: Sparkles },
  event: { label: '행사', icon: CalendarDays },
}

/**
 * 알림 목록 (F-IAXPMY).
 * 읽음·읽지 않음을 구분해 표시하고, 선택하면 읽음 처리 후 연결 원본으로 이동한다.
 * 원본이 종료·삭제된 알림은 접근 불가를 안내한다.
 */
export function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  // 들어온 순간 안 읽었던 것을 기억해 뒀다가 그것만 강조한다
  const [unreadIds, setUnreadIds] = useState<string[] | null>(null)
  if (unreadIds === null && notifications.length > 0) {
    setUnreadIds(notifications.filter((item) => !item.readAt).map((item) => item.id))
  }

  // 화면을 여는 것이 곧 확인이라, 목록은 곧바로 읽음으로 넘긴다
  useEffect(() => {
    void markAllAsRead()
  }, [markAllAsRead])

  function handleOpen(notification: AppNotification) {
    if (notification.href) navigate(notification.href)
  }

  return (
    <>
      <header className="mb-5 flex items-center gap-1">
        <Link
          to={ROUTES.more}
          aria-label="뒤로"
          className="-ml-2 rounded-full p-1.5 text-ink-700 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">알림</h1>

        {unreadCount > 0 && (
          <span className="ml-auto text-sm font-medium text-brand-500">새 알림 {unreadCount}</span>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyState message="받은 알림이 없습니다." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type]
            const isUnread = unreadIds?.includes(notification.id) ?? !notification.readAt
            const isGone = notification.href === null

            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-card px-4 py-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors',
                    isUnread ? 'bg-brand-50' : 'bg-white',
                    !isGone && 'hover:bg-brand-100',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full',
                      isUnread ? 'bg-brand-400 text-white' : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    <meta.icon className="size-[18px]" strokeWidth={2} aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          'truncate text-[15px]',
                          isUnread ? 'font-semibold text-ink-900' : 'font-medium text-ink-700',
                        )}
                      >
                        {notification.title}
                      </p>
                      {isUnread && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-brand-500"
                          aria-label="읽지 않음"
                        />
                      )}
                    </div>

                    {notification.body && (
                      <p className="mt-0.5 truncate text-sm text-ink-600">{notification.body}</p>
                    )}

                    <p className="mt-1 text-xs text-ink-400">
                      {meta.label} · {formatDate(notification.createdAt, 'M월 d일')}{' '}
                      {formatTime(notification.createdAt)}
                    </p>

                    {/* 연결 원본이 종료·삭제된 경우 (F-IAXPMY 예외) */}
                    {isGone && (
                      <p className="mt-1.5 text-xs text-ink-500">
                        연결된 내용이 종료되어 열 수 없어요.
                      </p>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-6 px-1 text-xs text-ink-400">
        알림은 서비스 안에서만 표시되며 푸시·문자·이메일로 발송되지 않습니다.
      </p>
    </>
  )
}
