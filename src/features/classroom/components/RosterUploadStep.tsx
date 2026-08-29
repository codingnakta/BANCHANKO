import { useRef, useState } from 'react'
import { AlertCircle, Download, FileSpreadsheet, X } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import {
  downloadRosterTemplate,
  parseRosterFile,
  type RosterRowError,
} from '../api/rosterFile'
import type { RosterEntry } from '@/types'

interface RosterUploadStepProps {
  entries: RosterEntry[]
  onChange: (entries: RosterEntry[]) => void
}

/**
 * 학생 명단 업로드.
 * 양식을 내려받아 채운 뒤 다시 올리는 방식이라, 양식 헤더와 파서가 같은 상수를 쓴다.
 */
export function RosterUploadStep({ entries, onChange }: RosterUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<RosterRowError[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  async function handleTemplate() {
    setIsBusy(true)
    setFailure(null)
    try {
      await downloadRosterTemplate()
    } catch (error) {
      console.error('[roster] 양식 생성 실패', error)
      setFailure('양식을 만들지 못했어요.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleFile(file: File) {
    setIsBusy(true)
    setFailure(null)
    try {
      const parsed = await parseRosterFile(file)
      onChange(parsed.entries)
      setErrors(parsed.errors)
      setFileName(file.name)
    } catch (error) {
      console.error('[roster] 파일 읽기 실패', error)
      setFailure('파일을 읽지 못했어요. 양식 그대로인지 확인해주세요.')
    } finally {
      setIsBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function clear() {
    onChange([])
    setErrors([])
    setFileName(null)
    setFailure(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-ink-600">
        학생의 <strong className="font-semibold text-ink-900">학교 구글 계정</strong>을 등록해두면,
        그 학생이 구글로 로그인할 때 자동으로 우리 반에 들어옵니다.
        <br />
        지금 하지 않고 나중에 학생 관리에서 등록해도 괜찮아요.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" size="lg" onClick={handleTemplate} disabled={isBusy} className="flex-1">
          <Download className="size-4" />
          양식 내려받기
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          className="flex-1"
        >
          {isBusy ? <Spinner className="size-4" /> : <FileSpreadsheet className="size-4" />}
          파일 올리기
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>

      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure}
        </p>
      )}

      {fileName && (
        <div className="flex items-center justify-between rounded-xl bg-ink-100 px-4 py-3">
          <span className="truncate text-sm text-ink-700">{fileName}</span>
          <button
            type="button"
            onClick={clear}
            aria-label="명단 지우기"
            className="ml-3 shrink-0 rounded-full p-1 text-ink-500 hover:bg-ink-200"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <section>
          <h3 className="mb-2 px-1 text-sm font-semibold text-ink-900">
            등록할 학생 {entries.length}명
          </h3>
          <ul className="max-h-64 divide-y divide-ink-100 overflow-y-auto rounded-xl border border-ink-200">
            {entries.map((entry) => (
              <li key={entry.email} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-14 shrink-0 text-sm text-ink-500">{entry.studentNo || '—'}</span>
                <span className="w-20 shrink-0 truncate text-sm font-medium text-ink-900">
                  {entry.name || '이름 없음'}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-600">{entry.email}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {errors.length > 0 && (
        <section className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertCircle className="size-4" />
            건너뛴 줄 {errors.length}개
          </h3>
          <ul className="mt-2 flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error.row} className="text-sm text-ink-700">
                <span className="text-ink-500">{error.row}행</span> {error.raw} —{' '}
                <span className="text-danger">{error.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
