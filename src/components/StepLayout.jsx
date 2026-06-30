import StepBadge from "./StepBadge";

export default function StepLayout({ step, title, sub, children }) {
  return (
    <div className="w-full min-h-[var(--step-layout-min-height,570px)] flex flex-col">
      <StepBadge step={step} />
      <h2 className="text-[30px] font-semibold text-[#454545] mb-0">{title}</h2>
      <p className="text-[18px] font-normal text-[#454545] leading-normal whitespace-pre-line">{sub}</p>
      <div className="w-full flex flex-1 flex-col">{children}</div>
    </div>
  );
}
