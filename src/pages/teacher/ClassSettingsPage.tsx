import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { TeacherPageShell } from '@/components/layout'
import { Button, Card, Field, Input, Spinner } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { myClassroomKeys } from '@/features/classroom/api/myClassroom'
import {
  fetchDuties,
  saveClassroomBasics,
  saveDuties,
  settingsKeys,
  WEEKDAYS,
  type DutyInput,
} from '@/features/teacher/api/settings'
import { useMyClassroomRow } from '@/features/teacher/hooks/useMyClassroomRow'

/** 학급 기본 정보 — 학급명, 학급 규칙, 청소 당번 (F-RONORQ). */
export function ClassSettingsPage() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const { data: classroom, isPending } = useMyClassroomRow()
  const { data: savedDuties } = useQuery({
    queryKey: settingsKeys.duties(classroomId),
    queryFn: () => fetchDuties(classroomId),
    enabled: Boolean(classroomId),
  })

  const [name, setName] = useState('')
  const [rules, setRules] = useState<string[]>([])
  const [duties, setDuties] = useState<DutyInput[]>([])
  const [saved, setSaved] = useState(false)

  // 서버 값이 도착하면 폼을 한 번만 채운다 (이후 교사의 입력이 이긴다)
  const [loadedClassroom, setLoadedClassroom] = useState<typeof classroom>(undefined)
  if (classroom && classroom !== loadedClassroom) {
    setLoadedClassroom(classroom)
    setName(classroom.name)
    setRules(classroom.rules.length > 0 ? classroom.rules : [''])
  }

  const [loadedDuties, setLoadedDuties] = useState<typeof savedDuties>(undefined)
  if (savedDuties && savedDuties !== loadedDuties) {
    setLoadedDuties(savedDuties)
    setDuties(
      WEEKDAYS.map((day) => {
        const found = savedDuties.find((duty) => duty.weekday === day.value)
        return {
          weekday: day.value,
          task: found?.task ?? '',
          studentNames: found?.student_names ?? '',
        }
      }),
    )
  }

  const mutation = useMutation({
    mutationFn: async () => {
      await saveClassroomBasics(classroomId, { name, rules })
      await saveDuties(classroomId, duties)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myClassroomKeys.all })
      await queryClient.invalidateQueries({ queryKey: settingsKeys.duties(classroomId) })
      await invalidateClassroomViews(queryClient)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  if (isPending || !classroom) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <TeacherPageShell
      title="학급 기본 정보"
      action={
        <Button size="md" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending && <Spinner className="size-4" />}
          {saved ? '저장됨' : '저장'}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Card className="p-5">
          <Field label="학급 이름" htmlFor="className">
            <Input id="className" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          {classroom.school_name && (
            <p className="mt-3 text-sm text-ink-500">
              {classroom.school_name} · {classroom.grade}학년 {classroom.class_no}반
            </p>
          )}
        </Card>

        {/* 학급 규칙 */}
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold text-ink-900">학급 규칙</h2>
          <div className="flex flex-col gap-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={rule}
                  onChange={(e) => {
                    const next = [...rules]
                    next[index] = e.target.value
                    setRules(next)
                  }}
                  placeholder="예: 수업 시작 전까지 자리에 앉기"
                />
                <button
                  type="button"
                  onClick={() => setRules(rules.filter((_, i) => i !== index))}
                  aria-label={`${index + 1}번째 규칙 삭제`}
                  className="shrink-0 rounded-full p-2 text-ink-400 hover:bg-ink-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="md"
            className="mt-2"
            onClick={() => setRules([...rules, ''])}
          >
            <Plus className="size-4" />
            규칙 추가
          </Button>
        </Card>

        {/* 청소 당번 */}
        <Card className="p-5">
          <h2 className="mb-1 text-base font-semibold text-ink-900">청소 당번</h2>
          <p className="mb-3 text-sm text-ink-500">이름은 쉼표로 구분해주세요.</p>

          <div className="flex flex-col gap-3">
            {duties.map((duty, index) => (
              <div key={duty.weekday} className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-medium text-ink-700">
                  {WEEKDAYS[index]?.label}
                </span>
                <Input
                  value={duty.task}
                  onChange={(e) => {
                    const next = [...duties]
                    next[index] = { ...duty, task: e.target.value }
                    setDuties(next)
                  }}
                  placeholder="구역"
                  className="w-28"
                />
                <Input
                  value={duty.studentNames}
                  onChange={(e) => {
                    const next = [...duties]
                    next[index] = { ...duty, studentNames: e.target.value }
                    setDuties(next)
                  }}
                  placeholder="홍길동, 김민준"
                />
              </div>
            ))}
          </div>
        </Card>

        {mutation.error && (
          <p role="alert" className="text-center text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : '저장하지 못했어요.'}
          </p>
        )}
      </div>
    </TeacherPageShell>
  )
}
