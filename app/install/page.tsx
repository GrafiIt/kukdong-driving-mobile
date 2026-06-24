'use client';

import { useState } from 'react';
import { ChevronLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { SlideMenu } from '@/components/slide-menu';
import { InstallGuide } from '@/components/install-guide';

export default function InstallPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-hidden">

        {/* ── 상단 내비게이션 바 ── */}
        <header className="flex items-center justify-between px-5 pt-6 pb-2 flex-shrink-0">
          {/* 좌측: 홈으로 돌아가기 */}
          <div className="min-w-[100px]">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 active:text-slate-700 transition-colors py-2 pr-3"
              aria-label="홈으로 돌아가기"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
              <span className="text-sm font-semibold">홈으로</span>
            </Link>
          </div>

          {/* 중앙: 화면 제목 */}
          <div className="flex-1 text-center">
            <span className="text-base font-bold text-slate-700">휴대폰 설치</span>
          </div>

          {/* 우측: 햄버거 메뉴 */}
          <div className="min-w-[100px] flex justify-end">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="메뉴 열기"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <Menu size={24} strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <InstallGuide />
        </main>

      {/* ── 슬라이드 메뉴 ── */}
      <SlideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
