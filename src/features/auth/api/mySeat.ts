import { supabase } from '@/lib/supabase'

export const mySeatKeys = {
  all: ['mySeat'] as const,
  mine: (userId: string) => [...mySeatKeys.all, userId] as const,
}

export interface MySeat {
  studentNo: string
  name: string
  classRole: string
}

/**
 * 선생님이 명단에 적어 둔 내 학번·이름.
 *
 * 화면에는 구글 계정 이름 대신 이 이름을 쓴다. 명단이 학급의 기준이라
 * 계정 이름이 'yundayeon' 같아도 '윤다연'으로 보여야 한다.
 * 교사에게는 명단 줄이 없어 null 이 돌아온다.
 */
export async function fetchMySeat(): Promise<MySeat | null> {
  const { data, error } = await supabase
    .from('my_seat')
    .select('student_no, student_name, class_role')
    .maybeSingle()

  if (error) {
    console.error('[seat] 조회 실패', error)
    return null
  }
  if (!data) return null

  return {
    studentNo: data.student_no ?? '',
    name: data.student_name ?? '',
    classRole: data.class_role ?? '',
  }
}

/** 내 이름 바꾸기. profiles 는 컬럼 단위로 열려 있어 이름만 고칠 수 있다. */
export async function updateMyName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', userId)

  if (error) {
    console.error('[profile] 이름 변경 실패', error)
    throw new Error('이름을 바꾸지 못했어요.')
  }
}
