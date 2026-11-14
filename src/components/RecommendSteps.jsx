import StepLayout from "./StepLayout";
import NavButtons from "./NavButtons";
import InfoBox from "./InfoBox";
import Tag from "./Tag";
import KeywordAlertModal from "./KeywordAlertModal";
import { DropdownSelect, FormInput } from "./FormFields";
import { BirthdateFields, RegionSelect, TenureMonthsField } from "./ProfileFields";
import { toggleField } from "../utils/toggleField";
import { getSavingPlanType } from "../utils/recommendationPayload";
import { useState, useEffect, useRef } from "react";

function FieldHeader({
  title,
  choice,
  required = false,
  requiredText = true,
  size = "large",
  starColor = "#03BFA5",
  className = "",
}) {
  const titleSize = size === "small" ? "text-[23px] font-medium" : "text-[26px] font-semibold";

  return (
    <div className={`flex flex-col gap-[10px] ${className}`}>
      <div className="flex items-center gap-[5px] text-[#454545]">
        <p className={`${titleSize} leading-normal text-[#454545]`}>{title}</p>
        {required && (
          <span
            className="h-4 w-[14px] text-[26px] font-semibold leading-[16px]"
            style={{ color: starColor }}
            aria-hidden="true"
          >
            *
          </span>
        )}
        {choice && (
          <span className="text-[18px] font-normal leading-normal text-[#454545]">
            {choice}
          </span>
        )}
      </div>
      {required && requiredText && (
        <p className="text-[18px] font-normal leading-normal text-[#454545]">
          필수 입력 항목입니다.
        </p>
      )}
    </div>
  );
}

function getRangeProgress(value, min, max) {
  const numericValue = Number(value);
  const progress = ((numericValue - min) / (max - min)) * 100;
  return `${Math.min(100, Math.max(0, progress))}%`;
}

function toggleSingleField(data, setData, field, val) {
  const cur = data[field] || [];
  setData({
    ...data,
    [field]: cur.includes(val) ? [] : [val],
  });
}

function SavingPlanNotice({ type }) {
  const isShortTerm = type === "short";
  const label = isShortTerm ? "단기 예치" : "목돈 만들기";
  const descriptionBefore = isShortTerm ? "3개월 이하라 " : "6개월 이상이라 ";
  const descriptionAfter = isShortTerm
    ? "로 분류돼요. 단기 예적금 · 파킹통장을 비교해 드려요."
    : "로 분류돼요. 정부 청년 상품 · 시중 은행 상품을 비교해 드려요.";

  return (
    <div className="flex min-h-[64px] w-full items-center gap-4 rounded-[10px] border border-[#03BFA5] bg-[#F2FFFD] px-5 py-2">
      <span className="shrink-0 rounded-[7px] bg-[#59C5B4] px-4 py-2 text-[18px] font-semibold text-white">
        {label}
      </span>
      <p className="text-[18px] leading-[1.45] text-[#454545]">
        {descriptionBefore}<span className="font-semibold text-[#03BFA5]">{label}</span>{descriptionAfter}
      </p>
    </div>
  );
}

export function SavingPeriodField({ data, setData, cats }) {
  return (
    <>
      <FieldHeader title="저축 기간" choice="(단일 선택)" required requiredText={false} className="mb-[5px]" />
      <p className="mb-[26px] text-[18px] text-[#767676]">넣어둘 기간을 하나만 골라주세요.</p>
      <div className="flex flex-wrap gap-[13px]">
        {cats.savingPeriod.map((period) => (
          <Tag
            key={period.optionId}
            label={period.optionValue}
            selected={(data.savingPeriod || []).includes(period.optionId)}
            onClick={() => toggleSingleField(data, setData, "savingPeriod", period.optionId)}
          />
        ))}
      </div>
    </>
  );
}

// 대분류별 금액 범위(단위: 만원). 단기 예치는 10만원~1억원, 목돈 만들기는 1만원~100만원.
const AMOUNT_CONFIG = {
  short: {
    min: 10,
    max: 10000,
    step: 10,
    defaultValue: 10,
    minLabel: "10만원",
    maxLabel: "1억원",
    hint: "10만 원 ~ 1억 원 사이로 입력할 수 있어요.",
    errorHint: "10만 원 ~ 1억 원 사이로 입력해주세요.",
  },
  goal: {
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 1,
    minLabel: "1만원",
    maxLabel: "100만원",
    hint: "1만 원 ~ 100만 원 사이로 입력할 수 있어요.",
    errorHint: "1만 원 ~ 100만 원 사이로 입력해주세요.",
  },
};

// 금액 입력: 숫자 박스를 눌러 직접 입력하거나 슬라이더를 드래그해서 바꾼다.
// 범위를 벗어난 값을 입력하면 박스/문구가 빨갛게 바뀌고, onValidityChange(true)로 부모가 다음 단계를 막을 수 있다.
export function AmountField({ data, setData, type, onValidityChange }) {
  const isShortTerm = type === "short";
  const config = isShortTerm ? AMOUNT_CONFIG.short : AMOUNT_CONFIG.goal;
  const amountTitle = isShortTerm ? "예치 희망액" : "월 납입 희망액";
  const amountDescription = isShortTerm
    ? "한 번에 예치할 수 있는 금액이에요. (단기 예치 기준)"
    : "매달 넣을 수 있는 금액이에요. (목돈 만들기 기준)";

  const stored = Number(data.monthlyAmount);
  const hasValidStored = Number.isFinite(stored) && stored >= config.min && stored <= config.max;
  const amount = hasValidStored ? stored : config.defaultValue;

  // 값이 아직 없거나, 대분류가 바뀌어 범위를 벗어났다면 그 대분류의 기본값으로 맞춘다.
  useEffect(() => {
    if (!hasValidStored) setData((prev) => ({ ...prev, monthlyAmount: config.defaultValue }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidStored, config.defaultValue]);

  const [text, setText] = useState(String(amount));
  const focusedRef = useRef(false);

  // 슬라이더/대분류 변경 등 바깥에서 값이 바뀌면 입력창도 맞춘다(입력 중에는 건드리지 않는다).
  useEffect(() => {
    if (!focusedRef.current) setText(String(amount));
  }, [amount]);

  // 대분류(단기/목돈)가 바뀌면 범위가 달라지므로, 입력 중이던 값은 버리고 새 값으로 맞춘다.
  useEffect(() => {
    setText(String(amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShortTerm]);

  const typed = text === "" ? null : Number(text);
  const isInvalid = typed === null || typed < config.min || typed > config.max;

  useEffect(() => {
    onValidityChange?.(isInvalid);
    return () => onValidityChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInvalid]);

  const handleTyping = (event) => {
    const next = event.target.value.replace(/\D/g, "").slice(0, 6);
    setText(next);
    const value = Number(next);
    if (next !== "" && value >= config.min && value <= config.max) {
      setData((prev) => ({ ...prev, monthlyAmount: value }));
    }
  };

  const handleSlide = (event) => {
    const value = Number(event.target.value);
    setText(String(value));
    setData((prev) => ({ ...prev, monthlyAmount: value }));
  };

  return (
    <div className="mt-10">
      <FieldHeader title={amountTitle} required requiredText={false} className="mb-[5px]" />
      <p className="mb-[20px] text-[18px] text-[#767676]">{amountDescription}</p>

      <label
        className={`inline-flex h-[56px] cursor-text items-center gap-2 rounded-[14px] border-2 bg-white px-5 transition-colors ${
          isInvalid
            ? "border-[#F0566F]"
            : "border-[#D9D9D9] focus-within:border-[#03BFA5]"
        }`}
      >
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={handleTyping}
          onFocus={(event) => {
            focusedRef.current = true;
            event.target.select();
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          style={{ width: `${Math.max(text.length, 1) + 0.4}ch` }}
          className={`bg-transparent text-right text-[34px] font-bold leading-none outline-none ${
            isInvalid ? "text-[#F0566F]" : "text-[#03BFA5]"
          }`}
          aria-label={amountTitle}
          aria-invalid={isInvalid}
        />
        <span className="text-[18px] font-semibold text-[#8A8F99]">만원</span>
      </label>
      <p className={`mb-[24px] mt-3 text-[18px] ${isInvalid ? "text-[#F0566F]" : "text-[#767676]"}`}>
        {isInvalid ? config.errorHint : config.hint}
      </p>

      <div className="w-full max-w-[760px]">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={amount}
          onChange={handleSlide}
          className="recommend-range mb-[18px] w-full"
          style={{ "--range-progress": getRangeProgress(amount, config.min, config.max) }}
          aria-label={amountTitle}
        />
        <div className="flex justify-between px-1 font-pretendard text-[17px] font-semibold text-[#454545]">
          <span>{config.minLabel}</span>
          <span>{config.maxLabel}</span>
        </div>
      </div>
    </div>
  );
}

function useSavingPeriodValidation(data, onNext) {
  const [showKeywordAlert, setShowKeywordAlert] = useState(false);
  const handleNext = () => {
    if (!data.savingPeriod?.length) {
      setShowKeywordAlert(true);
      return;
    }
    onNext();
  };

  return { handleNext, showKeywordAlert, closeAlert: () => setShowKeywordAlert(false) };
}

/* 1. 저축 기간에 따른 단기 예치·목돈 만들기 */
export function StepSavingPlan({ data, setData, cats, onPrev, onNext }) {
  const [amountInvalid, setAmountInvalid] = useState(false);
  const { handleNext, showKeywordAlert, closeAlert } = useSavingPeriodValidation(data, onNext);
  const selectedPeriod = cats.savingPeriod.find((period) =>
    (data.savingPeriod || []).includes(period.optionId),
  );
  const planType = getSavingPlanType(selectedPeriod);

  return (
    <>
      <StepLayout step={1} title="기본 정보" sub="저축 기간에 따라 단기 예치·목돈 만들기로 자동 분류돼요.">
        <div className="mt-8 pl-4">
          <SavingPeriodField data={data} setData={setData} cats={cats} />
          {selectedPeriod && (
            <div className="step-reveal">
              {/* step-reveal은 자식 1개의 높이를 0fr -> 1fr로 펼치므로 내용을 한 덩어리로 감싼다 */}
              <div>
                <div className="mt-7"><SavingPlanNotice type={planType} /></div>
                <AmountField data={data} setData={setData} type={planType} onValidityChange={setAmountInvalid} />
              </div>
            </div>
          )}
        </div>
        <NavButtons isFirst onPrev={onPrev} onNext={handleNext} isLast={false} disabled={Boolean(selectedPeriod) && amountInvalid} />
      </StepLayout>
      {showKeywordAlert && <KeywordAlertModal onClose={closeAlert} />}
    </>
  );
}

/* 2. 현재 신분 + 핵심 혜택 + 은행 우대 조건 */
export function StepBenefits({ data, setData, cats, onPrev, onNext, nextLabel, bankRequired = true }) {
  const [showKeywordAlert, setShowKeywordAlert] = useState(false);
  const handleNext = () => {
    if (bankRequired && !data.bankRelation?.length) {
      setShowKeywordAlert(true);
      return;
    }
    onNext();
  };

  return (
    <>
      <StepLayout step={1} title="기본 정보" sub="몇 가지 간단한 키워드 태그로 당신에게 Fin. 한 상품을 찾아드립니다.">
        <div className="mt-8 pl-4">
          <FieldHeader title="현재 신분" choice="(단일 선택)" className="mb-[26px]" />
          <div className="mb-10 flex flex-wrap gap-[13px]">
            {cats.status.map((status) => (
              <Tag
                key={status.optionId}
                label={status.optionValue}
                selected={(data.status || []).includes(status.optionId)}
                onClick={() => toggleSingleField(data, setData, "status", status.optionId)}
              />
            ))}
          </div>

          <FieldHeader title="핵심 혜택" choice="(복수 선택)" className="mb-[26px]" />
          <div className="flex flex-wrap gap-[13px] mb-10">
            {cats.benefits.map((b) => (
              <Tag key={b.optionId} label={b.optionValue}
                selected={(data.benefits || []).includes(b.optionId)}
                onClick={() => toggleField(data, setData, "benefits", b.optionId)} />
            ))}
          </div>

          <FieldHeader
            title="은행 우대 조건"
            choice="(복수 선택)"
            required={bankRequired}
            requiredText={false}
            className="mb-[26px]"
          />
          <div className="flex flex-wrap gap-[13px] mb-12">
            {cats.bankRelation.map((b) => (
              <Tag key={b.optionId} label={b.optionValue}
                selected={(data.bankRelation || []).includes(b.optionId)}
                onClick={() => toggleField(data, setData, "bankRelation", b.optionId)} />
            ))}
          </div>
        </div>
        <NavButtons onPrev={onPrev} onNext={handleNext} nextLabel={nextLabel} isLast={false} />
      </StepLayout>
      {showKeywordAlert && (
        <KeywordAlertModal onClose={() => setShowKeywordAlert(false)} />
      )}
    </>
  );
}

/* 4. 개인 기본 정보 (Step 2-1) */
export function StepPersonalInfo({ data, setData, onPrev, onNext, onSkip }) {
  const hasIncome = data.income !== undefined && data.income !== null && data.income !== "";
  const isComplete = Boolean(data.birthYear && data.birthMonth && data.birthDay) && hasIncome;

  return (
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="mt-8 pl-4">
          <p className="text-[26px] text-[#454545] font-semibold mb-[30px]">개인 기본 정보</p>

          {/* 생년월일 컴포넌트 그리드 스케일링 */}
          <div className="pl-2 mb-[32px]">
            <FieldHeader
              title="생년월일"
              required
              size="small"
              className="mb-[26px]"
            />
            
            <BirthdateFields
              values={{ year: data.birthYear, month: data.birthMonth, day: data.birthDay }}
              onChange={(key, next) => setData({ ...data, [`birth${key[0].toUpperCase()}${key.slice(1)}`]: next })}
            />
          </div>

          <div className="pl-2 mb-12">
            <FieldHeader title="개인 연소득" required size="small" className="mb-[20px]" />
              
            <div className="flex flex-col gap-3">
              <div className="flex items-center flex-wrap gap-5">
                <div className = "flex items-center">
                  <div className="flex h-[46px] w-[320px] items-center border border-[#D9D9D9] rounded-[4px] px-3 bg-white">
                    <FormInput type="number" placeholder="숫자(단위:만원)를 입력하세요."
                      value={data.income ?? ""}
                      onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          // 0 ~ 10000 범위 제한 적용
                          if (val !== "") {
                            let num = parseInt(val, 10);
                            if (num > 10000) val = "10000";
                            else val = num.toString(); 
                          }
                          setData({ ...data, income: val });
                        }}
                      className="w-full border-none outline-none focus:ring-0 p-0 m-0 bg-transparent" />
                  </div>
                  <div className="h-[46px] min-w-[64px] px-4 border rounded-[4px] border-[#03BFA5] bg-[#FFFFFF] flex items-center justify-center">
                    <span className="text-[18px] text-[#03BFA5] font-normal">만원</span>
                  </div>
                </div>
                <div className="flex-1 min-w-[340px]">
                  <InfoBox type="mint-rect" className="w-[344px] max-w-full">0원~1억원 내에서 입력 가능합니다.</InfoBox>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NavButtons onPrev={onPrev} onNext={onNext} isLast={false} disabled={!isComplete}/>
      </StepLayout>
  );
}

/* 5. 거주지역 (Step 2-2) */
export function StepRegion({ data, setData, cats, onNext, onPrev, onSkip }) {
  const hasRegion = Boolean(data.region);

  return (
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="mt-8 pl-4">
          <div className="flex items-center mb-[26px]">
            <p className="text-[26px] text-[#454545] font-semibold">거주지역</p>
          </div>
          <div className="flex w-full max-w-[610px] flex-col gap-[10px]">
            <RegionSelect
              value={data.region || ""}
              onChange={(next) => setData({ ...data, region: next })}
              options={cats.regions.map((r) => ({ value: r.optionId, label: r.optionValue }))}
            />
            <InfoBox type="mint-region" className="w-full">
              지자체별 청년 금융상품 필터링에 활용됩니다.
            </InfoBox>
          </div>
        </div>
        <NavButtons onPrev={onPrev} onNext={onNext} isLast={false} nextLabel={hasRegion ? "다음 단계" : "건너뛰기"} />
      </StepLayout>
  );
}

/* 6. 가구정보 (가구원 수, 가구 소득) (Step 2-3) */
// 카드(폼) 맨 아래가 화면 아래로 벗어나 있으면, 벗어난 만큼만(여백 24px 포함) 부드럽게 내려서 보이게 한다.
// 단, 방금 누른 항목이 화면 위로 사라지지 않도록(헤더 높이 96px 아래 유지) 내리는 양을 제한한다.
function scrollCardBottomIntoView(inputElement) {
  // 체크박스 input은 display:none이라 위치를 잴 수 없으므로, 눈에 보이는 label 기준으로 계산한다.
  const fromElement = inputElement?.closest("label") ?? inputElement;
  const card = fromElement?.closest("[data-recommend-card]");
  if (!card) return;

  requestAnimationFrame(() => {
    const overflow = card.getBoundingClientRect().bottom + 24 - window.innerHeight;
    if (overflow <= 0) return;

    const maxScroll = Math.max(0, fromElement.getBoundingClientRect().top - 96);
    const amount = Math.min(overflow, maxScroll);
    if (amount > 0) window.scrollBy({ top: amount, behavior: "smooth" });
  });
}

export function StepHouseholdIncome({ data, setData, cats, onPrev, onNext, onSkip }) {
  const count = data.householdCount || 1;
  // 2단계를 건너뛴 게 아니라 이 화면까지 실제로 들어왔다면, 화면에 보이는 "1인"이
  // 곧 사용자가 확인한 값이므로 state에도 반영한다. 이미 값이 있으면(스테퍼 조작 또는
  // 재마운트 전 선택) 덮어쓰지 않는다.
  useEffect(() => {
    if (data.householdCount == null) {
      setData((prev) => ({ ...prev, householdCount: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="mt-8 pl-4">
          <p className="text-[26px] text-[#454545] font-semibold mb-[30px]">가구 정보</p>

          <div className="pl-2">
            <FieldHeader title="가구원 수" required size="small" className="mb-[30px]" />
            <div className="flex h-[56px] w-[235px] items-center justify-center gap-[30px] rounded-full border border-[#CACACA] bg-white p-[10px] shadow-sm mb-[34px]">
              <button type="button"
                onClick={() => setData({ ...data, householdCount: Math.max(1, count - 1) })}
                className="flex h-[28px] w-10 items-center justify-center rounded-full border-2 border-[#454545] text-center font-pretendard text-[25px] leading-none text-[#454545] hover:bg-gray-50">-</button>
              <span className="font-pretendard text-[25px] text-center text-[#000000]">
                {count}인
              </span>
              <button type="button"
                onClick={() => setData({ ...data, householdCount: Math.max(1, count + 1) })}
                className="flex h-[28px] w-10 items-center justify-center rounded-full border-2 border-[#454545] text-center font-pretendard text-[25px] leading-none text-[#454545] hover:bg-gray-50">+</button>
            </div>

            <FieldHeader title="가구 소득" required size="small" className="mb-[26px]" />

            <div className="flex flex-col gap-[10px] mb-[14px] w-full max-w-[570px]">
              {cats.incomeLevel.map((item) => {
                const isSelected = data.incomeLevel === item.label;
                return (
                  <label key={item.label}
                    className={`flex h-[54px] items-center gap-[10px] px-[25px] rounded-full border-2 cursor-pointer transition-all ${
                      isSelected ? "border-[#03BFA5] bg-[#03BFA5] text-white" : "border-[#E0DFDF] bg-white hover:border-[#03BFA5]"
                    }`}
                  >
                    <input type="checkbox" className="hidden" checked={isSelected}
                      onChange={(event) => {
                        setData({ ...data, incomeLevel: isSelected ? "" : item.label });
                        if (!isSelected) scrollCardBottomIntoView(event.currentTarget);
                      }} />
                    
                    <div className={`w-5 h-5 rounded-[2px] flex items-center justify-center transition-all ${
                      isSelected ? "bg-white" : "border border-[#454545] bg-white"
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-[#03BFA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <span className={`w-[150px] text-center font-pretendard text-[20px] font-normal ${isSelected ? "text-white" : "text-[#454545]"}`}>
                      {item.label}
                    </span>
                    {item.amount && (
                      <span className={`w-[235px] text-center font-pretendard text-[22px] font-normal ${isSelected ? "text-white" : "text-[#03BFA5]"}`}>
                        {item.amount}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            
            <InfoBox type="mint-pill" className="mb-4 w-full max-w-[569px]">
              가구원 수 변경 시 중위소득에 해당하는 금액이 자동 조정됩니다.
            </InfoBox>
          </div>
        </div>
        <NavButtons onPrev={onPrev} onNext={onNext} isLast={false} disabled={!data.incomeLevel}/>
      </StepLayout>
  );
}

/* 7. 가구정보 (무주택 여부) (Step 2-4) */
export function StepHousing({ data, setData, onPrev, onNext, onSkip }) {
  const hasHousingSelection = Boolean(data.housingStatus || data.isTenant);

  return (
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="mt-8 pl-4">
          <div className="flex items-center gap-1.5 mb-[30px]">
            <p className="text-[26px] text-[#454545] font-semibold">가구 정보</p>
          </div>

          <div className="pl-2">
            <div className="flex items-center gap-1.5 mb-5">
              <p className="text-[23px] text-[#454545] font-medium">무주택 여부</p>
            </div>

        <div className="flex gap-4 mb-3">
          {["무주택", "유주택"].map((opt) => {
            const isSelected = data.housingStatus === opt;
            return (
              <label 
                key={opt}
                className={`flex h-[50px] min-w-[236px] items-center justify-center gap-3 rounded-full border cursor-pointer transition-all ${
                  isSelected 
                    ? "border-[#03BFA5] bg-[#03BFA5] text-white" 
                    : "border-[#D9D9D9] bg-white text-[#454545] hover:border-[#03BFA5]"
                }`}
              >
                <input type="checkbox" 
                  className="hidden" 
                  checked={isSelected}
                  onChange={() => setData({ ...data, housingStatus: isSelected ? "" : opt })} />
                
                <div className={`w-4 h-4 rounded-xs flex items-center justify-center transition-all ${
                  isSelected ? "bg-white" : "border border-gray-300 bg-white"}`}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-[#03BFA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[20px] font-pretendard">{opt}</span>
              </label>
            );
          })}
        </div>

            <label className={`flex h-[46px] items-center gap-3 px-6 rounded-full border border-[#D9D9D9] transition-all mb-5 cursor-pointer w-full max-w-[488px] ${
                data.isTenant ? "bg-[#03BFA5] border-[#03BFA5] text-white shadow-md" : "bg-white text-[#454545] hover:border-[#03BFA5]"
              }`}>
              <input type="checkbox" className="hidden" checked={data.isTenant || false}
                onChange={(e) => setData({ ...data, isTenant: e.target.checked })} />
              <div className={`w-4 h-4 rounded-xs flex items-center justify-center transition-all ${
                data.isTenant ? "bg-white" : "border border-gray-300 bg-white"
              }`}>
                {data.isTenant && (
                  <svg className="w-3.5 h-3.5 text-[#03BFA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[18px] font-pretendard">세대주입니다.</span>
            </label>
            <InfoBox type="mint-pill" className="w-full max-w-[484px]">
              청약/주거 지원 상품의 자격 요건입니다.
            </InfoBox>
        </div>
      </div>
      <NavButtons
        onPrev={onPrev}
        onNext={onNext}
        nextLabel={hasHousingSelection ? "다음 단계" : "건너뛰기"}
      />
    </StepLayout>
  );
}

/* 8. 재직 정보 (근속 기간) (Step 2-5) */
export function StepEmployment({ data, setData, onPrev, onNext, onSkip }) {
  const months = data.employmentMonths || 0;
  const hasEmploymentSelection = Number(months) > 0 || Boolean(data.isFirstJob);
  
  return (
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="mt-8 pl-4">
          <div className="flex items-center gap-1.5 mb-[30px]">
            <p className="text-[26px] text-[#454545] font-semibold">재직 정보</p>
          </div>

          <div className="pl-2">
            <div className="flex items-center gap-1.5 mb-[34px]">
              <p className="text-[23px] text-[#454545] font-medium">근속 기간</p>
            </div>

            <TenureMonthsField
              months={months}
              onChange={(next) => setData({ ...data, employmentMonths: next })}
            />

            <label className={`h-[46px] flex items-center gap-3 px-6 rounded-full border border-[#D9D9D9] transition-all mb-3 cursor-pointer w-full max-w-[488px] ${
                data.isFirstJob ? "bg-[#03BFA5] border-[#03BFA5] text-white shadow-md" : "bg-white text-[#454545] hover:border-[#03BFA5]"
              }`}
            >
              <input type="checkbox" className="hidden" checked={data.isFirstJob || false}
                onChange={(e) => setData({ ...data, isFirstJob: e.target.checked })} />
              <div className={`w-4 h-4 rounded-xs flex items-center justify-center transition-all ${
                data.isFirstJob ? "bg-white" : "border border-gray-300 bg-white"
              }`}>
                {data.isFirstJob && (
                  <svg className="w-3.5 h-3.5 text-[#03BFA5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[17px] font-pretendard">첫 직장입니다.</span>
            </label>
            
            <InfoBox type="mint-pill" className="mb-4 h-[50px] w-full max-w-[488px]">
              일부 정부 상품은 근속 요건이 존재합니다.
            </InfoBox>
          </div>
        </div>
        <NavButtons
          onPrev={onPrev}
          onNext={onNext}
          isLast={false}
          nextLabel={hasEmploymentSelection ? "다음 단계" : "건너뛰기"}
        />
      </StepLayout>
  );
}

const TABS = [
  { id: '전체', label: '전체', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: '시중', label: '시중', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  { id: '인터넷', label: '인터넷', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: '특수', label: '특수', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { id: '지방', label: '지방', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }
];

export function BankSelector({
  theme = 'mint',
  title,
  infoText,
  selectedBanks = [],
  onChange,
  disabledBanks = [],
  cats,
}) {
  const [activeTab, setActiveTab] = useState('전체');

  const colors = {
    mint: { main: '#03BFA5', bg: '#F2FBF9', text: 'text-[#03BFA5]', border: 'border-[#03BFA5]' },
    blue: { main: '#2C88D9', bg: '#F0F6FF', text: 'text-[#2C88D9]', border: 'border-[#2C88D9]' }
  };
  const themeColor = colors[theme];
  const categoriesToUse = cats?.bankCategories || [];

  const displayedCategories = categoriesToUse.filter(category => {
    if (activeTab !== '전체' && category.id !== activeTab) return false;
    if (category.banks.length === 0) return false;
    return true;
  });

  const toggleBank = (bank) => {
    if (disabledBanks.includes(bank)) return; 
    if (selectedBanks.includes(bank)) {
      onChange(selectedBanks.filter(b => b !== bank));
    } else {
      onChange([...selectedBanks, bank]);
    }
  };

  const selectAll = (categoryBanks) => {
    const validBanks = categoryBanks.filter(b => !disabledBanks.includes(b));
    const allSelected = validBanks.length > 0 && validBanks.every(b => selectedBanks.includes(b));
    if (allSelected) {
      onChange(selectedBanks.filter(b => !validBanks.includes(b)));
    } else {
      onChange(Array.from(new Set([...selectedBanks, ...validBanks])));
    }
  };

  return (
    <div className="w-full max-w-[1022px] mb-8">
      <div className="mb-5 flex flex-col gap-[10px]">
        <div className="flex items-center gap-[7px]">
        <svg className={`w-[21px] h-[23px] ${themeColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
          <div className="flex items-center gap-[5px]">
            <p className="text-[23px] font-medium leading-normal text-[#454545]">{title}</p>
            <span
              className="h-4 w-[14px] text-[26px] font-semibold leading-[16px]"
              style={{ color: themeColor.main }}
              aria-hidden="true"
            >
              *
            </span>
            <span className="text-[18px] font-normal leading-normal text-[#454545]">
              (복수 선택)
            </span>
          </div>
        </div>
        <p className="text-[18px] font-normal leading-normal text-[#454545]">
          필수 입력 항목입니다.
        </p>
      </div>

      <div className="flex h-[43px] gap-3 mb-[34px]">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex h-[43px] items-center justify-center gap-[10px] rounded-[10px] border-2 px-5 py-2 text-[20px] font-medium transition-all ${
                isActive ? `${themeColor.border} ${themeColor.text}` : 'border-[#E0DFDF] text-[#454545] hover:border-[#A5A5A5]'
              }`} style={{ backgroundColor: isActive ? themeColor.bg : '#FFFFFF' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-[18px] mb-[30px]">
        {displayedCategories.map(category => (
          <div key={category.id}>
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-[17px] mb-4">
              <span className="text-[18px] font-normal text-[#747474]">{category.title}</span>
              <button onClick={() => selectAll(category.banks)} className={`text-[18px] font-normal ${themeColor.text}`}>전체선택</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {category.banks.map(bank => {
                const isSelected = selectedBanks.includes(bank);
                const isDisabled = disabledBanks.includes(bank);
                let btnStyle = "border-[#E0DFDF] text-[#454545] bg-white hover:border-[#A5A5A5]";
                if (isDisabled) btnStyle = "border-[#E0E0E0] text-[#B0B0B0] bg-[#F5F5F5] font-pretendard cursor-not-allowed"; 
                else if (isSelected) btnStyle = `${themeColor.border} ${themeColor.text} font-pretendard shadow`;

                return (
                  <button key={bank} disabled={isDisabled} onClick={() => toggleBank(bank)}
                    className={`h-[56px] rounded-[10px] border-2 px-[10px] py-3 text-[22px] font-medium font-pretendard flex items-center justify-center transition-all ${btnStyle}`}
                    style={{ backgroundColor: isSelected && !isDisabled ? themeColor.bg : undefined }}
                  >{bank}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <InfoBox
        type={theme === "mint" ? "mint-outline" : "blue-outline"}
        className="mb-3 w-full max-w-[1002px]"
      >
        {infoText}
      </InfoBox>

      <div className="min-h-[72px] rounded-[10px] flex items-center justify-between px-[29px] py-[25px] flex-wrap gap-2" style={{ backgroundColor: themeColor.bg }}>
        {selectedBanks.length === 0 ? (
          <span className="text-[18px] text-[#808080] font-normal">선택된 은행이 없어요</span>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {selectedBanks.map(bank => (
              <span key={bank} className={`flex items-center gap-1 px-4 py-2 rounded-full border text-[17px] bg-[#F4FEFD] ${themeColor.border} ${themeColor.text} font-semibold shadow-sm`}>
                {bank}
                <button onClick={() => toggleBank(bank)} className="ml-1.5 hover:opacity-70 font-bold">×</button>
              </span>
            ))}
          </div>
        )}
        <button onClick={() => onChange([])} className="text-[18px] font-normal text-[#808080] flex items-center gap-1 shrink-0 ml-auto hover:opacity-80">초기화 ↺</button>
      </div>
    </div>
  );
}

/* 9. 거래 이력 은행 (최종 페이지 - 1, 2페이지 분할) */
export function StepTransaction({ data, setData, cats, onPrev, onSubmit, onSkip, onSubStepChange }) {
  const [subStep, setSubStep] = useState(1); 
  const isFirstRender = useRef(true);

  // 첫거래 은행 <-> 만기 예적금 은행 화면이 바뀔 때도 다른 단계 이동처럼 검색바 위치로 스크롤한다.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSubStepChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subStep]);

  const firstBanks = data.firstBanks || [];
  const maturedBanks = data.maturedBanks || [];

  const handleFinalSubmit = () => {
    onSubmit?.();
  };

  return (
    <>
      <StepLayout step={2} title="상세 정보" sub="Y-Fin.만의 정확한 적합도 분석과 예상 수익률 계산을 위해 필요한 정보입니다." onSkip={onSkip}>
        <div className="flex items-center gap-1.5 mb-[30px] pl-4 mt-8">
          <p className="text-[24px] text-[#454545] font-semibold">거래 이력</p>
        </div>

        <div className="pl-6">
          {subStep === 1 && (
            <BankSelector 
              theme="mint" title="첫거래 은행" infoText="아직 거래해본 적 없는 은행을 선택하면, 해당 은행의 ‘첫거래 우대금리'가 자동 반영됩니다."
              cats={cats} selectedBanks={firstBanks}
              onChange={(newBanks) => setData({ ...data, firstBanks: newBanks })}
            />
          )}

          {subStep === 2 && (
            <BankSelector 
              theme="blue" title="만기 예적금이 있는 은행" infoText="만기된(될) 예적금이 있는 은행을 선택하면 해당 은행의 ‘재예치 우대금리’가 자동 반영됩니다."
              cats={cats} selectedBanks={maturedBanks}
              onChange={(newBanks) => setData({ ...data, maturedBanks: newBanks })}
              disabledBanks={firstBanks} 
            />
          )}
        </div>

        <div className="mt-auto">
          {subStep === 1 ? ( 
            <NavButtons onPrev={onPrev} onNext={() => setSubStep(2)} isLast={false} />
          ) : ( 
            <NavButtons onPrev={() => setSubStep(1)} onSubmit={handleFinalSubmit} isLast={true} submitLabel="분석하기" />
          )}
        </div>
      </StepLayout>
    </>
  );
}

/* 10. 로딩 스크린 컴포넌트 */
export function LoadingScreen({ onAnimationComplete, isAnalysisReady = true, eligibleProductCount }) {
  const [progress, setProgress] = useState(55);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const maxProgress = isAnalysisReady ? 100 : 95;
        if (prev >= maxProgress) {
          return maxProgress;
        }
        return Math.min(prev + 1, maxProgress);
      });
    }, 25);

    return () => clearInterval(interval);
  }, [isAnalysisReady]);

  useEffect(() => {
    if (progress !== 100 || !isAnalysisReady || !onAnimationComplete) return undefined;

    const timeout = setTimeout(onAnimationComplete, 700);
    return () => clearTimeout(timeout);
  }, [isAnalysisReady, onAnimationComplete, progress]);

  const isDone = progress === 100;
  const hasEligibleProductCount = eligibleProductCount !== null
    && eligibleProductCount !== undefined
    && eligibleProductCount !== "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#989898]/53 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={isDone ? "상품 분석 완료" : "상품 분석 중"}
    >
      <div className={`relative h-[418px] w-full max-w-[587px] rounded-[25px] transition-colors duration-300 ${
        isDone ? "bg-[#EFFFFD]" : "bg-[#FFFFFF]"
      }`}>
        <div className="absolute left-1/2 top-[76px] flex size-[88px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#03BFA5] text-[#03BFA5]">
          {isDone ? (
            <svg className="size-[45px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.2 11.2 14.4 15.8 9.7" />
              <circle cx="12" cy="12" r="8.5" strokeWidth="1.5" />
            </svg>
          ) : (
            <svg className="size-[45px] animate-spin [animation-duration:1.8s]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 4v5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20v-5h5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.3 9A7 7 0 0 0 6.8 6.8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.7 15a7 7 0 0 0 11.5 2.2" />
            </svg>
          )}
        </div>

        {isDone ? (
          <>
            <h2 className="absolute left-1/2 top-[191px] -translate-x-1/2 text-center text-[24px] font-semibold leading-[1.4] whitespace-nowrap text-[#03BFA5]">
              분석이 완료됐어요!
            </h2>
            <p className="absolute left-1/2 top-[244px] -translate-x-1/2 text-center text-[15.85px] leading-[1.2] whitespace-nowrap text-[#03BFA5]">
              {hasEligibleProductCount
                ? `총 ${Number(eligibleProductCount).toLocaleString("ko-KR")}개의 상품 중 나에게 맞는 상품을 찾았어요.`
                : "나에게 맞는 상품을 찾았어요."}
            </p>
          </>
        ) : (
          <>
            <h2 className="absolute left-1/2 top-[192px] -translate-x-1/2 text-center text-[24px] font-semibold leading-[1.22] whitespace-nowrap text-[#03BFA5]">
              입력하신 정보를 바탕으로<br />
              당신에게 Fin.한 상품을 분석 중이에요
            </h2>
            <p className="absolute left-1/2 top-[274px] -translate-x-1/2 text-center text-[15.9px] leading-[1.2] whitespace-nowrap text-[#03BFA5]">
              키워드 ∙ 거래 이력 ∙ 신분을 기반으로 최적의 상품을 계산하고 있어요.
            </p>
          </>
        )}

        <div
          className={`absolute left-1/2 h-[8px] w-[477px] max-w-[calc(100%-108px)] -translate-x-1/2 overflow-hidden rounded-full ${
            isDone ? "top-[302px] bg-[#CBF7F1]" : "top-[347px] bg-[#CBF7F1]"
          }`}
        >
          <div
            className="h-full rounded-full bg-[#03BFA5] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`absolute right-[54px] text-center text-[15.85px] leading-[1.2] text-[#03BFA5] ${
            isDone ? "top-[316px]" : "top-[360px]"
          }`}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}
