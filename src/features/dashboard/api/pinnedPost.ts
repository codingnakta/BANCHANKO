import { supabase } from '@/lib/supabase'

/** 핀은 두 가지다 — 학급 과제(파란 핀)와 내 할일(핑크 핀) */
export type PinColumn = 'pinned_post_id' | 'pinned_todo_id'

export const pinnedKeys = {
  all: ['pinned'] as const,
  mine: (userId: string, column: PinColumn) => [...pinnedKeys.all, column, userId] as const,
}

/** 내가 홈에 띄워 둔 것. 아직 고른 게 없으면 null. */
export async function fetchPinnedId(userId: string, column: PinColumn): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(column)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[pin] 조회 실패', error)
    return null
  }
  return (data as Record<string, string | null> | null)?.[column] ?? null
}

/** 핀을 옮기거나(id) 뺀다(null). 본인 행만 바꿀 수 있다. */
export async function savePinnedId(
  userId: string,
  column: PinColumn,
  id: string | null,
): Promise<void> {
  // 컬럼 이름이 변수라 update 인자를 좁혀 넘긴다
  const patch = column === 'pinned_post_id' ? { pinned_post_id: id } : { pinned_todo_id: id }

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)

  if (error) {
    console.error('[pin] 저장 실패', error)
    throw new Error('홈 고정을 바꾸지 못했어요.')
  }
}
