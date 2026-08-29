import { supabase } from '@/lib/supabase'
import type { RosterEntry, School } from '@/types'

export interface CreateClassroomInput {
  school: School | null
  grade: number
  classNo: number
  name: string
  roster: RosterEntry[]
}

export interface CreateClassroomResult {
  classroomId: string
  /** 다른 학급에 이미 등록되어 있어 명단에 넣지 못한 이메일 */
  rejectedEmails: string[]
}

/** 이메일 비교는 소문자·공백 제거 기준으로만 한다 (학교 계정이라 점 정규화는 하지 않는다). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * 학급을 만들고 학생 명단을 등록한다.
 *
 * teacher_id 는 RLS 가 auth.uid() 와 대조하므로 클라이언트 값을 믿지 않는다.
 * 명단 중 다른 학급에 이미 등록된 이메일은 unique 제약에 걸리므로,
 * 전체 insert 를 실패시키지 않고 걸러낸 뒤 거절 목록으로 돌려준다.
 */
export async function createClassroom(input: CreateClassroomInput): Promise<CreateClassroomResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('로그인이 만료됐어요. 다시 로그인해주세요.')
  }

  const { data: classroom, error: classroomError } = await supabase
    .from('classrooms')
    .insert({
      teacher_id: userData.user.id,
      name: input.name.trim(),
      grade: input.grade,
      class_no: input.classNo,
      school_name: input.school?.schoolName ?? null,
      office_code: input.school?.officeCode ?? null,
      school_code: input.school?.schoolCode ?? null,
      school_level: input.school?.schoolLevel ?? null,
    })
    .select('id')
    .single()

  if (classroomError || !classroom) {
    console.error('[classroom] 생성 실패', classroomError)
    throw new Error(
      classroomError?.code === '23505'
        ? '이미 만든 학급이 있어요.'
        : '학급을 만들지 못했어요. 잠시 후 다시 시도해주세요.',
    )
  }

  const rejectedEmails = await insertRoster(classroom.id, input.roster)
  return { classroomId: classroom.id, rejectedEmails }
}

/** 명단을 넣고, 이미 다른 학급에 등록된 이메일 목록을 돌려준다. */
export async function insertRoster(
  classroomId: string,
  roster: RosterEntry[],
): Promise<string[]> {
  if (roster.length === 0) return []

  const rows = roster.map((entry) => ({
    classroom_id: classroomId,
    email: normalizeEmail(entry.email),
    student_no: entry.studentNo.trim() || null,
    student_name: entry.name.trim() || null,
  }))

  const { error } = await supabase.from('classroom_roster').insert(rows)
  if (!error) return []

  // unique 위반이 아니면 원인을 알 수 없으니 그대로 올린다
  if (error.code !== '23505') {
    console.error('[classroom] 명단 등록 실패', error)
    throw new Error('학생 명단을 저장하지 못했어요.')
  }

  // 한 건이라도 겹치면 배치 전체가 실패하므로, 한 줄씩 넣어 겹치는 것만 추려낸다
  const rejected: string[] = []
  for (const row of rows) {
    const { error: rowError } = await supabase.from('classroom_roster').insert(row)
    if (rowError) {
      if (rowError.code === '23505') {
        rejected.push(row.email)
      } else {
        console.error('[classroom] 명단 한 줄 등록 실패', rowError)
        throw new Error('학생 명단을 저장하지 못했어요.')
      }
    }
  }
  return rejected
}
