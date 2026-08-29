import { supabase } from '@/lib/supabase'
import { normalizeEmail } from '@/features/classroom/api/createClassroom'
import type { RosterEntry } from '@/types'

export const rosterKeys = {
  all: ['roster'] as const,
  list: (classroomId: string) => [...rosterKeys.all, classroomId] as const,
}

/** 명단 한 줄 + 실제 참여 여부 */
export interface RosterMember {
  email: string
  studentNo: string
  name: string
  /** 학생 전화번호 (교사만 볼 수 있다) */
  phone: string
  /** 학부모 전화번호 (교사만 볼 수 있다) */
  parentPhone: string
  /** 구글 로그인으로 실제 학급에 들어왔는지 */
  joined: boolean
  /** 참여했다면 그 계정의 profiles.id */
  studentId: string | null
  /** 담당 과목이 있으면 1인1역(과목도우미) (M5) */
  helperSubject: string | null
}

/**
 * 학생 명단.
 *
 * classroom_roster(교사가 등록한 좌석)를 기준으로 하고,
 * classroom_members(실제 참여)를 붙여 누가 아직 안 들어왔는지 보여준다.
 */
export async function fetchRoster(classroomId: string): Promise<RosterMember[]> {
  const [rosterResult, memberResult] = await Promise.all([
    supabase
      .from('classroom_roster')
      .select('email, student_no, student_name, phone, parent_phone, claimed_by')
      .eq('classroom_id', classroomId)
      .order('student_no'),
    supabase
      .from('classroom_members')
      .select('student_id, helper_subject')
      .eq('classroom_id', classroomId),
  ])

  if (rosterResult.error) {
    console.error('[roster] 조회 실패', rosterResult.error)
    throw new Error('학생 명단을 불러오지 못했어요.')
  }

  const helperByStudent = new Map(
    (memberResult.data ?? []).map((m) => [m.student_id, m.helper_subject]),
  )

  return (rosterResult.data ?? []).map((row) => ({
    email: row.email,
    studentNo: row.student_no ?? '',
    name: row.student_name ?? '',
    phone: row.phone ?? '',
    parentPhone: row.parent_phone ?? '',
    joined: row.claimed_by !== null,
    studentId: row.claimed_by,
    helperSubject: row.claimed_by ? (helperByStudent.get(row.claimed_by) ?? null) : null,
  }))
}

/** 명단에 학생을 추가한다. 이미 다른 학급에 등록된 이메일은 거절 목록으로 돌려준다. */
export async function addRosterEntries(
  classroomId: string,
  entries: RosterEntry[],
): Promise<string[]> {
  const rejected: string[] = []

  for (const entry of entries) {
    const { error } = await supabase.from('classroom_roster').insert({
      classroom_id: classroomId,
      email: normalizeEmail(entry.email),
      student_no: entry.studentNo.trim() || null,
      student_name: entry.name.trim() || null,
      phone: entry.phone?.trim() || null,
      parent_phone: entry.parentPhone?.trim() || null,
    })
    if (error) {
      if (error.code === '23505') {
        rejected.push(normalizeEmail(entry.email))
      } else {
        console.error('[roster] 추가 실패', error)
        throw new Error('학생을 추가하지 못했어요.')
      }
    }
  }
  return rejected
}

/** 명단에서 빼고, 이미 참여한 학생이면 학급 소속도 해제한다 (F-FMLMIG). */
export async function removeRosterEntry(
  classroomId: string,
  email: string,
  studentId: string | null,
): Promise<void> {
  if (studentId) {
    const { error } = await supabase
      .from('classroom_members')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)
    if (error) {
      console.error('[roster] 소속 해제 실패', error)
      throw new Error('학급 소속을 해제하지 못했어요.')
    }
  }

  const { error } = await supabase
    .from('classroom_roster')
    .delete()
    .eq('classroom_id', classroomId)
    .eq('email', email)

  if (error) {
    console.error('[roster] 삭제 실패', error)
    throw new Error('학생을 명단에서 빼지 못했어요.')
  }
}

/**
 * 1인1역(과목도우미) 지정·해제 (M5).
 * 담당 과목이 있으면 그 과목의 과제를 학생이 직접 등록할 수 있다 (RLS 가 강제).
 */
export async function setHelperSubject(
  classroomId: string,
  studentId: string,
  subject: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('classroom_members')
    .update({ helper_subject: subject?.trim() || null })
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)

  if (error) {
    console.error('[roster] 1인1역 지정 실패', error)
    throw new Error('1인1역을 지정하지 못했어요.')
  }
}
