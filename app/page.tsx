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
  
  // ✅ [추가] 지역구 상태 관리 (초기값: 종로구)
  const [region, setRegion] = useState("종로구");

  useEffect(() => {
    const saved = sessionStorage.getItem('userName');
    if (saved) setUserName(saved);
    
    // 실제 환경에서는 여기서 GPS나 설정을 통해 '영등포구' 등으로 업데이트 가능합니다.
    // setRegion("영등포구"); 
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userName');
    setUserName(null);
  };

  const getTextColor = (t: number) => {
    if (t >= 33) return "text-red-400";
    if (t <= -10) return "text-blue-300";
    return "text-white";
  };

  const getCardBgColor = (t: number) => {
    if (t >= 33) return "bg-red-900/60 border-red-500/50";
    if (t <= -10) return "bg-blue-900/60 border-blue-500/50";
    return "bg-white/10 border-white/20";
  };

  const getBgImage = (p: PTYType) => {
    const images = {
      0: "/sunny.png", 1: "/rain.png", 2: "/snow.png", 3: "/cloudy.png",
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
    if (t >= 33) desc = "⚠️ 극심한 폭염! 즉시 실내 또는 냉방 쉼터로 이동하세요.";
    else if (t <= -10) desc = "⚠️ 기록적 한파! 즉시 실내 또는 난방 쉼터로 이동하세요.";
    else if (t >= 25) desc = "무더운 날씨입니다. 수분을 충분히 섭취하세요.";
    else if (t >= 15) desc = "활동하기 딱 좋은 날씨입니다.";
    else desc = "쌀쌀한 날씨입니다. 옷차림에 신경 쓰세요.";

    return { title: ptyData[p].title, iconUrl: ptyData[p].icon, desc: desc };
  };

  const status = getStatusData(temp, pty);
  const textColor = getTextColor(temp);
  const cardStyle = getCardBgColor(temp);

  return (
    <div 
      className="max-w-md mx-auto min-h-screen pb-24 font-sans text-gray-900 shadow-2xl relative flex flex-col transition-all duration-1000 bg-cover bg-center"
      style={{ backgroundImage: `url('${getBgImage(pty)}')` }}
    >
      <div className="absolute inset-0 z-0 backdrop-blur-[1px] bg-black/20"></div>

      <header className="relative flex items-center justify-center p-4 bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-20 h-16">
        <div className="absolute left-4 flex items-center gap-2">
          <img src="/logo.png" alt="로고" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="font-black text-xl tracking-tight text-white">쉴라잡이</h1>
        <div className="absolute right-4">
          {userName && (
            <button onClick={handleLogout} className="text-[10px] px-2.5 py-1 bg-red-500/20 text-red-200 rounded-full border border-red-500/30 font-bold">
              로그아웃
            </button>
          )}
        </div>
      </header>

      {temp >= 33 && (
        <div className="relative z-20 text-center py-1.5 bg-red-600/30 animate-pulse border-b border-red-500/30">
          <span className="text-[10px] font-black text-red-200 uppercase">🔥 폭염주의!</span>
        </div>
      )}
      {temp <= -10 && (
        <div className="relative z-20 text-center py-1.5 bg-blue-600/30 animate-pulse border-b border-blue-500/30">
          <span className="text-[10px] font-black text-blue-100 uppercase">❄️ 한파주의!</span>
        </div>
      )}

      <section className={`relative z-10 m-4 p-6 rounded-3xl text-white shadow-2xl transition-all duration-700 backdrop-blur-md border ${cardStyle}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold">{status.title}</h2>
              <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider text-white">Live</span>
            </div>
          </div>
          
          {/* ✅ [추가] 오른쪽 상단 지역구 표시 디자인 */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            <span className="text-[10px]">📍</span>
            <span className="text-xs font-black tracking-tight text-white/90">{region}</span>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-4">
          <h3 className={`text-7xl font-light tracking-tighter transition-colors duration-500 ${textColor}`}>
            {temp}<span className="text-4xl ml-1">°C</span>
          </h3>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md p-2 shadow-inner">
            <img src={status.iconUrl} alt={status.title} className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="mt-6 px-4 py-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-500">
          <p className={`text-center text-sm font-semibold leading-relaxed ${textColor}`}>
            {status.desc}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <WeatherInfoItem label="습도" value={pty === 1 ? "90%" : "45%"} icon="💧" />
          <WeatherInfoItem label="풍속" value={pty === 2 ? "6.5m/s" : "2.1m/s"} icon="🚩" />
          <WeatherInfoItem label="미세먼지" value="보통" icon="💨" />
          
          <button 
            onClick={() => setShowDetail(true)} 
            className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col items-start transition hover:bg-white/20 active:scale-95"
          >
            <div className="text-[11px] text-white/70 mb-1">🔍 상세보기</div>
            <div className="text-sm font-bold text-white">내일 날씨 보기</div>
          </button>
        </div>
      </section>

      <section className="relative z-10 px-4 mt-2 flex-1 flex flex-col mb-4">
        <button
          onClick={() => router.push('/map')}
          className="w-full flex-1 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center shadow-xl"
        >
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg mb-4 ${temp >= 33 ? 'bg-red-500' : temp <= -10 ? 'bg-blue-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>📍</div>
          <h3 className="text-2xl font-black text-white tracking-tight">가까운 쉼터 찾기</h3>
          <p className="text-emerald-300 font-bold text-sm mt-1 uppercase tracking-widest text-white/80">Find Nearest Shelter</p>
        </button>
      </section>

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 w-full max-w-sm rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">내일 날씨 예보</h3>
              <button onClick={() => setShowDetail(false)} className="text-2xl text-white/50 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                <span>오전 (09:00)</span>
                <span className="font-bold text-emerald-400">18°C / 화창</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                <span>오후 (14:00)</span>
                <span className="font-bold text-orange-400">24°C / 흐림</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                <span>저녁 (20:00)</span>
                <span className="font-bold text-blue-400">15°C / 맑음</span>
              </div>
            </div>
            <button 
              onClick={() => setShowDetail(false)}
              className="w-full mt-8 py-4 bg-emerald-500 rounded-2xl font-bold active:scale-95 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/20 backdrop-blur-xl border-t border-white/10 flex justify-around py-3 z-30">
        <NavItem label="긴급 전화" icon="📞" active={false} isEmergency={true} onClick={() => window.location.href = 'tel:119'} />
        <NavItem label="홈" icon="🏠" active={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <NavItem label={userName ? `${userName}` : "로그인"} icon="👤" active={!!userName} onClick={() => userName ? handleLogout() : router.push('/login')} />
      </nav>
    </div>
  );
}

function WeatherInfoItem({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
      <div className="text-[11px] text-white/70 mb-1">{icon} {label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function NavItem({ label, icon, active, isEmergency, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all active:scale-90 ${active ? 'text-emerald-300' : isEmergency ? 'text-red-400' : 'text-gray-300'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}