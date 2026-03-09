/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";
import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao: any;
    confetti: any;
  }
}
type ConfettiFn = (options: {
  particleCount: number;
  spread: number;
  origin: { y: number };
  zIndex: number;
}) => void;

interface KakaoSize {}
interface KakaoPoint {}

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoLatLngBounds {
  extend(position: KakaoLatLng): void;
}

interface KakaoMap {
  setCenter(position: KakaoLatLng): void;
  setBounds(bounds: KakaoLatLngBounds): void;
}

interface KakaoMarker {
  setPosition(position: KakaoLatLng): void;
}

interface KakaoPolyline {
  getPath(): KakaoLatLng[];
  setMap(map: KakaoMap | null): void;
}

interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
}

interface KakaoMapsApi {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: {
    position: KakaoLatLng;
    map: KakaoMap | null;
    image?: unknown;
  }) => KakaoMarker;
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options?: { offset: KakaoPoint },
  ) => unknown;
  Size: new (width: number, height: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
  Polyline: new (options: {
    path: KakaoLatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
  }) => KakaoPolyline;
  LatLngBounds: new () => KakaoLatLngBounds;
  InfoWindow: new (options: {
    content: HTMLElement;
    removable: boolean;
  }) => KakaoInfoWindow;
  event: {
    addListener(target: unknown, eventName: string, handler: () => void): void;
  };
  load(callback: () => void): void;
}

type AppWindow = Window & {
  kakao: { maps: KakaoMapsApi };
  confetti?: ConfettiFn;
};

interface Shelter {
  name: string;
  lat: number;
  lng: number;
}

interface RouteStep {
  lat: number;
  lng: number;
  instruction: string;
}

interface NavigationState {
  myMarker: KakaoMarker | null;
  polyline: KakaoPolyline | null;
  routeSteps: RouteStep[];
  lastSpokenStep: number;
  watchId: number | null;
  isArrived: boolean;
  isRerouting: boolean;
  currentEndLat: number;
  currentEndLng: number;
  currentShelterName: string;
  openedInfowindows: KakaoInfoWindow[];
  selectedVoice: SpeechSynthesisVoice | null;
}

interface OsrmStep {
  distance: number;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

interface OsrmRoute {
  distance: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: OsrmStep[];
  }>;
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}
const appWindow =
  typeof window !== "undefined"
    ? (window as unknown as AppWindow)
    : ({} as AppWindow);

export default function MapNavigation() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<KakaoMap | null>(null);
  const [subtitle, setSubtitle] = useState<string>("주변 쉼터를 찾는 중...");
  const [fontSize, setFontSize] = useState<number>(20);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const state = useRef<NavigationState>({
    myMarker: null,
    polyline: null,
    routeSteps: [],
    lastSpokenStep: -1,
    watchId: null,
    isArrived: false,
    isRerouting: false,
    currentEndLat: 0,
    currentEndLng: 0,
    currentShelterName: "",
    openedInfowindows: [],
    selectedVoice: null,
  });

  const arrowImage =
    "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path fill='%233301fc' d='M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z'/></svg>";

  const loadVoices = () => {
    if (typeof window === 'undefined') return;
    const voices = window.speechSynthesis.getVoices();
    state.current.selectedVoice =
      voices.find((v) => v.name.includes("Google") && v.lang === "ko-KR") ||
      voices.find((v) => v.name.includes("Yuna") && v.lang === "ko-KR") ||
      voices.find((v) => v.lang === "ko-KR" || v.lang.includes("ko")) ||
      null;
  };

  const speak = (text: string) => {
    const formattedText = text.replace(/\. /g, ".<br>");
    setSubtitle(formattedText);
    if (typeof SpeechSynthesisUtterance === "undefined") return;
    window.speechSynthesis.cancel();
    const smoothText = text
      .replace(/미터/g, " 미터, ")
      .replace(/후/g, "후,    ")
      .replace(/세요./g, "세요.    ")
      .replace(/니다./g, "니다.    ");
    const msg = new SpeechSynthesisUtterance(smoothText);
    if (!state.current.selectedVoice) loadVoices();
    if (state.current.selectedVoice) msg.voice = state.current.selectedVoice;
    msg.lang = "ko-KR";
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
  };

  const getDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1000;
  };

  const startApp = () => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;
    setShowWelcome(false);
    const map = mapInstance.current;
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const locPos = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapInstance.current?.setCenter(locPos);
        if (!state.current.myMarker) {
          state.current.myMarker = new window.kakao.maps.Marker({
            position: locPos, 
            map: mapInstance.current,
            image: new window.kakao.maps.MarkerImage("https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", new window.kakao.maps.Size(35, 35))
          });
        }
        speak("내 위치를 확인했습니다. 가고 싶은 쉼터를 눌러보세요.");
      });
    }
  };

  const startTracking = () => {
    if (state.current.watchId) navigator.geolocation.clearWatch(state.current.watchId);
    state.current.watchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude: curLat, longitude: curLng } = pos.coords;
      const locPos = new window.kakao.maps.LatLng(curLat, curLng);

      if (state.current.myMarker) {
        state.current.myMarker.setPosition(locPos);
      } else {
        state.current.myMarker = new window.kakao.maps.Marker({
          position: locPos, map: mapInstance.current,
          image: new window.kakao.maps.MarkerImage(arrowImage, new window.kakao.maps.Size(40, 40), { offset: new window.kakao.maps.Point(20, 20) }),
        });
      }

      const distToFinal = getDistance(curLat, curLng, state.current.currentEndLat, state.current.currentEndLng);
      if (distToFinal < 20 && !state.current.isArrived) {
        state.current.isArrived = true;
        speak(`${state.current.currentShelterName}에 잘 도착하셨습니다. 안내를 종료합니다.`);
        if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10001 });
        navigator.geolocation.clearWatch(state.current?.watchId??0);
        return;
      }

      if (state.current.polyline && !state.current.isRerouting) {
        const path = state.current.polyline.getPath();
        let minDistance = Infinity;
        path.forEach((p) => {
          const d = getDistance(curLat, curLng, p.getLat(), p.getLng());
          if (d < minDistance) minDistance = d;
        });
        if (minDistance > 50) {
          state.current.isRerouting = true;
          speak("경로를 벗어났습니다. 현재 위치에서 다시 길을 찾습니다.");
          findRoute(state.current.currentEndLat, state.current.currentEndLng, state.current.currentShelterName);
          return;
        }

        if (state.current.polyline && !state.current.isRerouting) {
          const path = state.current.polyline.getPath();
          let minDistance = Infinity;
          path.forEach((p) => {
            const d = getDistance(curLat, curLng, p.getLat(), p.getLng());
            if (d < minDistance) minDistance = d;
          });
          if (minDistance > 50) {
            state.current.isRerouting = true;
            speak("경로를 벗어났습니다. 현재 위치에서 다시 길을 찾습니다.");
            findRoute(
              state.current.currentEndLat,
              state.current.currentEndLng,
              state.current.currentShelterName,
            );
            return;
          }}
        }

        for (let i = 0; i < state.current.routeSteps.length; i++) {
          if (i <= state.current.lastSpokenStep) continue;
          const step = state.current.routeSteps[i];
          if (getDistance(curLat, curLng, step.lat, step.lng) < 40) {
            state.current.lastSpokenStep = i;
            const nextStep = state.current.routeSteps[i + 1]
              ? ` 그 다음은 ${state.current.routeSteps[i + 1].instruction}`
              : "";
            speak(`이제 ${step.instruction}${nextStep}`);
            break;
          }
        }
      },
      null,
      { enableHighAccuracy: true },
    );
  };

  const findRoute = (endLat: number, endLng: number, shelterName: string) => {
    state.current.openedInfowindows.forEach((iw) => iw.close());
    state.current.openedInfowindows = [];
    if (state.current.watchId !== null) {
      navigator.geolocation.clearWatch(state.current.watchId);
      state.current.watchId = null;
    }
    if (state.current.polyline) {
      state.current.polyline.setMap(null);
      state.current.polyline = null;
    }
    state.current.lastSpokenStep = -1;
    state.current.routeSteps = [];
    state.current.isArrived = false;
    state.current.currentEndLat = endLat;
    state.current.currentEndLng = endLng;
    state.current.currentShelterName = shelterName;

    setSubtitle("새로운 경로를 계산 중입니다...");

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: startLat, longitude: startLng } = pos.coords;
      const url = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&continue_straight=true`;
      fetch(url).then((res) => res.json()).then((data) => {
        if (data.code === "Ok") {
          const route = data.routes[0];
          const linePath = route.geometry.coordinates.map((c: any) => new window.kakao.maps.LatLng(c[1], c[0]));
          state.current.polyline = new window.kakao.maps.Polyline({ path: linePath, strokeWeight: 8, strokeColor: "#3301fc", strokeOpacity: 0.8 });
          state.current.polyline?.setMap(mapInstance.current);
          route.legs[0].steps.forEach((step:any) => {
            const m = step.maneuver;
            if (m.modifier && (m.modifier.includes("u-turn") || m.modifier.includes("sharp"))) return;
            const dist = Math.round(step.distance);
            const stepText = m.type === "depart" ? "안내를 시작합니다. " : m.type === "arrive" ? "목적지 근처에 도착했습니다. " : `${dist > 10 ? dist + "미터 직진 후 " : ""}${m.modifier === "left" ? "왼쪽으로 꺾으세요" : m.modifier === "right" ? "오른쪽으로 꺾으세요" : "앞으로 이동하세요"}`;
            state.current.routeSteps.push({ lat: m.location[1], lng: m.location[0], instruction: stepText });
          });
          const bounds = new window.kakao.maps.LatLngBounds();
          linePath.forEach((p: any) => bounds.extend(p));
          mapInstance.current?.setBounds(bounds);
          if (!state.current.isRerouting) {
            const duration = Math.ceil(route.distance / 50);
            speak(`${shelterName}까지 안내를 시작합니다. 약 ${duration}분 정도 걸립니다.`);
          }
        }});
    });
  };

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      speak("인터넷 연결이 끊어졌습니다.");
    };
    const handleOnline = () => {
      setIsOffline(false);
      speak("인터넷이 다시 연결되었습니다.");
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=53573d8bf722b4bc75ea45fd95a4ed3c&libraries=services&autoload=false`;
    script.async = true;
    document.head.appendChild(script);
    

    // useEffect 내의 script.onload 부분
script.onload = () => {
  window.kakao.maps.load(() => {
    if (!mapContainer.current) return;
    
    // 1. 지도 인스턴스 생성
    mapInstance.current = new window.kakao.maps.Map(mapContainer.current, { 
      center: new window.kakao.maps.LatLng(37.5665, 126.978), 
      level: 4 
    });

    // 2. 데이터 가져오기 (성공했던 로직 그대로)
    fetch("https://3dt-1st-project-4th-fx-hbdzardjfyg9cgcq.koreacentral-01.azurewebsites.net/api/shelters")
      .then((res) => res.json())
      .then((data) => {
        console.log("데이터 확인:", data); // 마커가 안 뜨면 이걸 먼저 보세요!
        
        // 데이터가 배열인지 확인하고 마커 함수 호출
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          initMarkers(items);
        } else {
          console.warn("데이터가 비어있습니다.");
        }
      })
      .catch(err => console.error("API 로딩 실패:", err));
  });
};

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMarkers = (arr: any[]) => {
    if (!mapInstance.current || !window.kakao) return;
    
    arr.forEach((s: { name: string; lat: number; lng: number }) => {
      // ✅ [중요] 모든 좌표 생성에 new 키워드 적용
      const markerPosition = new window.kakao.maps.LatLng(s.lat, s.lng);
      const marker = new window.kakao.maps.Marker({ 
        position: markerPosition, 
        map: mapInstance.current 
      });

      const content = document.createElement("div");
      content.style.cssText = "padding:10px; font-size:14px; color:black; min-width:150px; background:white; border-radius:8px;";
      content.innerHTML = `<strong>${s.name}</strong><br><button id="nav-btn-${s.name.replace(/\s/g, "")}" style="margin-top:10px; cursor:pointer; width:100%; height:35px; background:#4CAF50; color:white; border:none; border-radius:5px; font-weight:bold;">🚶 길안내 시작</button>`;
      
      const infowindow = new window.kakao.maps.InfoWindow({ content: content, removable: true });
      
      window.kakao.maps.event.addListener(marker, "click", () => {
        if (!state.current.openedInfowindows.includes(infowindow)) {
          if (state.current.openedInfowindows.length >= 3) {
            const oldIw = state.current.openedInfowindows.shift();
            if (oldIw) oldIw.close();
          }
          infowindow.open(mapInstance.current, marker);
          state.current.openedInfowindows.push(infowindow);
          setTimeout(() => {
            const btn = document.getElementById(`nav-btn-${s.name.replace(/\s/g, "")}`);
            if (btn) btn.onclick = () => findRoute(s.lat, s.lng, s.name);
          }, 100);
        }
      });
    });
  };

  const isPlusDisabled = fontSize >= 36;
  const isMinusDisabled = fontSize <= 16;

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {showWelcome && (
        <div style={welcomeLayerStyle as any}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>🔊</div>
          <h1 style={{ fontSize: "30px" }}>반갑습니다!</h1>
          <p style={{ fontSize: "22px" }}>
            안내를 위해 <b>소리를 크게</b> 키워주세요.
          </p>
          <button onClick={startApp} style={confirmButtonStyle}>
            확인했습니다
          </button>
        </div>
      )}
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      <div style={uiWrapperStyle as any}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => speak(subtitle.replace(/<br>/g, ""))}
            style={buttonStyle}
          >
            🔄 다시듣기
          </button>
          <div style={{ display: "flex", gap: "5px" }}>
            <button
              onClick={() => setFontSize((f) => Math.min(36, f + 4))}
              disabled={isPlusDisabled}
              style={{
                ...subButtonStyle,
                backgroundColor: isPlusDisabled ? "#e0e0e0" : "white",
              }}
            >
              글자 +
            </button>
            <button
              onClick={() => setFontSize((f) => Math.max(16, f - 4))}
              disabled={isMinusDisabled}
              style={{
                ...subButtonStyle,
                backgroundColor: isMinusDisabled ? "#e0e0e0" : "white",
              }}
            >
              글자 -
            </button>
          </div>
        </div>
        <div
          style={{
            ...subtitleBoxStyle,
            fontSize: `${fontSize}px`,
            backgroundColor: isOffline
              ? "rgba(200, 0, 0, 0.9)"
              : "rgba(0, 0, 0, 0.85)",
          } as any}
        >
          <span dangerouslySetInnerHTML={{ __html: `🔊 ${subtitle}` }} />
        </div>
      </div>
    </div>
  );
}

// --- 스타일 정의 ---
const welcomeLayerStyle = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "white", zIndex: 10000,
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center",
};

const confirmButtonStyle = {
  marginTop: "30px", padding: "20px 50px", fontSize: "24px", background: "#4CAF50", color: "white",
  border: "none", borderRadius: "15px", fontWeight: "bold", cursor: "pointer",
};

const uiWrapperStyle = {
  position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "90%", zIndex: 999,
  display: "flex", flexDirection: "column", gap: "10px",
};

const buttonStyle = {
  padding: "12px", background: "#FF9800", color: "white", border: "none", borderRadius: "10px",
  fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
};

const subButtonStyle = {
  padding: "12px 18px", border: "1px solid #ccc", borderRadius: "10px", fontWeight: "bold", cursor: "pointer",
};

const subtitleBoxStyle = {
  color: "white", padding: "20px", borderRadius: "15px", textAlign: "center", minHeight: "80px", transition: "background 0.3s ease",
};
