import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Button, EmptyState, Input, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser, useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { createNotice, noticeKeys } from '@/features/teacher/api/notices'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { DdayCard, useDashboard, usePinnedPost } from '@/features/dashboard'
import { useNotifications } from '@/features/notifications'
import { MyTodoList } from '@/features/todo'
import { getTodayIso, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * 할일 탭 (역할 공통).
 *
 * 다가오는 일정과 학급 과제를 모아 보여준다.
 * 교사에게는 맨 위에 작성 링크가 더 붙고, '내 할일'은 두 역할 모두 쓴다.
 */
export function TodoPage() {
  const isTeacher = useIsTeacher()
  const { pinnedId } = usePinnedPost()
  const { data, isPending } = useDashboard()
  const { unreadCount } = useNotifications()

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const events = data?.upcomingEvents ?? []
  // 홈에 고정한 과제는 목록에서도 맨 위에 둔다
  const assignments = [...(data?.upcomingAssignments ?? [])].sort(
    (a, b) => Number(b.id === pinnedId) - Number(a.id === pinnedId),
  )
  const todayIso = getTodayIso()

  return (
    <>
      <AppHeader title="할일" showBell={!isTeacher} hasUnreadNotification={unreadCount > 0} />

      <div className="flex flex-col gap-7">
        {/* 교사만 — 공지사항·과제 작성 */}
        {isTeacher && (
          <section className="flex gap-2">
            <Link
              to={ROUTES.teacher.noticeNew}
              className="flex-1 rounded-card bg-white px-4 py-3.5 text-center text-[15px] font-medium text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              공지사항·과제 작성
            </Link>
            <Link
              to={ROUTES.teacher.notices}
              className="rounded-card bg-white px-4 py-3.5 text-[15px] font-medium text-ink-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              관리
            </Link>
          </section>
        )}

        {/* 다가오는 일정 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">다가오는 일정</h2>
          {events.length === 0 ? (
            <EmptyState message="예정된 일정이 없습니다." />
          ) : (
            <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {events.map((event) => (
                <li key={event.id} className="border-b border-ink-100 last:border-0">
                  <Link
                    to={ROUTES.noticeDetail(event.id)}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink-900">
                        {event.title}
                      </span>
                      {event.description && (
                        <span className="mt-0.5 block truncate text-xs text-ink-500">
                          {event.description}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-base font-medium tabular-nums',
                        event.startAt.slice(0, 10) === todayIso ? 'text-danger' : 'text-ink-900',
                      )}
                    >
                      {relativeDayLabel(event.startAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 우리반 과제 — 선생님이 올리고, 학생도 받아 적은 과제를 더할 수 있다 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">우리반 과제</h2>
          {!isTeacher && <AddAssignment />}
          {assignments.length === 0 ? (
            <EmptyState message="지금 확인할 과제가 없습니다." />
          ) : (
            <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="border-b border-ink-100 last:border-0">
                  <DdayCard assignment={assignment} inList />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 내 할일 — 교사·학생 모두 스스로 적는다 */}
        <MyTodoList />
      </div>
    </>
  )
}

/**
 * 학생이 우리반 과제를 더하는 줄.
 *
 * 수업에서 받아 적은 과제를 반에 공유하는 자리다. 올린 과제는
 * 학급 전체가 보고, 고치거나 지우는 것은 올린 본인과 선생님만 할 수 있다.
 */
function AddAssignment() {
  const classroomId = useCurrentUser()?.classroomId ?? ''
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createNotice(classroomId, {
        type: 'assignment',
        title,
        body: '',
        subject,
        dueDate,
        linkUrl: '',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await invalidateClassroomViews(queryClient)
      setTitle('')
      setSubject('')
      setDueDate('')
    },
  })

  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="과목"
          aria-label="과목"
          className="w-24 shrink-0"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && mutation.mutate()}
          placeholder="과제를 적어보세요"
          aria-label="과제"
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="마감일"
        />
        <Button
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
          aria-label="과제 추가"
        >
          <Plus className="size-4" />
          추가
        </Button>
      </div>

      {mutation.error && (
        <p role="alert" className="text-sm text-danger">
          {mutation.error instanceof Error ? mutation.error.message : '등록하지 못했어요.'}
        </p>
      )}
    </div>
  )
}
