import { useState } from 'react'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Pencil } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchMyClassroom, myClassroomKeys } from '@/features/classroom/api/myClassroom'
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  noticeKeys,
  updateNotice,
} from '@/features/teacher/api/notices'
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

/** 챗봇이 대신 못 하는 일은 여기로 보낸다 */
const SCREENS: Record<string, { label: string; to: string }> = {
  students: { label: '학생 관리', to: ROUTES.teacher.students },
  settings: { label: '학급 기본 정보', to: ROUTES.teacher.settings },
  timetable: { label: '시간표·급식 검수', to: ROUTES.teacher.timetable },
  notices: { label: '안내 관리', to: ROUTES.teacher.notices },
  attendance: { label: '출결 기록', to: ROUTES.teacher.attendance },
  todo: { label: '할일', to: ROUTES.todo },
}

/**
 * AI 가 만들어 온 작업 제안.
 *
 * 여기서 교사가 확인하고 눌러야 실제로 반영된다. AI 가 직접 쓰지 않는다.
 * 공지·과제는 제목과 날짜를 이 자리에서 바로 고칠 수 있다.
 */
export function ActionCard({ action }: { action: ChatAction }) {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()
  const already = useAlready(action, classroomId, user?.id ?? '')

  const editable = action.kind === 'post' || action.kind === 'edit'
  const [title, setTitle] = useState(editable ? (action.title ?? '') : '')
  const [date, setDate] = useState(editable ? (action.date ?? '') : '')
  const [body, setBody] = useState(editable ? (action.body ?? '') : '')
  const [editing, setEditing] = useState(false)

  const mutation = useMutation({
    mutationFn: () => apply(action, classroomId, { title, date, body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      await queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      await queryClient.invalidateQueries({ queryKey: rosterKeys.all })
      await queryClient.invalidateQueries({ queryKey: myClassroomKeys.all })
      await queryClient.invalidateQueries({ queryKey: teacherContextKeys.all })
      await invalidateClassroomViews(queryClient)
    },
  })

  if (action.kind === 'link') {
    const screen = SCREENS[action.screen]
    if (!screen) return null

    return (
      <Link
        to={screen.to}
        className="mt-2 flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3.5 transition-colors hover:bg-brand-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-ink-900">{screen.label}</span>
          {action.reason && (
            <span className="mt-0.5 block text-xs text-ink-500">{action.reason}</span>
          )}
        </span>
        <ArrowRight className="size-5 shrink-0 text-brand-500" aria-hidden />
      </Link>
    )
  }

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

      {already && (
        <p className="mb-2 rounded-lg bg-ink-100 px-3 py-2 text-xs text-ink-600">{already}</p>
      )}

      {editable && editing ? (
        <div className="flex flex-col gap-2">
          <Field label="제목" htmlFor="actionTitle">
            <Input
              id="actionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field
            label={action.kind === 'post' && action.type === 'assignment' ? '마감일' : '날짜'}
            htmlFor="actionDate"
          >
            <Input
              id="actionDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="안내 문구" htmlFor="actionBody">
            <textarea
              id="actionBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="학생들에게 전할 내용을 적어주세요."
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-500"
            />
          </Field>
        </div>
      ) : (
        <Preview action={action} title={title} date={date} body={body} />
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          // 삭제는 되돌릴 수 없으니 눌리기 전에 눈으로 알아채게 한다
          variant={action.kind === 'delete' ? 'danger' : already ? 'secondary' : 'primary'}
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? '적용 중…' : already ? '그래도 적용' : applyLabel(action)}
        </Button>
        {editable && (
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

function Preview({
  action,
  title,
  date,
  body,
}: {
  action: ChatAction
  title: string
  date: string
  body: string
}) {
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
          {body && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{body}</p>
          )}
        </>
      )

    case 'edit':
      return (
        <>
          <p className="text-[15px] text-ink-900">
            <Tag>수정</Tag>
            <b className="font-medium">{action.target}</b>
          </p>
          <ul className="mt-1.5 flex flex-col gap-0.5 text-sm text-ink-600">
            {title && title !== action.target && <li>제목 → {title}</li>}
            {date && <li>날짜 → {formatDate(`${date}T00:00:00`)}</li>}
            {action.subject && <li>과목 → {action.subject}</li>}
            {body && <li className="whitespace-pre-wrap">내용 → {body}</li>}
          </ul>
        </>
      )

    case 'delete':
      return (
        <>
          <p className="text-[15px] text-ink-900">
            <Tag>삭제</Tag>
            <b className="font-medium">{action.target}</b>
          </p>
          <p className="mt-1.5 text-xs text-danger">지운 안내는 되돌릴 수 없어요.</p>
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

    case 'link':
      // 링크는 카드 자체가 링크라 여기까지 오지 않는다
      return null

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

/** 실행 버튼 문구 — 갈래마다 무슨 일이 일어나는지 그대로 적는다 */
function applyLabel(action: ChatAction) {
  switch (action.kind) {
    case 'post':
      return '등록'
    case 'edit':
      return '수정'
    case 'delete':
      return '삭제'
    default:
      return '적용'
  }
}

function doneLabel(action: ChatAction, title: string) {
  switch (action.kind) {
    case 'post':
      return `${action.type === 'assignment' ? '과제' : '공지'} “${title}” 등록했어요.`
    case 'edit':
      return `“${action.target}”을 고쳤어요.`
    case 'delete':
      return `“${action.target}”을 지웠어요.`
    case 'duty':
      return `${weekdayLabel(action.weekday)}요일 ${action.area} 당번을 바꿨어요.`
    case 'role':
      return `${action.student}의 1인1역을 정했어요.`
    case 'rule':
      return '학급규칙에 넣었어요.'
    case 'link':
      return ''
  }
}

/**
 * 지금 이미 그렇게 되어 있는지 확인해 한 줄로 알려 준다.
 *
 * 모델도 [학급 정보]를 보고 되묻긴 하지만 놓칠 수 있어서,
 * 실제 데이터로 한 번 더 본다. 같은 걸 다시 눌러도 사고가 나진 않지만
 * 교사가 헛일을 하지 않도록 미리 말해 준다.
 */
function useAlready(action: ChatAction, classroomId: string, userId: string): string | null {
  const enabled = Boolean(classroomId)
  const [duties, roster, classroom, posts] = useQueries({
    queries: [
      {
        queryKey: settingsKeys.duties(classroomId),
        queryFn: () => fetchDuties(classroomId),
        enabled: enabled && action.kind === 'duty',
      },
      {
        queryKey: rosterKeys.list(classroomId),
        queryFn: () => fetchRoster(classroomId),
        enabled: enabled && action.kind === 'role',
      },
      {
        queryKey: myClassroomKeys.detail(userId),
        queryFn: fetchMyClassroom,
        enabled: enabled && action.kind === 'rule',
      },
      {
        queryKey: noticeKeys.list(classroomId),
        queryFn: () => fetchNotices(classroomId),
        enabled:
          enabled &&
          (action.kind === 'post' || action.kind === 'edit' || action.kind === 'delete'),
      },
    ],
  })

  switch (action.kind) {
    case 'duty': {
      if (!duties.data) return null
      const plan = toDutyPlan(duties.data)
      const index = plan.areas.indexOf(action.area)
      if (index === -1) return null
      const current = (plan.names[action.weekday]?.[index] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
      return same(current, action.students)
        ? `${weekdayLabel(action.weekday)}요일 ${action.area}는 이미 ${current.join(', ')}예요.`
        : null
    }

    case 'role': {
      const member = roster.data?.find((row) => row.name === action.student)
      return member && member.classRole === action.role
        ? `${action.student}는 이미 ${action.role}이에요.`
        : null
    }

    case 'rule': {
      const rules = classroom.data?.rules ?? []
      const dupes = action.rules.filter((rule) => rules.includes(rule))
      if (dupes.length === 0) return null
      return dupes.length === action.rules.length
        ? '이미 학급규칙에 있어요.'
        : `“${dupes.join('”, “')}”는 이미 학급규칙에 있어요.`
    }

    case 'link':
      return null

    case 'post': {
      const title = action.title.trim()
      return posts.data?.some((post) => post.title.trim() === title)
        ? '같은 제목으로 올린 안내가 이미 있어요.'
        : null
    }

    case 'delete': {
      // 지울 대상이 없으면 눌러도 실패하니 미리 알려 준다
      const found = findPost(posts.data ?? [], action.target)
      return found ? null : `“${action.target}”을(를) 올린 안내에서 찾지 못했어요.`
    }

    case 'edit': {
      const found = findPost(posts.data ?? [], action.target)
      if (!found) return `“${action.target}”을(를) 올린 안내에서 찾지 못했어요.`

      const unchanged =
        (!action.title || action.title === found.title) &&
        (!action.date || action.date === found.due_date) &&
        (!action.body || action.body === (found.body ?? '')) &&
        (!action.subject || action.subject === (found.subject ?? ''))
      return unchanged ? '이미 그렇게 되어 있어요.' : null
    }
  }
}

/** 제목으로 기존 안내를 찾는다. 정확히 같은 것을 먼저, 없으면 포함하는 것을. */
function findPost<T extends { title: string }>(posts: T[], target: string): T | undefined {
  const needle = target.trim()
  return (
    posts.find((post) => post.title.trim() === needle) ??
    posts.find((post) => post.title.includes(needle) || needle.includes(post.title.trim()))
  )
}

/** 순서를 무시하고 같은 사람들인지 */
function same(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sorted = (list: string[]) => [...list].sort()
  return sorted(a).every((name, i) => name === sorted(b)[i])
}

/** 제안을 실제 데이터로 반영한다. 저장 경로는 화면에서 쓰는 것과 같다. */
async function apply(
  action: ChatAction,
  classroomId: string,
  edited: { title: string; date: string; body: string },
): Promise<void> {
  switch (action.kind) {
    case 'post':
      await createNotice(classroomId, {
        type: action.type,
        title: edited.title,
        body: edited.body,
        subject: action.subject ?? '',
        dueDate: edited.date,
        linkUrl: '',
      })
      return

    case 'edit': {
      const found = findPost(await fetchNotices(classroomId), action.target)
      if (!found) throw new Error(`“${action.target}”을(를) 찾지 못했어요.`)

      await updateNotice(found.id, {
        type: found.type === 'assignment' ? 'assignment' : 'notice',
        title: edited.title || found.title,
        body: edited.body || found.body || '',
        subject: action.subject ?? found.subject ?? '',
        dueDate: edited.date || found.due_date || '',
        linkUrl: found.link_url ?? '',
      })
      return
    }

    case 'delete': {
      const found = findPost(await fetchNotices(classroomId), action.target)
      if (!found) throw new Error(`“${action.target}”을(를) 찾지 못했어요.`)

      await deleteNotice(found.id)
      return
    }

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

    case 'link':
      // 화면으로 보내기만 한다 — 저장할 것이 없다
      return

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
