import StepBadge from "./StepBadge";

// step 제목/설명 공통 레이아웃
export default function StepLayout({ step, title, sub, children }) {
  return (
    <div>
      <StepBadge step={step} />
      <h2 className="text-[22px] font-bold text-[#454545] mb-2">{title}</h2>
      <p className="text-[13px] font-regular text-[#454545] mb-8">{sub}</p>
      {children}
    </div>
  );
}