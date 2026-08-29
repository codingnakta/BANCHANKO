import { supabase } from '@/lib/supabase'
import type { PersonalTodoRow } from '@/lib/supabase/database.types'

export const personalTodoKeys = {
  all: ['personalTodos'] as const,
  mine: (userId: string) => [...personalTodoKeys.all, userId] as const,
}

/**
 * 내 할일 — 학생이 스스로 적는 개인 할 일.
 * RLS 가 본인 것만 통과시키므로 조회에 따로 조건을 걸지 않아도 된다.
 */
export async function fetchPersonalTodos(): Promise<PersonalTodoRow[]> {
  const { data, error } = await supabase
    .from('personal_todos')
    .select('*')
    .order('done')
    .order('due_date', { nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[todo] 조회 실패', error)
    throw new Error('내 할일을 불러오지 못했어요.')
  }
  return data ?? []
}

export async function createPersonalTodo(
  userId: string,
  input: { title: string; dueDate: string },
): Promise<void> {
  const { error } = await supabase.from('personal_todos').insert({
    user_id: userId,
    title: input.title.trim(),
    due_date: input.dueDate || null,
  })

  if (error) {
    console.error('[todo] 등록 실패', error)
    throw new Error('할일을 등록하지 못했어요.')
  }
}

export async function setPersonalTodoDueDate(id: string, dueDate: string): Promise<void> {
  const { error } = await supabase
    .from('personal_todos')
    .update({ due_date: dueDate || null })
    .eq('id', id)

  if (error) {
    console.error('[todo] 마감일 변경 실패', error)
    throw new Error('마감일을 바꾸지 못했어요.')
  }
}

export async function setPersonalTodoDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('personal_todos').update({ done }).eq('id', id)
  if (error) {
    console.error('[todo] 완료 표시 실패', error)
    throw new Error('할일을 바꾸지 못했어요.')
  }
}

export async function deletePersonalTodo(id: string): Promise<void> {
  const { error } = await supabase.from('personal_todos').delete().eq('id', id)
  if (error) {
    console.error('[todo] 삭제 실패', error)
    throw new Error('할일을 지우지 못했어요.')
  }
}
