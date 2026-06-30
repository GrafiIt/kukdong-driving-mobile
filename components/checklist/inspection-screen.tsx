'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronLeft, Camera, X, AlertCircle } from 'lucide-react'
import {
  CATEGORIES,
  CHECKLIST_ITEMS,
  CATEGORY_COUNT,
  type CategoryKey,
  type InspectionResult,
  type CompressedImage,
} from '@/lib/checklist-data'
import { compressImage, formatFileSize } from '@/lib/compress-image'

interface InspectionScreenProps {
  results: Record<string, InspectionResult>
  onUpdateResult: (itemId: string, update: Partial<InspectionResult>) => void
  onFinish: () => void
  onBack: () => void
}

// ── iOS 스타일 휠 픽커 ─────────────────────────────────────────
const SLEEP_OPTIONS: number[] = Array.from({ length: 17 }, (_, i) => 4 + i * 0.5) // 4 ~ 12, 0.5단위

interface WheelPickerProps {
  value: number
  onChange: (v: number) => void
}

function WheelPicker({ value, onChange }: WheelPickerProps) {
  const ITEM_H = 44          // px — 각 항목 높이
  const VISIBLE = 5          // 보이는 행 수 (중앙 포함)
  const containerH = ITEM_H * VISIBLE

  const scrollRef = useRef<HTMLDivElement>(null)
  const isUserScroll = useRef(false)

  // 초기 스크롤 위치 설정 (value 기준)
  useEffect(() => {
    const idx = SLEEP_OPTIONS.indexOf(value)
    if (idx < 0 || !scrollRef.current) return
    scrollRef.current.scrollTop = idx * ITEM_H
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 외부 value 변경 시 스크롤 동기화
  useEffect(() => {
    if (isUserScroll.current) return
    const idx = SLEEP_OPTIONS.indexOf(value)
    if (idx < 0 || !scrollRef.current) return
    scrollRef.current.scrollTop = idx * ITEM_H
  }, [value])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    isUserScroll.current = true
    const idx = Math.round(el.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(SLEEP_OPTIONS.length - 1, idx))
    if (SLEEP_OPTIONS[clamped] !== value) {
      onChange(SLEEP_OPTIONS[clamped])
    }
    // 잠시 후 플래그 해제
    clearTimeout((el as HTMLDivElement & { _swTimer?: ReturnType<typeof setTimeout> })._swTimer)
    ;(el as HTMLDivElement & { _swTimer?: ReturnType<typeof setTimeout> })._swTimer =
      setTimeout(() => { isUserScroll.current = false }, 200)
  }

  const padding = Math.floor(VISIBLE / 2) * ITEM_H // 위아래 패딩으로 중앙 정렬

  return (
    <div
      className="relative flex-1 select-none overflow-hidden"
      style={{ height: containerH }}
    >
      {/* 중앙 하이라이트 바 */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-xl bg-gray-100 border border-gray-200"
        style={{ top: Math.floor(VISIBLE / 2) * ITEM_H, height: ITEM_H }}
      />

      {/* 위쪽 그라데이션 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent" />
      {/* 아래쪽 그라데이션 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent" />

      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* 상단 패딩 */}
        <div style={{ height: padding }} />

        {SLEEP_OPTIONS.map((opt) => {
          const isSelected = opt === value
          return (
            <div
              key={opt}
              className="snap-center flex items-center justify-center transition-all duration-150"
              style={{ height: ITEM_H }}
            >
              <span
                className={`transition-all duration-150 ${
                  isSelected
                    ? 'text-2xl font-bold text-[#1e3a5f]'
                    : 'text-base font-medium text-gray-400'
                }`}
              >
                {Number.isInteger(opt) ? opt : opt.toFixed(1)}
              </span>
            </div>
          )
        })}

        {/* 하단 패딩 */}
        <div style={{ height: padding }} />
      </div>
    </div>
  )
}

// ── 이상 입력 모달 ─────────────────────────────────────────────
interface AbnormalModalProps {
  itemLabel: string
  result: InspectionResult
  onSave: (note: string, images: CompressedImage[]) => void
  onCancel: () => void
}

function AbnormalModal({ itemLabel, result, onSave, onCancel }: AbnormalModalProps) {
  const [note, setNote] = useState(result.note ?? '')
  const [images, setImages] = useState<CompressedImage[]>(result.images ?? [])
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (!files.length) return
      if (images.length >= 2) return

      setIsCompressing(true)
      try {
        const remaining = 2 - images.length
        const filesToProcess = files.slice(0, remaining)
        const compressed = await Promise.all(filesToProcess.map(compressImage))
        setImages((prev) => [...prev, ...compressed])
      } finally {
        setIsCompressing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [images.length]
  )

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" />
            <span className="font-bold text-red-600 text-sm">이상 항목</span>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="닫기"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-800 mb-4 leading-snug">{itemLabel}</p>

        {/* 이상 내용 텍스트 */}
        <label className="block text-xs font-semibold text-gray-600 mb-1">이상 내용 입력</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="이상 내용을 입력하세요"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 mb-4"
        />

        {/* 사진 첨부 */}
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          사진 첨부 <span className="text-gray-400 font-normal">(최대 2장, 자동 압축됨)</span>
        </label>
        <div className="flex gap-3 mb-5">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={`첨부 사진 ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                aria-label="이미지 삭제"
              >
                <X size={12} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] text-center py-0.5">
                {formatFileSize(img.compressedSize)}
              </div>
            </div>
          ))}

          {images.length < 2 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Camera size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {isCompressing ? '압축 중...' : '사진 추가'}
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 저장 버튼 */}
        <button
          onClick={() => onSave(note, images)}
          className="w-full h-12 bg-[#1e3a5f] text-white font-bold rounded-xl text-sm hover:bg-[#162d4a] transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  )
}

// ── 메인 점검 화면 ─────────────────────────────────────────────
export default function InspectionScreen({
  results,
  onUpdateResult,
  onFinish,
  onBack,
}: InspectionScreenProps) {
  const [activeTab, setActiveTab] = useState<CategoryKey>('vehicle')
  const [modalItemId, setModalItemId] = useState<string | null>(null)

  const currentItems = CHECKLIST_ITEMS.filter((i) => i.categoryKey === activeTab)

  const getTabCompleted = (key: CategoryKey) => {
    const items = CHECKLIST_ITEMS.filter((i) => i.categoryKey === key)
    return items.filter(
      (i) => results[i.id]?.status === 'normal' || results[i.id]?.status === 'abnormal'
    ).length
  }

  const totalCompleted = CHECKLIST_ITEMS.filter(
    (i) => results[i.id]?.status === 'normal' || results[i.id]?.status === 'abnormal'
  ).length
  const totalItems = CHECKLIST_ITEMS.length
  const progressPercent = Math.round((totalCompleted / totalItems) * 100)

  const handleStatusClick = (itemId: string, status: 'normal' | 'abnormal') => {
    if (status === 'abnormal') {
      onUpdateResult(itemId, { status: 'abnormal' })
      setModalItemId(itemId)
    } else {
      onUpdateResult(itemId, { status: 'normal', note: undefined, images: undefined })
    }
  }

  const handleModalSave = (note: string, images: CompressedImage[]) => {
    if (!modalItemId) return
    onUpdateResult(modalItemId, { status: 'abnormal', note, images })
    setModalItemId(null)
  }

  const handleModalCancel = () => {
    if (modalItemId) {
      const current = results[modalItemId]
      if (current?.status === 'abnormal' && !current.note) {
        onUpdateResult(modalItemId, { status: 'pending' })
      }
    }
    setModalItemId(null)
  }

  const isAllDone = totalCompleted === totalItems

  const modalItem = modalItemId
    ? CHECKLIST_ITEMS.find((i) => i.id === modalItemId)
    : null

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <header className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} className="text-[#1e3a5f]" />
        </button>
        <h1 className="text-lg font-bold text-[#1e3a5f] flex-1 text-center">점검 체크리스트</h1>
        <div className="w-9" />
      </header>

      {/* 진행률 미니바 + 탭 (sticky 고정 영역) */}
      <div className="sticky top-0 z-40 bg-white">
        {/* 진행률 미니바 */}
        <div className="px-4 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">{totalCompleted} / {totalItems} 항목 완료</span>
            <span className="text-xs font-bold text-[#1e3a5f]">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 탭 (차량 → 작업 → 탱크) */}
        <div className="flex gap-2.5 px-4 py-3">
          {CATEGORIES.map((cat) => {
            const completed = getTabCompleted(cat.key)
            const total = CATEGORY_COUNT[cat.key]
            const isActive = activeTab === cat.key
            const isAllTabDone = completed === total

            // 탭별 컬러 테마
            const theme = {
              vehicle: {
                activeBg: 'bg-blue-600',
                activeText: 'text-white',
                inactiveBg: 'bg-blue-50',
                inactiveText: 'text-blue-700',
                inactiveBorder: 'border-blue-300',
                inactiveShadow: 'border-b-4 border-b-blue-300',
                doneText: 'text-blue-200',
                inactiveDoneText: 'text-blue-400',
              },
              work: {
                activeBg: 'bg-emerald-600',
                activeText: 'text-white',
                inactiveBg: 'bg-emerald-50',
                inactiveText: 'text-emerald-700',
                inactiveBorder: 'border-emerald-300',
                inactiveShadow: 'border-b-4 border-b-emerald-300',
                doneText: 'text-emerald-200',
                inactiveDoneText: 'text-emerald-500',
              },
              tank: {
                activeBg: 'bg-orange-500',
                activeText: 'text-white',
                inactiveBg: 'bg-orange-50',
                inactiveText: 'text-orange-700',
                inactiveBorder: 'border-orange-300',
                inactiveShadow: 'border-b-4 border-b-orange-300',
                doneText: 'text-orange-200',
                inactiveDoneText: 'text-orange-400',
              },
            } as const

            const t = theme[cat.key]

            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`
                  flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl
                  font-bold text-xs gap-0.5 select-none
                  transition-all duration-150 ease-in-out
                  border
                  ${isActive
                    ? `${t.activeBg} ${t.activeText} border-transparent shadow-sm translate-y-0.5`
                    : `${t.inactiveBg} ${t.inactiveText} ${t.inactiveBorder} ${t.inactiveShadow} hover:brightness-95 active:translate-y-0.5 active:border-b`
                  }
                `}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] font-semibold ${
                  isActive
                    ? (isAllTabDone ? t.doneText : 'text-white/70')
                    : (isAllTabDone ? t.inactiveDoneText : 'text-gray-400')
                }`}>
                  {completed}/{total}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 항목 리스트 */}
      <main className="flex-1 px-4 pt-3 pb-32 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {currentItems.map((item) => {
            const result = results[item.id]
            const isNormal = result?.status === 'normal'
            const isAbnormal = result?.status === 'abnormal'

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* 항목 헤더 */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isAbnormal
                        ? 'bg-red-500 text-white'
                        : isNormal
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.order}
                  </span>
                  <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                    {item.label}
                  </p>
                </div>

                {/* 버튼 영역 */}
                <div className="px-4 pb-4">
                  {item.type === 'binary' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusClick(item.id, 'normal')}
                        className={`flex-1 h-11 rounded-xl font-bold text-sm transition-colors ${
                          isNormal
                            ? 'bg-[#1e3a5f] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        정상
                      </button>
                      <button
                        onClick={() => handleStatusClick(item.id, 'abnormal')}
                        className={`flex-1 h-11 rounded-xl font-bold text-sm transition-colors ${
                          isAbnormal
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        이상
                      </button>
                    </div>
                  ) : (
                    // 수면 시간 — iOS 스타일 휠 픽커
                    <div className="flex items-center gap-3 px-1">
                      <WheelPicker
                        value={result?.numberValue ?? 4}
                        onChange={(v) =>
                          onUpdateResult(item.id, {
                            status: 'normal',
                            numberValue: v,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-gray-500 flex-shrink-0">{item.unit}</span>
                    </div>
                  )}
                </div>

                {/* 이상 입력 내용 미리보기 */}
                {isAbnormal && (result.note || (result.images && result.images.length > 0)) && (
                  <div
                    className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2 cursor-pointer"
                    onClick={() => setModalItemId(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setModalItemId(item.id)}
                    aria-label="이상 내용 수정"
                  >
                    {result.note && (
                      <p className="text-xs text-red-700 truncate">{result.note}</p>
                    )}
                    {result.images && result.images.length > 0 && (
                      <div className="flex gap-2 mt-1.5">
                        {result.images.map((img, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={idx}
                            src={img.dataUrl}
                            alt={`이상 사진 ${idx + 1}`}
                            className="w-14 h-14 object-cover rounded-lg border border-red-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={onFinish}
          disabled={!isAllDone}
          className={`w-full h-14 text-white text-lg font-bold rounded-2xl shadow-md transition-colors ${
            isAllDone
              ? 'bg-[#1e3a5f] hover:bg-[#162d4a] active:bg-[#0f2035]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isAllDone ? '점검 완료 → 최종 확인' : `${totalItems - totalCompleted}개 항목 미완료`}
        </button>
      </div>

      {/* 이상 입력 모달 */}
      {modalItem && (
        <AbnormalModal
          itemLabel={modalItem.label}
          result={results[modalItem.id]}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  )
}
