import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  createPersonalTodo,
  deletePersonalTodo,
  fetchPersonalTodos,
  personalTodoKeys,
  setPersonalTodoDone,
  setPersonalTodoDueDate,
} from '../api/personalTodos'

/** 내 할일 목록과 등록·완료·삭제. 전부 본인 것만 다룬다. */
export function usePersonalTodos() {
  const userId = useCurrentUser()?.id ?? ''
  const queryClient = useQueryClient()
  const key = personalTodoKeys.mine(userId)

  const query = useQuery({
    queryKey: key,
    queryFn: fetchPersonalTodos,
    enabled: Boolean(userId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: personalTodoKeys.all })

  const add = useMutation({
    mutationFn: (input: { title: string; dueDate: string }) => createPersonalTodo(userId, input),
    onSuccess: invalidate,
  })

  const toggleDone = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => setPersonalTodoDone(id, done),
    onSuccess: invalidate,
  })

  const setDueDate = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      setPersonalTodoDueDate(id, dueDate),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deletePersonalTodo(id),
    onSuccess: invalidate,
  })

  return {
    todos: query.data ?? [],
    isPending: query.isPending,
    add,
    toggleDone,
    setDueDate,
    remove,
  }
}
