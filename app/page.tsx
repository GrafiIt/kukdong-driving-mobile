'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Menu, LogIn, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SlideMenu } from '@/components/slide-menu';
import { createClient } from '@/utils/supabase/client';

// ── 통합 인증 상수 ────────────────────────────────────────
const LOGIN_BASE_URL = 'https://payment.1004.help/auth/login';
const NEXT_URL = 'https://bestdriver.1004.help/';
// ─────────────────────────────────────────────────────────

interface MenuItemProps {
  title: string;
}

// 로그인 안내 모달 컴포넌트
function LoginRequiredModal({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* 딤 처리 배경 */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* 상단 강조 바 */}
        <div className="h-1.5 w-full bg-slate-700" />

        <div className="px-7 pt-8 pb-7">
          {/* 아이콘 */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <LogIn size={28} className="text-slate-700" strokeWidth={2} />
            </div>
          </div>

          {/* 제목 */}
          <h2
            id="login-modal-title"
            className="text-center text-lg font-bold text-slate-900 mb-2 text-balance"
          >
            로그인이 필요한 서비스입니다
          </h2>

          {/* 설명 */}
          <p className="text-center text-sm text-slate-500 leading-relaxed mb-7 text-pretty">
            로그인 페이지로 이동하시겠습니까?
          </p>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              아니오
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-2xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-600 active:bg-slate-800 transition-colors shadow-md"
            >
              네, 이동합니다
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const driverName = '이윤상';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  const menuItems: MenuItemProps[] = [
    { title: '일일점검\n체크리스트' },
    { title: '운행일보' },
    { title: '운전자\n그룹웨어' },
    { title: '여정관리' },
  ];

  // ── 페이지 진입 시 세션 확인 ──────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;
      setIsAuthenticated(hasSession);
      if (!hasSession) {
        setShowLoginModal(true);
      }
    };
    checkSession();
  }, []);

  // ── 통합 로그인 URL 생성 ──────────────────────────────────
  const buildLoginUrl = useCallback(() => {
    const url = new URL(LOGIN_BASE_URL);
    url.searchParams.set('next', NEXT_URL);
    return url.toString();
  }, []);

  // ── 모달 확인(예) 처리 ────────────────────────────────────
  const handleLoginConfirm = () => {
    window.location.href = buildLoginUrl();
  };

  // ── 모달 취소(아니오) 처리 ────────────────────────────────
  const handleLoginCancel = () => {
    setShowLoginModal(false);
  };

  // ── 메뉴 버튼 클릭 처리 ──────────────────────────────────
  // 로그인 상태가 아니면 클릭 시 다시 로그인 안내 팝업 표시
  const handleMenuClick = (title: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (title === '일일점검\n체크리스트') {
      router.push('/checklist');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-hidden">

      {/* ── 상단 내비게이션 바 ── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2 flex-shrink-0">
        {/* 좌측 여백 */}
        <div className="min-w-[100px]" />

        {/* 중앙 여백 */}
        <div className="flex-1" />

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
      </main>

      {/* ── 슬라이드 메뉴 ── */}
      <SlideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        onRequireLogin={() => setShowLoginModal(true)}
      />

      {/* ── 로그인 안내 모달 ── */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onConfirm={handleLoginConfirm}
        onCancel={handleLoginCancel}
      />
    </div>
  );
}
