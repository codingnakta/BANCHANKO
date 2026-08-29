import { useState } from 'react'
import { Navigate } from 'react-router'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'

/**
 * 명단에 아직 등록되지 않은 학생 안내.
 *
 * 학생이 교사보다 먼저 로그인했거나 이메일이 다르게 등록된 경우다.
 * 어느 쪽이든 학생이 선생님께 알려야 하는 건 "지금 로그인한 계정 주소"이므로
 * 그 주소를 크게 보여주고 복사할 수 있게 한다.
 */
export function WaitingPage() {
  const { profile, isLoading, refresh, signOut } = useAuth()
  const [copied, setCopied] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Spinner />
      </div>
    )
  }

  // 교사가 명단에 넣어주면 다음 확인에서 학급이 잡히고, 그때 홈으로 보낸다
  if (profile.classroomId) return <Navigate to={ROUTES.home} replace />

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile!.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 권한이 없으면 사용자가 직접 읽어서 전달하면 된다
    }
  }

  async function checkAgain() {
    setIsChecking(true)
    await refresh()
    setIsChecking(false)
  }

  return (
    <main className="safe-bottom [--safe-pb:2rem] mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 bg-white px-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-ink-900">아직 등록되지 않았어요</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          선생님이 학생 명단에 등록해주시면
          <br />
          바로 우리 반으로 들어갈 수 있어요.
        </p>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-ink-50 p-5">
        <p className="text-sm font-medium text-ink-700">지금 로그인한 계정</p>
        <p className="mt-2 text-lg font-semibold break-all text-ink-900">{profile.email}</p>
        <Button
          variant="secondary"
          size="md"
          onClick={copyEmail}
          className="mt-4 w-full"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? '복사했어요' : '주소 복사하기'}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-500">
          이 주소를 선생님께 알려주세요.
          <br />
          다른 주소로 등록되어 있으면 들어올 수 없어요.
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <Button onClick={checkAgain} disabled={isChecking} size="lg">
          {isChecking ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
          등록됐는지 다시 확인
        </Button>
        <Button variant="ghost" size="md" onClick={signOut}>
          다른 계정으로 로그인
        </Button>
      </div>
    </main>
  )
}
