/**
 * Supabase 스키마 타입.
 * supabase/migrations/20260829120000_init.sql 과 1:1 로 맞춰 수기 작성했다.
 * 스키마가 바뀌면 아래 명령으로 재생성해 교체할 수 있다 (형식 동일):
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'teacher' | 'student'
export type SchoolLevel = 'middle' | 'high'
export type PostType = 'notice' | 'assignment' | 'event'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'excused'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          /** null = 아직 역할을 정하지 않음 (구글 로그인 직후) */
          role: UserRole | null
          name: string
          created_at: string
        }
        Insert: {
          id: string
          role?: UserRole | null
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          id: string
          teacher_id: string
          name: string
          school_name: string | null
          office_code: string | null
          school_code: string | null
          school_level: SchoolLevel | null
          grade: number
          class_no: number
          rules: string[]
          timetable_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          school_name?: string | null
          office_code?: string | null
          school_code?: string | null
          school_level?: SchoolLevel | null
          grade: number
          class_no: number
          created_at?: string
        }
        Update: {
          name?: string
          school_name?: string | null
          office_code?: string | null
          school_code?: string | null
          school_level?: SchoolLevel | null
          grade?: number
          class_no?: number
          rules?: string[]
          timetable_published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'classrooms_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      classroom_members: {
        Row: {
          classroom_id: string
          student_id: string
          helper_subject: string | null
          joined_at: string
        }
        Insert: {
          classroom_id: string
          student_id: string
          helper_subject?: string | null
          joined_at?: string
        }
        Update: {
          helper_subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'classroom_members_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classroom_members_student_id_fkey'
            columns: ['student_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      posts: {
        Row: {
          id: string
          classroom_id: string
          author_id: string
          type: PostType
          subject: string | null
          title: string
          body: string | null
          due_date: string | null
          link_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          author_id: string
          type: PostType
          subject?: string | null
          title: string
          body?: string | null
          due_date?: string | null
          link_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          subject?: string | null
          title?: string
          body?: string | null
          due_date?: string | null
          link_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'posts_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      classroom_roster: {
        Row: {
          classroom_id: string
          email: string
          student_no: string | null
          student_name: string | null
          claimed_by: string | null
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          classroom_id: string
          email: string
          student_no?: string | null
          student_name?: string | null
          claimed_by?: string | null
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          student_no?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'classroom_roster_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
        ]
      }
      timetable_entries: {
        Row: {
          classroom_id: string
          /** 1=월 ~ 5=금 */
          weekday: number
          period: number
          subject: string
        }
        Insert: {
          classroom_id: string
          weekday: number
          period: number
          subject?: string
        }
        Update: { subject?: string }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          classroom_id: string
          student_id: string
          date: string
          status: AttendanceStatus
          reason: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          student_id: string
          date: string
          status: AttendanceStatus
          reason?: string | null
          updated_by?: string | null
        }
        Update: {
          status?: AttendanceStatus
          reason?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      attendance_history: {
        Row: {
          id: string
          attendance_id: string
          before_status: AttendanceStatus | null
          before_reason: string | null
          after_status: AttendanceStatus
          after_reason: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      duties: {
        Row: {
          classroom_id: string
          weekday: number
          student_names: string
          task: string | null
        }
        Insert: {
          classroom_id: string
          weekday: number
          student_names?: string
          task?: string | null
        }
        Update: {
          student_names?: string
          task?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'duties_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      my_classroom_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      /** 역할을 한 번만 설정한다. 이미 정해졌으면 예외. */
      set_my_role: {
        Args: { p_role: UserRole }
        Returns: string
      }
      /** 로그인한 사용자의 이메일로 명단을 찾아 학급에 배정한다. 멱등. */
      claim_my_seat: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** 자주 쓰는 Row 타입 단축 별칭 */
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ClassroomRow = Database['public']['Tables']['classrooms']['Row']
export type ClassroomMemberRow = Database['public']['Tables']['classroom_members']['Row']
export type PostRow = Database['public']['Tables']['posts']['Row']
export type DutyRow = Database['public']['Tables']['duties']['Row']
export type RosterRow = Database['public']['Tables']['classroom_roster']['Row']
export type TimetableEntryRow = Database['public']['Tables']['timetable_entries']['Row']
export type AttendanceRow = Database['public']['Tables']['attendance']['Row']
export type AttendanceHistoryRow = Database['public']['Tables']['attendance_history']['Row']
