/**
 * 나이스 교육정보 개방 포털 프록시 (Deno / Supabase Edge Function).
 *
 * NEIS_API_KEY 를 브라우저에 노출하지 않기 위해 이 함수를 거친다.
 * 키 없이도 호출은 되지만 결과가 5건으로 잘리고 트래픽 제한(ERROR-337)에 걸린다.
 *
 * 배포:
 *   npx supabase secrets set NEIS_API_KEY=xxxx
 *   npx supabase functions deploy neis
 *
 * 사용:
 *   GET /neis?action=searchSchool&name=미림&office=B10
 *
 * 시간표·급식은 나중에 action 만 추가해 이 함수를 재사용한다.
 */

const NEIS_BASE = 'https://open.neis.go.kr/hub'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

/** 학급이 중·고등학교만 대상이라 그 외 학교급은 검색 결과에서 제외한다. */
type SchoolLevel = 'middle' | 'high'

const LEVEL_BY_NEIS_NAME: Record<string, SchoolLevel> = {
  중학교: 'middle',
  고등학교: 'high',
}

interface School {
  officeCode: string
  officeName: string
  schoolCode: string
  schoolName: string
  schoolLevel: SchoolLevel
  address: string
}

interface NeisSchoolRow {
  ATPT_OFCDC_SC_CODE?: string
  ATPT_OFCDC_SC_NM?: string
  SD_SCHUL_CODE?: string
  SCHUL_NM?: string
  SCHUL_KND_SC_NM?: string
  ORG_RDNMA?: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * 나이스 응답에서 행 배열을 꺼낸다.
 *
 * 정상:      { schoolInfo: [ { head: [...] }, { row: [...] } ] }
 * 결과 없음: { RESULT: { CODE: "INFO-200", ... } }   ← 최상위 구조가 아예 다르다
 * 오류:      { RESULT: { CODE: "ERROR-337", ... } }
 */
function extractRows(payload: unknown, endpoint: string): NeisSchoolRow[] {
  if (!payload || typeof payload !== 'object') return []

  const top = payload as Record<string, unknown>

  // 결과 없음 / 오류 — INFO-200 은 빈 결과이므로 오류가 아니다
  if (top.RESULT) {
    const result = top.RESULT as { CODE?: string; MESSAGE?: string }
    if (result.CODE === 'INFO-200') return []
    throw new Error(`나이스 오류 ${result.CODE}: ${result.MESSAGE ?? ''}`)
  }

  const sections = top[endpoint]
  if (!Array.isArray(sections)) return []

  for (const section of sections) {
    if (section && typeof section === 'object' && Array.isArray((section as { row?: unknown }).row)) {
      return (section as { row: NeisSchoolRow[] }).row
    }
  }
  return []
}

async function searchSchool(name: string, office: string | null): Promise<School[]> {
  const apiKey = Deno.env.get('NEIS_API_KEY')

  const params = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    SCHUL_NM: name,
  })
  if (apiKey) params.set('KEY', apiKey)
  if (office) params.set('ATPT_OFCDC_SC_CODE', office)

  const response = await fetch(`${NEIS_BASE}/schoolInfo?${params}`)
  if (!response.ok) {
    throw new Error(`나이스 응답 실패 (HTTP ${response.status})`)
  }

  const rows = extractRows(await response.json(), 'schoolInfo')

  return rows.flatMap((row) => {
    const level = LEVEL_BY_NEIS_NAME[row.SCHUL_KND_SC_NM ?? '']
    if (!level) return [] // 초등학교·특수학교 등 제외
    if (!row.ATPT_OFCDC_SC_CODE || !row.SD_SCHUL_CODE || !row.SCHUL_NM) return []

    return [{
      officeCode: row.ATPT_OFCDC_SC_CODE,
      officeName: row.ATPT_OFCDC_SC_NM ?? '',
      schoolCode: row.SD_SCHUL_CODE,
      schoolName: row.SCHUL_NM,
      schoolLevel: level,
      address: (row.ORG_RDNMA ?? '').trim(),
    }]
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  try {
    if (action === 'searchSchool') {
      const name = (url.searchParams.get('name') ?? '').trim()
      if (name.length < 2) {
        return json({ schools: [] })
      }
      const schools = await searchSchool(name, url.searchParams.get('office'))
      return json({ schools })
    }

    return json({ error: `알 수 없는 action: ${action ?? '(없음)'}` }, 400)
  } catch (error) {
    console.error('[neis]', error)
    return json({ error: error instanceof Error ? error.message : '조회에 실패했어요' }, 502)
  }
})
