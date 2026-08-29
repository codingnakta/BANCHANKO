import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { TaskCard, usePinnedTodo } from '@/features/dashboard'
import { relativeDayLabel } from '@/lib/date'
import { usePersonalTodos } from '../hooks/usePersonalTodos'

/**
 * 내 할일 — 학생이 스스로 적는 개인 할 일.
 *
 * 모양은 우리반 과제와 같고 핀·화살표 색만 핑크다.
 * 학급 과제와 따로 하나씩 홈에 띄울 수 있다.
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
          {todos.map((todo) => (
            <li key={todo.id} className="border-b border-ink-100 last:border-0">
              <TaskCard
                title={todo.title}
                dday={
                  todo.due_date && !todo.done
                    ? relativeDayLabel(`${todo.due_date}T00:00:00`)
                    : null
                }
                tone="mine"
                done={todo.done}
                pinned={pinnedId === todo.id}
                onTogglePin={() => toggle(todo.id)}
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
                    <Trash2 className="size-4" />
                    지우기
                  </Button>
                </div>
              </TaskCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
