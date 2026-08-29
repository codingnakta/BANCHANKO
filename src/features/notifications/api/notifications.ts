import { supabase } from '@/lib/supabase'
import type { AppNotification } from '@/types'

/**
 * 알림은 따로 쌓지 않고 교사가 올린 글을 그대로 본다.
 *
 * 알림 테이블을 두면 글을 올릴 때마다 학생 수만큼 줄이 생기고, 고치거나
 * 지울 때 함께 손봐야 한다. 학생마다 "어디까지 봤는지"(notifications_read_at)만
 * 알면 새 글을 가려낼 수 있어 그 칸 하나로 끝낸다.
 */
export async function fetchNotifications(
  classroomId: string,
  readAt: string | null,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, type, title, body, created_at')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[알림] 조회 실패', error)
    throw new Error('알림을 불러오지 못했어요.')
  }

  return (data ?? []).map((post) => ({
    id: post.id,
    type: post.type === 'assignment' ? 'assignment_due' : 'notice',
    title: post.title,
    body: post.body ?? undefined,
    createdAt: post.created_at,
    // 마지막으로 확인한 시각보다 나중에 올라왔으면 안 읽은 것이다
    readAt: readAt && post.created_at <= readAt ? readAt : null,
    href: `/notices/${post.id}`,
  }))
}

/** 지금까지 올라온 글을 다 본 것으로 표시한다. */
export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ notifications_read_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[알림] 읽음 표시 실패', error)
  }
}

/** 마지막으로 알림을 확인한 시각 */
export async function fetchNotificationsReadAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notifications_read_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[알림] 읽은 시각 조회 실패', error)
    return null
  }
  return data?.notifications_read_at ?? null
}
