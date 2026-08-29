import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Download, Utensils } from 'lucide-react'
import { TeacherPageShell } from '@/components/layout'
import { Button, Card, Spinner } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { invalidateClassroomViews } from '@/lib/invalidate'
import { useDashboard } from '@/features/dashboard'
import {
  emptyGrid,
  fetchNeisWeek,
  fetchSavedTimetable,
  mondayOf,
  PERIODS,
  publishTimetable,
  timetableKeys,
  WEEKDAY_LABELS,
  type TimetableGrid,
} from '@/features/teacher/api/timetable'
import { useMyClassroomRow } from '@/features/teacher/hooks/useMyClassroomRow'

/**
 * 시간표·급식 검수 (F-OHHQTM).
 *
 * 나이스에서 받아온 시간표는 그대로 학생에게 보내지 않고, 교사가 확인·수정한 뒤 공개한다.
 * 시간표를 제공하지 않는 학교는 빈 격자에 직접 입력하면 된다.
 * 급식은 교사가 고칠 수 있는 값이 아니라 확인용으로만 보여준다.
 */
export function TimetableReviewPage() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()

  const { data: classroom } = useMyClassroomRow()
  const { data: dashboard } = useDashboard()
  const [grid, setGrid] = useState<TimetableGrid>(emptyGrid())
  const [saved, setSaved] = useState(false)

  const { data: savedGrid, isPending } = useQuery({
    queryKey: timetableKeys.detail(classroomId),
    queryFn: () => fetchSavedTimetable(classroomId),
    enabled: Boolean(classroomId),
  })

  // 저장된 시간표가 도착하면 한 번만 폼에 옮긴다
  const [loadedFrom, setLoadedFrom] = useState<TimetableGrid | null>(null)
  if (savedGrid && savedGrid !== loadedFrom) {
    setLoadedFrom(savedGrid)
    setGrid(savedGrid)
  }

  const importMutation = useMutation({
    mutationFn: () => fetchNeisWeek(classroom!, mondayOf(new Date())),
    onSuccess: (imported) => setGrid(imported),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishTimetable(classroomId, grid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: timetableKeys.detail(classroomId) })
      await invalidateClassroomViews(queryClient)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const hasSchool = Boolean(classroom?.office_code && classroom?.school_code)

  return (
    <TeacherPageShell
      title="시간표·급식 검수"
      description={
        classroom?.timetable_published
          ? '학생에게 공개된 시간표예요'
          : '공개하기 전까지 학생에게 보이지 않아요'
      }
      action={
        <Button size="md" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
          {publishMutation.isPending && <Spinner className="size-4" />}
          {saved ? '공개됨' : '공개하기'}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Card className="p-4">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => importMutation.mutate()}
            disabled={!hasSchool || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Download className="size-4" />
            )}
            나이스에서 이번 주 시간표 가져오기
          </Button>
          <p className="mt-2 text-center text-xs text-ink-500">
            {hasSchool
              ? '가져온 뒤 고칠 수 있어요. 공개해야 학생에게 보입니다.'
              : '학교를 선택하지 않아 자동으로 가져올 수 없어요. 직접 입력해주세요.'}
          </p>
          {importMutation.isSuccess &&
            Object.values(importMutation.data ?? {}).every((day) =>
              Object.values(day).every((subject) => !subject),
            ) && (
              <p className="mt-2 text-center text-xs text-warning">
                이 학교는 나이스에 시간표를 올리지 않아요. 직접 입력해주세요.
              </p>
            )}
        </Card>

        {/* 시간표 격자 */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-10" />
                {WEEKDAY_LABELS.map((label) => (
                  <th key={label} className="pb-1 text-sm font-semibold text-ink-700">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period}>
                  <th className="text-xs font-medium text-ink-500">{period}</th>
                  {WEEKDAY_LABELS.map((label, index) => {
                    const weekday = index + 1
                    return (
                      <td key={label}>
                        <input
                          value={grid[weekday]?.[period] ?? ''}
                          onChange={(event) =>
                            setGrid({
                              ...grid,
                              [weekday]: { ...grid[weekday], [period]: event.target.value },
                            })
                          }
                          aria-label={`${label}요일 ${period}교시`}
                          className="h-11 w-full rounded-lg border border-ink-200 bg-white px-2 text-center text-sm text-ink-900 focus:outline-2 focus:outline-brand-500"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 급식은 확인용 */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Utensils className="size-4 text-brand-700" />
            오늘 급식 ({format(new Date(), 'M월 d일')})
          </h2>
          {dashboard?.meal ? (
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {dashboard.meal.items.map((item) => (
                <li key={item} className="text-sm text-ink-700">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500">
              오늘 급식 정보가 없어요. (주말이거나 학교가 제공하지 않는 날)
            </p>
          )}
          <p className="mt-3 text-xs text-ink-400">
            급식은 나이스 정보를 그대로 보여주며 수정할 수 없어요.
          </p>
        </Card>

        {publishMutation.error && (
          <p role="alert" className="text-center text-sm text-danger">
            {publishMutation.error instanceof Error
              ? publishMutation.error.message
              : '공개하지 못했어요.'}
          </p>
        )}
      </div>
    </TeacherPageShell>
  )
}
