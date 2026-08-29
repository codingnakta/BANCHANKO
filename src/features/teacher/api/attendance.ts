import { supabase } from '@/lib/supabase'
import type { AttendanceStatus } from '@/lib/supabase/database.types'

export const attendanceKeys = {
  all: ['attendance'] as const,
  day: (classroomId: string, date: string) => [...attendanceKeys.all, classroomId, date] as const,
  history: (attendanceId: string) => [...attendanceKeys.all, 'history', attendanceId] as const,
}

export const ATTENDANCE_STATUS: { value: AttendanceStatus; label: string; tone: string }[] = [
  { value: 'present', label: '출석', tone: 'bg-success/10 text-success' },
  { value: 'late', label: '지각', tone: 'bg-warning/10 text-warning' },
  { value: 'early_leave', label: '조퇴', tone: 'bg-warning/10 text-warning' },
  { value: 'excused', label: '인정결석', tone: 'bg-brand-100 text-brand-700' },
  { value: 'absent', label: '결석', tone: 'bg-danger/10 text-danger' },
]

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  early_leave: '조퇴',
  excused: '인정결석',
  absent: '결석',
}

export interface AttendanceRecord {
  studentId: string
  name: string
  studentNo: string
  /** 아직 기록하지 않았으면 null */
  attendanceId: string | null
  status: AttendanceStatus | null
  reason: string
}

/**
 * 하루치 출결 (F-ZOJYKF).
 *
 * 학급에 실제로 참여한 학생을 기준으로 하고, 그날 기록이 있으면 붙인다.
 * 명단에만 있고 아직 로그인하지 않은 학생은 계정이 없어 출결을 남길 수 없다.
 */
export async function fetchAttendance(
  classroomId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const [memberResult, recordResult, rosterResult] = await Promise.all([
    supabase
      .from('classroom_members')
      .select('student_id, profiles(name)')
      .eq('classroom_id', classroomId),
    supabase
      .from('attendance')
      .select('id, student_id, status, reason')
      .eq('classroom_id', classroomId)
      .eq('date', date),
    supabase
      .from('classroom_roster')
      .select('claimed_by, student_no, student_name')
      .eq('classroom_id', classroomId),
  ])

  if (memberResult.error) {
    console.error('[attendance] 학생 조회 실패', memberResult.error)
    throw new Error('학생 목록을 불러오지 못했어요.')
  }

  const recordByStudent = new Map((recordResult.data ?? []).map((r) => [r.student_id, r]))
  const rosterByStudent = new Map(
    (rosterResult.data ?? []).filter((r) => r.claimed_by).map((r) => [r.claimed_by!, r]),
  )

  return (memberResult.data ?? [])
    .map((member) => {
      const record = recordByStudent.get(member.student_id)
      const roster = rosterByStudent.get(member.student_id)
      const profile = member.profiles as unknown as { name?: string } | null

      return {
        studentId: member.student_id,
        name: roster?.student_name || profile?.name || '이름 없음',
        studentNo: roster?.student_no ?? '',
        attendanceId: record?.id ?? null,
        status: record?.status ?? null,
        reason: record?.reason ?? '',
      }
    })
    .sort((a, b) => a.studentNo.localeCompare(b.studentNo) || a.name.localeCompare(b.name))
}

/**
 * 출결을 남기거나 고친다.
 * 변경 이력은 DB 트리거가 자동으로 쌓으므로 화면에서 따로 챙기지 않는다.
 */
export async function saveAttendance(input: {
  classroomId: string
  studentId: string
  date: string
  status: AttendanceStatus
  reason: string
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()

  const { error } = await supabase.from('attendance').upsert(
    {
      classroom_id: input.classroomId,
      student_id: input.studentId,
      date: input.date,
      status: input.status,
      reason: input.reason.trim() || null,
      updated_by: userData.user?.id ?? null,
    },
    { onConflict: 'classroom_id,student_id,date' },
  )

  if (error) {
    console.error('[attendance] 저장 실패', error)
    throw new Error('출결을 저장하지 못했어요.')
  }
}

export interface HistoryEntry {
  id: string
  beforeStatus: AttendanceStatus | null
  beforeReason: string | null
  afterStatus: AttendanceStatus
  afterReason: string | null
  changedAt: string
}

export async function fetchAttendanceHistory(attendanceId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('attendance_history')
    .select('*')
    .eq('attendance_id', attendanceId)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('[attendance] 이력 조회 실패', error)
    throw new Error('변경 이력을 불러오지 못했어요.')
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    beforeStatus: row.before_status,
    beforeReason: row.before_reason,
    afterStatus: row.after_status,
    afterReason: row.after_reason,
    changedAt: row.changed_at,
  }))
}
