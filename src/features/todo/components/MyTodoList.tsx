import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { PinIcon } from '@/components/icons'
import { Button, Input } from '@/components/ui'
import { usePinnedTodo } from '@/features/dashboard'
import { relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import { usePersonalTodos } from '../hooks/usePersonalTodos'

/**
 * 내 할일 — 학생이 스스로 적는 개인 할 일.
 *
 * 학급 과제와 섞이지 않도록 핀 색을 나눈다. 학급 과제는 파란 핀,
 * 내 할일은 핑크 핀이고 각각 하나씩 홈에 띄울 수 있다.
 * 이 목록은 본인 말고는 아무도 보지 못한다.
 */
export function MyTodoList() {
  const { todos, add, toggleDone, remove } = usePersonalTodos()
  const { pinnedId, toggle } = usePinnedTodo()

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  function submit() {
    if (!title.trim() || add.isPending) return
    add.mutate({ title, dueDate }, { onSuccess: () => {
      setTitle('')
      setDueDate('')
    } })
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2 px-1">
        <h2 className="text-lg font-bold text-ink-900">내 할일</h2>
        <span className="text-xs text-ink-400">나만 볼 수 있어요</span>
      </div>

      {/* 등록 */}
      <div className="mb-2 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="할 일을 적어보세요"
          aria-label="할 일"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="마감일"
          className="w-36 shrink-0"
        />
        <Button onClick={submit} disabled={!title.trim() || add.isPending} aria-label="추가">
          <Plus className="size-4" />
        </Button>
      </div>

      {add.error && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {add.error instanceof Error ? add.error.message : '등록하지 못했어요.'}
        </p>
      )}

      {todos.length === 0 ? (
        <p className="rounded-card bg-white px-4 py-4 text-sm text-ink-500 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          아직 적어둔 할 일이 없어요.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {todos.map((todo) => {
            const pinned = pinnedId === todo.id
            return (
              <li
                key={todo.id}
                className="flex items-center gap-2.5 border-b border-ink-100 px-4 py-3 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => toggle(todo.id)}
                  aria-pressed={pinned}
                  aria-label={pinned ? `${todo.title} 홈 고정 해제` : `${todo.title} 홈에 고정`}
                  className={cn(
                    'shrink-0 transition-colors',
                    pinned ? 'text-mine-400' : 'text-ink-300 hover:text-mine-300',
                  )}
                >
                  <PinIcon filled={pinned} className="size-6" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleDone.mutate({ id: todo.id, done: !todo.done })}
                  aria-pressed={todo.done}
                  aria-label={`${todo.title} ${todo.done ? '완료 취소' : '완료'}`}
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    todo.done
                      ? 'border-mine-400 bg-mine-400 text-white'
                      : 'border-ink-300 text-transparent hover:border-mine-300',
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </button>

                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[15px]',
                    todo.done ? 'text-ink-400 line-through' : 'text-ink-900',
                  )}
                >
                  {todo.title}
                </span>

                {todo.due_date && !todo.done && (
                  <span className="shrink-0 text-sm font-medium text-ink-500 tabular-nums">
                    {relativeDayLabel(`${todo.due_date}T00:00:00`)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remove.mutate(todo.id)}
                  aria-label={`${todo.title} 지우기`}
                  className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
