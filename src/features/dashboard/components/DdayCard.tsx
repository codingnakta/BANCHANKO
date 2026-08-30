import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, DateDialog } from '@/components/ui'
import { useCurrentUser, useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { deleteNotice, noticeKeys, updateNoticeDueDate } from '@/features/teacher/api/notices'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { usePinnedPost } from '../hooks/usePinnedPost'
import { TaskCard } from './TaskCard'
import { relativeDayLabel } from '@/lib/date'
import type { Notice } from '@/types'

interface DdayCardProps {
  assignment: Notice
  /** 목록 안에 줄로 들어갈 때 */
  inList?: boolean
}

/**
 * 우리반 과제 한 건. 펼치면 내용을 보여준다.
 *
 * 왼쪽 파란 핀을 누르면 이 과제를 홈에 띄운다.
 * D-day 는 교사만 눌러 고칠 수 있다 — 학급 과제의 마감일은 교사가 정하고,
 * 학생 계정으로는 저장 자체가 막혀 있다(RLS).
 * 지우는 것은 올린 본인과 교사만 할 수 있다.
 */
export function DdayCard({ assignment, inList }: DdayCardProps) {
  const { pinnedId, toggle } = usePinnedPost()
  const isTeacher = useIsTeacher()
  const userId = useCurrentUser()?.id
  const queryClient = useQueryClient()
  const [editingDate, setEditingDate] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canDelete = isTeacher || assignment.authorId === userId

  const mutation = useMutation({
    mutationFn: (dueDate: string) => updateNoticeDueDate(assignment.id, dueDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await invalidateClassroomViews(queryClient)
      setEditingDate(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => deleteNotice(assignment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await invalidateClassroomViews(queryClient)
    },
  })

  return (
    <>
      <TaskCard
        title={assignment.title}
        subject={assignment.subject}
        dday={assignment.dueAt ? relativeDayLabel(assignment.dueAt) : null}
        pinned={pinnedId === assignment.id}
        onTogglePin={() => toggle(assignment.id)}
        onEditDate={isTeacher ? () => setEditingDate(true) : undefined}
        inList={inList}
      >
        {assignment.body && (
          <p className="text-sm leading-relaxed text-ink-600">{assignment.body}</p>
        )}

        {/* 지우는 것은 올린 본인과 교사만. 실수로 누르지 않게 한 번 더 묻는다 */}
        {canDelete && (
          <div className={assignment.body ? 'mt-3' : undefined}>
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-600">지울까요?</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                >
                  지움
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  취소
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-sm text-ink-500 hover:text-danger hover:underline"
              >
                지우기
              </button>
            )}

            {removeMutation.error && (
              <p role="alert" className="mt-2 text-xs text-danger">
                {removeMutation.error instanceof Error
                  ? removeMutation.error.message
                  : '지우지 못했어요.'}
              </p>
            )}
          </div>
        )}
      </TaskCard>

      {editingDate && (
        <DateDialog
          title="마감일 바꾸기"
          value={assignment.dueAt?.slice(0, 10) ?? ''}
          isSaving={mutation.isPending}
          onSave={(value) => mutation.mutate(value)}
          onClose={() => setEditingDate(false)}
        />
      )}
    </>
  )
}
