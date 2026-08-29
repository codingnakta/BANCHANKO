import { useState } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants'
import { relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import { usePersonalTodos } from '@/features/todo'
import { usePinnedPost, usePinnedTodo } from '../hooks/usePinnedPost'
import { TaskCard } from './TaskCard'
import type { Notice } from '@/types'

type TabKey = 'assignment' | 'todo'

interface AssignmentTodoTabsProps {
  /** 학급에 올라온 과제 전체 — 그중 핀을 꽂은 하나만 보여준다 */
  assignments: Notice[]
}

/**
 * 과제 안내 — 우리반 과제와 내 할일을 탭으로 오간다.
 *
 * 두 쪽 다 홈에는 핀으로 고른 하나만 띄운다. 카드 모양은 같고
 * 핀·화살표 색만 다르다 — 우리반 과제는 파란색, 내 할일은 핑크색.
 */
export function AssignmentTodoTabs({ assignments }: AssignmentTodoTabsProps) {
  const [tab, setTab] = useState<TabKey>('assignment')
  const { pinnedId, toggle: togglePin } = usePinnedPost()
  const { pinnedId: pinnedTodoId, toggle: toggleTodoPin } = usePinnedTodo()
  const { todos, toggleDone, remove } = usePersonalTodos()

  const assignment = assignments.find((item) => item.id === pinnedId)
  const todo = todos.find((item) => item.id === pinnedTodoId)

  return (
    <section>
      <div className="flex items-end gap-5 px-1">
        <TabButton active={tab === 'assignment'} onClick={() => setTab('assignment')}>
          우리반 과제
        </TabButton>
        <TabButton active={tab === 'todo'} onClick={() => setTab('todo')}>
          내 할일
        </TabButton>
      </div>

      <div className="mt-2 overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {tab === 'assignment' ? (
          assignment ? (
            <TaskCard
              title={assignment.title}
              dday={assignment.dueAt ? relativeDayLabel(assignment.dueAt) : null}
              pinned
              onTogglePin={() => togglePin(assignment.id)}
              inList
            >
              {assignment.body ? (
                <p className="text-sm leading-relaxed text-ink-600">{assignment.body}</p>
              ) : null}
              <Link
                to={ROUTES.noticeDetail(assignment.id)}
                className="mt-2 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                원문 보기
              </Link>
            </TaskCard>
          ) : (
            <Blank>할일에서 파란 핀을 꽂으면 여기에 보여요.</Blank>
          )
        ) : todo ? (
          <TaskCard
            title={todo.title}
            dday={
              todo.due_date && !todo.done ? relativeDayLabel(`${todo.due_date}T00:00:00`) : null
            }
            tone="mine"
            done={todo.done}
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
        ) : (
          <Blank>할일에서 핑크 핀을 꽂으면 여기에 보여요.</Blank>
        )}
      </div>
    </section>
  )
}

function Blank({ children }: { children: string }) {
  return (
    <p className="py-4 text-center text-sm text-ink-500">
      {children}{' '}
      <Link to={ROUTES.todo} className="font-medium text-brand-500 hover:underline">
        할일 열기
      </Link>
    </p>
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
