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
  { key: 'vehicle', label: '차량점검', icon: '🚛', color: '#1e3a5f' },
  { key: 'work',    label: '작업관련', icon: '📋', color: '#1e3a5f' },
  { key: 'tank',    label: '탱크점검', icon: '🛢', color: '#1e3a5f' },
]

// ────────────────────────────────────────
// 18개 점검 항목 (차량 9 + 작업 7 + 탱크 2)
// ────────────────────────────────────────
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── 차량점검 (9항목) ──
  {
    id: 'v1',
    categoryKey: 'vehicle',
    order: 1,
    label: '타이어 공기압 및 마모상태 확인',
    type: 'binary',
  },
  {
    id: 'v2',
    categoryKey: 'vehicle',
    order: 2,
    label: '3점식 안전벨트 상태 확인',
    type: 'binary',
  },
  {
    id: 'v3',
    categoryKey: 'vehicle',
    order: 3,
    label: '주차동 / 정조동 / 방향지시동 작동 상태 확인',
    type: 'binary',
  },
  {
    id: 'v4',
    categoryKey: 'vehicle',
    order: 4,
    label: '브레이크동 / 후진표시동 상태 확인',
    type: 'binary',
  },
  {
    id: 'v5',
    categoryKey: 'vehicle',
    order: 5,
    label: '미러 / 경적 작동 상태 확인',
    type: 'binary',
  },
  {
    id: 'v6',
    categoryKey: 'vehicle',
    order: 6,
    label: '와이퍼 / 워셔액 레벨 상태 확인',
    type: 'binary',
  },
  {
    id: 'v7',
    categoryKey: 'vehicle',
    order: 7,
    label: '냉각수 / 엔진오일 상태 확인',
    type: 'binary',
  },
  {
    id: 'v8',
    categoryKey: 'vehicle',
    order: 8,
    label: '밴드셰이고 작동 상태 확인',
    type: 'binary',
  },
  {
    id: 'v9',
    categoryKey: 'vehicle',
    order: 9,
    label: '기타 오일(엔젠이크, 구라제, 베터리액 등) 누유 확인',
    type: 'binary',
  },

  // ── 작업관련 (7항목) ──
  {
    id: 'w1',
    categoryKey: 'work',
    order: 1,
    label: '개인 보호 장비(PPE) 소지 유무 및 상태 확인',
    type: 'binary',
  },
  {
    id: 'w2',
    categoryKey: 'work',
    order: 2,
    label: 'HOSE (연결 부위 및 파손) 상태 확인',
    type: 'binary',
  },
  {
    id: 'w3',
    categoryKey: 'work',
    order: 3,
    label: '차량 고임목 소지 유무 및 상태 확인',
    type: 'binary',
  },
  {
    id: 'w4',
    categoryKey: 'work',
    order: 4,
    label: '핸드레일 점검 및 상태 확인',
    type: 'binary',
  },
  {
    id: 'w5',
    categoryKey: 'work',
    order: 5,
    label: '고소 작업 안전벨트 소지 유무 및 상태 확인',
    type: 'binary',
  },
  {
    id: 'w6',
    categoryKey: 'work',
    order: 6,
    label: '운행 전 차량 주위 360도 위험 요소 확인',
    type: 'binary',
  },
  {
    id: 'w7',
    categoryKey: 'work',
    order: 7,
    label: '수면 시간',
    type: 'number',
    unit: '시간',
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
