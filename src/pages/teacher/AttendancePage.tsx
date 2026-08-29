import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { History } from 'lucide-react'
import { TeacherPageShell } from '@/components/layout'
import { Card, EmptyState, Input, Spinner } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  ATTENDANCE_STATUS,
  attendanceKeys,
  fetchAttendance,
  fetchAttendanceHistory,
  saveAttendance,
  STATUS_LABEL,
  type AttendanceRecord,
} from '@/features/teacher/api/attendance'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '@/lib/supabase/database.types'

/** 출결 기록 (F-ZOJYKF). 변경 이력은 DB 트리거가 자동으로 남긴다. */
export function AttendancePage() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [openHistory, setOpenHistory] = useState<string | null>(null)

  const { data: records, isPending } = useQuery({
    queryKey: attendanceKeys.day(classroomId, date),
    queryFn: () => fetchAttendance(classroomId, date),
    enabled: Boolean(classroomId),
  })

  const mutation = useMutation({
    mutationFn: (input: { studentId: string; status: AttendanceStatus; reason: string }) =>
      saveAttendance({ classroomId, date, ...input }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: attendanceKeys.day(classroomId, date) }),
  })

  return (
    <TeacherPageShell title="출결 기록" description="학교 공식 시스템을 대신하지 않아요">
      <Card className="mb-5 p-4">
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="출결 날짜"
        />
      </Card>

      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !records || records.length === 0 ? (
        <EmptyState message="아직 학급에 들어온 학생이 없어요. 학생이 구글 로그인을 해야 출결을 남길 수 있어요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((record) => (
            <StudentRow
              key={record.studentId}
              record={record}
              isSaving={mutation.isPending}
              onSave={(status, reason) =>
                mutation.mutate({ studentId: record.studentId, status, reason })
              }
              historyOpen={openHistory === record.attendanceId}
              onToggleHistory={() =>
                setOpenHistory(openHistory === record.attendanceId ? null : record.attendanceId)
              }
            />
          ))}
        </ul>
      )}

      {mutation.error && (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {mutation.error instanceof Error ? mutation.error.message : '저장하지 못했어요.'}
        </p>
      )}
    </TeacherPageShell>
  )
}

interface StudentRowProps {
  record: AttendanceRecord
  isSaving: boolean
  onSave: (status: AttendanceStatus, reason: string) => void
  historyOpen: boolean
  onToggleHistory: () => void
}

function StudentRow({ record, isSaving, onSave, historyOpen, onToggleHistory }: StudentRowProps) {
  const [reason, setReason] = useState(record.reason)

  return (
    <li className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink-900">
            {record.studentNo && <span className="mr-2 text-sm text-ink-500">{record.studentNo}</span>}
            {record.name}
          </p>
        </div>
        {record.attendanceId && (
          <button
            type="button"
            onClick={onToggleHistory}
            aria-label={`${record.name} 변경 이력`}
            className={cn(
              'shrink-0 rounded-full p-2 transition-colors',
              historyOpen ? 'bg-ink-100 text-ink-700' : 'text-ink-400 hover:bg-ink-100',
            )}
          >
            <History className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ATTENDANCE_STATUS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isSaving}
            onClick={() => onSave(option.value, reason)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
              record.status === option.value
                ? option.tone
                : 'bg-ink-100 text-ink-500 hover:bg-ink-200',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 사유는 출석이 아닐 때만 의미가 있다 */}
      {record.status && record.status !== 'present' && (
        <div className="mt-2 flex gap-2">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => {
              if (reason !== record.reason && record.status) onSave(record.status, reason)
            }}
            placeholder="사유 (예: 병원 진료)"
            className="h-9 text-sm"
          />
        </div>
      )}

      {historyOpen && record.attendanceId && <HistoryList attendanceId={record.attendanceId} />}
    </li>
  )
}

function HistoryList({ attendanceId }: { attendanceId: string }) {
  const { data: history, isPending } = useQuery({
    queryKey: attendanceKeys.history(attendanceId),
    queryFn: () => fetchAttendanceHistory(attendanceId),
  })

  if (isPending) {
    return (
      <div className="mt-2 flex justify-center py-3">
        <Spinner className="size-4" />
      </div>
    )
  }

  if (!history || history.length === 0) {
    return <p className="mt-2 text-xs text-ink-500">변경 이력이 없어요.</p>
  }

  return (
    <ul className="mt-2 flex flex-col gap-1 border-t border-ink-100 pt-2">
      {history.map((entry) => (
        <li key={entry.id} className="text-xs text-ink-600">
          <span className="text-ink-400">{formatDate(entry.changedAt, 'M월 d일 HH:mm')}</span>{' '}
          {entry.beforeStatus ? (
            <>
              {STATUS_LABEL[entry.beforeStatus]} → {STATUS_LABEL[entry.afterStatus]}
            </>
          ) : (
            <>{STATUS_LABEL[entry.afterStatus]} 기록</>
          )}
          {entry.afterReason && <span className="text-ink-400"> · {entry.afterReason}</span>}
        </li>
      ))}
    </ul>
  )
}
