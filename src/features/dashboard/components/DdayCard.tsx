import { usePinnedPost } from '../hooks/usePinnedPost'
import { TaskCard } from './TaskCard'
import { relativeDayLabel } from '@/lib/date'
import type { Notice } from '@/types'

interface DdayCardProps {
  assignment: Notice
  /** 목록 안에 줄로 들어갈 때 */
  inList?: boolean
}

/**
 * 우리반 과제 한 건. 펼치면 내용을 보여준다.
 * 왼쪽 파란 핀을 누르면 이 과제를 홈에 띄운다.
 */
export function DdayCard({ assignment, inList }: DdayCardProps) {
  const { pinnedId, toggle } = usePinnedPost()

  return (
    <TaskCard
      title={assignment.title}
      dday={assignment.dueAt ? relativeDayLabel(assignment.dueAt) : null}
      pinned={pinnedId === assignment.id}
      onTogglePin={() => toggle(assignment.id)}
      inList={inList}
    >
      {assignment.body && (
        <p className="text-sm leading-relaxed text-ink-600">{assignment.body}</p>
      )}
    </TaskCard>
  )
}
