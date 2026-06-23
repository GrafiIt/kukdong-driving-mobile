'use client';

import Image from 'next/image';

interface MenuItemProps {
  title: string;
  href?: string;
}

export default function Dashboard() {
  // 운전자 이름 - DB 연동 시 변수로 변경
  const driverName = '이윤상';

  // 메뉴 항목들
  const menuItems: MenuItemProps[] = [
    { title: '일일점검\n체크리스트' },
    { title: '운행일보' },
    { title: '운전자\n그룹웨어' },
    { title: '여정관리' },
  ];

  const handleMenuClick = (title: string) => {
    console.log(`${title} 클릭됨`);
    // 향후 페이지 이동 로직 추가
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      {/* 모바일 컨테이너 */}
      <div className="w-full max-w-md min-h-screen bg-white rounded-3xl shadow-lg border-4 border-gray-200 flex flex-col overflow-hidden">
        {/* 상단 환영 메시지 */}
        <div className="px-6 pt-8 pb-6">
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

        {/* 하단 로고 구역 */}
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
    </div>
  );
}
