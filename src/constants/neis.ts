/**
 * 시도교육청 코드 (ATPT_OFCDC_SC_CODE).
 *
 * 나이스 시간표·급식 조회의 필수 파라미터이고 학교 검색 범위를 좁히는 데도 쓴다.
 * 기획 문서에는 서울(B10)만 적혀 있어 나머지는 실제 API 를 호출해 확인했다.
 * F10·Q10 은 API 가 "전남광주통합특별시교육청(광주)/(전남)" 으로 내려주지만
 * 교사가 고르는 화면에서는 아래 표시명을 쓴다.
 */
export interface EducationOffice {
  code: string
  name: string
}

export const EDUCATION_OFFICES: readonly EducationOffice[] = [
  { code: 'B10', name: '서울특별시교육청' },
  { code: 'C10', name: '부산광역시교육청' },
  { code: 'D10', name: '대구광역시교육청' },
  { code: 'E10', name: '인천광역시교육청' },
  { code: 'F10', name: '광주광역시교육청' },
  { code: 'G10', name: '대전광역시교육청' },
  { code: 'H10', name: '울산광역시교육청' },
  { code: 'I10', name: '세종특별자치시교육청' },
  { code: 'J10', name: '경기도교육청' },
  { code: 'K10', name: '강원특별자치도교육청' },
  { code: 'M10', name: '충청북도교육청' },
  { code: 'N10', name: '충청남도교육청' },
  { code: 'P10', name: '전북특별자치도교육청' },
  { code: 'Q10', name: '전라남도교육청' },
  { code: 'R10', name: '경상북도교육청' },
  { code: 'S10', name: '경상남도교육청' },
  { code: 'T10', name: '제주특별자치도교육청' },
] as const
