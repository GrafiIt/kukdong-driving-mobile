// 점검 카테고리 타입
export type CategoryKey = 'vehicle' | 'work' | 'tank'

// 개별 점검 항목 타입
export interface ChecklistItem {
  id: string
  categoryKey: CategoryKey
  order: number
  label: string
  type: 'binary' | 'number' // binary: 정상/이상, number: 숫자 입력
  unit?: string // 숫자 입력일 때 단위 (예: "시간")
  requiresPhoto?: boolean // true면 사진 최소 1장 첨부해야 완료로 인정
  // 화면 표시용 커스텀 라벨 (DB status값은 그대로 'normal'/'abnormal' 유지)
  // 인덱스 0: status === 'normal'일 때 표시할 텍스트
  // 인덱스 1: status === 'abnormal'일 때 표시할 텍스트
  customLabels?: [string, string]
}

// 카테고리 메타 정보
export interface Category {
  key: CategoryKey
  label: string
  icon: string
  color: string
}

// 점검 결과 타입 (단일 항목)
export interface InspectionResult {
  itemId: string
  status: 'normal' | 'abnormal' | 'pending' // 정상 | 이상 | 미선택
  numberValue?: number // 숫자 입력 항목
  note?: string // 이상 시 메모
  images?: CompressedImage[] // 압축된 이미지 (최대 2장)
}

export interface CompressedImage {
  dataUrl: string // base64 data URL (압축 후)
  fileName: string
  originalSize: number // bytes
  compressedSize: number // bytes
}

// ────────────────────────────────────────
// 카테고리 목록 (탭 순서: 차량 → 작업 → 탱크)
// ────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { key: 'vehicle', label: '차량점검',    icon: '🚛', color: '#1e3a5f' },
  { key: 'work',    label: '운전자 점검', icon: '📋', color: '#1e3a5f' },
  { key: 'tank',    label: '비고 및 서명', icon: '🛢', color: '#1e3a5f' },
]

// ────────────────────────────────────────
// 12개 점검 항목 (차량 6 + 운전자 점검 4 + 탱크 2)
// ────────────────────────────────────────
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── 차량점검 (6항목) ──
  {
    id: 'v1',
    categoryKey: 'vehicle',
    order: 1,
    label: '타이어 상태',
    type: 'binary',
    requiresPhoto: true,
  },
  {
    id: 'v2',
    categoryKey: 'vehicle',
    order: 2,
    label: '휠 너트 상태',
    type: 'binary',
    requiresPhoto: true,
  },
  {
    id: 'v3',
    categoryKey: 'vehicle',
    order: 3,
    label: '등화 상태',
    type: 'binary',
    requiresPhoto: false,
  },
  {
    id: 'v4',
    categoryKey: 'vehicle',
    order: 4,
    label: '누유 여부',
    type: 'binary',
    requiresPhoto: true,
  },
  {
    id: 'v5',
    categoryKey: 'vehicle',
    order: 5,
    label: '반사판 상태',
    type: 'binary',
    requiresPhoto: false,
  },
  {
    id: 'v6',
    categoryKey: 'vehicle',
    order: 6,
    label: '적재함 상태',
    type: 'binary',
    requiresPhoto: true,
  },

  // ── 운전자 점검 (4항목) ──
  {
    id: 'w1',
    categoryKey: 'work',
    order: 1,
    label: '작업 절차 준수',
    type: 'binary',
    requiresPhoto: false,
    customLabels: ['준수', '미준수'],
  },
  {
    id: 'w2',
    categoryKey: 'work',
    order: 2,
    label: 'PPE 착용 상태',
    type: 'binary',
    requiresPhoto: true,
    customLabels: ['착용', '미착용'],
  },
  {
    id: 'w3',
    categoryKey: 'work',
    order: 3,
    label: '휴대폰 사용 금지',
    type: 'binary',
    requiresPhoto: false,
    customLabels: ['준수', '미준수'],
  },
  {
    id: 'w4',
    categoryKey: 'work',
    order: 4,
    label: '고임목 확인',
    type: 'binary',
    requiresPhoto: true,
    customLabels: ['설치', '미설치'],
  },

  // ── 탱크점검 (2항목) ──
  {
    id: 't1',
    categoryKey: 'tank',
    order: 1,
    label: '유창 칸 벨브 작동 유무 상태 확인',
    type: 'binary',
  },
  {
    id: 't2',
    categoryKey: 'tank',
    order: 2,
    label: '유창 칸 내 잔유 유무 확인',
    type: 'binary',
  },
]

// 카테고리별 항목 수
export const CATEGORY_COUNT: Record<CategoryKey, number> = {
  vehicle: CHECKLIST_ITEMS.filter((i) => i.categoryKey === 'vehicle').length,
  work:    CHECKLIST_ITEMS.filter((i) => i.categoryKey === 'work').length,
  tank:    CHECKLIST_ITEMS.filter((i) => i.categoryKey === 'tank').length,
}

// 초기 결과 맵 생성
export function createInitialResults(): Record<string, InspectionResult> {
  return Object.fromEntries(
    CHECKLIST_ITEMS.map((item) => [
      item.id,
      { itemId: item.id, status: 'pending' as const },
    ])
  )
}
