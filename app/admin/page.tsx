'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar, type AdminMenuKey } from '@/components/admin/admin-sidebar'
import { InspectionTable } from '@/components/admin/inspection-table'
import { createClient } from '@/utils/supabase/client'

const ADMIN_LOGIN_URL =
  'https://payment.1004.help/auth/login?next=https://bestdriver.1004.help/admin'

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('checklist')
  const [isChecking, setIsChecking] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // ── 클라이언트 측 2중 세션 체크 (URL 직접 접근 방어) ────
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = ADMIN_LOGIN_URL
        return
      }
      setIsChecking(false)
    }
    checkSession()
  }, [])

  // 세션 확인 중에는 아무것도 렌더링하지 않음
  if (isChecking) return null

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      {/* 좌측 사이드바 */}
      <AdminSidebar
        active={activeMenu}
        onSelect={setActiveMenu}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 우측 메인 콘텐츠: 사이드바 접힘 여부에 관계없이 남은 공간 전체 차지 */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        {activeMenu === 'checklist' && <InspectionTable />}
      </main>
    </div>
  )
}
