/** 환경변수 접근 지점. 누락 시 앱 부팅 단계에서 바로 실패시킨다. */
function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`환경변수 ${key} 가 설정되지 않았습니다. .env.local 을 확인하세요.`)
  }
  return value
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  /**
   * publishable 키는 브라우저에 노출되는 것을 전제로 한 키다.
   * 실제 접근 통제는 RLS 정책이 담당하므로, 테이블마다 정책을 반드시 건다.
   * secret(service_role) 키는 절대 프론트엔드에 두지 않는다.
   */
  supabasePublishableKey: required(
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ),
}
