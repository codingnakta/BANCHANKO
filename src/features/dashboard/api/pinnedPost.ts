import { supabase } from '@/lib/supabase'

export const pinnedPostKeys = {
  all: ['pinnedPost'] as const,
  mine: (userId: string) => [...pinnedPostKeys.all, userId] as const,
}

/** 내가 홈에 띄워 둔 글. 아직 고른 게 없으면 null. */
export async function fetchPinnedPostId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('pinned_post_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[pin] 조회 실패', error)
    return null
  }
  return data?.pinned_post_id ?? null
}

/** 핀을 옮기거나(글 id) 뺀다(null). 본인 행만 바꿀 수 있다. */
export async function savePinnedPostId(userId: string, postId: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ pinned_post_id: postId })
    .eq('id', userId)

  if (error) {
    console.error('[pin] 저장 실패', error)
    throw new Error('홈 고정을 바꾸지 못했어요.')
  }
}
