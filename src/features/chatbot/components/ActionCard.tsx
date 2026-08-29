import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchMyClassroom, myClassroomKeys } from '@/features/classroom/api/myClassroom'
import { createNotice, noticeKeys } from '@/features/teacher/api/notices'
import { fetchRoster, rosterKeys, setClassRole } from '@/features/teacher/api/roster'
import {
  fetchDuties,
  saveClassroomBasics,
  saveDuties,
  settingsKeys,
  toDutyPlan,
  WEEKDAYS,
} from '@/features/teacher/api/settings'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { formatDate } from '@/lib/date'
import { teacherContextKeys } from '../api/teacherContext'
import type { ChatAction } from '@/types'

/**
 * AI 가 만들어 온 작업 제안.
 *
 * 여기서 교사가 확인하고 눌러야 실제로 반영된다. AI 가 직접 쓰지 않는다.
 * 공지·과제는 제목과 날짜를 이 자리에서 바로 고칠 수 있다.
 */
export function ActionCard({ action }: { action: ChatAction }) {
  const classroomId = useCurrentUser()?.classroomId ?? ''
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(action.kind === 'post' ? action.title : '')
  const [date, setDate] = useState(action.kind === 'post' ? (action.date ?? '') : '')
  const [editing, setEditing] = useState(false)

  const mutation = useMutation({
    mutationFn: () => apply(action, classroomId, { title, date }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      await queryClient.invalidateQueries({ queryKey: rosterKeys.all })
      await queryClient.invalidateQueries({ queryKey: myClassroomKeys.all })
      await queryClient.invalidateQueries({ queryKey: teacherContextKeys.all })
      await invalidateClassroomViews(queryClient)
    },
  })

  if (mutation.isSuccess) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-800">
        <Check className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">{doneLabel(action, title)}</span>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-ink-200 bg-white px-4 py-3.5">
      <p className="mb-2 text-[11px] font-medium text-ink-500">이렇게 할까요?</p>

      {action.kind === 'post' && editing ? (
        <div className="flex flex-col gap-2">
          <Field label="제목" htmlFor="actionTitle">
            <Input
              id="actionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label={action.type === 'assignment' ? '마감일' : '날짜'} htmlFor="actionDate">
            <Input
              id="actionDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>
      ) : (
        <Preview action={action} title={title} date={date} />
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? '적용 중…' : action.kind === 'post' ? '등록' : '적용'}
        </Button>
        {action.kind === 'post' && (
          <Button size="sm" variant="ghost" onClick={() => setEditing((prev) => !prev)}>
            <Pencil className="size-4" />
            {editing ? '미리보기' : '고치기'}
          </Button>
        )}
      </div>

      {mutation.error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {mutation.error instanceof Error ? mutation.error.message : '반영하지 못했어요.'}
        </p>
      )}
    </div>
  )
}

function Preview({ action, title, date }: { action: ChatAction; title: string; date: string }) {
  switch (action.kind) {
    case 'post':
      return (
        <>
          <p className="text-[15px] font-medium text-ink-900">
            <Tag>{action.type === 'assignment' ? '과제' : '공지'}</Tag>
            {title}
          </p>
          {date && (
            <p className="mt-1 text-xs text-ink-500">
              {action.type === 'assignment' ? '마감 ' : '일정 '}
              {formatDate(`${date}T00:00:00`)}
              {action.subject && ` · ${action.subject}`}
            </p>
          )}
          {action.body && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
              {action.body}
            </p>
          )}
        </>
      )

    case 'duty':
      return (
        <p className="text-[15px] text-ink-900">
          <Tag>청소당번</Tag>
          {weekdayLabel(action.weekday)}요일 <b className="font-medium">{action.area}</b> —{' '}
          {action.students.join(', ') || '미지정'}
        </p>
      )

    case 'role':
      return (
        <p className="text-[15px] text-ink-900">
          <Tag>1인1역</Tag>
          {action.student} — <b className="font-medium">{action.role || '해제'}</b>
        </p>
      )

    case 'rule':
      return (
        <div className="text-[15px] text-ink-900">
          <Tag>학급규칙</Tag>
          <ul className="mt-1 flex flex-col gap-1">
            {action.rules.map((rule) => (
              <li key={rule} className="text-sm text-ink-700">
                · {rule}
              </li>
            ))}
          </ul>
        </div>
      )
  }
}

function Tag({ children }: { children: string }) {
  return (
    <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
      {children}
    </span>
  )
}

function weekdayLabel(weekday: number) {
  return WEEKDAYS.find((day) => day.value === weekday)?.label ?? String(weekday)
}

function doneLabel(action: ChatAction, title: string) {
  switch (action.kind) {
    case 'post':
      return `${action.type === 'assignment' ? '과제' : '공지'} “${title}” 등록했어요.`
    case 'duty':
      return `${weekdayLabel(action.weekday)}요일 ${action.area} 당번을 바꿨어요.`
    case 'role':
      return `${action.student}의 1인1역을 정했어요.`
    case 'rule':
      return '학급규칙에 넣었어요.'
  }
}

/** 제안을 실제 데이터로 반영한다. 저장 경로는 화면에서 쓰는 것과 같다. */
async function apply(
  action: ChatAction,
  classroomId: string,
  edited: { title: string; date: string },
): Promise<void> {
  switch (action.kind) {
    case 'post':
      await createNotice(classroomId, {
        type: action.type,
        title: edited.title,
        body: action.body,
        subject: action.subject ?? '',
        dueDate: edited.date,
        linkUrl: '',
      })
      return

    case 'duty': {
      const plan = toDutyPlan(await fetchDuties(classroomId))
      // 없던 구역이면 새로 만든다
      let index = plan.areas.indexOf(action.area)
      if (index === -1) {
        plan.areas.push(action.area)
        index = plan.areas.length - 1
      }
      for (const day of WEEKDAYS) {
        const names = plan.names[day.value] ?? []
        // 구역을 새로 만들었으면 다른 요일도 같은 길이로 맞춰 둔다
        while (names.length < plan.areas.length) names.push('')
        plan.names[day.value] = names
      }
      plan.names[action.weekday][index] = action.students.join(', ')
      await saveDuties(classroomId, plan)
      return
    }

    case 'role': {
      const roster = await fetchRoster(classroomId)
      const member =
        roster.find((row) => row.name === action.student) ??
        roster.find((row) => row.name.includes(action.student))
      if (!member) throw new Error(`${action.student} 학생을 명단에서 찾지 못했어요.`)
      await setClassRole(classroomId, member.email, action.role || null)
      return
    }

    case 'rule': {
      const classroom = await fetchMyClassroom()
      if (!classroom) throw new Error('학급 정보를 찾지 못했어요.')
      const merged = [...classroom.rules]
      for (const rule of action.rules) {
        if (!merged.includes(rule)) merged.push(rule)
      }
      await saveClassroomBasics(classroomId, { name: classroom.name, rules: merged })
      return
    }
  }
}
