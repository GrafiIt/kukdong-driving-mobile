'use client'

import { ClipboardCheck, type LucideIcon } from 'lucide-react'

export type AdminMenuKey = 'checklist'

interface AdminMenuItem {
  key: AdminMenuKey
  label: string
  icon: LucideIcon
}

// 추후 메뉴 확장을 위해 배열로 관리
const MENU_ITEMS: AdminMenuItem[] = [
  { key: 'checklist', label: '일일점검 체크리스트', icon: ClipboardCheck },
]

interface AdminSidebarProps {
  active: AdminMenuKey
  onSelect: (key: AdminMenuKey) => void
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  return (
    <aside className="flex w-1/5 min-w-[220px] flex-col border-r border-slate-200 bg-slate-900">
      {/* 로고 / 타이틀 */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <span className="text-lg font-bold tracking-tight text-white">
          관리자 페이지
        </span>
      </div>

      {/* 메뉴 목록 */}
      <nav className="flex flex-1 flex-col gap-2 p-4">
        {MENU_ITEMS.map((item, index) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`flex items-center gap-3 rounded-xl px-4 py-4 text-left text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={22} className="flex-shrink-0" />
              <span>
                {index + 1}. {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-center text-xs text-slate-500">휴먼과드라이빙 관리자</p>
      </div>
    </aside>
  )
}
