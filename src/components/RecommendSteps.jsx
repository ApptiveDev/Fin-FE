import StepLayout from "./StepLayout";
import NavButtons from "./NavButtons";
import InfoBox from "./InfoBox";
import Tag from "./Tag";
import { FormInput, FormSelect } from "./FormFields";
import { toggleField } from "../utils/toggleField";

// 1. 저축 계획 (Step 1-1)
export function StepSavingPlan({ data, setData, cats, onNext}) {
  const amount = data.monthlyAmount || 1;
  return (
    <StepLayout step={1} title="상세 정보" sub="y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다.">
      <p className="text-md font-semibold text-[#454545] mb-6">저축 계획</p>

      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-[#454545]">월 납입 희망액</p>
        <span className="text-teal-500 text-sm">ⓘ</span>
      </div>

      <input type="range" min={1} max={100} value={amount}
        onChange={(e) => setData({ ...data, monthlyAmount: Number(e.target.value) })}
        className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-500 mb-1" />
      
      <div className="flex justify-between text-xs text-[#8F8F8F] mb-6">
        <span>1만원</span><span>100만원</span>
      </div>

      <div className="flex items-center gap-1 border border-gray-300 rounded-full px-4 py-2 w-fit mb-6 bg-white">
        <input type="number" value={amount}
          onChange={(e) => setData({ ...data, monthlyAmount: Math.min(100, Math.max(1, Number(e.target.value))) })}
          className="w-8 text-center text-[#CACACA] text-sm font-medium focus:outline-none bg-transparent" />
        <span className="text-sm text-[#999999]">만원</span>
      </div>
      
      <NavButtons isFirst onNext={onNext} />
    </StepLayout>
  );
}

// 2. 현재 신분 + 희망 저축 기간 (Step 1-2)
export function StepBasicInfo({ data, setData, cats, onPrev, onNext }) {
  return (
    <StepLayout step={1} title="기본 정보" sub="몇 가지 간단한 키워드 태그로 당신에게 Fin. 한 상품을 찾아드립니다.">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-md text-[#454545] font-semibold mb-0">현재 신분</p>
        <div className="w-3 h-3 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">!</div>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {cats.status.map((s) => (
          <Tag key={s.optionId} label={s.optionValue}
            selected={(data.status || []).includes(s.optionId)}
            onClick={() => toggleField(data, setData, "status", s.optionId)} />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <p className="text-md text-[#454545] font-semibold mb-0">희망 저축 기간</p>
        <div className="w-3 h-3 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">!</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {cats.savingPeriod.map((p) => (
          <Tag key={p.optionId} label={p.optionValue}
            selected={(data.savingPeriod || []).includes(p.optionId)}
            onClick={() => toggleField(data, setData, "savingPeriod", p.optionId)}/>
        ))}
      </div>
      <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.savingPeriod || data.savingPeriod.length === 0} />
    </StepLayout>
  );
}

// 3. 핵심 혜택 + 은행 거래 (Step 1-3)
export function StepBenefits({ data, setData, cats, onPrev, onNext }) {
  return (
    <StepLayout step={1} title="기본 정보" sub="몇 가지 간단한 키워드 태그로 당신에게 Fin. 한 상품을 찾아드립니다.">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-md text-[#454545] font-semibold mb-0">핵심 혜택</p>
        <div className="w-3 h-3 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">!</div>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {cats.benefits.map((b) => (
          <Tag key={b.optionId} label={b.optionValue}
            selected={(data.benefits || []).includes(b.optionId)}
            onClick={() => toggleField(data, setData, "benefits", b.optionId)} />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <p className="text-md text-[#454545] font-semibold mb-0">은행 거래</p>
        <div className="w-3 h-3 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">!</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {cats.bankRelation.map((b) => (
          <Tag key={b.optionId} label={b.optionValue}
            selected={(data.bankRelation || []).includes(b.optionId)}
            onClick={() => toggleField(data, setData, "bankRelation", b.optionId)} />
        ))}
      </div>
      <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.benefits || data.benefits.length === 0} />
    </StepLayout>
  );
}

const YEARS  = Array.from({ length: 50 }, (_, i) => 1975 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

export function StepPersonalInfo({ data, setData, onPrev, onNext }) {
  return (
    <StepLayout step={2} title="상세 정보" sub="y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다.">
      
      <p className="text-md text-[#454545] font-semibold mb-3">개인 기본 정보</p>

      {/* 생년월일 섹션 */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-[#454545] font-semibold mb-0">생년월일</p>
        <div className="w-4 h-4 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">i</div>
      </div>
      
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {[
          { key: "birthYear",  items: YEARS,  unit: "년" },
          { key: "birthMonth", items: MONTHS, unit: "월" },
          { key: "birthDay",   items: DAYS,   unit: "일" },
        ].map(({ key, items, unit }) => (
          <div key={key} className="flex items-center gap-1">
            <FormSelect 
              value={data[key] || ""} 
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
              className="px-3 py-2 text-sm border-gray-300 rounded"
            >
              <option value="">선택</option>
              {items.map((v) => <option key={v}>{v}</option>)}
            </FormSelect>
            <span className="text-sm text-gray-500 mr-2">{unit}</span>
          </div>
        ))}
        
        <div className="flex-1 min-w-70">
          <InfoBox>기본 만 19~34세, 군필자는 39세까지 선택 가능</InfoBox>
        </div>
      </div>

      <div className="h-4"></div>

      {/* 개인 연소득 섹션 */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-[#454545] font-semibold mb-0">개인 연소득</p>
        <div className="w-4 h-4 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[10px] font-bold">i</div>
      </div>
      
      <div className="flex flex-col gap-3 mb-8">
        {/* 수정된 부분: 입력창과 '만원' 버튼을 하나의 flex 컨테이너로 묶고 크기를 조절했습니다. */}
        <div className="flex gap-2 items-center flex-wrap">
          
          <div className="flex h-9 items-center border border-gray-300 rounded-lg px-3 py-2 bg-white sm:flex-none sm:w-64">
            <FormInput type="number" placeholder="숫자(단위:만원)를 입력하세요."
              value={data.income || ""}
              onChange={(e) => setData({ ...data, income: e.target.value })}
              className="w-full border-none outline-none focus:ring-0 text-sm p-0 m-0 bg-transparent" />
          </div>

          <button type="button" className="h-9 text-sm text-[#03BFA5] bg-white border border-[#03BFA5] rounded-lg px-4 py-2 flex items-center justify-center font-medium hover:bg-teal-50/40 transition-all">만원
          </button>
          <InfoBox>미취업자는 0원 입력 기본값(수정 가능) / 최대 1억원 입력 가능</InfoBox>
        </div>
      </div>
      <div className="mt-8">
        <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.income}/>
      </div>
    </StepLayout>
  );
}

// 5. 거주지역 (Step 2-2)
export function StepRegion({ data, setData, cats, onNext, onPrev }) {
  return (
    <StepLayout step={2} title="거주지역" sub="y-Fin만의 지역별 맞춤 금융상품 추천을 위한 필수 항목입니다.">
      <p className="text-sm text-[#454545] font-semibold mb-1.5">거주지역</p>
      <FormSelect
        value={data.region || ""}
        onChange={(e) => setData({ ...data, region: e.target.value })}
        className="w-full"
      >
        <option value="">선택해주세요.</option>
        {cats.regions.map((r) => (
          <option key={r.optionId} value={r.optionId}>{r.optionValue}</option>
        ))}
      </FormSelect>
      <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.region} />
    </StepLayout>
  );
}

// 6. 가구정보 (가구원 수, 가구 소득) (Step 2-3)
export function StepHouseholdIncome({ data, setData, cats, onPrev, onNext }) {
  const count = data.householdCount || 1;
  return (
    <StepLayout step={2} title="상세 정보" sub="y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다.">
      <p className="text-sm text-[#454545] font-semibold mb-3">가구 정보</p>

      <p className="text-sm text-[#454545] font-inter mb-2">가구원 수</p>
      <div className="flex items-center gap-3 mb-4">
        <button type="button"
          onClick={() => setData({ ...data, householdCount: Math.max(1, count + 1) })}
          className="w-8 h-8 rounded-full border border-[#CACACA] text-teal-500 text-lg hover:border-teal-400 transition-all">+</button>
        <span className="text-sm font-semibold">{count}인</span>
        <button type="button"
          onClick={() => setData({ ...data, householdCount: Math.max(1, count - 1) })}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-400 text-lg hover:border-teal-400 transition-all">−</button>
      </div>

      <p className="text-sm text-gray-700 mb-2">가구 소득</p>
      <div className="flex flex-col gap-2">
        {cats.incomeLevel.map((item) => (
          <label key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
              data.incomeLevel === item.label
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-gray-200 hover:border-teal-300"
            }`}>
            <input type="checkbox" className="accent-teal-500"
              checked={data.incomeLevel === item.label}
              onChange={() => setData({ ...data, incomeLevel: data.incomeLevel === item.label ? "" : item.label })} />
            <span className="text-sm flex-1">{item.label}</span>
            {item.amount && (
              <span className={`text-sm ${data.incomeLevel === item.label ? "text-teal-100" : "text-teal-500"}`}>
                {item.amount}
              </span>
            )}
          </label>
        ))}
      </div>
      <InfoBox>가구원 수 변경 시 중위소득에 해당하는 금액이 자동 조정됩니다.</InfoBox>

      <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.incomeLevel}/>
    </StepLayout>
  );
}

// 7. 가구정보 (무주택 여부) (Step 2-4)
export function StepHousing({ data, setData, onPrev, onNext }) {
  return (
    <StepLayout step={2} title="상세 정보" sub="y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다.">
      <p className="text-sm font-semibold text-gray-700 mb-3">가구 정보</p>

      <p className="text-sm text-gray-700 mb-2">무주택 여부</p>
      <div className="flex gap-2 mb-3">
        {["무주택", "유주택"].map((opt) => (
          <label key={opt}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
              data.housingStatus === opt ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 hover:border-teal-300"
            }`}>
            <input type="checkbox" className="accent-teal-500"
              checked={data.housingStatus === opt}
              onChange={() => setData({ ...data, housingStatus: opt })} />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 cursor-pointer hover:border-teal-300 transition-all mb-3">
        <input type="checkbox" className="accent-teal-500"
          checked={data.isTenant || false}
          onChange={(e) => setData({ ...data, isTenant: e.target.checked })} />
        <span className="text-sm text-gray-700">세대주입니다.</span>
      </label>
      <InfoBox>기본 만 19~34세, 군필자는 39세까지 선택 가능</InfoBox>

      <NavButtons onPrev={onPrev} onNext={onNext} disabled={!data.housingStatus} />
    </StepLayout>
  );
}

// 8. 재직 정보 (근속 기간) (Step 2-5)
export function StepEmployment({ data, setData, onPrev, onSubmit }) {
  const months = data.employmentMonths || 0;
  return (
    <StepLayout step={2} title="상세 정보" sub="y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다.">
      <p className="text-sm font-semibold text-gray-700 mb-3">재직 정보</p>

      <p className="text-sm text-gray-700 mb-2">근속 기간</p>
      <input type="range" min={0} max={120} value={months}
        onChange={(e) => setData({ ...data, employmentMonths: Number(e.target.value) })}
        className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-500 mb-1" />
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span>0개월</span><span>120개월</span>
      </div>
      <div className="flex items-center gap-1 border border-gray-300 rounded-full px-4 py-2 w-fit mb-4">
        <FormInput type="number" value={months}
          onChange={(e) => setData({ ...data, employmentMonths: Math.min(120, Math.max(0, Number(e.target.value))) })}
          className="w-16 h-5 text-center" />
        <span className="text-sm text-gray-500">개월</span>
      </div>

      <label className="flex w-40 h-10 items-center gap-2 px-4 py-2.5 rounded-full border border-[#CACACA] cursor-pointer hover:border-[#03BFA5] transition-all mb-4 bg-white">
        <input type="checkbox" className="accent-teal-500"
          checked={data.isFirstJob || false}
          onChange={(e) => setData({ ...data, isFirstJob: e.target.checked })} />
        <span className="text-sm text-[#454545]">첫 직장입니다.</span>
      </label>
      <InfoBox>첫 직장 선택 시 신규 취업자 전용 상품을 추천합니다.</InfoBox>

      <NavButtons onPrev={onPrev} onNext={onSubmit} isLast />
    </StepLayout>
  );
}