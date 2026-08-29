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
 *   GET /neis?action=timetable&office=B10&school=7011569&level=high&grade=3&classNo=1&date=2026-08-29
 *   GET /neis?action=meal&office=B10&school=7011569&date=2026-08-29
 *
 * date 는 항상 클라이언트(브라우저 로컬 시각)가 계산해 넘긴다.
 * 이 함수는 UTC 로 도므로 서버에서 "오늘"을 만들면 한국 날짜와 어긋난다.
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

/* ── 시간표 ────────────────────────────────────────────────── */

interface TimetableEntry {
  period: number
  subject: string
}

/**
 * 학년도·학기를 날짜에서 추정한다.
 *
 * 3~8월을 1학기로 보지만 학교마다 2학기 시작이 달라(미림마이스터고는 8월에 이미 2학기)
 * 한 번에 맞히기 어렵다. 그래서 추정값으로 먼저 조회하고 비면 반대 학기로 다시 조회한다.
 */
function guessTerm(date: Date): { ay: number; sem: number } {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  if (month < 3) return { ay: year - 1, sem: 2 }
  return { ay: year, sem: month <= 8 ? 1 : 2 }
}

function toNeisDate(isoDate: string): string {
  return isoDate.replaceAll('-', '')
}

async function fetchTimetable(params: {
  office: string
  school: string
  level: string
  grade: string
  classNo: string
  date: string
}): Promise<TimetableEntry[]> {
  const apiKey = Deno.env.get('NEIS_API_KEY')
  // 중학교와 고등학교는 엔드포인트가 분리되어 있다
  const endpoint = params.level === 'middle' ? 'misTimetable' : 'hisTimetable'
  const ymd = toNeisDate(params.date)
  const { ay, sem } = guessTerm(new Date(`${params.date}T00:00:00`))

  for (const semester of [sem, sem === 1 ? 2 : 1]) {
    const query = new URLSearchParams({
      Type: 'json',
      pIndex: '1',
      pSize: '100',
      ATPT_OFCDC_SC_CODE: params.office,
      SD_SCHUL_CODE: params.school,
      AY: String(ay),
      SEM: String(semester),
      GRADE: params.grade,
      CLASS_NM: params.classNo,
      ALL_TI_YMD: ymd,
    })
    if (apiKey) query.set('KEY', apiKey)

    const response = await fetch(`${NEIS_BASE}/${endpoint}?${query}`)
    if (!response.ok) continue

    const rows = extractRows(await response.json(), endpoint) as Array<{
      PERIO?: string
      ITRT_CNTNT?: string
    }>

    if (rows.length === 0) continue

    return rows
      .map((row) => ({
        period: Number(row.PERIO ?? 0),
        // 전문교과 등에 '* ' 접두사가 붙어 나온다
        subject: (row.ITRT_CNTNT ?? '').replace(/^\*\s*/, '').trim(),
      }))
      .filter((entry) => entry.period > 0)
      .sort((a, b) => a.period - b.period)
  }

  return []
}

/* ── 급식 ──────────────────────────────────────────────────── */

interface Meal {
  date: string
  items: string[]
  calorie: string | null
}

/**
 * DDISH_NM 은 '보리쌀밥 <br/>청양호박된장국 (5.6)<br/>배추겉절이(j) ...' 형태다.
 * 알레르기 번호와 원산지 표시는 학생 화면에서 노이즈라 메뉴 이름만 남긴다.
 */
function parseDishes(raw: string): string[] {
  return raw
    .split(/<br\s*\/?>/i)
    .map((dish) =>
      dish
        .replace(/\([\d.,\s]*\)/g, '') // 알레르기 번호 (1.5.6.13)
        .replace(/\(j\)/gi, '') // 원산지 표시
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

async function fetchMeal(office: string, school: string, date: string): Promise<Meal | null> {
  const apiKey = Deno.env.get('NEIS_API_KEY')
  const query = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '10',
    ATPT_OFCDC_SC_CODE: office,
    SD_SCHUL_CODE: school,
    MLSV_YMD: toNeisDate(date),
  })
  if (apiKey) query.set('KEY', apiKey)

  const response = await fetch(`${NEIS_BASE}/mealServiceDietInfo?${query}`)
  if (!response.ok) return null

  const rows = extractRows(await response.json(), 'mealServiceDietInfo') as Array<{
    MMEAL_SC_NM?: string
    DDISH_NM?: string
    CAL_INFO?: string
  }>

  // 조식·중식·석식이 함께 오는 학교가 있다. MVP 는 중식만 보여준다.
  const lunch = rows.find((row) => row.MMEAL_SC_NM === '중식') ?? rows[0]
  if (!lunch?.DDISH_NM) return null

  return {
    date,
    items: parseDishes(lunch.DDISH_NM),
    calorie: lunch.CAL_INFO?.trim() || null,
  }
}

/* ── 학사일정 ──────────────────────────────────────────────── */

interface ScheduleItem {
  date: string
  title: string
  /** 휴업일·공휴일이면 표시를 달리한다 */
  isHoliday: boolean
}

/** 학교가 나이스에 올린 학사일정 (개학식·시험·방학·공휴일 등). */
async function fetchSchedule(
  office: string,
  school: string,
  from: string,
  to: string,
): Promise<ScheduleItem[]> {
  const apiKey = Deno.env.get('NEIS_API_KEY')
  const query = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: office,
    SD_SCHUL_CODE: school,
    AA_FROM_YMD: toNeisDate(from),
    AA_TO_YMD: toNeisDate(to),
  })
  if (apiKey) query.set('KEY', apiKey)

  const response = await fetch(`${NEIS_BASE}/SchoolSchedule?${query}`)
  if (!response.ok) return []

  const rows = extractRows(await response.json(), 'SchoolSchedule') as Array<{
    AA_YMD?: string
    EVENT_NM?: string
    SBTR_DD_SC_NM?: string
  }>

  return rows.flatMap((row) => {
    if (!row.AA_YMD || !row.EVENT_NM) return []
    const ymd = row.AA_YMD
    return [{
      date: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
      title: row.EVENT_NM.trim(),
      isHoliday: row.SBTR_DD_SC_NM !== '수업일',
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

    if (action === 'timetable') {
      const office = url.searchParams.get('office')
      const school = url.searchParams.get('school')
      const date = url.searchParams.get('date')
      const grade = url.searchParams.get('grade')
      const classNo = url.searchParams.get('classNo')

      if (!office || !school || !date || !grade || !classNo) {
        return json({ entries: [] })
      }

      const entries = await fetchTimetable({
        office,
        school,
        level: url.searchParams.get('level') ?? 'high',
        grade,
        classNo,
        date,
      })
      return json({ entries })
    }

    if (action === 'meal') {
      const office = url.searchParams.get('office')
      const school = url.searchParams.get('school')
      const date = url.searchParams.get('date')

      if (!office || !school || !date) return json({ meal: null })

      return json({ meal: await fetchMeal(office, school, date) })
    }

    if (action === 'schedule') {
      const office = url.searchParams.get('office')
      const school = url.searchParams.get('school')
      const from = url.searchParams.get('from')
      const to = url.searchParams.get('to')

      if (!office || !school || !from || !to) return json({ schedule: [] })

      return json({ schedule: await fetchSchedule(office, school, from, to) })
    }

    return json({ error: `알 수 없는 action: ${action ?? '(없음)'}` }, 400)
  } catch (error) {
    console.error('[neis]', error)
    return json({ error: error instanceof Error ? error.message : '조회에 실패했어요' }, 502)
  }
})
