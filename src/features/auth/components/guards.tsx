import { Navigate, Outlet, useLocation } from 'react-router'
import { ROUTES } from '@/constants'
import { Spinner } from '@/components/ui'
import { useAuth } from '../hooks/useCurrentUser'

function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <Spinner />
    </div>
  )
}

/** 로그인하지 않았으면 로그인 화면으로 보낸다. */
export function RequireAuth() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!session) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />

  return <Outlet />
}

/**
 * 온보딩을 끝낸 사용자만 통과시킨다.
 *  - 역할 미정      → 역할 선택
 *  - 교사 + 학급 없음 → 학급 생성
 *  - 학생 + 소속 없음 → 명단 등록 대기 안내
 */
export function RequireOnboarded() {
  const { profile, isLoading } = useAuth()

  if (isLoading || !profile) return <FullPageSpinner />
  if (!profile.role) return <Navigate to={ROUTES.onboardingRole} replace />
  if (profile.role === 'teacher' && !profile.classroomId) {
    return <Navigate to={ROUTES.classroomCreate} replace />
  }
  if (profile.role === 'student' && !profile.classroomId) {
    return <Navigate to={ROUTES.onboardingWaiting} replace />
  }

  return <Outlet />
}

/** 교사 전용 화면. 학생이 주소를 직접 쳐도 홈으로 돌려보낸다. */
export function RequireTeacher() {
  const { profile, isLoading } = useAuth()

  if (isLoading || !profile) return <FullPageSpinner />
  if (profile.role !== 'teacher') return <Navigate to={ROUTES.home} replace />

  return <Outlet />
}
