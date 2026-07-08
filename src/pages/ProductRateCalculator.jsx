import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findProductById, PRODUCTS } from "../data/products";
import { openProductApplication } from "../utils/productApplyLink";

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19 8 12l7-7" />
    </svg>
  );
}

function InfoCircleIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 10.5v5" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TaxIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10" />
    </svg>
  );
}

function formatWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")} 원`;
}

function parseRate(rateText) {
  const value = Number(String(rateText).replace("%", ""));
  return Number.isFinite(value) ? value / 100 : 0;
}

function Chip({ label, active }) {
  return (
    <span
      className={`flex h-[44px] items-center justify-center rounded-full px-[24px] text-[22px] font-medium leading-[1.2] ${
        active
          ? "border-2 border-[#03BFA5] bg-[#F7FFFE] text-[#03BFA5]"
          : "border border-[#E4E4E4] bg-white text-[#454545]"
      }`}
    >
      {label}
    </span>
  );
}

function OptionButton({ active, children, onClick, className = "", activeTone = "mint" }) {
  const activeClass = activeTone === "soft"
    ? "border border-[#E4E4E4] bg-[#EFEFEF] text-[#454545]"
    : "border-2 border-[#03BFA5] bg-[#F7FFFE] text-[#03BFA5]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[58px] items-center justify-center rounded-[10px] text-[22px] font-medium leading-[1.2] transition-colors ${
        active
          ? activeClass
          : "border border-[#E4E4E4] bg-white text-[#454545] hover:border-[#03BFA5]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function CalculatorCard({ children, className = "" }) {
  return (
    <section className={`rounded-[20px] border border-[#D5D5D5] bg-white ${className}`}>
      {children}
    </section>
  );
}

function AmountCard({ amount }) {
  return (
    <CalculatorCard className="relative h-[165px] px-[38px] py-[38px]">
      <h2 className="text-[22px] font-semibold leading-[1.2] text-[#454545]">월 납입액</h2>
      <div className="absolute bottom-[36px] right-[38px] flex items-end gap-[14px] text-[#454545]">
        <span className="text-[45px] font-bold leading-[1.2]">{amount.toLocaleString("ko-KR")}</span>
        <span className="pb-[10px] text-[26px] font-medium leading-[1.2]">원</span>
      </div>
    </CalculatorCard>
  );
}

function PeriodCard({ months, onChange }) {
  const options = [6, 12, 24, 36];

  return (
    <CalculatorCard className="relative h-[220px] px-[42px] py-[38px]">
      <h2 className="text-[22px] font-semibold leading-[1.2] text-[#454545]">저축 기간</h2>
      <div className="absolute right-[38px] top-[65px] flex items-end gap-[10px] text-[#454545]">
        <span className="text-[45px] font-bold leading-[1.2]">{months}</span>
        <span className="pb-[10px] text-[26px] font-medium leading-[1.2]">개월</span>
      </div>
      <div className="absolute bottom-[36px] right-[38px] flex gap-[6px]">
        {options.map((option) => (
          <OptionButton
            key={option}
            active={months === option}
            onClick={() => onChange(option)}
            className="h-[50px] rounded-full px-[24px]"
          >
            {option}개월
          </OptionButton>
        ))}
      </div>
    </CalculatorCard>
  );
}

function ToggleCard({ title, options, value, onChange, activeTone = "soft" }) {
  return (
    <CalculatorCard className="h-[170px] px-[38px] py-[38px]">
      <h2 className="text-[22px] font-semibold leading-[1.2] text-[#454545]">{title}</h2>
      <div className="mt-[6px] grid grid-cols-2 gap-[5px]">
        {options.map((option) => (
          <OptionButton key={option} active={value === option} onClick={() => onChange(option)} activeTone={activeTone}>
            {option}
          </OptionButton>
        ))}
      </div>
    </CalculatorCard>
  );
}

function RateHero({ product }) {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[180px] items-center justify-between gap-8 rounded-[10px] bg-[#EFFFFD] px-[38px] py-[34px]">
      <button
        type="button"
        onClick={() => navigate(`/products/${product.id}`)}
        className="absolute right-[39px] top-[31px] flex items-center gap-[14px] text-[20px] font-medium leading-[1.2] text-[#454545] transition-colors hover:text-[#03BFA5]"
      >
        <ArrowLeftIcon className="size-[21px]" />
        계산 금리 수정하기
      </button>
      <div>
        <p className="mb-[17px] text-[22px] font-semibold leading-[1.2] text-[#454545]">내가 받을 수 있는 금리</p>
        <div className="flex flex-wrap items-end gap-[7px]">
          <span className="text-[50px] font-bold leading-[1.2] text-[#03BFA5]">{product.calculator.headlineRate}</span>
          <span className="pb-[10px] text-[22px] font-medium leading-[1.2] text-[#454545]">(연)</span>
          <span className="pb-[11px] text-[20px] font-medium leading-[1.2] text-[#454545]">{product.calculator.baseText}</span>
        </div>
      </div>
      <div className="mt-[68px] flex flex-wrap justify-end gap-[6px]">
        {product.calculator.chips.map((chip) => (
          <Chip key={chip.label} label={chip.label} active={chip.active} />
        ))}
      </div>
    </section>
  );
}

function ResultRow({ label, value, tone = "default" }) {
  const colorClass = tone === "positive" ? "text-[#03BFA5]" : tone === "negative" ? "text-[#D3455B]" : "text-[#454545]";

  return (
    <div className="flex h-[45px] items-start justify-between border-b border-[#D9D9D9] text-[24px] font-medium leading-[1.2]">
      <span className="text-[#454545]">{label}</span>
      <span className={colorClass}>{value}</span>
    </div>
  );
}

function ResultCard({ principal, interest, tax, finalAmount }) {
  return (
    <CalculatorCard className="h-[407px] px-[38px] py-[38px]">
      <h2 className="text-[22px] font-semibold leading-[1.2] text-[#454545]">예상 수령액</h2>
      <div className="mt-[35px] flex flex-col gap-[15px]">
        <ResultRow label="납입원금합계" value={formatWon(principal)} />
        <ResultRow label="세전 이자" value={`+ ${formatWon(interest)}`} tone="positive" />
        <div className="flex items-center justify-between text-[24px] font-medium leading-[1.2]">
          <span className="text-[#454545]">이자 과세 (15.4%)</span>
          <span className="flex items-center gap-[5px] text-[#D3455B]">
            <TaxIcon className="size-[22px]" />
            - {formatWon(tax)}
          </span>
        </div>
      </div>
      <div className="mt-[33px] border-t-2 border-[#D9D9D9] pt-[25px]">
        <div className="flex items-center justify-between">
          <span className="text-[24px] font-semibold leading-[1.2] text-[#454545]">세후 실수령액</span>
          <span className="text-[40px] font-semibold leading-[1.2] text-[#03BFA5]">{formatWon(finalAmount)}</span>
        </div>
      </div>
    </CalculatorCard>
  );
}

function BottomActions({ product }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="grid grid-cols-2 gap-[10px]">
        <button
          type="button"
          onClick={() => navigate(`/products/${product.id}`)}
          className="flex h-[78px] items-center justify-center gap-[10px] rounded-[10px] border-2 border-[#03BFA5] bg-white text-[25px] font-semibold leading-[1.2] text-[#03BFA5]"
        >
          <ArrowLeftIcon className="size-[16px]" />
          상품 상세
        </button>
        <button
          type="button"
          onClick={() => openProductApplication(product)}
          className="flex h-[78px] items-center justify-center rounded-[10px] border-2 border-[#03BFA5] bg-[#03BFA5] text-[25px] font-semibold leading-[1.2] text-white"
        >
          신청하러 가기
        </button>
      </div>
      <div className="flex min-h-[93px] items-center rounded-[10px] border border-[#03BFA5] bg-[#F7FFFE] px-[37px] py-[22px]">
        <InfoCircleIcon className="mr-[9px] size-[20px] shrink-0 text-[#03BFA5]" />
        <p className="text-[18px] font-normal leading-[1.3] text-[#454545]">
          매월 초 ∙ 매월 동일액 납입 가정 기준 예상치입니다(첫 회차가 전 기간, 마지막 회차가 1개월치 이자) 실제 납입 시점 ∙ 금액에 따라 수령액이 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function ProductRateCalculator() {
  const { productId } = useParams();
  const product = findProductById(productId) || PRODUCTS[0];
  const [months, setMonths] = useState(product.calculator.months);
  const [accumulationType, setAccumulationType] = useState(product.calculator.accumulationType);
  const [interestType, setInterestType] = useState(product.calculator.interestType);
  const [taxType, setTaxType] = useState(product.calculator.taxType);

  const result = useMemo(() => {
    const monthlyAmount = product.calculator.monthlyAmount;
    const principal = monthlyAmount * months;
    const rate = parseRate(product.calculator.headlineRate);
    const simpleInterest = monthlyAmount * rate * months * (months + 1) / 24;
    const interest = interestType === "복리" ? simpleInterest * 1.015 : simpleInterest;
    const tax = taxType.includes("비과세") ? 0 : interest * 0.154;

    return {
      principal,
      interest,
      tax,
      finalAmount: principal + interest - tax,
    };
  }, [interestType, months, product.calculator.headlineRate, product.calculator.monthlyAmount, taxType]);

  return (
    <main className="min-h-screen bg-white font-inter text-[#454545]">
      <div className="mx-auto w-full max-w-[1535px]">
        <h1 className="mb-[32px] pt-[74px] text-[32px] font-bold leading-[1.2] text-[#454545]">적금 수익률 계산기</h1>
        <RateHero product={product} />

        <div className="mt-[28px] grid gap-[30px] xl:grid-cols-[752px_762px]">
          <div className="flex flex-col gap-[20px]">
            <AmountCard amount={product.calculator.monthlyAmount} />
            <PeriodCard months={months} onChange={setMonths} />
            <ToggleCard
              title="적립 방식"
              options={["정액", "자유"]}
              value={accumulationType}
              onChange={setAccumulationType}
            />
            <ToggleCard
              title="이자 방식"
              options={["단리", "복리"]}
              value={interestType}
              onChange={setInterestType}
            />
            <ToggleCard
              title="과세 유형"
              options={["일반 15.4%", "비과세 0%"]}
              value={taxType}
              onChange={setTaxType}
              activeTone="mint"
            />
          </div>

          <div className="flex flex-col gap-[12px]">
            <ResultCard {...result} />
            <BottomActions product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
