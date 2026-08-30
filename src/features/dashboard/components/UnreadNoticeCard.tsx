import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import type { Notice } from '@/types'

const TYPE_LABEL: Record<Notice['type'], string> = {
  notice: '공지',
  newsletter: '가정통신문',
  assignment: '과제',
}

interface UnreadNoticeCardProps {
  notices: Notice[]
}

/**
 * 최근 공지 — 대시보드에서 우선 표시한다. (F-ZTJSNU 규칙)
 * 읽음 추적은 아직 스키마에 없어서 '미확인'으로 구분하지 않는다.
 */
export function UnreadNoticeCard({ notices }: UnreadNoticeCardProps) {
  if (notices.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">
        최근 공지
        <span className="ml-2 text-sm font-semibold text-brand-500">{notices.length}</span>
      </h2>

      <ul className="flex flex-col gap-2">
        {notices.map((notice) => (
          <li key={notice.id}>
            <Link
              to={ROUTES.noticeDetail(notice.id)}
              className="group flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{notice.title}</p>
                {/* 올린 날짜는 보여주지 않는다 */}
                <p className="mt-0.5 text-xs text-ink-500">{TYPE_LABEL[notice.type]}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
