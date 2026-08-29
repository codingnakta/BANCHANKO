import { Navigate, Route, Routes } from 'react-router'
import { AppShell, DetailShell } from '@/components/layout'
import { ROUTES } from '@/constants'
import { RequireAuth, RequireOnboarded, RequireTeacher } from '@/features/auth/components/guards'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RoleSelectPage } from '@/pages/onboarding/RoleSelectPage'
import { WaitingPage } from '@/pages/onboarding/WaitingPage'
// 교사
import { CreateClassroomPage } from '@/pages/teacher/CreateClassroomPage'
import { TeacherHomePage } from '@/pages/teacher/TeacherHomePage'
import { StudentsPage } from '@/pages/teacher/StudentsPage'
import { ClassSettingsPage } from '@/pages/teacher/ClassSettingsPage'
import { NoticesPage } from '@/pages/teacher/NoticesPage'
import { NoticeEditPage } from '@/pages/teacher/NoticeEditPage'
import { TimetableReviewPage } from '@/pages/teacher/TimetableReviewPage'
import { AttendancePage } from '@/pages/teacher/AttendancePage'
// 학생
import { StudentHomePage } from '@/pages/student/StudentHomePage'
import { ClassroomBoardPage } from '@/pages/classroom/ClassroomBoardPage'
import { NoticesSectionPage } from '@/pages/classroom/sections/NoticesSectionPage'
import { DutiesSectionPage } from '@/pages/classroom/sections/DutiesSectionPage'
import { RolesSectionPage } from '@/pages/classroom/sections/RolesSectionPage'
import { TimetableSectionPage } from '@/pages/classroom/sections/TimetableSectionPage'
import { MealSectionPage } from '@/pages/classroom/sections/MealSectionPage'
import { ScheduleSectionPage } from '@/pages/classroom/sections/ScheduleSectionPage'
import { RulesSectionPage } from '@/pages/classroom/sections/RulesSectionPage'
import { ChatbotPage } from '@/pages/student/ChatbotPage'
// 공통
import { TodoPage } from '@/pages/todo/TodoPage'
import { MorePage } from '@/pages/more/MorePage'
import { NotificationsPage } from '@/pages/more/NotificationsPage'
import { NoticeDetailPage } from '@/pages/notices/NoticeDetailPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** 루트(/)에 들어오면 역할에 맞는 홈으로 보낸다. */
function RoleHomeRedirect() {
  const user = useCurrentUser()
  return (
    <Navigate to={user?.role === 'teacher' ? ROUTES.teacher.home : ROUTES.student.home} replace />
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        {/* 온보딩 — 셸 없이 단독 화면 */}
        <Route path={ROUTES.onboardingRole} element={<RoleSelectPage />} />
        <Route path={ROUTES.onboardingWaiting} element={<WaitingPage />} />
        <Route path={ROUTES.teacher.classroomCreate} element={<CreateClassroomPage />} />

        <Route element={<RequireOnboarded />}>
          <Route path={ROUTES.root} element={<RoleHomeRedirect />} />

          {/* 탭바가 있는 최상위 화면 */}
          <Route element={<AppShell />}>
            {/* 교사 */}
            <Route element={<RequireTeacher />}>
              <Route path={ROUTES.teacher.home} element={<TeacherHomePage />} />
            </Route>

            {/* 학생 */}
            <Route path={ROUTES.student.home} element={<StudentHomePage />} />

            {/* 공통 */}
            <Route path={ROUTES.todo} element={<TodoPage />} />
            <Route path={ROUTES.classroom} element={<ClassroomBoardPage />} />
            <Route path={ROUTES.more} element={<MorePage />} />
          </Route>

          {/* 상세·작성 화면 (탭바 미표시) */}
          <Route element={<DetailShell />}>
            <Route path={ROUTES.noticeDetail(':id')} element={<NoticeDetailPage />} />

            {/* 우리반 하위 화면 */}
            <Route path={ROUTES.classroomSection.notices} element={<NoticesSectionPage />} />
            <Route path={ROUTES.classroomSection.duties} element={<DutiesSectionPage />} />
            <Route path={ROUTES.classroomSection.roles} element={<RolesSectionPage />} />
            <Route path={ROUTES.classroomSection.timetable} element={<TimetableSectionPage />} />
            <Route path={ROUTES.classroomSection.meal} element={<MealSectionPage />} />
            <Route path={ROUTES.classroomSection.schedule} element={<ScheduleSectionPage />} />
            <Route path={ROUTES.classroomSection.rules} element={<RulesSectionPage />} />

            <Route path={ROUTES.student.chatbot} element={<ChatbotPage />} />
            <Route path={ROUTES.notifications} element={<NotificationsPage />} />
            <Route
              path={ROUTES.account}
              element={
                <PlaceholderPage
                  title="계정 관리"
                  feature="계정 종료와 개인정보 보관 안내"
                  backTo={ROUTES.more}
                />
              }
            />
            <Route
              path={ROUTES.about}
              element={
                <PlaceholderPage
                  title="서비스 안내"
                  feature="이용약관·개인정보 처리방침"
                  backTo={ROUTES.more}
                />
              }
            />

            {/* 교사 운영 화면 */}
            <Route element={<RequireTeacher />}>
              <Route path={ROUTES.teacher.students} element={<StudentsPage />} />
              <Route path={ROUTES.teacher.settings} element={<ClassSettingsPage />} />
              <Route path={ROUTES.teacher.notices} element={<NoticesPage />} />
              <Route path={ROUTES.teacher.noticeNew} element={<NoticeEditPage />} />
              <Route path={ROUTES.teacher.noticeEdit(':id')} element={<NoticeEditPage />} />
              <Route path={ROUTES.teacher.timetable} element={<TimetableReviewPage />} />
              <Route path={ROUTES.teacher.attendance} element={<AttendancePage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
