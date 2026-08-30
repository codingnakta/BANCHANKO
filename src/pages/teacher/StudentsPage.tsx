import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, FileSpreadsheet, Pencil, Plus, Trash2, X } from 'lucide-react'
import { TeacherPageShell } from '@/components/layout'
import { Button, EmptyState, Field, Input, Modal, Spinner } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { downloadRosterTemplate, parseRosterFile } from '@/features/classroom/api/rosterFile'
import {
  addRosterEntries,
  fetchRoster,
  removeRosterEntry,
  rosterKeys,
  setClassRole,
  updateRosterEntry,
  type RosterMember,
} from '@/features/teacher/api/roster'
import { cn } from '@/lib/utils'

/** 학생 관리 (F-FMLMIG, M5). */
export function StudentsPage() {
  const user = useCurrentUser()
  const classroomId = user?.classroomId ?? ''
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [newStudent, setNewStudent] = useState({
    studentNo: '',
    name: '',
    email: '',
    phone: '',
    parentPhone: '',
    classRole: '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** 1인1역을 고치는 중인 학생의 이메일 */
  /** 등록 팝업 */
  const [adding, setAdding] = useState(false)
  /** 고치는 중인 학생 (원래 이메일로 찾는다) */
  const [editing, setEditing] = useState<RosterMember | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [roleInput, setRoleInput] = useState('')

  const { data: roster, isPending } = useQuery({
    queryKey: rosterKeys.list(classroomId),
    queryFn: () => fetchRoster(classroomId),
    enabled: Boolean(classroomId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: rosterKeys.list(classroomId) })

  const addMutation = useMutation({
    mutationFn: (entries: Parameters<typeof addRosterEntries>[1]) =>
      addRosterEntries(classroomId, entries),
    onSuccess: async (rejected, entries) => {
      await invalidate()
      const added = entries.length - rejected.length
      setMessage(
        rejected.length > 0
          ? `${added}명 추가. ${rejected.length}명은 이미 다른 학급에 등록되어 있어요.`
          : `${added}명을 추가했어요.`,
      )
      setNewStudent({
        studentNo: '',
        name: '',
        email: '',
        phone: '',
        parentPhone: '',
        classRole: '',
      })
      setAdding(false)
    },
    onError: (e: Error) => setError(e.message),
  })

  const removeMutation = useMutation({
    mutationFn: (member: RosterMember) =>
      removeRosterEntry(classroomId, member.email, member.studentId),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  })

  const editMutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateRosterEntry>[2]) =>
      updateRosterEntry(classroomId, editing!.email, patch),
    onSuccess: async () => {
      await invalidate()
      setEditing(null)
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string | null }) =>
      setClassRole(classroomId, email, role),
    onSuccess: async () => {
      await invalidate()
      setEditingRole(null)
      setRoleInput('')
    },
    onError: (e: Error) => setError(e.message),
  })

  async function handleFile(file: File) {
    setError(null)
    try {
      const parsed = await parseRosterFile(file)
      if (parsed.entries.length === 0) {
        setError('파일에서 읽을 학생이 없어요.')
        return
      }
      addMutation.mutate(parsed.entries)
    } catch {
      setError('파일을 읽지 못했어요. 양식 그대로인지 확인해주세요.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function addOne() {
    setError(null)
    if (!newStudent.email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    addMutation.mutate([newStudent])
  }

  return (
    <TeacherPageShell
      title="학생 관리"
      description="학생 정보를 등록하고 1인1역을 정해요"
      action={
        <Button size="md" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          추가
        </Button>
      }
    >
      {message && (
        <p className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>
      )}
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* 명단 */}
      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !roster || roster.length === 0 ? (
        <EmptyState message="아직 등록한 학생이 없어요." />
      ) : (
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">
            학생 {roster.length}명
            <span className="ml-2 text-sm font-medium text-ink-500">
              {roster.filter((m) => m.joined).length}명 참여
            </span>
          </h2>

          <ul className="flex flex-col gap-2">
            {roster.map((member) => (
              <li
                key={member.email}
                className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      member.joined
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-ink-100 text-ink-400',
                    )}
                    title={member.joined ? '참여함' : '아직 로그인 전'}
                  >
                    {member.joined ? <Check className="size-4" /> : '—'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-ink-900">
                      {member.studentNo && (
                        <span className="mr-2 text-sm text-ink-500">{member.studentNo}</span>
                      )}
                      {member.name || member.email.split('@')[0]}
                      {member.classRole && (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {member.classRole}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{member.email}</p>
                    {(member.phone || member.parentPhone) && (
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {member.phone && `학생 ${member.phone}`}
                        {member.phone && member.parentPhone && ' · '}
                        {member.parentPhone && `학부모 ${member.parentPhone}`}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditing(member)}
                    aria-label={`${member.name || member.email} 정보 고치기`}
                    className="shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Pencil className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(member)}
                    aria-label={`${member.name || member.email} 명단에서 빼기`}
                    className="shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* 1인1역은 명단에 딸린 값이라 로그인 전 학생에게도 정할 수 있다 */}
                <div className="mt-2 border-t border-ink-100 pt-2">
                  {editingRole === member.email ? (
                    <div className="flex gap-2">
                      <Input
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="맡은 역할 (예: 칠판 담당)"
                        className="h-9 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          roleMutation.mutate({ email: member.email, role: roleInput || null })
                        }
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRole(null)}
                        aria-label="취소"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRole(member.email)
                        setRoleInput(member.classRole)
                      }}
                      className="text-sm text-brand-500 hover:underline"
                    >
                      {member.classRole ? '1인1역 바꾸기' : '1인1역 정하기'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {editing && <EditStudent member={editing} mutation={editMutation} onClose={() => setEditing(null)} />}

      {adding && (
        <Modal title="학생 정보 등록" onClose={() => setAdding(false)}>
        <p className="mb-3 text-xs text-ink-500">
          연락처는 담임인 나만 볼 수 있어요. 학생·학부모에게는 보이지 않아요.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Field label="학번" htmlFor="studentNo">
              <Input
                id="studentNo"
                value={newStudent.studentNo}
                onChange={(e) => setNewStudent({ ...newStudent, studentNo: e.target.value })}
                placeholder="10101"
                className="w-24"
              />
            </Field>
            <Field label="이름" htmlFor="studentName">
              <Input
                id="studentName"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                placeholder="홍길동"
              />
            </Field>
          </div>

          <Field label="구글 계정 이메일" htmlFor="studentEmail">
            <Input
              id="studentEmail"
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              placeholder="hong@e-mirim.hs.kr"
            />
          </Field>

          <div className="flex gap-2">
            <Field label="전화번호" htmlFor="studentPhone">
              <Input
                id="studentPhone"
                type="tel"
                inputMode="tel"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </Field>
            <Field label="학부모 전화번호" htmlFor="parentPhone">
              <Input
                id="parentPhone"
                type="tel"
                inputMode="tel"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                placeholder="010-8765-4321"
              />
            </Field>
          </div>

          <Field label="1인1역" htmlFor="classRole">
            <Input
              id="classRole"
              value={newStudent.classRole}
              onChange={(e) => setNewStudent({ ...newStudent, classRole: e.target.value })}
              placeholder="칠판 담당"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button onClick={addOne} disabled={addMutation.isPending}>
            <Plus className="size-4" />
            추가
          </Button>
        </div>

        <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => downloadRosterTemplate()}
          >
            <Download className="size-4" />
            양식 받기
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={addMutation.isPending}
          >
            <FileSpreadsheet className="size-4" />
            엑셀로 한번에
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </div>
        </Modal>
      )}
    </TeacherPageShell>
  )
}

/** 명단 한 줄 고치기 — 학번·이름·이메일·연락처 */
function EditStudent({
  member,
  mutation,
  onClose,
}: {
  member: RosterMember
  mutation: {
    mutate: (patch: {
      studentNo: string
      name: string
      email: string
      phone: string
      parentPhone: string
    }) => void
    isPending: boolean
    error: Error | null
  }
  onClose: () => void
}) {
  const [form, setForm] = useState({
    studentNo: member.studentNo,
    name: member.name,
    email: member.email,
    phone: member.phone,
    parentPhone: member.parentPhone,
  })

  return (
    <Modal title="학생 정보 고치기" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Field label="학번" htmlFor="editNo">
            <Input
              id="editNo"
              value={form.studentNo}
              onChange={(e) => setForm({ ...form, studentNo: e.target.value })}
              className="w-24"
            />
          </Field>
          <Field label="이름" htmlFor="editName">
            <Input
              id="editName"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
        </div>

        <Field
          label="구글 계정 이메일"
          htmlFor="editEmail"
          hint={
            member.joined
              ? '이미 들어온 학생이에요. 이메일을 바꾸면 바뀐 계정으로 들어오게 됩니다.'
              : '이 이메일로 로그인해야 우리 반에 들어올 수 있어요.'
          }
        >
          <Input
            id="editEmail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        <div className="flex gap-2">
          <Field label="전화번호" htmlFor="editPhone">
            <Input
              id="editPhone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="학부모 전화번호" htmlFor="editParentPhone">
            <Input
              id="editParentPhone"
              type="tel"
              inputMode="tel"
              value={form.parentPhone}
              onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
            />
          </Field>
        </div>

        {mutation.error && (
          <p role="alert" className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : '고치지 못했어요.'}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => mutation.mutate(form)}
            disabled={!form.email.trim() || mutation.isPending}
          >
            저장
          </Button>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </Modal>
  )
}
