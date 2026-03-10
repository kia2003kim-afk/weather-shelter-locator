'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

// ✅ 서울 25개 구 목록
const SEOUL_DISTRICTS = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구',
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ userid: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    userid: '', password: '', name: '', address: '', birthyear: ''
  });

  

  // ✅ /api/login 호출 → function_app.py의 login 함수
  const handleLogin = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const hashedPw = await sha256(loginForm.password);

      const res = await fetch('https://3dt-1st-project-4th-fx-hbdzardjfyg9cgcq.koreacentral-01.azurewebsites.net/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( {userid: loginForm.userid, password: hashedPw }),
      });
      const data = await res.json();

      if (res.ok && data.username) {
        sessionStorage.setItem('userName', data.username);
        sessionStorage.setItem('userId', loginForm.userid);
        setSuccess(`${data.username}님, 환영합니다! 🎉`);
        setTimeout(() => router.push('/'), 1200);
      } else {
        setError(data.detail || '아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  // ✅ /api/signup 호출 → function_app.py의 signup 함수
  const handleSignup = async () => {
    setError(''); setSuccess(''); setLoading(true);
    if (!signupForm.userid || !signupForm.password || !signupForm.name) {
      setError('아이디, 비밀번호, 이름은 필수입니다.');
      setLoading(false);
      return;
    }
    signupForm.password = await sha256(signupForm.password);
    try {
      const res = await fetch('https://3dt-1st-project-4th-fx-hbdzardjfyg9cgcq.koreacentral-01.azurewebsites.net/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('가입 완료! 로그인해주세요.');
        setMode('login');
        setLoginForm({ userid: signupForm.userid, password: '' });
      } else {
        setError(data.detail || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrapper}>
      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.push('/')}>← 뒤로</button>
        <div style={s.headerTitle}>쉴라잡이</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={s.content}>
        {/* 로고 */}
        <div style={s.logoArea}>
          <div style={s.logoIcon}>🏠</div>
          <div style={s.logoText}>어르신 안심 쉼터</div>
          <div style={s.logoSub}>실시간 도보 길안내 서비스</div>
        </div>

        {/* 로그인 / 회원가입 탭 */}
        <div style={s.tabs}>
          <button
            style={mode === 'login' ? s.tabActive : s.tab}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            로그인
          </button>
          <button
            style={mode === 'signup' ? s.tabActive : s.tab}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          >
            회원가입
          </button>
        </div>

        {/* 알림 메시지 */}
        {error && <div style={s.errorBox}>⚠️ {error}</div>}
        {success && <div style={s.successBox}>✅ {success}</div>}

        {/* 입력 폼 */}
        <div style={s.formCard}>
          {mode === 'login' ? (
            <>
              <Field label="아이디" type="text" placeholder="아이디 입력"
                value={loginForm.userid}
                onChange={(v) => setLoginForm({ ...loginForm, userid: v })}
                onEnter={handleLogin}
              />
              <Field label="비밀번호" type="password" placeholder="비밀번호 입력"
                value={loginForm.password}
                onChange={(v) => setLoginForm({ ...loginForm, password: v })}
                onEnter={handleLogin}
              />
              <button style={s.submitBtn} onClick={handleLogin} disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </>
          ) : (
            <>
              <Field label="아이디 *" type="text" placeholder="사용할 아이디"
                value={signupForm.userid}
                onChange={(v) => setSignupForm({ ...signupForm, userid: v })} />
              <Field label="비밀번호 *" type="password" placeholder="비밀번호"
                value={signupForm.password}
                onChange={(v) => setSignupForm({ ...signupForm, password: v })} />
              <Field label="이름 *" type="text" placeholder="실명"
                value={signupForm.name}
                onChange={(v) => setSignupForm({ ...signupForm, name: v })} />

              {/* ✅ 주소 → 서울 25개 구 드롭다운 (기존 Field 스타일과 동일하게) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>거주 구 (선택)</label>
                <select
                  value={signupForm.address}
                  onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })}
                  style={{
                    padding: '14px', border: '1.5px solid #D1D5DB', borderRadius: '10px',
                    fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box',
                    backgroundColor: 'white', color: signupForm.address ? '#111827' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ color: '#9CA3AF' }}>거주지 구 선택 (선택)</option>
                  {SEOUL_DISTRICTS.map((district) => (
                    <option key={district} value={district} style={{ color: '#111827' }}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="출생연도" type="number" placeholder="예: 1950"
                value={signupForm.birthyear}
                onChange={(v) => setSignupForm({ ...signupForm, birthyear: v })} />
              <button style={s.submitBtn} onClick={handleSignup} disabled={loading}>
                {loading ? '처리 중...' : '회원가입'}
              </button>
            </>
          )}
        </div>

        {/* ✅ 로그인 없이 계속하기 유지 */}
        <button style={s.guestBtn} onClick={() => router.push('/')}>
          로그인 없이 계속하기
        </button>
      </div>
    </div>
  );
}

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 입력 필드 공통 컴포넌트 (기존과 동일)
function Field({ label, type, placeholder, value, onChange, onEnter }: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; onEnter?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        style={{
          padding: '14px', border: '1.5px solid #D1D5DB', borderRadius: '10px',
          fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box'
        }}
      />
    </div>
  );
}

const GREEN = '#10B981';
const s: { [key: string]: React.CSSProperties } = {
  wrapper: { fontFamily: 'Pretendard, sans-serif', backgroundColor: '#F3F4F6', minHeight: '100vh', maxWidth: '480px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' },
  backBtn: { background: 'none', border: 'none', fontSize: '15px', color: GREEN, cursor: 'pointer', fontWeight: 'bold' },
  headerTitle: { fontSize: '18px', fontWeight: 'bold' },
  content: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  logoArea: { textAlign: 'center', padding: '16px 0' },
  logoIcon: { fontSize: '56px', marginBottom: '8px' },
  logoText: { fontSize: '22px', fontWeight: 'bold', color: '#111827' },
  logoSub: { fontSize: '14px', color: '#6B7280', marginTop: '4px' },
  tabs: { display: 'flex', backgroundColor: '#E5E7EB', borderRadius: '12px', padding: '4px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', color: '#6B7280', fontWeight: '500' },
  tabActive: { flex: 1, padding: '10px', border: 'none', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', color: GREEN, fontWeight: 'bold', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  formCard: { backgroundColor: 'white', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  submitBtn: { backgroundColor: GREEN, color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' },
  errorBox: { backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', padding: '12px', fontSize: '14px' },
  successBox: { backgroundColor: '#F0FDF4', color: GREEN, borderRadius: '10px', padding: '12px', fontSize: '14px' },
  guestBtn: { background: 'none', border: '1.5px solid #D1D5DB', borderRadius: '12px', padding: '14px', fontSize: '15px', color: '#6B7280', cursor: 'pointer' },
};