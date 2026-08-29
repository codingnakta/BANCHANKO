import { addDays, format, set } from 'date-fns'
import type { DashboardSummary } from '@/types'

/**
 * 화면 개발용 임시 데이터. docs/ 의 Figma 시안 내용을 그대로 옮겼다.
 * Supabase 스키마 확정 후 dashboard.api.ts 의 실제 쿼리로 교체하고 이 파일은 삭제한다.
 */

const today = new Date()
const iso = (d: Date) => d.toISOString()
const at = (d: Date, hours: number, minutes = 0) =>
  set(d, { hours, minutes, seconds: 0, milliseconds: 0 })

export const MOCK_DASHBOARD: DashboardSummary = {
  classroomName: '4반',
  todayTasks: [
    { id: 'tt1', label: '커리어국어 수행평가 발표' },
    { id: 'tt2', label: '청소당번(복도 청소)' },
    { id: 'tt3', label: '급식 신청서 제출하기' },
  ],
  currentPeriod: 2,
  timetable: [
    { id: 't1', period: 1, subject: '자치' },
    { id: 't2', period: 2, subject: '수학/국어' },
    { id: 't3', period: 3, subject: 'CS' },
    { id: 't4', period: 4, subject: 'CS' },
    { id: 't5', period: 5, subject: '웅프' },
    { id: 't6', period: 6, subject: '웅프' },
    { id: 't7', period: 7, subject: '' },
    { id: 't8', period: -1, periodLabel: '방과후A', subject: '' },
    { id: 't9', period: -2, periodLabel: '방과후B', subject: '' },
  ],
  meal: {
    id: 'm1',
    date: format(today, 'yyyy-MM-dd'),
    items: [
      '보리쌀밥',
      '청양호박된장국 (5,6)',
      '배추겉절이(j)',
      '꼬들어묵채볶음 (1,5,6,13)',
      '고추장오리불고기&무쌈(j) (5,6,13,18)',
      '별셋소떡꼬치 (2,5,6,10,12,13,15,16)',
    ],
    syncedAt: iso(at(today, 7, 30)),
  },
  cleaningDuties: [
    { id: 'c1', area: '복도', studentNames: ['홍창기', '오지환', '문보경'] },
    { id: 'c2', area: '교실', studentNames: ['박해민', '신민재'] },
  ],
  unreadNotices: [
    {
      id: 'n1',
      type: 'notice',
      title: '체육대회 반티 색상 투표 안내',
      body: '이번 주 금요일까지 반티 색상 투표를 마감합니다. 학급 게시판에서 확인해 주세요.',
      status: 'published',
      publishedAt: iso(at(today, 8, 10)),
      isRead: false,
    },
    {
      id: 'n2',
      type: 'newsletter',
      title: '2학기 학부모 상담주간 가정통신문',
      body: '2학기 학부모 상담주간이 다음 달 첫째 주에 진행됩니다. 신청서는 아래 링크에서 작성해 주세요.',
      externalUrl: 'https://example.school.kr/counseling',
      status: 'published',
      publishedAt: iso(addDays(today, -1)),
      isRead: false,
    },
  ],
  upcomingAssignments: [
    {
      id: 'a1',
      type: 'assignment',
      title: '응용프로그래밍 수행평가',
      body: '팀별 프로젝트 결과물을 제출하고 발표 자료를 함께 준비합니다.',
      status: 'published',
      publishedAt: iso(addDays(today, -3)),
      dueAt: iso(at(addDays(today, 21), 9, 0)),
      isRead: true,
    },
    {
      id: 'a2',
      type: 'assignment',
      title: '커리어국어 수행평가 발표',
      body: '발표 순서는 학급 게시판에서 확인하세요.',
      status: 'published',
      publishedAt: iso(addDays(today, -2)),
      dueAt: iso(at(today, 17, 0)),
      isRead: true,
    },
  ],
  upcomingEvents: [
    {
      id: 'e1',
      title: '전교 체육대회',
      startAt: iso(at(addDays(today, 2), 9, 0)),
      description: '체육복과 학급 티셔츠를 착용하고 등교합니다.',
      isPublic: true,
    },
    {
      id: 'e2',
      title: '2학기 중간고사',
      startAt: iso(at(addDays(today, 12), 9, 0)),
      isPublic: true,
    },
  ],
  hasUnreadNotification: true,
}

/** 데이터 없음 상태 확인용 — 필요 시 useDashboard 에서 바꿔 끼운다. */
export const MOCK_DASHBOARD_EMPTY: DashboardSummary = {
  classroomName: '4반',
  todayTasks: [],
  currentPeriod: undefined,
  timetable: null,
  meal: null,
  cleaningDuties: [],
  unreadNotices: [],
  upcomingAssignments: [],
  upcomingEvents: [],
  hasUnreadNotification: false,
}
