"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
 
// 1. PTY 변수 타입 정의 (0: 화창, 1: 비, 2: 눈, 3: 흐림)
type PTYType = 0 | 1 | 2 | 3;
 
export default function WeatherShelterPage() {
  const router = useRouter();
  const [temp, setTemp] = useState(9);
  const [pty, setPty] = useState<PTYType>(0);
  const [showDetail, setShowDetail] = useState(false);

  // ✅ 로그인 상태
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    const saved = sessionStorage.getItem('userName');
    if (saved) setUserName(saved);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('userName');
    setUserName(null);
  };
 
  // 온도별 배경색 설정
  const getBgColor = (t: number) => {
    if (t >= 33) return "from-red-600 to-red-800";
    if (t >= 25) return "from-orange-400 to-red-500";
    if (t >= 15) return "from-green-600 to-emerald-700";
    if (t >= 0)  return "from-cyan-400 to-blue-500";
    return "from-blue-700 to-indigo-900";
  };
 
  // PTY와 온도를 조합하여 상세 데이터 반환
  const getStatusData = (t: number, p: PTYType) => {
    const ptyData = {
      0: { title: "화창함", icon: "https://cdn-icons-png.flaticon.com/128/869/869869.png" },
      1: { title: "비", icon: "https://cdn-icons-png.flaticon.com/128/3313/3313888.png" },
      2: { title: "눈", icon: "https://cdn-icons-png.flaticon.com/128/2315/2315302.png" },
      3: { title: "흐림", icon: "https://cdn-icons-png.flaticon.com/128/1146/1146869.png" },
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
    <div className="max-w-md mx-auto bg-emerald-50 min-h-screen pb-24 font-sans text-gray-900 shadow-2xl relative">
     
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center p-4 bg-white/95 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">O</div>
          <h1 className="font-bold text-lg">쉴라잡이</h1>
        </div>
        {/* ✅ 로그인 상태에 따라 버튼 변경 */}
        {userName ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">{userName}님 👋</span>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-full border border-red-200 font-bold">
              로그아웃
            </button>
          </div>
        ) : (
          <button onClick={() => router.push('/login')} className="text-xs px-4 py-2 bg-green-600 text-white rounded-full font-bold">
            로그인
          </button>
        )}
      </header>
 
      {/* 메인 날씨 카드 */}
      <section className={`m-4 p-6 rounded-3xl text-white shadow-lg transition-all duration-700 bg-gradient-to-br ${getBgColor(temp)}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold">{status.title}</h2>
              <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Live</span>
            </div>
          </div>
         
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-1">
              <button onClick={() => setTemp(temp - 5)} className="bg-white/20 px-2 py-1 rounded text-xs active:scale-95 transition">-5°</button>
              <button onClick={() => setTemp(temp + 5)} className="bg-white/20 px-2 py-1 rounded text-xs active:scale-95 transition">+5°</button>
            </div>
            <select
              value={pty}
              onChange={(e) => setPty(Number(e.target.value) as PTYType)}
              className="bg-white/20 text-xs px-2 py-1 rounded text-white border-none outline-none appearance-none cursor-pointer"
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
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm p-3">
            <img src={status.iconUrl} alt={status.title} className="w-full h-full object-contain" />
          </div>
        </div>
 
        <p className="mt-6 text-center text-white/90 text-sm leading-relaxed h-10">{status.desc}</p>
 
        <div className="grid grid-cols-2 gap-3 mt-8">
          <WeatherInfoItem label="습도" value={pty === 1 ? "90%" : "45%"} icon="💧" />
          <WeatherInfoItem label="풍속" value={pty === 2 ? "6.5m/s" : "2.1m/s"} icon="🚩" />
          <WeatherInfoItem label="미세먼지" value="보통" icon="💨" />
          <button
            onClick={() => setShowDetail(true)}
            className="bg-white/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/30 transition flex flex-col items-start"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-white/70 mb-1">
              <span>🔍</span> 상세보기
            </div>
            <div className="text-sm font-bold tracking-tight">내일 날씨 보기</div>
          </button>
        </div>
 
        {/* 그래프 섹션 */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-[11px] font-bold text-white/80 mb-4">일일 기온 변화</p>
          <div className="flex justify-between items-end h-16 px-1">
            {[temp-2, temp, temp+4, temp+6, temp+2, temp].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-1.5 bg-white/60 rounded-full transition-all duration-1000"
                  style={{ height: `${((h + 10) / 50) * 100}%` }}
                ></div>
                <span className="text-[9px] text-white/60">{6 + i * 3}시</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 📍 [수정된 메인 버튼] 큼직한 버튼 섹션 */}
      <section className="px-4 mt-12 mb-12">
        <button
          className="w-full group relative overflow-hidden bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(16,185,129,0.15)] border-2 border-emerald-100 active:scale-[0.98] transition-all duration-300"
        >
          {/* 배경 꾸미기용 원형 요소 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 opacity-50"></div>
         
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform duration-300">
              📍
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">가까운 쉼터 찾기</h3>
              <p className="text-emerald-600 font-bold text-sm mt-1 uppercase tracking-widest">Find Nearest Shelter</p>
            </div>
          </div>
        </button>
      </section>
 
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-emerald-100 flex justify-around py-3">
        <NavItem label="지도" icon="🗺️" active={false} onClick={() => alert("지도 준비 중")} />
        <NavItem label="홈" icon="🏠" active={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <NavItem
          label={userName ? `${userName}` : "로그인"}
          icon="👤"
          active={!!userName}
          onClick={() => userName ? handleLogout() : router.push('/login')}
        />
      </nav>
 
      {/* 내일 날씨 모달 창 */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">📅 내일 날씨 예보</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">오전</span>
                <span className="font-bold text-blue-500 text-lg">10°C 💧</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">오후</span>
                <span className="font-bold text-orange-500 text-lg">18°C ☁️</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">내일은 오전에 비가 예상되며 오후에는 흐린 날씨가 이어지겠습니다.</p>
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
 
// --- 하위 컴포넌트 ---
function WeatherInfoItem({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70 mb-1">
        <span>{icon}</span> {label}
      </div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
 
function NavItem({ label, icon, active, onClick }: { label: string, icon: string, active: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 ${active ? 'text-green-700' : 'text-gray-400'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}