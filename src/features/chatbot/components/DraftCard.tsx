import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { createNotice, noticeKeys } from '@/features/teacher/api/notices'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { formatDate } from '@/lib/date'
import type { ChatDraft } from '@/types'

/**
 * AI 가 만들어 온 등록 초안.
 *
 * 여기서 교사가 확인하고 눌러야 실제로 등록된다. AI 가 직접 쓰지 않는다.
 * 제목·날짜는 바로 고칠 수 있고, 내용을 더 손보려면 등록 후 안내 관리에서 수정한다.
 */
export function DraftCard({ draft }: { draft: ChatDraft }) {
  const classroomId = useCurrentUser()?.classroomId ?? ''
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(draft.title)
  const [date, setDate] = useState(draft.date ?? '')
  const [editing, setEditing] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createNotice(classroomId, {
        type: draft.type,
        title,
        body: draft.body,
        subject: draft.subject ?? '',
        dueDate: date,
        linkUrl: '',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await invalidateClassroomViews(queryClient)
    },
  })

  const typeLabel = draft.type === 'assignment' ? '과제' : '공지'

  if (mutation.isSuccess) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
        <Check className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          {typeLabel} “{title}” 등록했어요.
        </span>
        <a href={ROUTES.teacher.notices} className="shrink-0 font-medium hover:underline">
          보러가기
        </a>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-ink-200 bg-white px-4 py-3.5">
      <p className="mb-2 text-[11px] font-medium text-ink-500">이렇게 등록할까요?</p>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Field label="제목" htmlFor="draftTitle">
            <Input
              id="draftTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label={draft.type === 'assignment' ? '마감일' : '날짜'} htmlFor="draftDate">
            <Input
              id="draftDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>
      ) : (
        <>
          <p className="text-[15px] font-medium text-ink-900">
            <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {typeLabel}
            </span>
            {title}
          </p>
          {date && (
            <p className="mt-1 text-xs text-ink-500">
              {draft.type === 'assignment' ? '마감 ' : '일정 '}
              {formatDate(`${date}T00:00:00`)}
              {draft.subject && ` · ${draft.subject}`}
            </p>
          )}
          {draft.body && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
              {draft.body}
            </p>
          )}
        </>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
        >
          {mutation.isPending ? '등록 중…' : '등록'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing((prev) => !prev)}>
          <Pencil className="size-4" />
          {editing ? '미리보기' : '고치기'}
        </Button>
      </div>

      {mutation.error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {mutation.error instanceof Error ? mutation.error.message : '등록하지 못했어요.'}
        </p>
      )}
    </div>
  )
}
