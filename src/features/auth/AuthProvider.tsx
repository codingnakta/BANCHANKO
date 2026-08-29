import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthState } from './AuthContext'
import type { UserProfile } from '@/types'

/**
 * 로그인한 사용자의 세션과 프로필을 앱 전체에 제공한다.
 *
 * 프로필을 읽기 전에 claim_my_seat() 을 부른다. 교사가 명단에 등록해둔 이메일로
 * 학생이 로그인하면 그 시점에 학급 소속이 만들어지기 때문이다. 이 RPC 는 멱등해서
 * 매번 호출해도 안전하고, 학생이 먼저 로그인하고 교사가 나중에 등록한 경우도
 * 다음 방문에서 자연스럽게 배정된다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (current: Session | null) => {
    if (!current) {
      setProfile(null)
      return
    }

    // 명단에 등록된 학생이면 여기서 학급 소속이 생긴다
    const { data: classroomId, error: claimError } = await supabase.rpc('claim_my_seat')
    if (claimError) {
      console.error('[auth] claim_my_seat 실패', claimError)
    }

    const { data: row, error } = await supabase
      .from('profiles')
      .select('id, role, name, created_at')
      .eq('id', current.user.id)
      .maybeSingle()

    if (error) {
      console.error('[auth] 프로필 조회 실패', error)
      setProfile(null)
      return
    }

    // 가입 트리거가 프로필을 만들기 전이면 잠시 비어 있을 수 있다
    if (!row) {
      setProfile(null)
      return
    }

    setProfile({
      id: row.id,
      email: current.user.email ?? '',
      name: row.name,
      role: row.role,
      classroomId: (classroomId as string | null) ?? null,
      createdAt: row.created_at,
    })
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session)
      if (active) setIsLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      // 콜백 안에서 supabase 를 다시 호출하면 교착이 생길 수 있어 큐 밖으로 빼낸다
      setTimeout(async () => {
        await loadProfile(next)
        if (active) setIsLoading(false)
      }, 0)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    await loadProfile(data.session)
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ session, profile, isLoading, refresh, signOut }),
    [session, profile, isLoading, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
