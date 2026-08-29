import { supabase } from '@/lib/supabase'
import type { AppNotification } from '@/types'

/**
 * 알림은 따로 쌓지 않고 교사가 올린 글을 그대로 본다.
 *
 * 알림 테이블을 두면 글 하나에 학생 수만큼 줄이 생기고, 고치거나 지울 때
 * 함께 손봐야 한다. 대신 누가 무엇을 읽었는지만 notification_reads 에
 * 한 줄씩 남긴다.
 */
export async function fetchNotifications(
  classroomId: string,
  userId: string,
): Promise<AppNotification[]> {
  const [postsResult, readsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, type, title, body, created_at')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('notification_reads').select('post_id, read_at').eq('user_id', userId),
  ])

  if (postsResult.error) {
    console.error('[알림] 조회 실패', postsResult.error)
    throw new Error('알림을 불러오지 못했어요.')
  }

  const readAtByPost = new Map((readsResult.data ?? []).map((row) => [row.post_id, row.read_at]))

  return (postsResult.data ?? []).map((post) => ({
    id: post.id,
    type: post.type === 'assignment' ? 'assignment_due' : 'notice',
    title: post.title,
    body: post.body ?? undefined,
    createdAt: post.created_at,
    readAt: readAtByPost.get(post.id) ?? null,
    href: `/notices/${post.id}`,
  }))
}

/** 그 알림 하나만 읽음으로 남긴다. 이미 읽었으면 시각을 그대로 둔다. */
export async function markNotificationRead(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_reads')
    .upsert({ user_id: userId, post_id: postId }, { onConflict: 'user_id,post_id' })

  if (error) {
    console.error('[알림] 읽음 표시 실패', error)
  }
}

/** 목록에 있는 것을 한꺼번에 읽음으로 남긴다 ('모두 읽음' 버튼). */
export async function markNotificationsRead(userId: string, postIds: string[]): Promise<void> {
  if (postIds.length === 0) return

  const { error } = await supabase
    .from('notification_reads')
    .upsert(
      postIds.map((postId) => ({ user_id: userId, post_id: postId })),
      { onConflict: 'user_id,post_id' },
    )

  if (error) {
    console.error('[알림] 모두 읽음 실패', error)
  }
}
