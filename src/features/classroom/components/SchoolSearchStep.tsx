import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Search } from 'lucide-react'
import { Field, Input, Select, Spinner } from '@/components/ui'
import { EDUCATION_OFFICES } from '@/constants'
import { schoolKeys, searchSchools } from '../api/searchSchools'
import { cn } from '@/lib/utils'
import type { School } from '@/types'

interface SchoolSearchStepProps {
  officeCode: string
  onOfficeChange: (code: string) => void
  selected: School | null
  onSelect: (school: School) => void
}

/** 교육청 선택 + 학교 검색. 나이스 시간표·급식 조회에 두 코드가 모두 필요하다. */
export function SchoolSearchStep({
  officeCode,
  onOfficeChange,
  selected,
  onSelect,
}: SchoolSearchStepProps) {
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')

  // 타이핑마다 호출하면 나이스 트래픽 제한에 걸린다
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(timer)
  }, [keyword])

  const enabled = debounced.length >= 2 && officeCode !== ''
  const { data: schools, isFetching, error } = useQuery({
    queryKey: schoolKeys.search(officeCode, debounced),
    queryFn: () => searchSchools(debounced, officeCode),
    enabled,
  })

  return (
    <div className="flex flex-col gap-5">
      <Field label="소속 교육청" htmlFor="office">
        <Select
          id="office"
          value={officeCode}
          onChange={(event) => onOfficeChange(event.target.value)}
        >
          <option value="">교육청을 선택하세요</option>
          {EDUCATION_OFFICES.map((office) => (
            <option key={office.code} value={office.code}>
              {office.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="학교 검색"
        htmlFor="school"
        hint={officeCode ? '학교 이름을 두 글자 이상 입력하세요' : '교육청을 먼저 선택하세요'}
        error={error instanceof Error ? error.message : undefined}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            id="school"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            disabled={!officeCode}
            placeholder="예: 미림"
            className="pl-11"
            autoComplete="off"
          />
          {isFetching && (
            <Spinner className="absolute top-1/2 right-4 size-4 -translate-y-1/2" />
          )}
        </div>
      </Field>

      {enabled && !isFetching && schools?.length === 0 && (
        <p className="px-1 text-sm text-ink-500">
          검색 결과가 없어요. 학교 이름이나 교육청을 다시 확인해주세요.
        </p>
      )}

      {schools && schools.length > 0 && (
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {schools.map((school) => {
            const isSelected = selected?.schoolCode === school.schoolCode
            return (
              <li key={`${school.officeCode}-${school.schoolCode}`}>
                <button
                  type="button"
                  onClick={() => onSelect(school)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-ink-200 bg-white hover:bg-ink-50',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink-900">
                      {school.schoolName}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-500">
                      {school.address || school.officeName}
                    </span>
                  </span>
                  {isSelected && <Check className="size-5 shrink-0 text-brand-700" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
