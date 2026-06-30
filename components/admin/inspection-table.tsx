'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { RefreshCw, ImageIcon, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { CHECKLIST_ITEMS } from '@/lib/checklist-data'
import { PhotoModal } from '@/components/admin/photo-modal'

// ─────────────────────────────────────────
// 타입
// ─────────────────────────────────────────
interface InspectionItemRow {
  item_id: string
  status: 'normal' | 'abnormal' | 'pending'
  note: string | null
  image_urls: string[] | null
}

interface InspectionRow {
  id: string
  driver_name: string | null
  vehicle_number: string | null
  inspected_at: string
  bestdriver_inspection_items: InspectionItemRow[]
}

// ─────────────────────────────────────────
// 기본 날짜 계산 (오늘 ~ 30일 전)
// ─────────────────────────────────────────
function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getDefaultDateRange(): { from: string; to: string } {
  const today = new Date()
  const past = new Date(today)
  past.setDate(today.getDate() - 30)
  return { from: toDateString(past), to: toDateString(today) }
}

// ─────────────────────────────────────────
// Supabase fetcher (기간 필터 포함)
// ─────────────────────────────────────────
async function fetchInspections(
  fromDate: string,
  toDate: string,
): Promise<InspectionRow[]> {
  const supabase = createClient()
  // toDate는 당일 23:59:59까지 포함하기 위해 다음날 00:00:00 미만으로 처리
  const toDateExclusive = toDateString(
    new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000),
  )

  const { data, error } = await supabase
    .schema('driver-checklist')
    .from('bestdriver_inspections')
    .select(
      'id, driver_name, vehicle_number, inspected_at, bestdriver_inspection_items(item_id, status, note, image_urls)',
    )
    .gte('inspected_at', fromDate)
    .lt('inspected_at', toDateExclusive)
    .order('inspected_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as InspectionRow[]
}

// ─────────────────────────────────────────
// 날짜 포맷 (YYYY.MM.DD HH:mm)
// ─────────────────────────────────────────
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─────────────────────────────────────────
// 18개 항목 순서 (checklist-data 순서 그대로)
// ─────────────────────────────────────────
const ORDERED_ITEMS = CHECKLIST_ITEMS // 이미 차량9 → 작업7 → 탱크2 순서

// 카테고리별 컬럼 범위
const VEHICLE_ITEMS = ORDERED_ITEMS.filter((i) => i.categoryKey === 'vehicle')
const WORK_ITEMS    = ORDERED_ITEMS.filter((i) => i.categoryKey === 'work')
const TANK_ITEMS    = ORDERED_ITEMS.filter((i) => i.categoryKey === 'tank')

// ─────────────────────────────────────────
// 모달 상태 타입
// ─────────────────────────────────────────
interface ModalState {
  images: string[]
  title: string
}

// ─────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────
export function InspectionTable() {
  const defaults = getDefaultDateRange()
  const [fromDate, setFromDate] = useState(defaults.from)
  const [toDate, setToDate]     = useState(defaults.to)
  // 실제 조회에 사용할 날짜 (검색 버튼 클릭 시 적용)
  const [appliedFrom, setAppliedFrom] = useState(defaults.from)
  const [appliedTo, setAppliedTo]     = useState(defaults.to)

  const [modal, setModal] = useState<ModalState | null>(null)

  // SWR key에 날짜를 포함시켜 날짜 변경 시 자동 refetch
  const swrKey = `admin-inspections/${appliedFrom}/${appliedTo}`

  const fetcher = useCallback(
    () => fetchInspections(appliedFrom, appliedTo),
    [appliedFrom, appliedTo],
  )

  const { data, error, isLoading, mutate, isValidating } = useSWR(swrKey, fetcher)

  // 검색 버튼 클릭
  const handleSearch = () => {
    setAppliedFrom(fromDate)
    setAppliedTo(toDate)
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── 헤더 타이틀 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">일일점검 체크리스트</h2>
          <p className="mt-1 text-sm text-slate-500">
            기사님들이 제출한 운행 전 점검 자료입니다.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* ── 기간 검색 필터 ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">점검 기간</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition-colors"
          />
          <span className="text-slate-400 font-medium">~</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#162d4a] active:bg-[#0f2035]"
        >
          <Search size={15} />
          검색
        </button>
        {/* 조회 결과 건수 */}
        {!isLoading && !error && data && (
          <span className="ml-auto text-sm text-slate-500">
            총 <span className="font-bold text-slate-800">{data.length}</span>건
          </span>
        )}
      </div>

      {/* ── 테이블 래퍼: 세로 스크롤을 위해 높이 제한 + 가로 스크롤 ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div className="overflow-auto always-scrollbar flex-1">
          <table className="w-max min-w-full border-collapse text-sm">

            {/* ─── 다중 헤더 (2-row) ─── */}
            <thead className="sticky top-0 z-20">
              {/* 1행: 카테고리 그룹 헤더 */}
              <tr className="bg-slate-100 border-b border-slate-200">
                {/* ── 좌측 4개 고정 컬럼 (z-30: 헤더 + sticky 교차점) ── */}
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 border-r border-slate-200 bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600 whitespace-nowrap"
                  style={{ width: 50, minWidth: 50 }}
                >
                  No.
                </th>
                <th
                  rowSpan={2}
                  className="sticky z-30 border-r border-slate-200 bg-slate-100 px-4 py-2 text-left text-xs font-bold text-slate-600 whitespace-nowrap"
                  style={{ left: 50, width: 140, minWidth: 140 }}
                >
                  점검일시
                </th>
                <th
                  rowSpan={2}
                  className="sticky z-30 border-r border-slate-200 bg-slate-100 px-4 py-2 text-left text-xs font-bold text-slate-600 whitespace-nowrap"
                  style={{ left: 190, width: 90, minWidth: 90 }}
                >
                  작업자명
                </th>
                <th
                  rowSpan={2}
                  className="sticky z-30 border-r-2 border-slate-300 bg-slate-100 px-4 py-2 text-left text-xs font-bold text-slate-600 whitespace-nowrap"
                  style={{ left: 280, width: 100, minWidth: 100 }}
                >
                  차량번호
                </th>
                {/* 차량점검 그룹 */}
                <th
                  colSpan={VEHICLE_ITEMS.length}
                  className="border-x border-slate-200 px-2 py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 whitespace-nowrap"
                >
                  차량점검 ({VEHICLE_ITEMS.length}항목)
                </th>
                {/* 작업관련 그룹 */}
                <th
                  colSpan={WORK_ITEMS.length}
                  className="border-x border-slate-200 px-2 py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 whitespace-nowrap"
                >
                  작업관련 ({WORK_ITEMS.length}항목)
                </th>
                {/* 탱크점검 그룹 */}
                <th
                  colSpan={TANK_ITEMS.length}
                  className="border-l border-slate-200 px-2 py-2 text-center text-xs font-bold text-orange-700 bg-orange-50 whitespace-nowrap"
                >
                  탱크점검 ({TANK_ITEMS.length}항목)
                </th>
              </tr>

              {/* 2행: 개별 항목 헤더 */}
              <tr className="bg-slate-50 border-b border-slate-200">
                {ORDERED_ITEMS.map((item, idx) => {
                  const isVehicle = item.categoryKey === 'vehicle'
                  const isWork    = item.categoryKey === 'work'
                  const bgClass   = isVehicle ? 'bg-blue-50/60' : isWork ? 'bg-emerald-50/60' : 'bg-orange-50/60'
                  const textClass = isVehicle ? 'text-blue-800' : isWork ? 'text-emerald-800' : 'text-orange-800'
                  const borderClass = idx === VEHICLE_ITEMS.length - 1 || idx === VEHICLE_ITEMS.length + WORK_ITEMS.length - 1
                    ? 'border-r-2 border-slate-300'
                    : 'border-r border-slate-200'
                  return (
                    <th
                      key={item.id}
                      className={`${bgClass} ${borderClass} px-2 py-2 text-center text-[11px] font-semibold ${textClass} min-w-[130px] max-w-[160px]`}
                    >
                      <div className="line-clamp-2 leading-tight" title={item.label}>
                        {item.order}. {item.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* ─── 바디 ─── */}
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4 + ORDERED_ITEMS.length} className="py-14 text-center text-slate-400">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              )}

              {error && !isLoading && (
                <tr>
                  <td colSpan={4 + ORDERED_ITEMS.length} className="py-14 text-center text-red-500">
                    데이터 조회 중 오류: {error.message}
                  </td>
                </tr>
              )}

              {!isLoading && !error && data?.length === 0 && (
                <tr>
                  <td colSpan={4 + ORDERED_ITEMS.length} className="py-14 text-center text-slate-400">
                    해당 기간의 점검 자료가 없습니다.
                  </td>
                </tr>
              )}

              {!isLoading && !error && data?.map((row, index) => {
                // item_id → InspectionItemRow 맵
                const itemMap = new Map<string, InspectionItemRow>()
                ;(row.bestdriver_inspection_items ?? []).forEach((it) => {
                  itemMap.set(it.item_id, it)
                })

                return (
                  <tr
                    key={row.id}
                    className="group border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {/* No. — sticky left 0 */}
                    <td
                      className="sticky left-0 z-10 border-r border-slate-200 bg-white group-hover:bg-slate-50 transition-colors px-3 py-2.5 text-center text-xs text-slate-400"
                      style={{ width: 50, minWidth: 50 }}
                    >
                      {index + 1}
                    </td>
                    {/* 점검일시 — sticky left 50 */}
                    <td
                      className="sticky z-10 border-r border-slate-200 bg-white group-hover:bg-slate-50 transition-colors px-4 py-2.5 whitespace-nowrap text-sm font-medium text-slate-800"
                      style={{ left: 50, width: 140, minWidth: 140 }}
                    >
                      {formatDateTime(row.inspected_at)}
                    </td>
                    {/* 작업자명 — sticky left 190 */}
                    <td
                      className="sticky z-10 border-r border-slate-200 bg-white group-hover:bg-slate-50 transition-colors px-4 py-2.5 whitespace-nowrap text-sm text-slate-700"
                      style={{ left: 190, width: 90, minWidth: 90 }}
                    >
                      {row.driver_name ?? '-'}
                    </td>
                    {/* 차량번호 — sticky left 280 */}
                    <td
                      className="sticky z-10 border-r-2 border-slate-300 bg-white group-hover:bg-slate-50 transition-colors px-4 py-2.5 whitespace-nowrap text-sm text-slate-700"
                      style={{ left: 280, width: 100, minWidth: 100 }}
                    >
                      {row.vehicle_number ?? '-'}
                    </td>

                    {/* 18개 점검 항목 셀 */}
                    {ORDERED_ITEMS.map((item, idx) => {
                      const it = itemMap.get(item.id)
                      const status = it?.status ?? 'pending'
                      const note   = it?.note ?? ''
                      const images = it?.image_urls ?? []
                      const borderClass = idx === VEHICLE_ITEMS.length - 1 || idx === VEHICLE_ITEMS.length + WORK_ITEMS.length - 1
                        ? 'border-r-2 border-slate-300'
                        : 'border-r border-slate-200'

                      if (status === 'normal') {
                        // 정상
                        return (
                          <td key={item.id} className={`${borderClass} px-2 py-2.5 text-center`}>
                            <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              정상
                            </span>
                          </td>
                        )
                      }

                      if (status === 'abnormal') {
                        // 이상 (사유 + 사진 아이콘)
                        const hasImages = images.length > 0
                        return (
                          <td key={item.id} className={`${borderClass} px-2 py-2.5 text-center`}>
                            <button
                              onClick={() =>
                                hasImages &&
                                setModal({ images, title: `${item.order}. ${item.label}` })
                              }
                              disabled={!hasImages}
                              className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors
                                ${hasImages
                                  ? 'cursor-pointer hover:bg-red-50'
                                  : 'cursor-default'}`}
                              title={hasImages ? '사진 보기' : ''}
                            >
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                이상
                                {hasImages && <ImageIcon size={11} />}
                              </span>
                              {note && (
                                <span className="block max-w-[120px] truncate text-[10px] text-slate-500" title={note}>
                                  {note}
                                </span>
                              )}
                            </button>
                          </td>
                        )
                      }

                      // pending / 미입력
                      return (
                        <td key={item.id} className={`${borderClass} px-2 py-2.5 text-center`}>
                          <span className="text-[11px] text-slate-300">-</span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사진 미리보기 모달 */}
      {modal && (
        <PhotoModal
          images={modal.images}
          title={modal.title}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
