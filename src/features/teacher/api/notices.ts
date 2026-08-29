import { supabase } from '@/lib/supabase'
import type { PostRow, PostType } from '@/lib/supabase/database.types'

export const noticeKeys = {
  all: ['teacherNotices'] as const,
  list: (classroomId: string) => [...noticeKeys.all, classroomId] as const,
  detail: (id: string) => [...noticeKeys.all, 'detail', id] as const,
}

export interface NoticeInput {
  type: PostType
  title: string
  body: string
  /** 과제만 사용 */
  subject: string
  /** 과제 마감일 (yyyy-MM-dd) */
  dueDate: string
  linkUrl: string
}

export async function fetchNotices(classroomId: string): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[notices] 조회 실패', error)
    throw new Error('안내를 불러오지 못했어요.')
  }
  return data ?? []
}

export async function fetchNotice(id: string): Promise<PostRow | null> {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
  if (error) {
    console.error('[notices] 상세 조회 실패', error)
    throw new Error('안내를 불러오지 못했어요.')
  }
  return data
}

/** 외부 자료 URL 은 저장 전에 형태를 확인한다 (F-WSHIYO 예외). */
export function normalizeLinkUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null

  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    new URL(withScheme)
    return withScheme
  } catch {
    throw new Error('외부 자료 주소가 올바르지 않아요.')
  }
}

export async function createNotice(classroomId: string, input: NoticeInput): Promise<string> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('로그인이 만료됐어요.')

  const { data, error } = await supabase
    .from('posts')
    .insert({
      classroom_id: classroomId,
      author_id: userData.user.id,
      type: input.type,
      // 과제에만 과목이 붙는다 (DB CHECK 제약과 같은 규칙)
      subject: input.type === 'assignment' ? input.subject.trim() || null : null,
      title: input.title.trim(),
      body: input.body.trim() || null,
      // 과제는 마감일, 행사는 행사 날짜를 같은 컬럼에 담는다
      due_date: input.type !== 'notice' && input.dueDate ? input.dueDate : null,
      link_url: normalizeLinkUrl(input.linkUrl),
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[notices] 등록 실패', error)
    throw new Error('안내를 등록하지 못했어요.')
  }
  return data.id
}

export async function updateNotice(id: string, input: NoticeInput): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({
      subject: input.type === 'assignment' ? input.subject.trim() || null : null,
      title: input.title.trim(),
      body: input.body.trim() || null,
      // 과제는 마감일, 행사는 행사 날짜를 같은 컬럼에 담는다
      due_date: input.type !== 'notice' && input.dueDate ? input.dueDate : null,
      link_url: normalizeLinkUrl(input.linkUrl),
    })
    .eq('id', id)

  if (error) {
    console.error('[notices] 수정 실패', error)
    throw new Error('안내를 수정하지 못했어요.')
  }
}

export async function deleteNotice(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) {
    console.error('[notices] 삭제 실패', error)
    throw new Error('안내를 삭제하지 못했어요.')
  }
}
