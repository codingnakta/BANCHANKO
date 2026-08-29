interface TabIconProps {
  className?: string
}

/**
 * '학급운영' 탭 아이콘 — 임시.
 *
 * 다른 탭 아이콘은 docs/*.svg 를 tools/icons/build-tab-icons.mjs 로 변환해 쓴다.
 * 학급운영용 시안이 나오면 docs/manage.svg 를 넣고 그 스크립트의 ICONS 목록에
 * 한 줄 추가한 뒤, 이 파일은 지우면 된다.
 */
export function ManageIcon({ className }: TabIconProps) {
  return (
    <svg
      width={28}
      height={24}
      viewBox="0 0 28 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <rect x="7" y="3" width="14" height="18" rx="2.5" />
      <path d="M11 3.5h6" />
      <path d="M11 9h6M11 13h6M11 17h3.5" />
    </svg>
  )
}
