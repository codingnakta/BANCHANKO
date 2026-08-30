import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { TeacherPageShell } from '@/components/layout'
import { Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { deleteNotice, fetchNotices, noticeKeys } from '@/features/teacher/api/notices'
import { formatDate, relativeDayLabel } from '@/lib/date'
import type { PostType } from '@/lib/supabase/database.types'

const TYPE_LABEL: Record<PostType, string> = { notice: '공지', assignment: '과제', event: '행사' }
const TYPE_TONE: Record<PostType, 'brand' | 'warning' | 'success'> = {
  notice: 'brand',
  assignment: 'warning',
  event: 'success',
}

/** 안내 관리 — 공지·과제·행사 목록 (F-WSHIYO). */
export function NoticesPage() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const { data: notices, isPending } = useQuery({
    queryKey: noticeKeys.list(classroomId),
    queryFn: () => fetchNotices(classroomId),
    enabled: Boolean(classroomId),
  })

  const removeMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.list(classroomId) })
      await invalidateClassroomViews(queryClient)
    },
  })

  return (
    <TeacherPageShell
      title="안내 관리"
      action={
        <Link to={ROUTES.teacher.noticeNew}>
          <Button size="md">
            <Plus className="size-4" />
            새 안내
          </Button>
        </Link>
      }
    >
      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !notices || notices.length === 0 ? (
        <EmptyState
          message="아직 올린 안내가 없어요."
          action={
            <Link to={ROUTES.teacher.noticeNew}>
              <Button size="md">첫 안내 쓰기</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={TYPE_TONE[notice.type]}>{TYPE_LABEL[notice.type]}</Badge>
                    {notice.subject && <Badge tone="neutral">{notice.subject}</Badge>}
                  </div>

                  <Link
                    to={ROUTES.noticeDetail(notice.id)}
                    className="block truncate text-[15px] font-medium text-ink-900 hover:underline"
                  >
                    {notice.title}
                  </Link>

                  {/* 등록일은 빼고 마감·일정 날짜만 보여준다 */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    {notice.due_date && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3" />
                        {notice.type === 'assignment' ? '마감 ' : '일정 '}
                        {formatDate(`${notice.due_date}T00:00:00`)} (
                        {relativeDayLabel(`${notice.due_date}T00:00:00`)})
                      </span>
                    )}
                    {notice.link_url && (
                      <span className="flex items-center gap-1">
                        <Link2 className="size-3" />
                        링크
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Link
                    to={ROUTES.teacher.noticeEdit(notice.id)}
                    aria-label={`${notice.title} 수정`}
                    className="rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(notice.id)}
                    aria-label={`${notice.title} 삭제`}
                    className="rounded-full p-2 text-ink-400 transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {removeMutation.error && (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {removeMutation.error instanceof Error
            ? removeMutation.error.message
            : '삭제하지 못했어요.'}
        </p>
      )}
    </TeacherPageShell>
  )
}
