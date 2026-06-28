'use client'

import { Bell, User, Car, Calendar, Truck, Layers, Fuel } from 'lucide-react'
import { CATEGORIES, CATEGORY_COUNT, CHECKLIST_ITEMS, type InspectionResult } from '@/lib/checklist-data'

interface StartScreenProps {
  results: Record<string, InspectionResult>
  onStart: () => void
}

const DRIVER_NAME = '이윤상'
const VEHICLE_NUMBER = '부산 99바 1234'

function getInspectionDateTime(): string {
  const now = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const day = days[now.getDay()]
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} (${day}) ${hh}:${min}`
}

function getCategoryIcon(key: string) {
  if (key === 'vehicle') return <Truck size={28} className="text-[#1e3a5f]" />
  if (key === 'work') return <Layers size={28} className="text-[#2e7d52]" />
  if (key === 'tank') return <Fuel size={28} className="text-[#5c3a9e]" />
  return null
}

function getCategoryBg(key: string) {
  if (key === 'vehicle') return 'bg-blue-50'
  if (key === 'work') return 'bg-green-50'
  if (key === 'tank') return 'bg-purple-50'
  return 'bg-gray-50'
}

export default function StartScreen({ results, onStart }: StartScreenProps) {
  const totalItems = CHECKLIST_ITEMS.length
  const completedItems = Object.values(results).filter(
    (r) => r.status === 'normal' || r.status === 'abnormal'
  ).length
  const progressPercent = Math.round((completedItems / totalItems) * 100)

  const getCategoryCompleted = (categoryKey: string) => {
    const categoryItems = CHECKLIST_ITEMS.filter((i) => i.categoryKey === categoryKey)
    return categoryItems.filter(
      (i) => results[i.id]?.status === 'normal' || results[i.id]?.status === 'abnormal'
    ).length
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4 bg-white">
        <h1 className="text-[17px] font-bold text-[#1e3a5f] leading-tight">
          운전자 운행 전 일일체크리스트
        </h1>
        <button
          aria-label="알림"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell size={22} className="text-[#1e3a5f]" />
        </button>
      </header>

      {/* 본문 */}
      <main className="flex-1 px-4 pb-32 flex flex-col gap-3">
        {/* 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 작업자명 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-[#1e3a5f]" />
            </div>
            <span className="text-sm text-gray-500 flex-1">작업자명</span>
            <span className="text-sm font-semibold text-[#1e3a5f]">{DRIVER_NAME}</span>
          </div>
          {/* 차량번호 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Car size={18} className="text-[#1e3a5f]" />
            </div>
            <span className="text-sm text-gray-500 flex-1">차량번호</span>
            <span className="text-sm font-semibold text-[#1e3a5f]">{VEHICLE_NUMBER}</span>
          </div>
          {/* 점검일시 */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-[#1e3a5f]" />
            </div>
            <span className="text-sm text-gray-500 flex-1">점검일시</span>
            <span className="text-sm font-semibold text-[#1e3a5f]">{getInspectionDateTime()}</span>
          </div>
        </div>

        {/* 전체 진행률 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">전체 점검 진행률</span>
            <span className="text-sm text-gray-500">
              <span className="font-bold text-[#1e3a5f]">{completedItems}</span>
              {' / '}{totalItems} 항목
            </span>
          </div>
          {/* 프로그레스 바 */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-center text-xl font-bold text-[#1e3a5f]">{progressPercent}%</p>
        </div>

        {/* 카테고리별 요약 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const total = CATEGORY_COUNT[cat.key]
              const completed = getCategoryCompleted(cat.key)
              return (
                <div
                  key={cat.key}
                  className={`${getCategoryBg(cat.key)} rounded-xl flex flex-col items-center py-4 gap-2`}
                >
                  {getCategoryIcon(cat.key)}
                  <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                    {cat.label}
                  </span>
                  <div className="text-center">
                    <span className="text-base font-bold text-[#1e3a5f]">{completed}</span>
                    <span className="text-xs text-gray-500"> / {total}</span>
                  </div>
                  <span className="text-xs text-gray-500">항목</span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={onStart}
          className="w-full h-14 bg-[#1e3a5f] hover:bg-[#162d4a] active:bg-[#0f2035] text-white text-lg font-bold rounded-2xl shadow-md transition-colors"
        >
          점검 시작
        </button>
      </div>
    </div>
  )
}
