import { DropdownSelect, FormInput } from "./FormFields";

// 추천 입력 단계(RecommendSteps)와 마이페이지 수정 모달(MyPageEditModals)이 함께 쓰는 입력 필드.
// 한쪽만 고치고 다른 쪽이 어긋나는 일이 없도록, 동작/디자인은 여기서 한 번만 정하고
// 화면별로 달라지는 크기만 compact(모달용 작은 크기) 여부로 나눈다.

export const BIRTH_YEARS = Array.from({ length: 50 }, (_, i) => 1975 + i);
export const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
export const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function getRangeProgress(value, min, max) {
  const numeric = Number(value);
  return `${Math.min(100, Math.max(0, ((numeric - min) / (max - min)) * 100))}%`;
}

// 생년월일 년/월/일 드롭다운(항상 아래로 펼쳐진다). values: { year, month, day }, onChange(key, value)
export function BirthdateFields({ values, onChange, compact = false }) {
  const columns = [
    { key: "year", items: BIRTH_YEARS, unit: "년" },
    { key: "month", items: BIRTH_MONTHS, unit: "월" },
    { key: "day", items: BIRTH_DAYS, unit: "일" },
  ];

  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-3" : "mb-2 gap-5"}`}>
      {columns.map(({ key, items, unit }) => (
        <div key={key} className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
          <DropdownSelect
            value={values[key] || ""}
            onChange={(next) => onChange(key, next)}
            options={items}
            textSize={compact ? "text-[15px]" : "text-[18px]"}
            className={compact ? "h-11 w-[92px]" : "h-[46px] w-[118px]"}
          />
          <span className={compact ? "text-[14px] font-medium text-[#454545]" : "text-[18px] font-semibold text-[#454545]"}>
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// 거주지역 드롭다운. options: [{ value, label }]
export function RegionSelect({ value, onChange, options, compact = false }) {
  return (
    <DropdownSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="선택해주세요."
      borderColor={compact ? "border-[#D9D9D9]" : "border-[#454545]"}
      textSize={compact ? "text-[15px]" : "text-[16.8px]"}
      className={`w-full font-pretendard ${compact ? "h-12" : "h-[54px]"}`}
    />
  );
}

// 근속 기간: 슬라이더(0~120개월) + 직접 입력. 값이 0보다 크면 숫자를 진하게(검은색) 보여준다.
// months가 ""(입력을 지운 상태)여도 슬라이더는 0으로 본다. onChange에는 숫자 또는 ""가 넘어간다.
export function TenureMonthsField({ months, onChange, compact = false }) {
  const numeric = Number(months) || 0;
  const numberColor = numeric > 0 ? "text-[#181818]!" : "text-[#E0DFDF]";

  const handleTyping = (event) => {
    const digits = event.target.value.replace(/[^0-9]/g, "");
    onChange(digits === "" ? "" : Math.min(120, Number(digits)));
  };

  if (compact) {
    return (
      <>
        <input
          type="range"
          min={0}
          max={120}
          value={numeric}
          onChange={(event) => onChange(Number(event.target.value))}
          className="recommend-range mb-2 w-full"
          style={{ "--range-progress": getRangeProgress(numeric, 0, 120) }}
        />
        <div className="mb-5 flex justify-between text-[13px] font-medium text-[#454545]">
          <span>0개월</span>
          <span>120개월</span>
        </div>

        <div className="mb-3 flex h-11 w-[130px] items-center gap-2 rounded-full border border-[#D9D9D9] bg-white px-4 focus-within:border-[#03BFA5]">
          <FormInput
            type="text"
            inputMode="numeric"
            value={months}
            onChange={handleTyping}
            className={`w-12 border-none bg-transparent p-0 text-center text-[14px] focus:ring-0 ${numberColor}`}
          />
          <span className="text-[14px] text-[#454545]">개월</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-[34px] w-full max-w-[592px]">
        <input
          type="range"
          min={0}
          max={120}
          value={numeric}
          onChange={(event) => onChange(Number(event.target.value))}
          className="recommend-range w-full"
          style={{ "--range-progress": getRangeProgress(numeric, 0, 120) }}
        />
        <div className="mt-[18px] flex justify-between px-1 font-pretendard text-[17px] font-semibold text-[#454545]">
          <span>0개월</span>
          <span>120개월</span>
        </div>
      </div>

      <div className="mb-3 flex h-[46px] w-full max-w-[488px] items-center rounded-full border border-[#D9D9D9] bg-white px-6 focus-within:border-[#03BFA5]">
        <div className="mr-4 flex h-[25px] w-[66px] items-center justify-center rounded-[4px] border border-[#E0E0E0] bg-[#FBFBFB]">
          <FormInput
            type="text"
            inputMode="numeric"
            value={months}
            onChange={handleTyping}
            className={`w-full border-none bg-transparent text-center font-pretendard text-[16px] outline-none focus:ring-0 ${numberColor}`}
          />
        </div>
        <span className="font-pretendard text-[18px] text-[#454545]">개월</span>
      </div>
    </>
  );
}
