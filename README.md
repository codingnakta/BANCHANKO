# 반창고 (BANCHANKO)

중·고등학교 담임교사와 학생을 위한 AI 기반 통합 학급관리 반응형 웹앱.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 빌드 | Vite 8 |
| UI | React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`) |
| 라우팅 | react-router v8 |
| 서버 상태 | TanStack Query v5 |
| 백엔드 | Supabase (Auth + Postgres + RLS) |
| 아이콘 | lucide-react |

## 시작하기

```bash
npm install
cp .env.example .env.local   # Supabase URL / anon key 입력
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | oxlint |

## 폴더 구조

```
src/
├─ app/                  앱 진입점 · 라우터 · 전역 프로바이더
├─ components/
│  ├─ ui/                Button, Card, Badge, EmptyState 등 기본 UI
│  ├─ layout/            AppShell(탭바 O), DetailShell(탭바 X), BottomTabBar
│  └─ common/            여러 기능이 공유하는 복합 컴포넌트
├─ features/             기능(F-) 단위 모듈. 각 폴더에 components/hooks/api
│  ├─ auth/              F-UBHBGS  이메일 로그인 · 역할 기반 접근 제어
│  ├─ classroom/         F-RONORQ  학급 생성 · 규칙 · 시간표 · 청소 당번
│  ├─ members/           F-FMLMIG  학생 초대 · 학급 소속 관리
│  ├─ notices/           F-WSHIYO  공지 · 가정통신문 · 과제 일정
│  ├─ dashboard/         F-ZTJSNU  오늘의 학급 정보 대시보드
│  ├─ events/            F-WFEXUJ  학급 행사 · 일정 관리
│  ├─ external-sync/     F-OHHQTM  나이스/급식 API 검수 · 공개
│  ├─ attendance/        F-ZOJYKF  출결 기록 · 변경 이력
│  ├─ chatbot/           F-CCZIQT  학급 데이터 기반 AI 질의응답
│  ├─ ai/                F-NXPULH  AI 안내 요약 · 오늘 할 일 생성
│  ├─ notifications/     F-IAXPMY  인앱 알림
│  ├─ account/           F-ETJOMB  계정 종료 · 개인정보 보관
│  └─ admin/             서비스 관리자 (교사 승인 · 계정 비활성화)
├─ pages/                라우트 단위 화면 조립
├─ lib/
│  ├─ supabase/          Supabase 클라이언트 · 스키마 타입
│  ├─ env.ts             환경변수 접근 지점
│  └─ utils.ts           cn() 등 공용 유틸
├─ hooks/                전역 공용 훅
├─ types/                도메인 타입 (역할 · 상태 · 안내 유형 등)
├─ constants/            ROUTES · 탭바 정의
└─ styles/               추가 스타일
```

`@/*` 별칭으로 `src/*` 를 참조한다. (`import { Button } from '@/components/ui'`)

### 화면 셸 규칙 (F-ZYSPUS)

- `AppShell` — 홈 · 우리반 · 할일 · 더보기 4개 최상위 화면. 하단 탭바를 표시한다.
- `DetailShell` — 원본 상세 화면과 작성/수정 화면. **탭바를 표시하지 않는다.**
- 탭 순서는 `홈 → 우리반 → 할일 → 더보기` 로 고정한다.

## 기획 문서

- `docs/반창고_기획서.md` — PRD (요구사항 R- 11개, KPI, 리스크, MVP 제외 범위)
- `docs/반창고_기능명세서.md` — 기능 F- 13개 상세 명세
- `docs/반창고_유저플로우.md` — 화면 흐름 (S1~S6)

## 다음 단계

1. Supabase 스키마 설계 및 RLS 정책 (역할 기반 접근 제어가 이 서비스의 핵심 제약)
2. `npx supabase gen types typescript` 결과로 `src/lib/supabase/database.types.ts` 교체
3. 인증 흐름(S1-1) 구현 — 역할 · 계정 상태 · 승인 상태 · 학급 소속별 분기
