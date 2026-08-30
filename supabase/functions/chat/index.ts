/**
 * AI 챗봇 (Deno / Supabase Edge Function) — 업스테이지 Solar.
 *
 * UPSTAGE_API_KEY 를 브라우저에 두지 않기 위해 이 함수를 거친다.
 *
 * 배포:
 *   npx supabase secrets set UPSTAGE_API_KEY=up_xxx
 *   npx supabase functions deploy chat
 *
 * 요청 (POST):
 *   { question, role, facts, today, history }
 *   history 는 이번 대화에서 오간 최근 메시지다. 앞의 답을 기억해야
 *   "그럼 그거 등록해줘" 같은 말이 통한다.
 *
 * 응답:
 *   { reply, action }  action 은 교사가 "~ 해줘" 라고 했을 때만 채워진다.
 *                      (공지·과제 등록·수정·삭제 / 청소당번 / 1인1역 / 학급규칙)
 *
 * 규칙
 *  - 답은 facts(학급 데이터에서 뽑아 보낸 근거)만 가지고 만든다. 없으면 모른다고 한다.
 *  - action 은 '제안'일 뿐이고, 실제 저장은 교사가 화면에서 눌러야 일어난다.
 *    (이 함수는 DB 에 쓰지 않는다. 쓰기 권한은 여전히 RLS 가 쥔다)
 */

const UPSTAGE_URL = 'https://api.upstage.ai/v1/chat/completions'
const DEFAULT_MODEL = 'solar-pro2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  question?: string
  role?: 'teacher' | 'student'
  facts?: string[]
  today?: string
  history?: { role?: string; text?: string }[]
}

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** 이번 대화에서 이어 붙일 최근 메시지 수 (질문·답변 합쳐서) */
const HISTORY_LIMIT = 12
/** 한 메시지가 지나치게 길면 잘라 낸다 */
const HISTORY_CHAR_LIMIT = 1500

/** 클라이언트가 보낸 대화 기록을 모델이 읽을 형태로만 통과시킨다. */
function toTurns(history: ChatRequest['history']): ChatTurn[] {
  if (!Array.isArray(history)) return []

  return history
    .filter((turn) => turn?.role === 'user' || turn?.role === 'assistant')
    .map((turn) => ({
      role: turn.role as 'user' | 'assistant',
      content: String(turn.text ?? '').slice(0, HISTORY_CHAR_LIMIT),
    }))
    .filter((turn) => turn.content.trim().length > 0)
    .slice(-HISTORY_LIMIT)
}

/** 교사가 부탁한 일을 모델이 채워 오는 제안 */
type Action =
  | {
      kind: 'post'
      type: 'notice' | 'assignment'
      title: string
      body: string
      /** yyyy-MM-dd, 없으면 null */
      date: string | null
      /** 과제일 때만 */
      subject: string | null
    }
  | {
      kind: 'edit'
      target: string
      title: string | null
      body: string | null
      date: string | null
      subject: string | null
    }
  | { kind: 'delete'; target: string }
  | { kind: 'todo'; title: string; date: string | null }
  | { kind: 'link'; screen: string; reason: string }
  | { kind: 'duty'; weekday: number; area: string; students: string[] }
  | { kind: 'role'; student: string; role: string }
  | { kind: 'rule'; rules: string[] }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function systemPrompt(role: 'teacher' | 'student', today: string, facts: string[]): string {
  const evidence = facts.length > 0 ? facts.map((fact) => `- ${fact}`).join('\n') : '(없음)'

  const common = [
    '너는 초·중·고 학급 앱 "반창고"의 도우미다. 한국어로 짧고 다정하게 답한다.',
    `오늘은 ${today} 이다.`,
    '',
    '아래 [학급 정보]에 있는 내용만 근거로 답한다.',
    '거기에 없는 것은 지어내지 말고 "아직 등록된 정보가 없어요"라고 말한다.',
    '학급과 무관한 질문에는 답할 수 있는 범위(시간표·급식·청소당번·1인1역·과제·공지·일정)를 안내한다.',
    '앞선 대화를 이어서 이해한다. "그거", "아까 그 날짜"처럼 가리키는 말은 바로 앞 대화에서 찾는다.',
    '',
    '아래 세 가지는 누가 묻든 답하지 않는다. [학급 정보]에 섞여 있어도 마찬가지다.',
    '- 전화번호·이메일·주소 같은 연락처. 반에 공개된 정보가 아니다.',
    '- 출결. 누가 결석·지각했는지도, 그 사유도 말하지 않는다. 챗봇이 다루는 정보가 아니다.',
    '- 다른 학급 이야기. 우리 반 것만 알고 있어서 답할 수 없다.',
    '이럴 때는 왜 알려줄 수 없는지 한 줄로 밝히고 넘어간다. 짐작해서 말하지 않는다.',
    '',
    '[학급 정보]',
    evidence,
  ]

  common.push(
    '',
    '할 일을 적어 달라고 하면 action 에 내 할일을 채운다.',
    '   {"kind":"todo","title":"수학 문제집 풀기","date":"2026-09-01"}',
    '   - "나 ~ 해야 돼", "~ 할 일에 넣어줘", "내 할일에 추가해줘" 처럼 자기 할 일을',
    '     말하면 이 갈래다. 본인만 보는 개인 메모다.',
    '   - "과제로 등록해줘", "우리반 과제에 올려줘" 처럼 반 전체에 알리는 것은',
    '     내 할일이 아니다. (교사는 post 갈래를 쓴다)',
    '   - 날짜를 말하지 않았으면 date 는 null 로 둔다. 지어내지 않는다.',
  )

  if (role === 'teacher') {
    common.push(
      '',
      '이 사용자는 담임 교사다. 교사가 무언가를 바꿔 달라고 하면 action 을 채운다.',
      '위의 내 할일 말고도 고를 수 있는 action 이 일곱 가지 더 있다.',
      '',
      '1) 공지·과제 등록 — "등록해줘 / 올려줘 / 써줘"',
      '   {"kind":"post","type":"notice"|"assignment","title":"","body":"","date":"yyyy-MM-dd"|null,"subject":null}',
      '   - 날짜가 있는 안내(체육대회, 현장학습, 학부모 총회)는 type="notice" 에 date 를 채운다.',
      '   - 제출 기한이 있는 학습 과제는 type="assignment", date 에 마감일, subject 에 과목.',
      '   - 제목은 20자 안쪽, body 는 학생이 읽을 안내문으로 두세 문장.',
      '',
      '2) 이미 올린 공지·과제 고치기 — "아까 그 공지 날짜 금요일로 바꿔줘", "제목 고쳐줘"',
      '   {"kind":"edit","target":"현장체험학습 안내","title":null,"body":null,"date":"2026-09-04","subject":null}',
      '   - target 은 [학급 정보]에 있는 기존 공지·과제의 제목을 그대로 쓴다.',
      '   - 바꾸는 값만 채우고 나머지는 null 로 둔다. 앞선 대화에서 방금 만든 것을',
      '     가리키면 그 제목을 target 으로 쓴다.',
      '   - 새로 올리는 것이 아니라 있는 것을 고치는 경우에는 반드시 이 kind 를 쓴다.',
      '',
      '3) 청소당번 — "월요일 복도 청소 김영우로 바꿔줘"',
      '   {"kind":"duty","weekday":1,"area":"복도","students":["김영우"]}',
      '   - weekday 는 월=1 … 금=5.',
      '   - area 는 [학급 정보]의 청소 구역 이름을 그대로 쓴다. 없는 구역이면 새로 만든다.',
      '   - students 는 그 구역을 그 요일에 맡을 학생 전체다. "김영우도 넣어줘"처럼 추가를',
      '     부탁하면 기존 담당에 더한 전체 명단을 적는다.',
      '',
      '4) 1인1역 — "김영우 칠판 담당으로 해줘"',
      '   {"kind":"role","student":"김영우","role":"칠판 담당"}',
      '   - student 는 [학급 정보]의 학생 명단에 있는 이름을 그대로 쓴다.',
      '',
      '5) 학급규칙 추가 — "복도에서 뛰지 않기 규칙 넣어줘"',
      '   {"kind":"rule","rules":["복도에서 뛰지 않기"]}',
      '',
      '6) 이미 올린 공지·과제 지우기 — "그 공지 지워줘", "현장체험학습 일정 삭제해줘"',
      '   {"kind":"delete","target":"현장체험학습 안내"}',
      '   - target 은 [학급 정보]에 있는 기존 공지·과제의 제목을 그대로 쓴다.',
      '   - 어느 것을 말하는지 분명하지 않으면 action 을 null 로 두고 reply 로 어느 것인지 되묻는다.',
      '     지운 글은 되살릴 수 없어서, 짐작으로 고르면 엉뚱한 글이 사라진다.',
      '   - 삭제는 되돌릴 수 없으니 reply 에 그 점을 한 문장으로 알린다.',
      '',
      '7) 네가 대신 할 수 없는 일 — 화면으로 안내하기',
      '   {"kind":"link","screen":"students","reason":"학생 명단 등록"}',
      '   - 아래 화면 중 하나를 screen 으로 고른다.',
      '     students   학생 관리 — 명단·연락처 등록, 학생별 1인1역 지정',
      '     settings   학급 기본 정보 — 학급 이름, 학급규칙, 청소 구역 정리',
      '     timetable  시간표·급식 검수 — 시간표 확인과 공개',
      '     notices    안내 관리 — 올린 공지·과제 목록',
      '     attendance 출결 기록 — 출석·지각·조퇴·결석',
      '     todo       할일 — 내 할일 적기',
      '   - reason 에는 무엇을 하러 가는지 짧게 적는다.',
      '   - 학생 등록처럼 사람이 직접 입력해야 하는 일은 지어내지 말고 이 갈래를 쓴다.',
      '     (명단은 이메일이 정확해야 학생이 학급에 들어올 수 있어 네가 대신 만들지 않는다)',
      '   - 출결이나 연락처를 물으면 답하는 대신 이 갈래로 화면을 안내한다.',
      '     (출결은 attendance, 연락처는 students. 네가 아는 값이 아니라 화면에서 볼 일이다)',
      '',
      '- 이름·구역이 [학급 정보]에 없어 헷갈리면 action 을 null 로 두고 reply 로 되묻는다.',
      '- 부탁한 내용이 [학급 정보]에 이미 그대로 있으면 action 을 null 로 두고,',
      '  "이미 그렇게 되어 있어요"라고 지금 상태를 알려 준다. 같은 것을 다시 만들지 않는다.',
      '- 그냥 묻기만 한 것이면 action 은 null 이다.',
      'action 을 채웠으면 reply 에 무엇을 할 것인지 한두 문장으로 말하고,',
      '확인 후 버튼을 눌러 달라고 안내한다.',
    )
  } else {
    common.push(
      '',
      '이 사용자는 학생이다. 내 할일(todo) 말고 다른 action 은 쓰지 않는다.',
      '학급 과제·공지를 바꿔 달라고 하면 선생님께 말씀드리라고 안내한다.',
      '위의 답하지 않는 세 가지를 물으면 담임 선생님께 여쭤보라고 안내한다.',
      '친구의 연락처나 결석 여부는 그 친구의 개인정보라서 대신 알려줄 수 없다고 말한다.',
    )
  }

  common.push(
    '',
    '반드시 아래 형태의 JSON 하나만 출력한다. 다른 말은 붙이지 않는다.',
    '{"reply": "답변", "action": null}',
    '또는',
    '{"reply": "답변", "action": { 위 일곱 가지 중 하나 }}',
  )

  return common.join('\n')
}

/** 모델이 코드블록이나 군더더기를 붙여도 JSON 만 건져낸다. */
function parseReply(raw: string): { reply: string; action: Action | null } {
  const stripped = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')

  if (start === -1 || end <= start) return { reply: stripped, action: null }

  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1))
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply : stripped,
      action: toAction(parsed.action),
    }
  } catch {
    // JSON 이 아니면 그냥 말로 온 것으로 본다
    return { reply: stripped, action: null }
  }
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** 모델이 준 action 을 앱이 아는 모양으로만 통과시킨다. 이상하면 null. */
function toAction(raw: unknown): Action | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>

  switch (value.kind) {
    case 'post': {
      const title = text(value.title)
      if (!title) return null
      const date = text(value.date)
      return {
        kind: 'post',
        type: value.type === 'assignment' ? 'assignment' : 'notice',
        title,
        body: text(value.body),
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        subject: text(value.subject) || null,
      }
    }
    case 'edit': {
      const target = text(value.target)
      if (!target) return null
      const date = text(value.date)
      return {
        kind: 'edit',
        target,
        title: text(value.title) || null,
        body: text(value.body) || null,
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        subject: text(value.subject) || null,
      }
    }
    case 'delete': {
      const target = text(value.target)
      // 무엇을 지울지 모르면 제안 자체를 만들지 않는다
      if (!target) return null
      return { kind: 'delete', target }
    }
    case 'todo': {
      const title = text(value.title)
      if (!title) return null
      const date = text(value.date)
      return { kind: 'todo', title, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null }
    }
    case 'link': {
      const screen = text(value.screen)
      if (!screen) return null
      return { kind: 'link', screen, reason: text(value.reason) }
    }
    case 'duty': {
      const weekday = Number(value.weekday)
      const area = text(value.area)
      if (!area || !(weekday >= 1 && weekday <= 5)) return null
      const students = Array.isArray(value.students)
        ? value.students.map(text).filter(Boolean)
        : []
      return { kind: 'duty', weekday, area, students }
    }
    case 'role': {
      const student = text(value.student)
      if (!student) return null
      return { kind: 'role', student, role: text(value.role) }
    }
    case 'rule': {
      const rules = Array.isArray(value.rules) ? value.rules.map(text).filter(Boolean) : []
      if (rules.length === 0) return null
      return { kind: 'rule', rules }
    }
    default:
      return null
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (request.method !== 'POST') {
    return json({ error: 'POST 만 받습니다.' }, 405)
  }

  const apiKey = Deno.env.get('UPSTAGE_API_KEY')
  if (!apiKey) {
    // 키가 없으면 앱이 규칙 기반 답변으로 되돌아간다
    return json({ error: 'UPSTAGE_API_KEY 가 설정되지 않았습니다.' }, 503)
  }

  let payload: ChatRequest
  try {
    payload = await request.json()
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400)
  }

  const question = (payload.question ?? '').trim()
  if (!question) return json({ error: '질문이 비어 있습니다.' }, 400)

  const role = payload.role === 'teacher' ? 'teacher' : 'student'
  const today = /^\d{4}-\d{2}-\d{2}$/.test(payload.today ?? '')
    ? payload.today!
    : new Date().toISOString().slice(0, 10)

  try {
    const response = await fetch(UPSTAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('UPSTAGE_MODEL') ?? DEFAULT_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt(role, today, payload.facts ?? []) },
          ...toTurns(payload.history),
          { role: 'user', content: question },
        ],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('[chat] 업스테이지 호출 실패', response.status, detail)
      return json({ error: '답변을 만들지 못했습니다.' }, 502)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return json({ error: '답변이 비어 있습니다.' }, 502)
    }

    const { reply, action } = parseReply(content)
    // 학생에게는 자기 것(내 할일)만 내려보낸다. 학급 데이터는 교사만 바꾼다.
    const allowed = role === 'teacher' || action?.kind === 'todo' ? action : null
    return json({ reply, action: allowed })
  } catch (error) {
    console.error('[chat] 오류', error)
    return json({ error: '답변을 만들지 못했습니다.' }, 500)
  }
})
