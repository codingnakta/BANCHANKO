/** 앱 전역 라우트 경로. 문자열 하드코딩 대신 이 상수를 사용한다. */
export const ROUTES = {
  login: '/login',

  // 로그인 직후 온보딩 (구글 로그인은 역할 정보를 주지 않는다)
  onboardingRole: '/onboarding/role',
  onboardingWaiting: '/onboarding/waiting',

  /** 역할을 보고 교사/학생 홈으로 보내주는 진입점 */
  root: '/',

  // ── 교사 ────────────────────────────────────────────────
  teacher: {
    home: '/teacher',
    /** 학급 운영 메뉴 모음 */
    manage: '/teacher/manage',
    students: '/teacher/students',
    settings: '/teacher/settings',
    notices: '/teacher/notices',
    noticeNew: '/teacher/notices/new',
    noticeEdit: (id: string) => `/teacher/notices/${id}/edit`,
    timetable: '/teacher/timetable',
    attendance: '/teacher/attendance',
    classroomCreate: '/teacher/classroom/new',
  },

  // ── 학생 ────────────────────────────────────────────────
  student: {
    home: '/student',
    todo: '/student/todo',
    chatbot: '/student/chat',
  },

  /** 우리반·공지 상세는 두 역할이 같은 화면을 본다 */
  classroom: '/classroom',
  noticeDetail: (id: string) => `/notices/${id}`,

  // 더보기 (역할 공통)
  more: '/more',
  notifications: '/more/notifications',
  account: '/more/account',
  about: '/more/about',
} as const
