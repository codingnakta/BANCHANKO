import type { UserProfile } from '@/types'

/**
 * 현재 로그인한 사용자.
 *
 * TODO: Supabase Auth 연동 시 세션에서 프로필을 조회하도록 교체한다.
 *       지금은 화면 개발용으로 학생 계정을 가정한다.
 */
const MOCK_USER: UserProfile = {
  id: 'mock-student',
  email: 'student@example.school.kr',
  name: '홍창기',
  role: 'student',
  status: 'active',
  classroomId: 'mock-classroom',
  createdAt: new Date().toISOString(),
}

export function useCurrentUser(): UserProfile {
  return MOCK_USER
}

/** 학생 전용 기능(AI 챗봇 등)의 노출 여부 */
export function useIsStudent(): boolean {
  return useCurrentUser().role === 'student'
}
