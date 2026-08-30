import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import { relativeDayLabel } from '@/lib/date'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 공지사항 — 학급에 올라온 공지와 과제 전체. */
export function NoticesSectionPage() {
  return (
    <ClassroomSectionShell title="공지사항" edit={{ to: ROUTES.teacher.notices, label: '관리' }}>
      {(data) =>
        data.notices.length === 0 ? (
          <Blank>올라온 공지가 없어요.</Blank>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.notices.map((notice) => (
              <li key={notice.id}>
                <Link
                  to={ROUTES.noticeDetail(notice.id)}
                  className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 transition-colors hover:bg-brand-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink-900">
                      {notice.title}
                    </span>
                    {/* 올린 날짜는 보여주지 않는다. 마감일만 오른쪽에 붙는다 */}
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {notice.type === 'assignment' ? '과제' : '공지'}
                      {notice.subject && ` · ${notice.subject}`}
                    </span>
                  </span>
                  {notice.dueAt && (
                    <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                      {relativeDayLabel(notice.dueAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )
      }
    </ClassroomSectionShell>
  )
}
