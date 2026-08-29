import { supabase } from './client'

export interface SupabaseHealth {
  ok: boolean
  /** 세션 조회까지 성공했는지 (Auth 응답 확인) */
  auth: boolean
  /** 실제로 존재가 확인된 테이블 */
  foundTables: string[]
  /** 아직 만들어지지 않은 테이블 */
  missingTables: string[]
  message: string
}

/** supabase/migrations 가 실제로 만드는 테이블 */
const EXPECTED_TABLES = [
  'profiles',
  'classrooms',
  'classroom_members',
  'classroom_roster',
  'posts',
  'duties',
] as const

/** 테이블이 스키마에 없을 때 PostgREST 가 주는 코드 */
const TABLE_NOT_FOUND = 'PGRST205'

/**
 * Supabase 연결 상태를 확인한다.
 * 개발 중 스키마 진행 상황을 눈으로 보려고 만든 도구다.
 *
 * 주의: head:true 로 조회하면 없는 테이블에도 204 가 떨어져 존재하는 것처럼 보인다.
 *       실제 존재 여부는 일반 select 의 에러 코드로 판단해야 한다.
 */
export async function checkSupabase(): Promise<SupabaseHealth> {
  const { error: authError } = await supabase.auth.getSession()
  if (authError) {
    return {
      ok: false,
      auth: false,
      foundTables: [],
      missingTables: [...EXPECTED_TABLES],
      message: `Auth 응답 실패: ${authError.message}`,
    }
  }

  const results = await Promise.all(
    EXPECTED_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select('*').limit(1)
      // 테이블이 없으면 PGRST205. 그 밖의 에러(RLS 로 막힘 등)는 '존재함'으로 본다.
      return { table, exists: error?.code !== TABLE_NOT_FOUND }
    }),
  )

  const foundTables = results.filter((r) => r.exists).map((r) => r.table)
  const missingTables = results.filter((r) => !r.exists).map((r) => r.table)

  return {
    ok: true,
    auth: true,
    foundTables,
    missingTables,
    message: foundTables.length
      ? `연결됨 · 테이블 ${foundTables.length}/${EXPECTED_TABLES.length}개 확인`
      : '연결됨 · 아직 만들어진 테이블이 없습니다',
  }
}
