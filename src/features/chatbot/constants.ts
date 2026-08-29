/** 챗봇이 답할 수 있는 범위를 알려주는 추천 질문 (유저플로우 S5-1 예시 기반) */

/** 빈 화면에서 보여주는 전체 문장형 추천 */
export const SUGGESTED_QUESTIONS = [
  '오늘 과제는 뭐야?',
  '내일 청소 당번은 누구야?',
  '이번 주 일정과 준비물 알려줘',
  '오늘 급식 뭐 나와?',
]

/** 교사에게 보여주는 추천 — 등록까지 부탁할 수 있다는 걸 알린다 */
export const TEACHER_SUGGESTED_QUESTIONS = [
  '다음 주 수요일 현장체험학습 공지로 등록해줘',
  '금요일까지 수학 익힘책 32~35쪽 과제로 올려줘',
  '월요일 복도 청소 김영우로 바꿔줘',
  '복도에서 뛰지 않기 학급규칙에 넣어줘',
]

/** 대화 중에도 입력창 위에 계속 띄우는 키워드 칩 */
export interface SuggestionChip {
  /** 칩에 보이는 짧은 키워드 */
  keyword: string
  /** 실제로 전송되는 질문 */
  question: string
}

export const SUGGESTION_CHIPS: SuggestionChip[] = [
  { keyword: '시간표', question: '오늘 시간표 알려줘' },
  { keyword: '급식', question: '오늘 급식 뭐 나와?' },
  { keyword: '청소 당번', question: '청소 당번은 누구야?' },
  { keyword: '과제', question: '과제 뭐 있어?' },
  { keyword: '공지', question: '새로운 공지 알려줘' },
  { keyword: '일정', question: '다가오는 일정과 준비물 알려줘' },
]

/* ── 마스코트 역할 분담 ──────────────────────────────────────── */

export type MascotKey = 'dog' | 'bunny' | 'cat'

/**
 * 주제별 담당 마스코트.
 * 시안에서 시간표 탭에 토끼, 급식 탭에 고양이가 붙어 있어 그 연상을 그대로 잇는다.
 * 강아지는 홈 히어로·챗봇 첫 화면의 대표 캐릭터라 안내와 기본값을 맡는다.
 *
 * 아바타만 바뀔 뿐 답변 내용은 캐릭터에 따라 달라지지 않는다.
 * (F-CCZIQT — 근거 없는 내용을 덧붙이지 않기 위해 말투는 나누지 않는다)
 */
export const MASCOT_BY_TOPIC = {
  timetable: 'bunny',
  assignment: 'bunny',
  event: 'bunny',
  meal: 'cat',
  cleaning: 'cat',
  notice: 'dog',
} as const satisfies Record<string, MascotKey>

/** 여러 주제가 걸리면 앞선 것이 답한다 */
export const MASCOT_TOPIC_PRIORITY = [
  'timetable',
  'meal',
  'cleaning',
  'assignment',
  'notice',
  'event',
] as const

/** 답변 범위 밖이거나 근거가 없을 때 나서는 기본 캐릭터 */
export const DEFAULT_MASCOT: MascotKey = 'dog'
