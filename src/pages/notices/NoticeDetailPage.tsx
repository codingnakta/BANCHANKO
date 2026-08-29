import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronLeft, ExternalLink, Pencil } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { fetchNotice, noticeKeys } from '@/features/teacher/api/notices'
import { formatDate, relativeDayLabel } from '@/lib/date'

/**
 * 공지·과제 상세 (F-WSHIYO).
 * 교사와 학생이 같은 화면을 보고, 수정 버튼만 교사에게 보인다.
 * 파일 제출·제출 현황은 제공하지 않는다 (외부 URL 만 연결).
 */
export function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isTeacher = useIsTeacher()

  const { data: notice, isPending } = useQuery({
    queryKey: noticeKeys.detail(id ?? ''),
    queryFn: () => fetchNotice(id!),
    enabled: Boolean(id),
  })

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!notice) {
    return <EmptyState message="안내를 찾을 수 없어요. 삭제되었을 수 있습니다." />
  }

  const isAssignment = notice.type === 'assignment'
  const dueIso = notice.due_date ? `${notice.due_date}T00:00:00` : null

  return (
    <>
      <header className="mb-5 flex items-start gap-1">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="뒤로"
          className="-ml-2 mt-0.5 rounded-full p-1.5 text-ink-700 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={isAssignment ? 'warning' : 'brand'}>{isAssignment ? '과제' : '공지'}</Badge>
            {notice.subject && <Badge tone="neutral">{notice.subject}</Badge>}
          </div>
          <h1 className="text-xl font-bold text-ink-900">{notice.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{formatDate(notice.created_at)}</p>
        </div>
        {isTeacher && (
          <Link to={ROUTES.teacher.noticeEdit(notice.id)}>
            <Button variant="secondary" size="md">
              <Pencil className="size-4" />
              수정
            </Button>
          </Link>
        )}
      </header>

      {dueIso && (
        <Card className="mb-4 flex items-center gap-2 p-4">
          <CalendarClock className="size-5 shrink-0 text-brand-700" aria-hidden />
          <p className="text-sm text-ink-800">
            마감 {formatDate(dueIso)}
            <span className="ml-2 font-semibold text-brand-700">{relativeDayLabel(dueIso)}</span>
          </p>
        </Card>
      )}

      <Card className="p-5">
        {notice.body ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink-800">
            {notice.body}
          </p>
        ) : (
          <p className="text-sm text-ink-500">내용이 없어요.</p>
        )}

        {notice.link_url && (
          <a
            href={notice.link_url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span className="truncate">첨부 자료 열기</span>
          </a>
        )}
      </Card>
    </>
  )
}
