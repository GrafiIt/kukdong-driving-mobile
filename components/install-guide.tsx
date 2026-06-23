'use client';

import { useState, useEffect, useRef } from 'react';
import { Share, Plus, MoreVertical, Download } from 'lucide-react';

// PWA beforeinstallprompt 이벤트 타입 확장
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type GuideTab = 'none' | 'android' | 'iphone';

interface InstallGuideProps {
  onBack: () => void;
}

export function InstallGuide({ onBack }: InstallGuideProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('none');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [androidStatus, setAndroidStatus] = useState<'idle' | 'prompted' | 'accepted' | 'dismissed' | 'unavailable'>('idle');
  const promptCaptured = useRef(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      promptCaptured.current = true;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      setAndroidStatus('prompted');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setAndroidStatus(outcome === 'accepted' ? 'accepted' : 'dismissed');
      setDeferredPrompt(null);
    } else {
      setAndroidStatus('unavailable');
    }
  };

  const handleTabToggle = (tab: GuideTab) => {
    setActiveTab((prev) => (prev === tab ? 'none' : tab));
    if (tab === 'android') setAndroidStatus('idle');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 화면 제목 */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 text-balance">
          휴대폰 설치 안내
        </h2>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          홈 화면에 앱을 추가하면 더욱 빠르게 이용할 수 있습니다.
        </p>
      </div>

      {/* 스크롤 가능 본문 */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4">

        {/* ── 안드로이드 카드 ── */}
        <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* 카드 헤더 버튼 */}
          <button
            onClick={() => handleTabToggle('android')}
            className="w-full flex items-center gap-4 px-5 py-5 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-expanded={activeTab === 'android'}
          >
            {/* 안드로이드 아이콘 */}
            <div className="w-14 h-14 rounded-2xl bg-[#3ddc84]/10 flex items-center justify-center flex-shrink-0">
              <AndroidIcon />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-900 text-lg">안드로이드 설치</p>
              <p className="text-slate-500 text-sm mt-0.5">Chrome 브라우저 권장</p>
            </div>
            <div
              className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${
                activeTab === 'android' ? 'rotate-180' : ''
              }`}
            >
              <ChevronDownIcon />
            </div>
          </button>

          {/* 안드로이드 상세 패널 */}
          {activeTab === 'android' && (
            <div className="px-5 pb-6 pt-2 bg-slate-50 border-t border-slate-100 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                아래 버튼을 누르면 브라우저의 앱 설치 창이 나타납니다. 설치를 허용하면 홈 화면에 아이콘이 추가됩니다.
              </p>

              <button
                onClick={handleAndroidInstall}
                disabled={androidStatus === 'accepted'}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-[#3ddc84] hover:bg-[#32c472] active:bg-[#28a85e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm font-bold text-slate-900 text-base"
              >
                <Download size={20} />
                {androidStatus === 'accepted' ? '설치 완료!' : '앱 설치하기'}
              </button>

              {/* 상태 메시지 */}
              {androidStatus === 'unavailable' && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                  <p className="font-semibold text-amber-800 text-sm">설치 창을 열 수 없습니다</p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    다음 중 한 가지 이유일 수 있습니다.
                  </p>
                  <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
                    <li>이미 홈 화면에 설치되어 있음</li>
                    <li>Chrome 이외의 브라우저 사용 중</li>
                    <li>브라우저가 아직 설치 조건을 충족하지 못함</li>
                  </ul>
                  <p className="text-amber-700 text-sm leading-relaxed mt-1">
                    Chrome 주소창 오른쪽의 <strong>"설치"</strong> 아이콘을 직접 눌러 설치해 주세요.
                  </p>
                </div>
              )}
              {androidStatus === 'dismissed' && (
                <p className="text-center text-slate-500 text-sm">
                  설치를 취소했습니다. 언제든 다시 시도할 수 있습니다.
                </p>
              )}
              {androidStatus === 'accepted' && (
                <p className="text-center text-[#28a85e] font-semibold text-sm">
                  홈 화면에 앱이 추가되었습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 아이폰 카드 ── */}
        <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* 카드 헤더 버튼 */}
          <button
            onClick={() => handleTabToggle('iphone')}
            className="w-full flex items-center gap-4 px-5 py-5 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-expanded={activeTab === 'iphone'}
          >
            {/* 애플 아이콘 */}
            <div className="w-14 h-14 rounded-2xl bg-slate-900/5 flex items-center justify-center flex-shrink-0">
              <AppleIcon />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-slate-900 text-lg">아이폰 설치</p>
              <p className="text-slate-500 text-sm mt-0.5">Safari 브라우저 전용</p>
            </div>
            <div
              className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${
                activeTab === 'iphone' ? 'rotate-180' : ''
              }`}
            >
              <ChevronDownIcon />
            </div>
          </button>

          {/* 아이폰 단계별 가이드 패널 */}
          {activeTab === 'iphone' && (
            <div className="px-5 pb-6 pt-2 bg-slate-50 border-t border-slate-100 space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-blue-800 text-sm leading-relaxed">
                  아이폰은 Safari 브라우저에서만 홈 화면 추가가 가능합니다. 아래 단계를 따라 진행해 주세요.
                </p>
              </div>

              {/* Step 1 */}
              <IphoneStep
                step={1}
                title="Safari로 이 페이지 열기"
                description="반드시 Safari 브라우저에서 이 페이지에 접속하세요."
                icon={
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                    <SafariIcon />
                  </div>
                }
              />

              {/* Step 2 */}
              <IphoneStep
                step={2}
                title="하단 공유 버튼 탭"
                description="화면 하단 가운데의 공유(사각형+화살표) 버튼을 탭하세요."
                icon={
                  <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center">
                    <Share size={16} className="text-white" strokeWidth={2.5} />
                  </div>
                }
              />

              {/* Step 3 */}
              <IphoneStep
                step={3}
                title="'홈 화면에 추가' 선택"
                description="공유 메뉴를 아래로 스크롤하여 '홈 화면에 추가'를 탭하세요."
                icon={
                  <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Plus size={16} className="text-white" strokeWidth={2.5} />
                  </div>
                }
              />

              {/* Step 4 */}
              <IphoneStep
                step={4}
                title="'추가' 버튼 탭"
                description="앱 이름을 확인한 후 우측 상단의 '추가'를 탭하면 완료됩니다."
                icon={
                  <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckIcon />
                  </div>
                }
                isLast
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 단계별 가이드 아이템 컴포넌트 ── */
interface IphoneStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

function IphoneStep({ step, title, description, icon, isLast = false }: IphoneStepProps) {
  return (
    <div className="flex gap-4">
      {/* 세로 연결선 + 스텝 번호 */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
          {step}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 mt-1 min-h-4" />}
      </div>

      {/* 내용 */}
      <div className={`flex gap-3 ${isLast ? '' : 'pb-4'}`}>
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          <p className="text-slate-500 text-sm leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 인라인 SVG 아이콘들 ── */
function AndroidIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="안드로이드">
      <path
        d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-10.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM4 12c0-4.418 3.582-8 8-8s8 3.582 8 8v4H4v-4z"
        fill="none"
      />
      <path
        d="M6 9.5C6 7.015 8.686 5 12 5s6 2.015 6 4.5V16H6V9.5z"
        fill="#3ddc84"
      />
      <circle cx="9.5" cy="9" r="0.75" fill="white" />
      <circle cx="14.5" cy="9" r="0.75" fill="white" />
      <line x1="9" y1="4" x2="7.5" y2="2.5" stroke="#3ddc84" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="4" x2="16.5" y2="2.5" stroke="#3ddc84" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="3" y="10" width="1.5" height="4" rx="0.75" fill="#3ddc84" />
      <rect x="19.5" y="10" width="1.5" height="4" rx="0.75" fill="#3ddc84" />
      <rect x="8" y="15.5" width="1.5" height="3" rx="0.75" fill="#3ddc84" />
      <rect x="14.5" y="15.5" width="1.5" height="3" rx="0.75" fill="#3ddc84" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-label="애플">
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z"
        fill="#1d1d1f"
      />
      <path
        d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="#1d1d1f"
      />
    </svg>
  );
}

function SafariIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="Safari">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8l-2.5 5.5L8 16l2.5-5.5L16 8z" fill="white" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
