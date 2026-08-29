import { useState } from 'react'
import bunnyMascot from '@/assets/mascots/bunny.png'
import catMascot from '@/assets/mascots/cat.png'
import { formatTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { MealMenu, TimetableEntry } from '@/types'

type TabKey = 'timetable' | 'meal'

interface TimetableMealTabsProps {
  entries: TimetableEntry[] | null
  meal: MealMenu | null
  /** 현재 진행 중인 교시 — 시안에서 파란색으로 강조된다 */
  currentPeriod?: number
}

/**
 * 시간표 / 급식 전환 섹션.
 * 두 데이터 모두 교사 검수·공개된 것만 전달된다. (F-OHHQTM)
 * 시안대로 탭에 따라 우측 마스코트가 토끼 ↔ 고양이로 바뀐다.
 */
export function TimetableMealTabs({ entries, meal, currentPeriod }: TimetableMealTabsProps) {
  const [tab, setTab] = useState<TabKey>('timetable')

  return (
    <section>
      {/* 마스코트가 행 높이를 만들고, 탭은 그 아래쪽 기준선에 정렬된다 */}
      <div className="flex items-end gap-5 px-1">
        <TabButton active={tab === 'timetable'} onClick={() => setTab('timetable')}>
          시간표
        </TabButton>
        <TabButton active={tab === 'meal'} onClick={() => setTab('meal')}>
          급식
        </TabButton>

        <img
          src={tab === 'timetable' ? bunnyMascot : catMascot}
          alt=""
          draggable={false}
          className="ml-auto mr-1 h-16 w-auto select-none"
        />
      </div>

      <div className="mt-2 rounded-card bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {tab === 'timetable' ? (
          <TimetableList entries={entries} currentPeriod={currentPeriod} />
        ) : (
          <MealList meal={meal} />
        )}
      </div>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'pb-1.5 text-xl font-semibold transition-colors',
        active
          ? 'border-b-2 border-brand-500 text-ink-900'
          : 'border-b-2 border-transparent text-[#b1b1b1] hover:text-ink-600',
      )}
    >
      {children}
    </button>
  )
}

function TimetableList({
  entries,
  currentPeriod,
}: {
  entries: TimetableEntry[] | null
  currentPeriod?: number
}) {
  if (!entries || entries.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-500">공개된 오늘 시간표가 없습니다.</p>
  }

  return (
    <ol className="flex flex-col">
      {entries.map((entry) => {
        const isCurrent = entry.period === currentPeriod
        const isEmpty = !entry.subject
        return (
          <li key={entry.id} className="flex items-center gap-4 py-1">
            <span
              className={cn(
                'w-14 shrink-0 text-xs font-medium',
                isCurrent ? 'text-brand-700' : 'text-[#9b9b9b]',
              )}
            >
              {entry.periodLabel ?? `${entry.period}교시`}
            </span>
            <span
              className={cn(
                'text-[15px] font-medium',
                isEmpty && 'text-ink-400',
                isCurrent && 'text-brand-700',
                !isEmpty && !isCurrent && 'text-ink-900',
              )}
            >
              {entry.subject || '-'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function MealList({ meal }: { meal: MealMenu | null }) {
  if (!meal || meal.items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-500">공개된 오늘 급식 정보가 없습니다.</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {meal.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-900" aria-hidden />
            <span className="text-[15px] text-ink-900">{item}</span>
          </li>
        ))}
      </ul>
      {/* 마지막 정상 데이터의 기준 시각 표시 (F-OHHQTM) */}
      <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
        {formatTime(meal.syncedAt)} 기준
      </p>
    </>
  )
}
