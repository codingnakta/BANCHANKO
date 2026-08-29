import { PinIcon } from '@/components/icons'
import { relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import { usePersonalTodos } from '../hooks/usePersonalTodos'

/**
 * 홈에 띄운 내 할일 한 줄.
 * 학급 과제 카드와 나란히 서지만 핀 색(핑크)으로 구분된다.
 */
export function MyTodoCard({ todoId }: { todoId: string }) {
  const { todos, toggleDone } = usePersonalTodos()
  const todo = todos.find((row) => row.id === todoId)
  if (!todo) return null

  return (
    <div className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <PinIcon filled className="size-7 shrink-0 text-mine-400" />

      <button
        type="button"
        onClick={() => toggleDone.mutate({ id: todo.id, done: !todo.done })}
        aria-pressed={todo.done}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            'block truncate text-base font-medium',
            todo.done ? 'text-ink-400 line-through' : 'text-ink-900',
          )}
        >
          {todo.title}
        </span>
        <span className="mt-0.5 block text-xs text-ink-500">내 할일</span>
      </button>

      {todo.due_date && !todo.done && (
        <span className="shrink-0 text-base font-medium text-ink-900 tabular-nums">
          {relativeDayLabel(`${todo.due_date}T00:00:00`)}
        </span>
      )}
    </div>
  )
}
