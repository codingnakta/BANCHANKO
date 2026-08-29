import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Button, Field, Input, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'
import { createClassroom } from '@/features/classroom/api/createClassroom'
import { RosterUploadStep } from '@/features/classroom/components/RosterUploadStep'
import { SchoolSearchStep } from '@/features/classroom/components/SchoolSearchStep'
import { cn } from '@/lib/utils'
import type { RosterEntry, School } from '@/types'

const STEPS = ['학교', '학년·반', '학생 명단'] as const
type StepIndex = 0 | 1 | 2

/**
 * 학급 생성 마법사 (F-RONORQ).
 * 교육청·학교를 고르면 나이스 시간표·급식 조회에 필요한 코드가 학급에 저장된다.
 * 학교를 못 찾아도 학급 운영은 되어야 하므로 건너뛸 수 있다.
 */
export function CreateClassroomPage() {
  const { profile, isLoading, refresh } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<StepIndex>(0)
  const [officeCode, setOfficeCode] = useState('')
  const [school, setSchool] = useState<School | null>(null)
  const [grade, setGrade] = useState('')
  const [classNo, setClassNo] = useState('')
  const [roster, setRoster] = useState<RosterEntry[]>([])

  // 학년·반에서 학급명을 만들어준다. 교사가 직접 고치면 그 값이 이긴다.
  const [customName, setCustomName] = useState<string | null>(null)
  const name = customName ?? (grade && classNo ? `${grade}학년 ${classNo}반` : '')

  const mutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: async (result) => {
      await refresh()
      navigate(ROUTES.home, {
        replace: true,
        state: { rejectedEmails: result.rejectedEmails },
      })
    },
  })

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Spinner />
      </div>
    )
  }

  // 이미 학급이 있으면 교사당 1개 규칙에 걸린다
  if (profile.classroomId) return <Navigate to={ROUTES.home} replace />
  if (profile.role !== 'teacher') return <Navigate to={ROUTES.home} replace />

  const gradeNumber = Number(grade)
  const classNumber = Number(classNo)
  const isBasicValid =
    Number.isInteger(gradeNumber) &&
    gradeNumber >= 1 &&
    gradeNumber <= 6 &&
    Number.isInteger(classNumber) &&
    classNumber >= 1 &&
    name.trim().length > 0

  const canGoNext = step === 0 ? true : step === 1 ? isBasicValid : true

  function goBack() {
    if (step === 0) return
    setStep((current) => (current - 1) as StepIndex)
  }

  function submit() {
    mutation.mutate({
      school,
      grade: gradeNumber,
      classNo: classNumber,
      name: name.trim(),
      roster,
    })
  }

  return (
    <main className="safe-bottom [--safe-pb:2rem] mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-white px-6 pt-4">
      <header className="flex flex-col gap-4">
        <div className="flex h-10 items-center">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              aria-label="이전 단계"
              className="-ml-2 rounded-full p-2 text-ink-600 hover:bg-ink-100"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
        </div>

        <ol className="flex gap-2" aria-label="진행 단계">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  'h-1 rounded-full',
                  index <= step ? 'bg-brand-500' : 'bg-ink-200',
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  index === step ? 'font-semibold text-brand-700' : 'text-ink-500',
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <h1 className="text-2xl font-bold text-ink-900">
          {step === 0 && '학교를 선택해주세요'}
          {step === 1 && '몇 학년 몇 반인가요?'}
          {step === 2 && '학생을 등록해주세요'}
        </h1>
      </header>

      <div className="flex-1 py-6">
        {step === 0 && (
          <SchoolSearchStep
            officeCode={officeCode}
            onOfficeChange={(code) => {
              setOfficeCode(code)
              setSchool(null)
            }}
            selected={school}
            onSelect={setSchool}
          />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-3">
              <Field label="학년" htmlFor="grade">
                <Input
                  id="grade"
                  inputMode="numeric"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value.replace(/\D/g, '').slice(0, 1))}
                  placeholder="3"
                />
              </Field>
              <Field label="반" htmlFor="classNo">
                <Input
                  id="classNo"
                  inputMode="numeric"
                  value={classNo}
                  onChange={(event) => setClassNo(event.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="4"
                />
              </Field>
            </div>

            <Field label="학급 이름" htmlFor="name" hint="학생에게 보이는 이름이에요">
              <Input
                id="name"
                value={name}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="3학년 4반"
              />
            </Field>

            {school && (
              <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                {school.schoolName} · 시간표와 급식을 자동으로 가져올 수 있어요
              </p>
            )}
          </div>
        )}

        {step === 2 && <RosterUploadStep entries={roster} onChange={setRoster} />}
      </div>

      {mutation.error && (
        <p role="alert" className="mb-3 text-center text-sm text-danger">
          {mutation.error instanceof Error ? mutation.error.message : '학급을 만들지 못했어요.'}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {step < 2 ? (
          <Button
            size="lg"
            disabled={!canGoNext}
            onClick={() => setStep((current) => (current + 1) as StepIndex)}
          >
            다음
          </Button>
        ) : (
          <Button size="lg" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending && <Spinner className="size-4" />}
            {roster.length > 0 ? `학생 ${roster.length}명과 함께 시작하기` : '학급 만들기'}
          </Button>
        )}

        {step === 0 && !school && (
          <Button variant="ghost" size="md" onClick={() => setStep(1)}>
            학교를 못 찾겠어요 · 건너뛰기
          </Button>
        )}
        {step === 2 && roster.length === 0 && (
          <p className="text-center text-xs text-ink-500">
            지금 등록하지 않아도 나중에 추가할 수 있어요
          </p>
        )}
      </div>
    </main>
  )
}
