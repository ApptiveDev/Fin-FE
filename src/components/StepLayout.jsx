import StepBadge from "./StepBadge";

export default function StepLayout({ step, title, sub, children }) {
  return (
    <div className="relative w-full min-h-[var(--scaled-step-layout-min-height,456px)]">
      <div
        className="absolute left-0 top-0 flex min-h-[var(--step-layout-min-height,570px)] origin-top-left flex-col"
        style={{
          width: "var(--step-content-width, 125%)",
          transform: "scale(var(--step-content-scale, 0.8))",
        }}
      >
        <StepBadge step={step} />
        <h2 className="text-[30px] font-semibold text-[#454545] mb-0">{title}</h2>
        <p className="text-[18px] font-normal text-[#454545] leading-normal whitespace-pre-line">{sub}</p>
        <div className="w-full flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
