import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DateDialog } from '@/components/ui'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { noticeKeys, updateNoticeDueDate } from '@/features/teacher/api/notices'
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
 */
export function DdayCard({ assignment, inList }: DdayCardProps) {
  const { pinnedId, toggle } = usePinnedPost()
  const isTeacher = useIsTeacher()
  const queryClient = useQueryClient()
  const [editingDate, setEditingDate] = useState(false)

  const mutation = useMutation({
    mutationFn: (dueDate: string) => updateNoticeDueDate(assignment.id, dueDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await invalidateClassroomViews(queryClient)
      setEditingDate(false)
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
