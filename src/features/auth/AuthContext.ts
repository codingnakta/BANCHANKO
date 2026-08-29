import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

export interface AuthState {
  session: Session | null
  profile: UserProfile | null
  /** 세션·프로필을 아직 확인하는 중 — 이 동안에는 가드가 리다이렉트하지 않는다 */
  isLoading: boolean
  /** 역할 설정·학급 생성 직후 프로필을 다시 읽는다 */
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

/** 컴포넌트와 분리해 두어야 Fast Refresh 가 동작한다. */
export const AuthContext = createContext<AuthState | null>(null)
