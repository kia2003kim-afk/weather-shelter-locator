"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PTYType = 0 | 1 | 2 | 3;

const BASE_URL = "https://3dt-1st-project-4th-fx-hbdzardjfyg9cgcq.koreacentral-01.azurewebsites.net/api";

const SEOUL_DISTRICTS = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구',
];

// ✅ 추가: 꺾은선 그래프 컴포넌트
function TempLineChart({ points }: { points: { label: string; temp: number }[] }) {
  if (!points || points.length < 2) return null;

  const width = 280;
  const height = 90;
  const paddingX = 24;
  const paddingY = 22;

  const temps = points.map((p) => p.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp || 1;

  const toX = (i: number) =>
    paddingX + (i / (points.length - 1)) * (width - paddingX * 2);
  const toY = (t: number) =>
    paddingY + ((maxTemp - t) / range) * (height - paddingY * 2);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.temp)}`)
    .join(" ");

  const fillD =
    pathD +
    ` L ${toX(points.length - 1)} ${height} L ${toX(0)} ${height} Z`;

  return (
    <div className="mt-5 px-1">
      <p className="text-xs text-white font-bold mb-3 tracking-wider">
        📈 일일 체감 온도 변화
      </p>
      <div className="bg-black/30 rounded-2xl px-3 pt-3 pb-5 border border-white/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(52,211,153,0.45)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.02)" />
            </linearGradient>
          </defs>

          <path d={fillD} fill="url(#tempGrad)" />

          <path
            d={pathD}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => {
            const cx = toX(i);
            const cy = toY(p.temp);
            const isFirst = i === 0;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={isFirst ? 9 : 7} fill="rgba(52,211,153,0.15)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isFirst ? 5.5 : 4}
                  fill={isFirst ? "#34d399" : "#6ee7b7"}
                  stroke="white"
                  strokeWidth="1.5"
                />
                {/* 그림자 텍스트 */}
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="rgba(0,0,0,0.5)" dx="0.5" dy="0.5">{p.temp}°</text>
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{p.temp}°</text>
                <text x={cx} y={height + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.75)">{p.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function WeatherShelterPage() {
  const router = useRouter();
  
  const [temp, setTemp] = useState(0);
  const [pty, setPty] = useState<PTYType>(0);
  const [humi, setHumi] = useState("--");
  const [wind, setWind] = useState("--");
  const [airGrade, setAirGrade] = useState("--");
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [tomorrowData, setTomorrowData] = useState<any[]>([]);
  const [tomorrowLoading, setTomorrowLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  
  const [region, setRegion] = useState("종로구");
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // ✅ 추가: 4시간 기온 변화 데이터
  const [chartPoints, setChartPoints] = useState<{ label: string; temp: number }[]>([]);

  // 로그인 유저 정보 + 유저 주소로 지역구 설정
  useEffect(() => {
    const saved = sessionStorage.getItem('userName');
    const savedUserId = sessionStorage.getItem('userId');
    if (saved) setUserName(saved);

    if (savedUserId) {
      fetch(`${BASE_URL}/user/address?userid=${savedUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            const match = data.address.match(/(\S+구)/);
            if (match) setRegion(match[1]);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 현재 날씨 API 호출
  useEffect(() => {
    const fetchCurrent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/env/current?district=${encodeURIComponent(region)}`);
        if (!res.ok) throw new Error("API 오류");
        const data = await res.json();
        setTemp(Math.round(data.temp ?? 0));
        setPty((data.pty ?? 0) as PTYType);
        setHumi(data.humi !== undefined ? `${data.humi}%` : "--");
        setWind(data.wind !== undefined ? `${data.wind}m/s` : "--");
        setAirGrade(data.air_grade ?? "--");
      } catch (e) {
        console.error("날씨 데이터 불러오기 실패", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrent();
  }, [region]);

  // ✅ 추가: today API로 현재 시간 기준 4시간 기온 변화 가져오기
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`${BASE_URL}/weather/today?district=${encodeURIComponent(region)}`);
        if (!res.ok) return;
        const data = await res.json();
        const forecasts: any[] = data.forecasts ?? [];

        const now = new Date();
        const currentHour = now.getHours();

        const target = forecasts
          .filter((f) => f.fcst_time && f.temp !== undefined)
          .sort((a, b) => parseInt(a.fcst_time) - parseInt(b.fcst_time))
          .filter((f) => parseInt(f.fcst_time.slice(0, 2)) >= currentHour)
          .slice(0, 4);

        if (target.length >= 2) {
          setChartPoints(
            target.map((f) => ({
              label: `${parseInt(f.fcst_time.slice(0, 2))}시`,
              temp: Math.round(f.temp),
            }))
          );
        }
      } catch (e) {
        // 에러 시 차트 미표시
      }
    };
    fetchForecast();
  }, [region]);

  // 내일 날씨 API 호출 (모달 열릴 때만)
  useEffect(() => {
    if (!showDetail) return;
    const fetchTomorrow = async () => {
      setTomorrowLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/weather/tomorrow?district=${encodeURIComponent(region)}`);
        if (!res.ok) throw new Error("API 오류");
        const data = await res.json();
        setTomorrowData(data.forecasts ?? []);
      } catch (e) {
        console.error("내일 날씨 불러오기 실패", e);
      } finally {
        setTomorrowLoading(false);
      }
    };
    fetchTomorrow();
  }, [showDetail, region]);

  const handleLogout = () => {
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userId');
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
              <h2 className="text-3xl font-bold">{loading ? "로딩 중..." : status.title}</h2>
              <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider text-white">Live</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowRegionPicker(true)}
            className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/20 transition active:scale-95"
          >
            <span className="text-[10px]">📍</span>
            <span className="text-sm font-black tracking-tight text-white/90">{region}</span>
            <span className="text-[10px] text-white/50">▼</span>
          </button>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-4">
          <h3 className={`text-7xl font-light tracking-tighter transition-colors duration-500 ${textColor}`}>
            {loading ? "--" : temp}<span className="text-4xl ml-1">°C</span>
          </h3>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md p-2 shadow-inner">
            <img src={status.iconUrl} alt={status.title} className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="mt-6 px-4 py-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-500">
          <p className={`text-center text-sm font-semibold leading-relaxed ${textColor}`}>
            {loading ? "날씨 정보를 불러오는 중..." : status.desc}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <WeatherInfoItem label="습도" value={loading ? "--" : humi} icon="💧" />
          <WeatherInfoItem label="풍속" value={loading ? "--" : wind} icon="🚩" />
          <WeatherInfoItem label="미세먼지" value={loading ? "--" : airGrade} icon="💨" />
          
          <button 
            onClick={() => setShowDetail(true)} 
            className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col items-start transition hover:bg-white/20 active:scale-95"
          >
            <div className="text-[11px] text-white/70 mb-1">🔍 상세보기</div>
            <div className="text-sm font-bold text-white">내일 날씨 보기</div>
          </button>
        </div>

        {/* ✅ 추가: 꺾은선 그래프 */}
        {!loading && chartPoints.length >= 2 && (
          <div className="mt-2 px-1 pt-4 border-t border-white/10">
            <TempLineChart points={chartPoints} />
          </div>
        )}
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

      {showRegionPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 w-full max-w-md rounded-t-3xl p-6 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">📍 지역구 선택</h3>
              <button onClick={() => setShowRegionPicker(false)} className="text-2xl text-white/50 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pb-2">
              {SEOUL_DISTRICTS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setRegion(d); setShowRegionPicker(false); }}
                  className={`py-2.5 px-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                    region === d
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-950 border border-white/10 w-full max-w-md rounded-t-3xl text-white shadow-2xl flex flex-col" style={{maxHeight: '85vh'}}>
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-2xl font-black">내일 날씨</h3>
                <p className="text-sm text-white/50 mt-0.5">📍 {region}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl text-white/70 hover:bg-white/20">✕</button>
            </div>

            {tomorrowLoading ? (
              <div className="text-center py-16 text-white/50 text-lg">불러오는 중...</div>
            ) : tomorrowData.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <div className="text-lg text-white/60">아직 내일 예보가 없습니다</div>
                <div className="text-sm mt-2 text-white/30">잠시 후 다시 확인해주세요</div>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                {tomorrowData
                  .filter((_, i) => i % 3 === 0)
                  .map((f, i) => {
                    const hour = parseInt(f.fcst_time?.slice(0, 2) ?? "0");
                    const isAM = hour < 12;
                    const displayHour = hour === 0 ? "자정" : hour === 12 ? "정오" : `${isAM ? "오전" : "오후"} ${isAM ? hour : hour - 12}시`;
                    const ptyIconUrl = [
                      "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/clear-day.svg",
                      "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/rain.svg",
                      "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/snow.svg",
                      "https://raw.githubusercontent.com/basmilius/weather-icons/dev/design/fill/final/cloudy.svg",
                    ][f.pty ?? 0];
                    const ptyLabel = ["맑음", "비", "눈", "흐림"][f.pty ?? 0] ?? "맑음";
                    const isWarm = f.temp >= 25;
                    const isCold = f.temp <= 0;
                    const tempColor = isWarm ? "text-orange-400" : isCold ? "text-blue-300" : "text-white";
                    const bgColor = isWarm ? "bg-orange-500/10 border-orange-500/20" : isCold ? "bg-blue-500/10 border-blue-500/20" : "bg-white/5 border-white/10";

                    return (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${bgColor}`}>
                        <div className="w-16 shrink-0">
                          <div className="text-base font-black text-white">{displayHour}</div>
                        </div>
                        <div className="w-10 h-10 shrink-0">
                          <img src={ptyIconUrl} alt={ptyLabel} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <div className={`text-2xl font-black ${tempColor}`}>{f.temp}°C</div>
                          <div className="text-sm text-white/50">{ptyLabel}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-sky-300">🌂 {f.pop ?? 0}%</div>
                          <div className="text-xs text-white/40 mt-0.5">{f.rain ?? "강수없음"}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="px-6 pb-6 pt-3 shrink-0">
              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-4 bg-emerald-500 rounded-2xl text-lg font-black active:scale-95 transition"
              >
                확인
              </button>
            </div>
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