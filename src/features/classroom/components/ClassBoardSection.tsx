import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/ui'
import { ROUTES } from '@/constants'
import { formatDate, isImminent, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { ClassEvent, Notice } from '@/types'

type Filter = 'all' | 'notice' | 'newsletter' | 'assignment' | 'event'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'newsletter', label: '가정통신문' },
  { key: 'assignment', label: '과제' },
  { key: 'event', label: '행사' },
]

/** 목록에 섞어 보여주기 위한 공통 형태 */
interface BoardItem {
  id: string
  kind: Filter
  label: string
  title: string
  /** 정렬·표시에 쓰는 기준 시각 */
  date: string
  /** 마감·시작이 있으면 D-day 를 표시한다 */
  dueAt?: string
  href: string
}

interface ClassBoardSectionProps {
  notices: Notice[]
  events: ClassEvent[]
}

/**
 * 공지·가정통신문·과제·행사 목록 (F-WSHIYO · F-WFEXUJ).
 * 공개된 항목만 전달되며, 각 항목은 원본 상세로 이동한다.
 */
export function ClassBoardSection({ notices, events }: ClassBoardSectionProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const items: BoardItem[] = [
    ...notices.map((n) => ({
      id: n.id,
      kind: n.type as Filter,
      label: { notice: '공지', newsletter: '가정통신문', assignment: '과제' }[n.type],
      title: n.title,
      date: n.publishedAt,
      dueAt: n.dueAt,
      href: ROUTES.noticeDetail(n.id),
    })),
    ...events.map((e) => ({
      id: e.id,
      kind: 'event' as const,
      label: '행사',
      title: e.title,
      date: e.startAt,
      dueAt: e.startAt,
      href: ROUTES.eventDetail(e.id),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const visible = filter === 'all' ? items : items.filter((item) => item.kind === filter)

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">안내</h2>

      <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-1.5">
          {FILTERS.map((f) => (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'border-brand-400 bg-brand-400 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-brand-50',
                )}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {visible.length === 0 ? (
        <EmptyState message="표시할 안내가 없습니다." />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                to={item.href}
                className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {item.label} · {formatDate(item.date)}
                  </p>
                </div>

                {/* 당일·임박 항목은 일반 예정 정보와 구분해 표시한다 */}
                {item.dueAt && (
                  <span
                    className={cn(
                      'shrink-0 text-sm font-medium tabular-nums',
                      isImminent(item.dueAt) ? 'text-brand-500' : 'text-ink-400',
                    )}
                  >
                    {relativeDayLabel(item.dueAt)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
