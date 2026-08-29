import { differenceInCalendarDays, format, isToday, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * ⚠️ 테스트용 — 앱 전체가 '오늘'로 여기는 날짜를 고정한다.
 * 실제 시각을 쓰려면 이 값을 null로 되돌리면 된다.
 */
const FIXED_TODAY: string | null = '2026-08-26'

/** 앱이 '지금'으로 쓰는 시각. new Date() 대신 이 함수를 쓴다. */
export function getNow(): Date {
  return FIXED_TODAY ? new Date(`${FIXED_TODAY}T09:00:00`) : new Date()
}

/** 오늘 날짜 'yyyy-MM-dd' */
export function getTodayIso(): string {
  return format(getNow(), 'yyyy-MM-dd')
}

/** 임박 판정 기준 — 오늘 포함 이 일수 이내면 '임박'으로 구분해 표시한다. (F-ZTJSNU) */
export const IMMINENT_DAYS = 2

export function formatDate(iso: string, pattern = 'M월 d일 (E)') {
  return format(parseISO(iso), pattern, { locale: ko })
}

export function formatTime(iso: string) {
  return format(parseISO(iso), 'a h:mm', { locale: ko })
}

/** 오늘 기준 남은 일수. 음수면 이미 지난 일정. */
export function daysUntil(iso: string, from: Date = getNow()) {
  return differenceInCalendarDays(parseISO(iso), from)
}

/** 당일 또는 임박(IMMINENT_DAYS 이내) 여부 */
export function isImminent(iso: string, from: Date = getNow()) {
  const days = daysUntil(iso, from)
  return days >= 0 && days <= IMMINENT_DAYS
}

/** '오늘', '내일', 'D-3', '지남' 형태의 짧은 라벨 */
export function relativeDayLabel(iso: string, from: Date = getNow()) {
  const days = daysUntil(iso, from)
  if (days < 0) return '기한 지남'
  if (days === 0) return '오늘'
  if (days === 1) return '내일'
  return `D-${days}`
}

export { isToday, parseISO }
