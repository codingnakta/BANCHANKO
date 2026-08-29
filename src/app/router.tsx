import { Routes, Route } from 'react-router'
import { AppShell, DetailShell } from '@/components/layout'
import { ROUTES } from '@/constants'
import { LoginPage } from '@/pages/auth/LoginPage'
import { HomePage } from '@/pages/home/HomePage'
import { ClassroomPage } from '@/pages/classroom/ClassroomPage'
import { TodoPage } from '@/pages/todo/TodoPage'
import { MorePage } from '@/pages/more/MorePage'
import { ChatbotPage } from '@/pages/chatbot/ChatbotPage'
import { NotificationsPage } from '@/pages/more/NotificationsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      {/* 하단 탭바가 있는 주요 화면 */}
      <Route element={<AppShell />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.classroom} element={<ClassroomPage />} />
        <Route path={ROUTES.todo} element={<TodoPage />} />
        <Route path={ROUTES.more} element={<MorePage />} />
      </Route>

      {/* 원본 상세·작성/수정 화면 (탭바 미표시) */}
      <Route element={<DetailShell />}>
        <Route path={ROUTES.chatbot} element={<ChatbotPage />} />

        {/* 더보기 하위 화면 */}
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

        {/* 교사 학급 운영 메뉴 — 아직 자리만 잡아둔 화면들 */}
        <Route
          path={ROUTES.members}
          element={<PlaceholderPage title="학생 관리" feature="학생 초대와 학급 소속 관리" />}
        />
        <Route
          path={ROUTES.classroomSettings}
          element={<PlaceholderPage title="학급 기본 정보" feature="학급 규칙·시간표·청소 당번 설정" />}
        />
        <Route
          path={ROUTES.noticeCreate}
          element={<PlaceholderPage title="안내 관리" feature="공지·가정통신문·과제 일정 발행" />}
        />
        <Route
          path={ROUTES.syncReview}
          element={<PlaceholderPage title="시간표·급식 검수" feature="외부 연동 정보 검수와 공개" />}
        />
        <Route
          path={ROUTES.attendance}
          element={<PlaceholderPage title="출결 기록" feature="학생별 출결과 변경 이력" />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
