import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants'
import { usePersonalTodos } from '@/features/todo'
import { isPast, relativeDayLabel } from '@/lib/date'
import { usePinnedPost, usePinnedTodo } from '../hooks/usePinnedPost'
import { DdayCard } from './DdayCard'
import { TaskCard } from './TaskCard'
import type { Notice } from '@/types'

interface PinnedTasksProps {
  /** 학급에 올라온 과제 전체 — 그중 핀을 꽂은 하나만 보여준다 */
  assignments: Notice[]
}

/**
 * 홈에 꽂아 둔 것 — 우리반 과제 하나와 내 할일 하나.
 *
 * 나눠 놓지 않고 한 자리에 세운다. 어느 쪽인지는 핀 색으로 안다.
 * 파란 핀은 우리반 과제, 핑크 핀은 내 할일이고 각각 하나씩만 꽂힌다.
 * 기한이 지난 과제는 홈에 띄우지 않는다.
 */
export function PinnedTasks({ assignments }: PinnedTasksProps) {
  const { pinnedId } = usePinnedPost()
  const { pinnedId: pinnedTodoId, toggle: toggleTodoPin } = usePinnedTodo()
  const { todos, toggleDone, remove } = usePersonalTodos()

  const pinnedAssignment = assignments.find((item) => item.id === pinnedId)
  const assignment = pinnedAssignment && !isPast(pinnedAssignment.dueAt) ? pinnedAssignment : null
  const todo = todos.find((item) => item.id === pinnedTodoId)

  return (
    <section>
      <h2 className="mb-2 px-1 text-xl font-semibold text-ink-900">챙길 것</h2>

      {!assignment && !todo ? (
        <p className="rounded-card bg-white px-4 py-6 text-center text-sm text-ink-500 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {pinnedAssignment
            ? '고정한 과제의 기한이 지났어요. '
            : '할일에서 핀을 꽂으면 여기에 보여요. '}
          <Link to={ROUTES.todo} className="font-medium text-brand-500 hover:underline">
            할일 열기
          </Link>
        </p>
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {assignment && (
            <div className="border-b border-ink-100 last:border-0">
              <DdayCard assignment={assignment} inList />
            </div>
          )}

          {todo && (
            <div className="border-b border-ink-100 last:border-0">
              <TaskCard
                title={todo.title}
                subject="내 할일"
                tone="mine"
                done={todo.done}
                dday={
                  todo.due_date && !todo.done
                    ? relativeDayLabel(`${todo.due_date}T00:00:00`)
                    : null
                }
                pinned
                onTogglePin={() => toggleTodoPin(todo.id)}
                inList
              >
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={todo.done ? 'secondary' : 'primary'}
                    onClick={() => toggleDone.mutate({ id: todo.id, done: !todo.done })}
                  >
                    <Check className="size-4" />
                    {todo.done ? '완료 취소' : '완료'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(todo.id)}>
                    지우기
                  </Button>
                </div>
              </TaskCard>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
