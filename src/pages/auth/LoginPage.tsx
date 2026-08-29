import { useState } from 'react'
import { Navigate } from 'react-router'
import { BanchankoLogo } from '@/features/auth/components/BanchankoLogo'
import { GoogleButton } from '@/features/auth/components/GoogleButton'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'
import { ROUTES } from '@/constants'
import { supabase } from '@/lib/supabase'

/** 로그인 화면 (F-UBHBGS). 구글 OAuth 하나만 제공한다. */
export function LoginPage() {
  const { session, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // 이미 로그인한 상태로 /login 에 오면 홈으로 (가드가 역할·학급에 맞게 다시 보낸다)
  if (!isLoading && session) return <Navigate to={ROUTES.home} replace />

  async function startGoogleLogin() {
    setError(null)
    setIsStarting(true)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${ROUTES.home}` },
    })

    if (oauthError) {
      console.error('[auth] 구글 로그인 실패', oauthError)
      setError('로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
      setIsStarting(false)
    }
    // 성공하면 구글로 이동하므로 여기로 돌아오지 않는다
  }

  return (
    <main className="safe-bottom [--safe-pb:9rem] flex min-h-dvh flex-col items-center justify-between bg-white px-6 pt-0">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <BanchankoLogo className="text-brand-700" />
      </div>

      <div className="w-full max-w-sm">
        <GoogleButton onClick={startGoogleLogin} disabled={isStarting} />
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
        <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">
          로그인하면 이용약관과 개인정보 처리방침에
          <br />
          동의한 것으로 간주합니다.
        </p>
      </div>
    </main>
  )
}
