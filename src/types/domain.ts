/** 기능명세서(반창고_기능명세서.md)의 공통 정의를 타입으로 옮긴 것. */

/**
 * 역할 — ALBMAT 담임교사 / CZKZUM 학생.
 * DB profiles.role 과 값을 맞춘다. 서비스 관리자(GKCQRO)는 해커톤 MVP 범위 밖이라 뺐다.
 */
export type UserRole = 'teacher' | 'student'

/** 계정 상태 — 비활성화·탈퇴 계정은 로그인이 차단된다. */
export type AccountStatus = 'active' | 'suspended' | 'withdrawn'

/** 담임교사 승인 상태 — 승인된 교사만 학급을 생성·운영할 수 있다. */
export type TeacherApprovalStatus = 'pending' | 'approved' | 'rejected'

/** 안내 유형 (F-WSHIYO) */
export type NoticeType = 'notice' | 'newsletter' | 'assignment'

/** 안내 상태 — 공개일 전·종료 안내는 학생에게 노출하지 않는다. */
export type NoticeStatus = 'draft' | 'published' | 'closed'

/** 출결 상태 (F-ZOJYKF) */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'excused'

/** 외부 연동 데이터 유형 (F-OHHQTM) */
export type SyncSourceType = 'timetable' | 'meal'

/** 외부 연동 검수 상태 — 검수·공개 전환 없이 학생에게 표시하지 않는다. */
export type SyncReviewStatus = 'pending' | 'reviewed' | 'published' | 'failed'

/** 알림 유형 (F-IAXPMY) */
export type NotificationType = 'notice' | 'assignment_due' | 'cleaning_duty' | 'event'

export interface UserProfile {
  id: string
  email: string
  name: string
  /** null = 구글 로그인은 했지만 아직 역할을 고르지 않음 */
  role: UserRole | null
  /** 학생·교사가 속한 학급. 미소속이면 null */
  classroomId: string | null
  createdAt: string
}

/* ── 온보딩 ──────────────────────────────────────────────────── */

/** 나이스 학교 검색 결과 1건 (Edge Function 이 정규화해 내려준다) */
export interface School {
  officeCode: string
  officeName: string
  schoolCode: string
  schoolName: string
  schoolLevel: 'middle' | 'high'
  address: string
}

/** 교사가 미리 등록해두는 학생 명단 1줄 */
export interface RosterEntry {
  studentNo: string
  name: string
  email: string
  /** 학생 전화번호 (선택) */
  phone?: string
  /** 학부모 전화번호 (선택) */
  parentPhone?: string
  /** 1인1역 (선택) */
  classRole?: string
}

/* ── 학급 데이터 엔티티 ───────────────────────────────────────── */

/** 시간표 1교시 (F-OHHQTM · 교사 검수·공개된 것만 학생에게 노출) */
export interface TimetableEntry {
  id: string
  /** 교시 (1교시 = 1). 방과후 등 정규 교시가 아니면 0 이하를 쓴다. */
  period: number
  /** '방과후A' 처럼 교시 표기를 직접 지정할 때 사용 */
  periodLabel?: string
  /** 빈 교시는 빈 문자열 */
  subject: string
  teacher?: string
  room?: string
}

/** 급식 (F-OHHQTM) */
export interface MealMenu {
  id: string
  /** ISO 날짜 (yyyy-MM-dd) */
  date: string
  /** 메뉴 항목 목록 */
  items: string[]
  /** 마지막 정상 데이터 기준 시각 — 학생 화면에 표시한다 */
  syncedAt: string
}

/** 청소 당번 (F-RONORQ) */
export interface CleaningDuty {
  id: string
  area: string
  studentNames: string[]
}

/** 공지·가정통신문·과제 (F-WSHIYO) */
export interface Notice {
  id: string
  type: NoticeType
  title: string
  /** 원문 */
  body: string
  /** 외부 자료 URL — 서비스 내부 파일 업로드는 제공하지 않는다 */
  externalUrl?: string
  status: NoticeStatus
  /** 공개일 (ISO) */
  publishedAt: string
  /** 마감일 (ISO) — 과제 일정에 사용 */
  dueAt?: string
  /** 과제의 과목 (수업 이름) */
  subject?: string
  /** 열람한 학생 기준 확인 여부 */
  isRead: boolean
}

/** 학급 행사·일정 (F-WFEXUJ) */
export interface ClassEvent {
  id: string
  title: string
  /** 일정 일시 (ISO) */
  startAt: string
  description?: string
  /** 비공개 일정은 학생에게 노출하지 않는다 */
  isPublic: boolean
}

/** 홈 대시보드 요약 묶음 (F-ZTJSNU) */
export interface DashboardSummary {
  /** 헤더에 표시할 학급명 */
  classroomName: string
  /** "오늘 뭐 하지?" 카드에 모아 보여줄 오늘 할 일 */
  todayTasks: TodayTask[]
  /** 현재 진행 중인 교시 — 시간표에서 강조 표시한다 */
  currentPeriod?: number
  /** 오늘 시간표 — 미공개 연동 데이터는 포함하지 않으므로 null 가능 */
  timetable: TimetableEntry[] | null
  meal: MealMenu | null
  cleaningDuties: CleaningDuty[]
  /** 미확인 공지 — 우선 표시 대상 */
  unreadNotices: Notice[]
  /** 예정 과제 */
  upcomingAssignments: Notice[]
  /** 다가오는 행사 */
  upcomingEvents: ClassEvent[]
  /** 헤더 알림 벨의 미확인 표시 여부 */
  hasUnreadNotification: boolean
}

/** "오늘 뭐 하지?" 카드의 할 일 한 줄. 원본(공지·과제·일정)으로 이동 가능해야 한다. */
export interface TodayTask {
  id: string
  label: string
  /** 원본 이동 경로 */
  href?: string
}

/* ── AI 챗봇 (F-CCZIQT) ──────────────────────────────────────── */

/** 답변의 근거가 된 학급 데이터. 출처와 최종 갱신 시각을 함께 표시해야 한다. */
export interface ChatSource {
  /** 화면에 보여줄 출처 이름 (예: '오늘 시간표', '공지: 체육대회 반티') */
  label: string
  /** 해당 데이터의 최종 갱신 시각 (ISO) */
  updatedAt: string
  /** 원본으로 이동할 경로. 없으면 이동 링크를 표시하지 않는다. */
  href?: string
}

/**
 * 답변 상태.
 * - answered: 근거 데이터로 답변함
 * - no_evidence: 학급 데이터에 근거가 없음 → 추정하지 않고 안내
 * - out_of_scope: 학급 데이터 밖의 질문 → 답변 범위를 안내
 */
export type ChatAnswerStatus = 'answered' | 'no_evidence' | 'out_of_scope'

/**
 * 교사가 "~ 해줘"라고 했을 때 AI 가 만들어 오는 작업 제안.
 *
 * 제안일 뿐이라 교사가 화면에서 확인하고 눌러야 실제로 반영된다.
 * AI 는 데이터를 직접 건드리지 않는다.
 */
export type ChatAction =
  /** 공지·과제 등록 */
  | {
      kind: 'post'
      type: 'notice' | 'assignment'
      title: string
      body: string
      /** yyyy-MM-dd. 공지는 일정 날짜, 과제는 마감일 */
      date: string | null
      /** 과제일 때의 과목 */
      subject: string | null
    }
  /** 이미 올린 공지·과제 고치기. target 은 기존 제목, 나머지는 바꿀 값만 채운다 */
  | {
      kind: 'edit'
      target: string
      title: string | null
      body: string | null
      date: string | null
      subject: string | null
    }
  /** 이미 올린 공지·과제 지우기. 되돌릴 수 없어 교사가 카드에서 눌러야 지워진다 */
  | { kind: 'delete'; target: string }
  /** 챗봇이 대신 못 하는 일 — 해당 화면으로 가는 링크만 띄운다 */
  | { kind: 'link'; screen: string; reason: string }
  /** 청소당번 — 한 요일, 한 구역의 담당 학생을 정한다 */
  | { kind: 'duty'; weekday: number; area: string; students: string[] }
  /** 1인1역 — 학생 한 명의 역할을 정한다 */
  | { kind: 'role'; student: string; role: string }
  /** 학급규칙 추가 */
  | { kind: 'rule'; rules: string[] }

export interface ChatAnswer {
  status: ChatAnswerStatus
  text: string
  sources: ChatSource[]
  /** 이 답변을 맡은 마스코트 (주제별로 달라진다) */
  mascot: 'dog' | 'bunny' | 'cat'
  /** 교사에게만 — 실행 제안 */
  action?: ChatAction
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  /** assistant 메시지에만 존재 */
  status?: ChatAnswerStatus
  sources?: ChatSource[]
  mascot?: 'dog' | 'bunny' | 'cat'
  /** 교사에게만 — 실행 제안 */
  action?: ChatAction
}

/* ── 학급 (F-RONORQ) ─────────────────────────────────────────── */

/** 학급 기본 정보. 담임교사만 생성·수정하고 학생은 조회만 한다. */
export interface Classroom {
  id: string
  /** 학급명 — 필수. 없으면 저장하지 않는다 */
  name: string
  teacherName: string
  /** 학급 규칙 */
  rules: string[]
}

/** 우리반 탭에서 쓰는 학급 정보 묶음 */
export interface ClassroomDetail {
  classroom: Classroom
  /** 교사 검수·공개된 시간표만 들어온다. 미공개면 null */
  timetable: TimetableEntry[] | null
  meal: MealMenu | null
  cleaningDuties: CleaningDuty[]
  /** 공개된 공지·가정통신문·과제 전체 목록 */
  notices: Notice[]
  /** 공개된 학급 행사 */
  events: ClassEvent[]
  /** 소속 학생 수 — 교사 화면의 학생 관리 메뉴에 표시 */
  studentCount: number
}

/* ── 인앱 알림 (F-IAXPMY) ────────────────────────────────────── */

/**
 * 인앱 알림. 초기 버전은 서비스 내 알림만 제공하고
 * 모바일 푸시·문자·이메일은 발송하지 않는다.
 */
export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body?: string
  /** 생성 시각 (ISO) */
  createdAt: string
  /** 읽은 시각. 아직 안 읽었으면 null */
  readAt: string | null
  /**
   * 연결된 원본으로 가는 경로.
   * 원본이 종료·삭제되었으면 null 이고, 화면은 접근 불가를 안내한다.
   */
  href: string | null
}
