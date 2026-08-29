import { supabase } from '@/lib/supabase'
import type { School } from '@/types'

/**
 * 나이스 학교 검색 (Edge Function 경유).
 *
 * 나이스 API 키는 서버에만 두므로 브라우저에서 직접 부르지 않는다.
 * 함수가 응답 형태(정상/INFO-200 빈 결과)를 흡수해 항상 배열로 내려준다.
 */
export async function searchSchools(name: string, officeCode: string): Promise<School[]> {
  const query = name.trim()
  if (query.length < 2) return []

  const params = new URLSearchParams({ action: 'searchSchool', name: query })
  if (officeCode) params.set('office', officeCode)

  const { data, error } = await supabase.functions.invoke<{ schools?: School[]; error?: string }>(
    `neis?${params}`,
    { method: 'GET' },
  )

  if (error) {
    console.error('[neis] 학교 검색 실패', error)
    throw new Error('학교를 찾지 못했어요. 잠시 후 다시 시도해주세요.')
  }
  if (data?.error) {
    throw new Error(data.error)
  }

  return data?.schools ?? []
}

export const schoolKeys = {
  all: ['schools'] as const,
  search: (office: string, name: string) => [...schoolKeys.all, 'search', office, name] as const,
}
