import React, { useState } from 'react';
import Header from '../components/Header';

//개별 약관 항목 컴포넌트 
const AgreementItem = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-2">
    <div className="flex items-center gap-3">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={() => onChange(id)}
        className="w-5 h-5 accent-slate-500 cursor-pointer" 
      />
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </div>
    <button className="text-xs text-gray-400 underline hover:text-gray-600 transition-colors">
      전문보기
    </button>
  </div>
);

function Agreement() {
  const [checks, setChecks] = useState({
    age: false, service: false, privacy: false, location: false, marketing: false
  });

  const isAllChecked = Object.values(checks).every(Boolean);
  const isRequiredFilled = checks.age && checks.service && checks.privacy;

  //전체 동의 핸들러
  const handleAll = () => {
    const nextVal = !isAllChecked;
    setChecks({
      age: nextVal,
      service: nextVal,
      privacy: nextVal,
      location: nextVal,
      marketing: nextVal,
    });
  };

  const handleSingle = (id) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  //사이드바 메뉴(example)
  const sidebarMenus = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  //상단 헤더 메뉴(example)
  const headerMenus = [ "청년금융소개", "지원정책", "금융가이드", "커뮤니티", "고객센터", "공지사항"];

  return (
    <div className="flex min-h-screen bg-[#EAF8F0] font-inter text-[22px] text-slate-900">
      

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <Header className="h-16 flex items-center px-10 gap-8">
          {headerMenus.map((menu, i) => (
            <button 
              key={i} 
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap"
              onClick={() => console.log(`${menu} 클릭됨`)}
            >
              {menu}
            </button>
          ))}
        </Header>

        {/*콘텐츠 배치*/}
        <div className="flex-1 flex justify-center items-center p-6">
          <div className="w-full max-w-xl bg-white p-12 rounded-[40px] shadow-2xl">
            <h2 className="text-2xl font-extrabold mb-8 text-slate-800">이용약관에 동의해주세요.</h2>

            {/*전체 동의 박스*/}
            <div className="p-6 bg-slate-100 rounded-2xl mb-6">
              <div className="flex items-center gap-3 mb-1">
                <input 
                  type="checkbox" 
                  checked={isAllChecked} 
                  onChange={handleAll}
                  className="w-6 h-6 accent-slate-600 cursor-pointer" 
                />
                <span className="font-bold text-lg text-slate-800">전체 동의</span>
              </div>
              <p className="text-xs text-slate-400 ml-9">필수 및 선택 약관에 모두 동의합니다.</p>
            </div>

            {/*개별 약관 리스트*/}
            <div className="space-y-1">
              <AgreementItem id="age" label="[필수] 만 14세 이상입니다." checked={checks.age} onChange={handleSingle} />
              <AgreementItem id="service" label="[필수] 서비스 이용약관 동의" checked={checks.service} onChange={handleSingle} />
              <AgreementItem id="privacy" label="[필수] 개인정보 수집 및 이용동의" checked={checks.privacy} onChange={handleSingle} />
              <AgreementItem id="location" label="[선택] 위치기반 서비스 이용약관 동의" checked={checks.location} onChange={handleSingle} />
              <AgreementItem id="marketing" label="[선택] 마케팅 정보 수신 동의" checked={checks.marketing} onChange={handleSingle} />
            </div>

            <button 
              disabled={!isRequiredFilled}
              className={`w-full mt-10 py-5 rounded-2xl font-black text-xl transition-all shadow-lg ${
                isRequiredFilled 
                ? 'bg-slate-700 text-white hover:bg-slate-800 active:scale-95 cursor-pointer' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              다음
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Agreement;