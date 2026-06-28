'use client'

import { useState } from 'react'
import { AdminSidebar, type AdminMenuKey } from '@/components/admin/admin-sidebar'
import { InspectionTable } from '@/components/admin/inspection-table'

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('checklist')

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      {/* 좌측 사이드바 (20%) */}
      <AdminSidebar active={activeMenu} onSelect={setActiveMenu} />

      {/* 우측 메인 콘텐츠 (80%) */}
      <main className="w-4/5 flex-1 overflow-y-auto p-8">
        {activeMenu === 'checklist' && <InspectionTable />}
      </main>
    </div>
  )
}
