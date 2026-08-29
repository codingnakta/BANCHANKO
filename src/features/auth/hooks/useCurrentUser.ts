import { useContext } from 'react'
import { AuthContext, type AuthState } from '../AuthContext'
import type { UserProfile } from '@/types'

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있어요')
  }
  return context
}

/** 현재 로그인한 사용자. 로그인 전이거나 아직 확인 중이면 null. */
export function useCurrentUser(): UserProfile | null {
  return useAuth().profile
}

/** 교사 전용 메뉴의 노출 여부 */
export function useIsTeacher(): boolean {
  return useCurrentUser()?.role === 'teacher'
}
