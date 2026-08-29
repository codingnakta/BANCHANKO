import { addDays, addHours, set } from 'date-fns'
import { ROUTES } from '@/constants'
import type { AppNotification } from '@/types'

/**
 * 알림 목록 화면 개발용 임시 데이터.
 * Supabase 연동 시 실제 쿼리로 교체한다. 학생은 자신에게 생성된 알림만 조회한다.
 */

const today = new Date()
const iso = (d: Date) => d.toISOString()
const at = (d: Date, hours: number, minutes = 0) =>
  set(d, { hours, minutes, seconds: 0, milliseconds: 0 })

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'noti1',
    type: 'notice',
    title: '새 공지가 올라왔어요',
    body: '체육대회 반티 색상 투표 안내',
    createdAt: iso(at(today, 8, 10)),
    readAt: null,
    href: ROUTES.noticeDetail('n1'),
  },
  {
    id: 'noti2',
    type: 'assignment_due',
    title: '과제 마감이 오늘이에요',
    body: '커리어국어 수행평가 발표',
    createdAt: iso(at(today, 7, 0)),
    readAt: null,
    href: ROUTES.noticeDetail('a2'),
  },
  {
    id: 'noti3',
    type: 'cleaning_duty',
    title: '오늘 청소 당번이에요',
    body: '복도 청소 — 홍창기, 오지환, 문보경',
    createdAt: iso(at(today, 6, 50)),
    readAt: null,
    href: ROUTES.classroom,
  },
  {
    id: 'noti4',
    type: 'event',
    title: '곧 학급 행사가 있어요',
    body: '전교 체육대회',
    createdAt: iso(addHours(addDays(today, -1), -2)),
    readAt: iso(addDays(today, -1)),
    href: ROUTES.eventDetail('e1'),
  },
  {
    id: 'noti5',
    type: 'notice',
    title: '새 가정통신문이 올라왔어요',
    body: '2학기 학부모 상담주간 가정통신문',
    createdAt: iso(addDays(today, -1)),
    readAt: iso(addDays(today, -1)),
    href: ROUTES.noticeDetail('n2'),
  },
  {
    // 연결 원본이 종료·삭제된 경우 — 접근 불가를 안내한다 (F-IAXPMY 예외)
    id: 'noti6',
    type: 'notice',
    title: '새 공지가 올라왔어요',
    body: '8월 급식 신청 안내',
    createdAt: iso(addDays(today, -3)),
    readAt: iso(addDays(today, -3)),
    href: null,
  },
]
