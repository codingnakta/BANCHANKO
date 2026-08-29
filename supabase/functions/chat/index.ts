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
 *   { question, role: 'teacher'|'student', facts: string[], today: 'yyyy-MM-dd' }
 *
 * 응답:
 *   { reply, draft }  draft 는 교사가 "~ 공지로 등록해줘" 라고 했을 때만 채워진다.
 *
 * 규칙
 *  - 답은 facts(학급 데이터에서 뽑아 보낸 근거)만 가지고 만든다. 없으면 모른다고 한다.
 *  - draft 는 '등록 제안'일 뿐이고, 실제 저장은 교사가 화면에서 눌러야 일어난다.
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
}

/** 교사가 등록을 부탁했을 때 모델이 채워 오는 초안 */
interface Draft {
  type: 'notice' | 'assignment'
  title: string
  body: string
  /** yyyy-MM-dd, 없으면 null */
  date: string | null
  /** 과제일 때만 */
  subject: string | null
}

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
    '',
    '[학급 정보]',
    evidence,
  ]

  if (role === 'teacher') {
    common.push(
      '',
      '이 사용자는 담임 교사다.',
      '교사가 공지나 과제를 "등록해줘 / 올려줘 / 써줘"라고 하면 draft 를 채운다.',
      '- 날짜가 있는 안내(체육대회, 현장학습, 학부모 총회 등)는 type="notice" 로 하고 date 를 채운다.',
      '- 제출 기한이 있는 학습 과제는 type="assignment" 로 하고 date 에 마감일, subject 에 과목을 넣는다.',
      '- "다음 주 화요일"처럼 말한 날짜는 오늘을 기준으로 yyyy-MM-dd 로 바꾼다.',
      '- 제목은 20자 안쪽으로 짧게, 내용(body)은 학생이 읽을 안내문으로 두세 문장 쓴다.',
      '- 등록을 부탁한 게 아니면 draft 는 null 로 둔다.',
      'reply 에는 무엇을 만들었는지 한두 문장으로 말하고, 확인 후 등록 버튼을 눌러 달라고 안내한다.',
    )
  } else {
    common.push('', '이 사용자는 학생이다. draft 는 항상 null 로 둔다.')
  }

  common.push(
    '',
    '반드시 아래 형태의 JSON 하나만 출력한다. 다른 말은 붙이지 않는다.',
    '{"reply": "답변", "draft": null}',
    '또는',
    '{"reply": "답변", "draft": {"type": "notice", "title": "...", "body": "...", "date": "2026-09-01", "subject": null}}',
  )

  return common.join('\n')
}

/** 모델이 코드블록이나 군더더기를 붙여도 JSON 만 건져낸다. */
function parseReply(raw: string): { reply: string; draft: Draft | null } {
  const stripped = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1))
      const draft = parsed.draft
      return {
        reply: typeof parsed.reply === 'string' ? parsed.reply : stripped,
        draft:
          draft && typeof draft.title === 'string' && draft.title.trim()
            ? {
                type: draft.type === 'assignment' ? 'assignment' : 'notice',
                title: String(draft.title).trim(),
                body: typeof draft.body === 'string' ? draft.body.trim() : '',
                date: /^\d{4}-\d{2}-\d{2}$/.test(draft.date ?? '') ? draft.date : null,
                subject: typeof draft.subject === 'string' ? draft.subject.trim() || null : null,
              }
            : null,
      }
    } catch {
      // JSON 이 아니면 그냥 말로 온 것으로 본다
    }
  }
  return { reply: stripped, draft: null }
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

    const { reply, draft } = parseReply(content)
    // 학생에게는 등록 초안을 절대 내려보내지 않는다
    return json({ reply, draft: role === 'teacher' ? draft : null })
  } catch (error) {
    console.error('[chat] 오류', error)
    return json({ error: '답변을 만들지 못했습니다.' }, 500)
  }
})
