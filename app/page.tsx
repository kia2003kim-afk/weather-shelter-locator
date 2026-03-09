"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PTYType = 0 | 1 | 2 | 3;

export default function WeatherShelterPage() {
  const router = useRouter();
  
  const [temp, setTemp] = useState(9);
  const [pty, setPty] = useState<PTYType>(0);
  const [showDetail, setShowDetail] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('userName');
    if (saved) setUserName(saved);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userName');
    setUserName(null);
  };

  // ✅ [변경] 날씨 상태별 배경 이미지 URL 설정
// ✅ [수정] 1초 만에 구분 가능한 초직관적 이미지
// ✅ [수정] 누가 봐도 해가 쨍쨍한, 강렬한 태양광과 새파란 하늘 이미지
const getBgImage = (p: PTYType) => {
    const images = {
      // ✅ 이제 public 폴더에 sunny.png, rain.png 등으로 저장하시면 됩니다.
      0: "/sunny.png",   // 화창함
      1: "/rain.png",    // 비
      2: "/snow.png",    // 눈
      3: "/cloudy.png",  // 흐림
    };
    return images[p];
  };

  const getStatusData = (t: number, p: PTYType) => {
    const ptyData = {
      0: { title: "화창함", icon: "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/clear-day.svg" },
      1: { title: "비", icon: "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/rain.svg" },
      2: { title: "눈", icon: "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/snow.svg" },
      3: { title: "흐림", icon: "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/cloudy.svg" },
    };

    let desc = "";
    if (t >= 33) desc = "극심한 폭염입니다! 야외 활동을 중단하세요.";
    else if (t >= 25) desc = "무더운 날씨입니다. 수분을 충분히 섭취하세요.";
    else if (t >= 15) desc = "활동하기 딱 좋은 날씨입니다.";
    else if (t >= 0)  desc = "쌀쌀한 날씨입니다. 옷차림에 신경 쓰세요.";
    else desc = "강력한 한파입니다! 체온 유지에 유의하세요.";

    return {
      title: ptyData[p].title,
      iconUrl: ptyData[p].icon,
      desc: desc
    };
  };

  const status = getStatusData(temp, pty);

  return (
    // ✅ [변경] 배경 이미지 적용 및 겹침 방지를 위해 overflow-hidden 추가
    <div 
      className="max-w-md mx-auto min-h-screen pb-24 font-sans text-gray-900 shadow-2xl relative flex flex-col transition-all duration-1000 bg-cover bg-center"
      style={{ backgroundImage: `url('${getBgImage(pty)}')` }}
    >
      {/* ✅ [추가] 배경 이미지 위에 어두운 레이어를 깔아 글씨 가독성 확보 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>

      {/* 모든 콘텐츠는 z-10으로 올려서 레이어 위에 보이게 함 */}
      <header className="relative flex items-center justify-center p-4 bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-20 h-16">
        <div className="absolute left-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">O</div>
        </div>
        <h1 className="font-black text-xl tracking-tight text-white">쉴라잡이</h1>
        <div className="absolute right-4 flex items-center gap-2">
          {userName && (
            <button onClick={handleLogout} className="text-[10px] px-2.5 py-1 bg-red-500/20 text-red-200 rounded-full border border-red-500/30 font-bold backdrop-blur-sm">
              로그아웃
            </button>
          )}
        </div>
      </header>

      {/* 메인 날씨 카드: 배경을 반투명하게 변경 */}
      <section className="relative z-10 m-4 p-6 rounded-3xl text-white shadow-2xl transition-all duration-700 bg-white/10 border border-white/20 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold">{status.title}</h2>
              <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Live</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-1">
              <button onClick={() => setTemp(temp - 5)} className="bg-white/20 px-2 py-1 rounded text-xs active:scale-95 transition hover:bg-white/30">-5°</button>
              <button onClick={() => setTemp(temp + 5)} className="bg-white/20 px-2 py-1 rounded text-xs active:scale-95 transition hover:bg-white/30">+5°</button>
            </div>
            <select
              value={pty} 
              onChange={(e) => setPty(Number(e.target.value) as PTYType)}
              className="bg-white/20 text-xs px-2 py-1 rounded text-white border border-white/10 outline-none appearance-none cursor-pointer"
            >
              <option value={0} className="text-gray-900">화창</option>
              <option value={1} className="text-gray-900">비</option>
              <option value={2} className="text-gray-900">눈</option>
              <option value={3} className="text-gray-900">흐림</option>
            </select>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-4">
          <h3 className="text-7xl font-light tracking-tighter">
            {temp}<span className="text-4xl ml-1">°C</span>
          </h3>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md p-2 shadow-inner">
            <img src={status.iconUrl} alt={status.title} className="w-full h-full object-contain" />
          </div>
        </div>

        <p className="mt-6 text-center text-white/90 text-sm font-medium leading-relaxed h-10">{status.desc}</p>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <WeatherInfoItem label="습도" value={pty === 1 ? "90%" : "45%"} icon="💧" />
          <WeatherInfoItem label="풍속" value={pty === 2 ? "6.5m/s" : "2.1m/s"} icon="🚩" />
          <WeatherInfoItem label="미세먼지" value="보통" icon="💨" />
          <button 
            onClick={() => setShowDetail(true)}
            className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/20 transition flex flex-col items-start"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-white/70 mb-1">
              <span>🔍</span> 상세보기
            </div>
            <div className="text-sm font-bold tracking-tight">내일 날씨 보기</div>
          </button>
        </div>

        {/* 그래프 섹션 */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-[11px] font-bold text-white/80 mb-4">일일 기온 변화</p>
          <div className="flex justify-between items-end h-16 px-1">
            {[temp-2, temp, temp+4, temp+6, temp+2, temp].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-1.5 bg-emerald-400/60 rounded-full transition-all duration-1000"
                  style={{ height: `${Math.max(10, ((h + 10) / 50) * 100)}%` }}
                ></div>
                <span className="text-[9px] text-white/60">{6 + i * 3}시</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 가까운 쉼터 찾기 버튼: 유리 같은 Glassmorphism 효과 */}
      <section className="relative z-10 px-4 mt-2 flex-1 flex flex-col mb-4">
        <button
          onClick={() => router.push('/map')}
          className="w-full flex-1 group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 active:scale-[0.98] transition-all duration-300 flex flex-col items-center justify-center"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500"></div>
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
              📍
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white tracking-tight">가까운 쉼터 찾기</h3>
              <p className="text-emerald-300 font-bold text-sm mt-1 uppercase tracking-widest">Find Nearest Shelter</p>
            </div>
          </div>
        </button>
      </section>

      {/* 하단 네비게이션: 배경 투명도 조절 */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/20 backdrop-blur-xl border-t border-white/10 flex justify-around py-3 z-30">
        <NavItem 
          label="긴급 전화" 
          icon="📞" 
          active={false} 
          onClick={() => window.location.href = 'tel:119'} 
          isEmergency={true}
        />
        <NavItem label="홈" icon="🏠" active={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <NavItem
          label={userName ? `${userName}` : "로그인"}
          icon="👤"
          active={!!userName}
          onClick={() => userName ? handleLogout() : router.push('/login')}
        />
      </nav>

      {/* 모달 창 생략 (기존과 동일) */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-lg w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">📅 내일 날씨 예보</h4>
            <div className="space-y-4 text-gray-800">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-medium">오전</span>
                <span className="font-bold text-blue-600 text-lg">10°C 💧</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-medium">오후</span>
                <span className="font-bold text-orange-600 text-lg">18°C ☁️</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">내일은 오전에 비가 예상되며 오후에는 흐린 날씨가 이어지겠습니다.</p>
            </div>
            <button
              onClick={() => setShowDetail(false)}
              className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 하위 컴포넌트: 배경에 맞춰 텍스트 가독성 조정
function WeatherInfoItem({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70 mb-1">
        <span>{icon}</span> {label}
      </div>
      <div className="text-xl font-bold tracking-tight text-white">{value}</div>
    </div>
  );
}

function NavItem({ label, icon, active, onClick, isEmergency }: { label: string, icon: string, active: boolean, onClick?: () => void, isEmergency?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 relative ${active ? 'text-emerald-300' : isEmergency ? 'text-red-400' : 'text-gray-300'}`}>
      {isEmergency && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      <span className="text-xl">{icon}</span>
      <span className={`text-[10px] font-bold ${isEmergency ? 'text-red-400' : ''}`}>{label}</span>
    </button>
  );
}