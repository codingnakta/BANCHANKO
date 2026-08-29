import type { RosterEntry } from '@/types'
import { normalizeEmail } from './createClassroom'

/**
 * 학생 명단 엑셀 양식 생성·파싱.
 *
 * exceljs 는 1MB 가까이 되므로 이 화면에서만 동적 import 한다.
 * (package.json 의 browser 필드가 미리 빌드된 브라우저 번들을 가리켜 폴리필이 필요 없다)
 */

export const ROSTER_HEADERS = [
  '학번',
  '이름',
  '이메일',
  '전화번호',
  '학부모 전화번호',
  '1인1역',
] as const

export interface RosterRowError {
  /** 엑셀에서 보이는 행 번호 (1부터) */
  row: number
  reason: string
  raw: string
}

export interface ParsedRoster {
  entries: RosterEntry[]
  errors: RosterRowError[]
}

// 흔한 오타를 걸러낼 정도의 최소 검증만 한다
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function loadExcelJS() {
  const mod = await import('exceljs')
  return (mod as unknown as { default?: typeof mod }).default ?? mod
}

/** 교사가 내려받아 채워 넣을 빈 양식을 만든다. 헤더는 파서와 항상 같은 상수를 쓴다. */
export async function downloadRosterTemplate(): Promise<void> {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('학생명단')

  sheet.columns = [
    { header: ROSTER_HEADERS[0], key: 'no', width: 12 },
    { header: ROSTER_HEADERS[1], key: 'name', width: 16 },
    { header: ROSTER_HEADERS[2], key: 'email', width: 34 },
    { header: ROSTER_HEADERS[3], key: 'phone', width: 18 },
    { header: ROSTER_HEADERS[4], key: 'parentPhone', width: 20 },
    { header: ROSTER_HEADERS[5], key: 'classRole', width: 16 },
  ]

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: 'middle' }
  sheet.addRow({
    no: '10101',
    name: '홍길동',
    email: 'hong@e-mirim.hs.kr',
    phone: '010-1234-5678',
    parentPhone: '010-8765-4321',
    classRole: '칠판 담당',
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '반창고_학생명단_양식.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 엑셀에서 CSV 로 저장하면 윈도우에서는 CP949(EUC-KR)로 떨어지는 경우가 많아
 * UTF-8 로 먼저 시도하고 실패하면 EUC-KR 로 다시 읽는다.
 */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('euc-kr').decode(buffer)
  }
}

/** 따옴표로 감싼 필드까지 다루는 최소 CSV 파서. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

async function readXlsx(file: File): Promise<string[][]> {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())

  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const rows: string[][] = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as unknown[]
    // exceljs 의 row.values 는 1-based 라 0번은 비어 있다
    rows.push(values.slice(1).map((v) => cellToString(v)))
  })
  return rows
}

function cellToString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  // 이메일이 하이퍼링크로 들어오면 { text, hyperlink } 형태가 된다
  if (typeof value === 'object') {
    const obj = value as { text?: unknown; hyperlink?: unknown; result?: unknown }
    if (typeof obj.text === 'string') return obj.text.trim()
    if (typeof obj.result === 'string') return obj.result.trim()
    if (typeof obj.hyperlink === 'string') return obj.hyperlink.replace(/^mailto:/i, '').trim()
  }
  return String(value).trim()
}

interface RosterColumns {
  start: number
  no: number
  name: number
  email: number
  phone: number
  parentPhone: number
  classRole: number
}

/**
 * 헤더 행에서 각 열 위치를 찾는다. 헤더가 없으면 양식 순서대로 본다.
 * '학부모 전화번호'가 '전화번호'도 포함하므로 학부모 열을 먼저 잡고 제외한다.
 */
function resolveColumns(rows: string[][]): RosterColumns {
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell.includes('이메일')))
  if (headerIndex === -1) {
    return { start: 0, no: 0, name: 1, email: 2, phone: 3, parentPhone: 4, classRole: 5 }
  }

  const header = rows[headerIndex]
  const find = (keyword: string, fallback: number) => {
    const index = header.findIndex((cell) => cell.includes(keyword))
    return index === -1 ? fallback : index
  }

  const parentPhone = header.findIndex((cell) => cell.includes('학부모'))
  const phone = header.findIndex((cell, i) => i !== parentPhone && cell.includes('전화'))

  return {
    start: headerIndex + 1,
    no: find('학번', 0),
    name: find('이름', 1),
    email: find('이메일', 2),
    phone: phone === -1 ? 3 : phone,
    parentPhone: parentPhone === -1 ? 4 : parentPhone,
    classRole: find('1인1역', 5),
  }
}

/** 업로드한 파일(.xlsx / .csv)에서 명단을 읽는다. */
export async function parseRosterFile(file: File): Promise<ParsedRoster> {
  const isCsv = /\.csv$/i.test(file.name)
  const rows = isCsv ? parseCsv(decodeText(await file.arrayBuffer())) : await readXlsx(file)

  const { start, no, name, email, phone, parentPhone, classRole } = resolveColumns(rows)
  const entries: RosterEntry[] = []
  const errors: RosterRowError[] = []
  const seen = new Set<string>()

  for (let i = start; i < rows.length; i += 1) {
    const row = rows[i]
    const rawEmail = (row[email] ?? '').trim()
    const rawName = (row[name] ?? '').trim()
    const rawNo = (row[no] ?? '').trim()
    const rawPhone = (row[phone] ?? '').trim()
    const rawParentPhone = (row[parentPhone] ?? '').trim()
    const rawRole = (row[classRole] ?? '').trim()

    // 완전히 빈 줄은 조용히 넘어간다
    if (!rawEmail && !rawName && !rawNo) continue

    const rowNumber = i + 1
    const raw = [rawNo, rawName, rawEmail].filter(Boolean).join(' · ') || '(빈 줄)'

    if (!rawEmail) {
      errors.push({ row: rowNumber, reason: '이메일이 없어요', raw })
      continue
    }

    const normalized = normalizeEmail(rawEmail)
    if (!EMAIL_PATTERN.test(normalized)) {
      errors.push({ row: rowNumber, reason: '이메일 형식이 아니에요', raw })
      continue
    }
    if (seen.has(normalized)) {
      errors.push({ row: rowNumber, reason: '파일 안에서 중복돼요', raw })
      continue
    }

    seen.add(normalized)
    entries.push({
      studentNo: rawNo,
      name: rawName,
      email: normalized,
      phone: rawPhone,
      parentPhone: rawParentPhone,
      classRole: rawRole,
    })
  }

  return { entries, errors }
}
