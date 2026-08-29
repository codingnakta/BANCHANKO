import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { GraduationCap, School } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const CHOICES: { role: UserRole; label: string; description: string; icon: typeof School }[] = [
  {
    role: 'teacher',
    label: '선생님이에요',
    description: '우리 반을 만들고 학생을 등록해요',
    icon: School,
  },
  {
    role: 'student',
    label: '학생이에요',
    description: '선생님이 등록해준 반에 들어가요',
    icon: GraduationCap,
  },
]

/**
 * 역할 선택 (최초 1회).
 * 구글 로그인은 교사·학생을 구분해주지 않아서 한 번 물어본다.
 * 교사가 명단에 등록해둔 이메일로 들어온 학생은 AuthProvider 의 claim_my_seat 에서
 * 이미 학급이 배정되므로 이 화면을 보지 않는다.
 */
export function RoleSelectPage() {
  const { profile, isLoading, refresh } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState<UserRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Spinner />
      </div>
    )
  }

  // 이미 역할이 정해졌으면 되돌아갈 이유가 없다
  if (profile.role) return <Navigate to={ROUTES.root} replace />

  async function choose(role: UserRole) {
    setPending(role)
    setError(null)

    const { error: rpcError } = await supabase.rpc('set_my_role', { p_role: role })
    if (rpcError) {
      console.error('[onboarding] set_my_role 실패', rpcError)
      setError('역할을 저장하지 못했어요. 다시 시도해주세요.')
      setPending(null)
      return
    }

    await refresh()
    navigate(role === 'teacher' ? ROUTES.teacher.classroomCreate : ROUTES.onboardingWaiting, {
      replace: true,
    })
  }

  return (
    <main className="safe-bottom [--safe-pb:2rem] mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 bg-white px-6">
      <header>
        <p className="text-sm text-ink-500">{profile.email}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">
          어떤 분이신가요?
        </h1>
        <p className="mt-2 text-sm text-ink-600">한 번 고르면 바꿀 수 없어요.</p>
      </header>

      <div className="flex flex-col gap-3">
        {CHOICES.map(({ role, label, description, icon: Icon }) => (
          <button
            key={role}
            type="button"
            onClick={() => choose(role)}
            disabled={pending !== null}
            className={cn(
              'flex items-center gap-4 rounded-2xl border-2 border-ink-200 bg-white p-5 text-left',
              'transition-colors hover:border-brand-500 hover:bg-brand-50',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              pending === role && 'border-brand-500 bg-brand-50',
            )}
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              {pending === role ? <Spinner className="size-5" /> : <Icon className="size-6" />}
            </span>
            <span>
              <span className="block text-base font-semibold text-ink-900">{label}</span>
              <span className="mt-0.5 block text-sm text-ink-600">{description}</span>
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
    </main>
  )
}
