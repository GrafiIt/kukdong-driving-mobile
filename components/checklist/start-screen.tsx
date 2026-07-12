'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlignJustify, UserCircle, Gauge, Clock, Package, Boxes, Zap } from 'lucide-react'
import { CATEGORIES, CATEGORY_COUNT, CHECKLIST_ITEMS, type InspectionResult } from '@/lib/checklist-data'
import { createClient } from '@/utils/supabase/client'
import { SlideMenu } from '@/components/slide-menu'

interface StartScreenProps {
  results: Record<string, InspectionResult>
  onStart: () => void
  onEdit: (inspectionId: string) => void
  isLoadingEdit: boolean
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
  if (key === 'vehicle') return <Package size={28} className="text-[#1a3a52]" />
  if (key === 'work') return <Boxes size={28} className="text-[#1a3a52]" />
  if (key === 'tank') return <Zap size={28} className="text-[#1a3a52]" />
  return null
}

function getCategoryBg(key: string) {
  if (key === 'vehicle') return 'bg-orange-50'
  if (key === 'work') return 'bg-slate-100'
  if (key === 'tank') return 'bg-orange-50'
  return 'bg-gray-50'
}

export default function StartScreen({ results, onStart, onEdit, isLoadingEdit }: StartScreenProps) {
  const [isTodayCompleted, setIsTodayCompleted] = useState(false)
  const [todayInspectionId, setTodayInspectionId] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 오늘 점검 완료 여부 조회
  useEffect(() => {
    const checkTodayInspection = async () => {
      try {
        const supabase = createClient()
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        const { data, error } = await supabase
          .schema('driver-checklist')
          .from('kukdong_driver_inspections')
          .select('id')
          .gte('inspected_at', todayStart.toISOString())
          .lte('inspected_at', todayEnd.toISOString())
          .order('inspected_at', { ascending: false })
          .limit(1)

        if (!error && data && data.length > 0) {
          setIsTodayCompleted(true)
          setTodayInspectionId(data[0].id)
        }
      } catch {
        // 조회 실패 시 기본값(미완료)으로 유지
      }
    }

    checkTodayInspection()
  }, [])

  // 점검 시작 / 수정 분기 핸들러
  const handleMainButtonClick = () => {
    if (isTodayCompleted) {
      if (!todayInspectionId) return
      const confirmed = window.confirm('오늘 점검을 마무리했는데 수정하시겠습니까?')
      if (confirmed) {
        onEdit(todayInspectionId)
      }
    } else {
      onStart()
    }
  }

  const totalItems = CHECKLIST_ITEMS.length

  // 오늘 완료된 경우 모든 항목을 꽉 채운 수치로 표시
  const displayCompleted = isTodayCompleted ? totalItems : Object.values(results).filter(
    (r) => r.status === 'normal' || r.status === 'abnormal'
  ).length
  const progressPercent = isTodayCompleted ? 100 : Math.round((displayCompleted / totalItems) * 100)

  const getCategoryCompleted = (categoryKey: string) => {
    if (isTodayCompleted) return CATEGORY_COUNT[categoryKey as keyof typeof CATEGORY_COUNT]
    const categoryItems = CHECKLIST_ITEMS.filter((i) => i.categoryKey === categoryKey)
    return categoryItems.filter(
      (i) => results[i.id]?.status === 'normal' || results[i.id]?.status === 'abnormal'
    ).length
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col" style={{ touchAction: 'pan-y' }}>
      {/* 상단 헤더 */}
      <header className="flex items-center px-5 pt-4 pb-4 bg-white gap-4 border-b border-gray-200">
        {/* 좌측: CI 로고 */}
        <Link
          href="/"
          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="홈으로 이동"
        >
          <Image
            src="/logo-ci.png"
            alt="극동 로지텍 CI"
            width={48}
            height={40}
            priority
            className="object-contain"
          />
        </Link>

        {/* 중앙: 제목 (flex-1로 중앙 정렬) */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-[17px] font-bold text-[#1a3a52] leading-tight tracking-tight">
            운전자 운행 전 일일체크리스트
          </h1>
        </div>

        {/* 우측: 메뉴 버튼 */}
        <button
          onClick={() => setIsMenuOpen(true)}
          aria-label="메뉴 열기"
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
        >
          <AlignJustify size={22} className="text-[#1a3a52]" />
        </button>
      </header>

      {/* 본문 */}
      <main className="flex-1 px-4 pb-4 flex flex-col gap-3">
        {/* 정보 카드 */}
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
          {/* 작업자명 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
            <div className="w-9 h-9 rounded-none bg-orange-100 flex items-center justify-center flex-shrink-0">
              <UserCircle size={18} className="text-[#1a3a52]" />
            </div>
            <span className="text-sm text-gray-600 flex-1 font-medium">작업자명</span>
            <span className="text-sm font-bold text-[#1a3a52]">{DRIVER_NAME}</span>
          </div>
          {/* 차량번호 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
            <div className="w-9 h-9 rounded-none bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Gauge size={18} className="text-[#1a3a52]" />
            </div>
            <span className="text-sm text-gray-600 flex-1 font-medium">차량번호</span>
            <span className="text-sm font-bold text-[#1a3a52]">{VEHICLE_NUMBER}</span>
          </div>
          {/* 점검일시 */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-none bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-[#1a3a52]" />
            </div>
            <span className="text-sm text-gray-600 flex-1 font-medium">점검일시</span>
            <span className="text-sm font-bold text-[#1a3a52]">{getInspectionDateTime()}</span>
          </div>
        </div>

        {/* 전체 진행률 카드 */}
        <div className="bg-white rounded-none border border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#1a3a52]">전체 점검 진행률</span>
            <span className="text-sm text-gray-600">
              <span className="font-bold text-[#ff6b35]">{displayCompleted}</span>
              {' / '}{totalItems} 항목
            </span>
          </div>
          {/* 프로그레스 바 */}
          <div className="h-2 bg-gray-300 rounded-none overflow-hidden mb-3">
            <div
              className="h-full bg-[#ff6b35] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-center text-2xl font-bold text-[#1a3a52]">{progressPercent}%</p>
        </div>

        {/* 카테고리별 요약 카드 */}
        <div className="bg-white rounded-none border border-gray-200 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const total = CATEGORY_COUNT[cat.key]
              const completed = getCategoryCompleted(cat.key)
              return (
                <div
                  key={cat.key}
                  className={`${getCategoryBg(cat.key)} rounded-none flex flex-col items-center py-4 gap-2 border border-gray-200`}
                >
                  {getCategoryIcon(cat.key)}
                  <span className="text-xs font-bold text-[#1a3a52] text-center leading-tight">
                    {cat.label}
                  </span>
                  <div className="text-center">
                    <span className="text-lg font-bold text-[#ff6b35]">{completed}</span>
                    <span className="text-xs text-gray-600"> / {total}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">항목</span>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* 하단 버튼 - 콘텐츠 바로 아래 또는 화면 하단에 고정 */}
      <div className="sticky bottom-0 mt-auto px-4 pb-6 pt-3 bg-white border-t border-gray-200">
        <button
          onClick={handleMainButtonClick}
          disabled={isLoadingEdit}
          className={`w-full h-14 text-white text-lg font-bold rounded-none transition-colors
            ${isLoadingEdit
              ? 'bg-gray-400 cursor-not-allowed opacity-70'
              : isTodayCompleted
              ? 'bg-[#1a3a52] hover:bg-[#0f2635] active:bg-[#081a28]'
              : 'bg-[#ff6b35] hover:bg-[#e55a24] active:bg-[#cc4910]'
            }`}
        >
          {isLoadingEdit
            ? '불러오는 중...'
            : isTodayCompleted
            ? '오늘 점검 완료 (수정하기)'
            : '점검 시작'}
        </button>
      </div>

      {/* 슬라이드 메뉴 */}
      <SlideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  )
}
