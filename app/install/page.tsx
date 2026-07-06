'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { SlideMenu } from '@/components/slide-menu';
import { InstallGuide } from '@/components/install-guide';

export default function InstallPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-hidden">

        {/* ── 상단 내비게이션 바 ── */}
        <header className="flex items-center px-5 pt-4 pb-2 flex-shrink-0 gap-3 border-b border-gray-200">
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

          {/* 중앙: 화면 제목 */}
          <div className="flex-1 text-center">
            <span className="text-base font-bold text-[#1a3a52] tracking-tight">휴대폰 설치</span>
          </div>

          {/* 우측: 햄버거 메뉴 */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="메뉴 열기"
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <Menu size={22} className="text-[#1a3a52]" />
          </button>
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
