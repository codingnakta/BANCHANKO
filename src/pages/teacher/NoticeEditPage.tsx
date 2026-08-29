import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TeacherPageShell } from '@/components/layout'
import { Button, Card, Field, Input, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  createNotice,
  fetchNotice,
  noticeKeys,
  updateNotice,
  type NoticeInput,
} from '@/features/teacher/api/notices'
import { cn } from '@/lib/utils'
import type { PostType } from '@/lib/supabase/database.types'

const TYPE_LABEL: Record<PostType, string> = {
  notice: '공지',
  assignment: '과제',
  event: '행사',
}

const EMPTY: NoticeInput = {
  type: 'notice',
  title: '',
  body: '',
  subject: '',
  dueDate: '',
  linkUrl: '',
}

/** 안내 작성·수정 (F-WSHIYO). 파일 업로드는 제공하지 않고 외부 URL 만 연결한다. */
export function NoticeEditPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<NoticeInput>(EMPTY)

  const { data: existing, isPending: isLoading } = useQuery({
    queryKey: noticeKeys.detail(id ?? ''),
    queryFn: () => fetchNotice(id!),
    enabled: isEdit,
  })

  // 수정할 안내를 불러오면 한 번만 폼에 옮긴다
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (existing && existing.id !== loadedId) {
    setLoadedId(existing.id)
    setForm({
      type: existing.type,
      title: existing.title,
      body: existing.body ?? '',
      subject: existing.subject ?? '',
      dueDate: existing.due_date ?? '',
      linkUrl: existing.link_url ?? '',
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        await updateNotice(id!, form)
        return id!
      }
      return createNotice(classroomId, form)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      navigate(ROUTES.teacher.notices, { replace: true })
    },
  })

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const canSave = form.title.trim().length > 0

  return (
    <TeacherPageShell
      title={isEdit ? '안내 수정' : '새 안내'}
      backTo={ROUTES.teacher.notices}
      action={
        <Button
          size="md"
          onClick={() => mutation.mutate()}
          disabled={!canSave || mutation.isPending}
        >
          {mutation.isPending && <Spinner className="size-4" />}
          {isEdit ? '수정' : '등록'}
        </Button>
      }
    >
      <Card className="flex flex-col gap-5 p-5">
        {/* 유형 */}
        <div className="flex gap-2">
          {(['notice', 'assignment', 'event'] as PostType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, type })}
              className={cn(
                'flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-colors',
                form.type === type
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
              )}
            >
              {TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        {form.type === 'assignment' && (
          <div className="flex gap-3">
            <Field label="과목" htmlFor="subject">
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="수학"
              />
            </Field>
            <Field label="마감일" htmlFor="dueDate">
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
        )}

        {form.type === 'event' && (
          <Field label="행사 날짜" htmlFor="eventDate">
            <Input
              id="eventDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
        )}

        <Field label="제목" htmlFor="title">
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={
              form.type === 'assignment'
                ? '수학 익힘책 32~35p'
                : form.type === 'event'
                  ? '체육대회'
                  : '체육대회 반티 색상 투표 안내'
            }
          />
        </Field>

        <Field label="내용" htmlFor="body">
          <textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={7}
            placeholder="학생들에게 전할 내용을 적어주세요."
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-500"
          />
        </Field>

        <Field
          label="외부 자료 링크"
          htmlFor="linkUrl"
          hint="파일 첨부 대신 링크를 걸어주세요 (선택)"
        >
          <Input
            id="linkUrl"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            placeholder="drive.google.com/..."
          />
        </Field>

        {mutation.error && (
          <p role="alert" className="text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : '저장하지 못했어요.'}
          </p>
        )}
      </Card>
    </TeacherPageShell>
  )
}
