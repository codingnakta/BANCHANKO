import { addDays, format, set } from 'date-fns'
import { MOCK_DASHBOARD } from '@/features/dashboard/api/dashboard.mock'
import type { ClassroomDetail } from '@/types'

/**
 * 우리반 화면 개발용 임시 데이터.
 * 시간표·급식·청소 당번은 홈과 같은 학급 데이터라 대시보드 목업을 그대로 쓴다.
 * Supabase 연동 시 classroom.api.ts 의 실제 쿼리로 교체하고 이 파일은 삭제한다.
 */

const today = new Date()
const iso = (d: Date) => d.toISOString()
const at = (d: Date, hours: number, minutes = 0) =>
  set(d, { hours, minutes, seconds: 0, milliseconds: 0 })

export const MOCK_CLASSROOM: ClassroomDetail = {
  classroom: {
    id: 'mock-classroom',
    name: '3학년 4반',
    teacherName: '윤다연',
    rules: [
      '수업 시작 전까지 자리에 앉기',
      '교실에서는 뛰지 않기',
      '청소 당번은 종례 후 바로 시작하기',
      '휴대폰은 수업 중 사물함에 보관하기',
    ],
  },

  timetable: MOCK_DASHBOARD.timetable,
  meal: MOCK_DASHBOARD.meal,
  cleaningDuties: MOCK_DASHBOARD.cleaningDuties,

  // 홈은 '미확인'·'예정'만 보여주지만 우리반은 공개된 전체 목록을 보여준다
  notices: [
    ...MOCK_DASHBOARD.unreadNotices,
    ...MOCK_DASHBOARD.upcomingAssignments,
    {
      id: 'n3',
      type: 'notice',
      title: '9월 학급 임원 선거 안내',
      body: '다음 주 월요일 조회 시간에 학급 임원 선거를 진행합니다. 후보 신청은 금요일까지입니다.',
      status: 'published',
      publishedAt: iso(addDays(today, -4)),
      isRead: true,
    },
    {
      id: 'n4',
      type: 'newsletter',
      title: '겨울 교복 착용 안내 가정통신문',
      body: '9월 15일부터 동복 착용이 시작됩니다. 하복은 세탁 후 보관해 주세요.',
      externalUrl: 'https://example.school.kr/uniform',
      status: 'published',
      publishedAt: iso(addDays(today, -6)),
      isRead: true,
    },
  ],

  events: [
    ...MOCK_DASHBOARD.upcomingEvents,
    {
      id: 'e3',
      title: '학급 사진 촬영',
      startAt: iso(at(addDays(today, -5), 10, 0)),
      description: '교복을 단정히 입고 등교합니다.',
      isPublic: true,
    },
  ],

  studentCount: 28,
}

/** 데이터 없음 상태 확인용 */
export const MOCK_CLASSROOM_EMPTY: ClassroomDetail = {
  classroom: {
    id: 'mock-classroom',
    name: '3학년 4반',
    teacherName: '윤다연',
    rules: [],
  },
  timetable: null,
  meal: null,
  cleaningDuties: [],
  notices: [],
  events: [],
  studentCount: 0,
}

export const MOCK_MEAL_DATE = format(today, 'yyyy-MM-dd')
