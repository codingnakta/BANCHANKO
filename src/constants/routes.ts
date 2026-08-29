/** 앱 전역 라우트 경로. 문자열 하드코딩 대신 이 상수를 사용한다. */
export const ROUTES = {
  login: '/login',

  // 로그인 직후 온보딩 (구글 로그인은 역할 정보를 주지 않는다)
  onboardingRole: '/onboarding/role',
  onboardingWaiting: '/onboarding/waiting',

  // 하단 탭바 4개 최상위 화면 (F-ZYSPUS · 홈 → 우리반 → 할일 → 더보기)
  home: '/',
  classroom: '/classroom',
  todo: '/todo',
  more: '/more',

  // 원본 상세·작성 화면 (탭바 미표시)
  noticeDetail: (id: string) => `/notices/${id}`,
  noticeCreate: '/notices/new',
  noticeEdit: (id: string) => `/notices/${id}/edit`,
  eventDetail: (id: string) => `/events/${id}`,

  // 교사 전용
  classroomCreate: '/classroom/new',
  classroomSettings: '/classroom/settings',
  members: '/classroom/members',
  attendance: '/classroom/attendance',
  syncReview: '/classroom/sync',

  // 학생 전용
  chatbot: '/chat',

  // 더보기 하위
  notifications: '/more/notifications',
  account: '/more/account',
  about: '/more/about',

} as const
