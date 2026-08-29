import { PageHeader } from '@/components/layout'
import { EmptyState } from '@/components/ui'

/** 이메일 로그인 (F-UBHBGS) */
export function LoginPage() {
  return (
    <>
      <PageHeader title="반창고 로그인" description="이메일로 로그인하세요" />
      <EmptyState message="로그인 폼 구현 예정" />
    </>
  )
}
