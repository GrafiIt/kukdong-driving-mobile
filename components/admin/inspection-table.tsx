'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { RefreshCw, ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PhotoModal } from '@/components/admin/photo-modal'

// ── 조회 결과 타입 ──
interface InspectionItemRow {
  status: 'normal' | 'abnormal' | 'pending'
  image_urls: string[] | null
}

interface InspectionRow {
  id: string
  driver_name: string | null
  vehicle_number: string | null
  inspected_at: string
  bestdriver_inspection_items: InspectionItemRow[]
}

// ── Supabase fetcher (driver-checklist 스키마 조회) ──
async function fetchInspections(): Promise<InspectionRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .schema('driver-checklist')
    .from('bestdriver_inspections')
    .select(
      'id, driver_name, vehicle_number, inspected_at, bestdriver_inspection_items(status, image_urls)',
    )
    .order('inspected_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as InspectionRow[]
}

// ── 날짜 포맷 (YYYY.MM.DD HH:mm) ──
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InspectionTable() {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    'admin-inspections',
    fetchInspections,
  )
  const [modalImages, setModalImages] = useState<string[] | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
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

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-16 text-center">No.</TableHead>
              <TableHead>점검일시</TableHead>
              <TableHead>작업자명</TableHead>
              <TableHead>차량번호</TableHead>
              <TableHead className="text-center">이상 항목 수</TableHead>
              <TableHead className="text-center">사진</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  데이터를 불러오는 중입니다...
                </TableCell>
              </TableRow>
            )}

            {error && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-red-500">
                  데이터 조회 중 오류가 발생했습니다: {error.message}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  저장된 점검 자료가 없습니다.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
              data?.map((row, index) => {
                const items = row.bestdriver_inspection_items ?? []
                const abnormalCount = items.filter((it) => it.status === 'abnormal').length
                const images = items.flatMap((it) => it.image_urls ?? [])
                const photoCount = images.length

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-center text-slate-400">{index + 1}</TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {formatDateTime(row.inspected_at)}
                    </TableCell>
                    <TableCell className="text-slate-700">{row.driver_name ?? '-'}</TableCell>
                    <TableCell className="text-slate-700">{row.vehicle_number ?? '-'}</TableCell>
                    <TableCell className="text-center">
                      {abnormalCount > 0 ? (
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                          {abnormalCount}건
                        </span>
                      ) : (
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-600">
                          정상
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {photoCount > 0 ? (
                        <button
                          onClick={() => setModalImages(images)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          <ImageIcon size={14} />
                          {photoCount}장
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">없음</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      {/* 사진 미리보기 모달 */}
      {modalImages && (
        <PhotoModal images={modalImages} onClose={() => setModalImages(null)} />
      )}
    </div>
  )
}
