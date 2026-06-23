'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { SlideMenu } from '@/components/slide-menu';
import { InstallGuide } from '@/components/install-guide';

type Screen = 'dashboard' | 'install';

interface MenuItemProps {
  title: string;
}

export default function Dashboard() {
  const driverName = '이윤상';
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: MenuItemProps[] = [
    { title: '일일점검\n체크리스트' },
    { title: '운행일보' },
    { title: '운전자\n그룹웨어' },
    { title: '여정관리' },
  ];

  const handleMenuClick = (title: string) => {
    console.log(`${title} 클릭됨`);
  };

  const screenTitle: Record<Screen, string> = {
    dashboard: '',
    install: '휴대폰 설치',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      {/* 모바일 컨테이너 */}
      <div className="relative w-full max-w-md min-h-screen bg-white rounded-3xl shadow-lg border-4 border-gray-200 flex flex-col overflow-hidden">

        {/* ── 상단 내비게이션 바 ── */}
        <header className="flex items-center justify-between px-5 pt-6 pb-2 flex-shrink-0">
          {/* 좌측: 홈으로 돌아가기 (대시보드가 아닐 때만 표시) */}
          <div className="min-w-[100px]">
            {currentScreen !== 'dashboard' ? (
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 active:text-slate-700 transition-colors py-2 pr-3"
                aria-label="홈으로 돌아가기"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
                <span className="text-sm font-semibold">홈으로</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          {/* 중앙: 화면 제목 (대시보드가 아닐 때) */}
          <div className="flex-1 text-center">
            {currentScreen !== 'dashboard' && (
              <span className="text-base font-bold text-slate-700">
                {screenTitle[currentScreen]}
              </span>
            )}
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

        {/* ── 메인 콘텐츠 영역 ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 대시보드 화면 */}
          {currentScreen === 'dashboard' && (
            <div className="flex flex-col flex-1">
              {/* 환영 메시지 */}
              <div className="px-6 pt-4 pb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                  {`${driverName} 기사님`}
                  <br />
                  반갑습니다
                </h1>
              </div>

              {/* 메인 메뉴 그리드 */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleMenuClick(item.title)}
                      className="aspect-square bg-slate-700 hover:bg-slate-600 rounded-3xl text-white font-bold text-center flex items-center justify-center transition-colors duration-200 text-lg leading-tight whitespace-pre-line shadow-md hover:shadow-lg"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 하단 로고 */}
              <div className="px-6 mt-8 mb-8 flex justify-center bg-white">
                <div className="relative w-40 h-20">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CI-xGa6dl9UPtCj0HlksYN7m8CxfoLiFy.png"
                    alt="휴먼로지텍 로고"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          )}

          {/* 설치 안내 화면 */}
          {currentScreen === 'install' && (
            <InstallGuide onBack={() => setCurrentScreen('dashboard')} />
          )}
        </main>

        {/* ── 슬라이드 메뉴 ── */}
        <SlideMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={(screen) => setCurrentScreen(screen as Screen)}
        />
      </div>
    </div>
  );
}
