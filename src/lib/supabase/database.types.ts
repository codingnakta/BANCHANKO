/**
 * Supabase 스키마 타입.
 * 스키마 확정 후 아래 명령으로 생성한 결과로 교체한다.
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */
export type Database = Record<string, never>
