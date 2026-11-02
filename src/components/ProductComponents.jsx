import { contributionDisplayValue } from "../utils/recommendationResult";

function handleCardKeyDown(event, onClick) {
  if (!onClick) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
}

function getTagStyle(tag) {
  let tagStyle = "bg-[#F5F5F5] text-[#333333] font-medium";
  if (tag.includes("적합도")) tagStyle = "bg-[#FFF4E0] text-[#E65200] font-medium";
  if (tag.includes("정부기여금") || tag.includes("정부 지원금")) tagStyle = "bg-[#E0FDF9] text-[#333333] font-medium";
  if (tag.includes("내집마련")) tagStyle = "bg-[#F0F2FF] text-[#6B4EFF] font-medium";
  return tagStyle;
}

// 상단 TOP 3 카드
export function TopCard({
  rank,
  title,
  subtitle,
  baseRate,
  maxRate,
  myRate,
  tags,
  isBest,
  isLoggedIn,
  onClick,
  contributionRate,
  maturityContribution,
  contributionCaption,
  showContribution = false,
  ratePillLabel = "내가 받을 수 있는 금리",
  ratePillValue,
}) {
  const hasContribution = showContribution && contributionRate && maturityContribution;
  const ratePillActive = ratePillValue !== undefined ? true : isLoggedIn;
  const ratePillDisplay = ratePillValue !== undefined ? ratePillValue : (isLoggedIn ? `연 ${myRate}%` : "연 ??? %");
  const isInteractive = Boolean(onClick);
  const displayedContributionRate = contributionDisplayValue(contributionRate, isLoggedIn);
  const displayedMaturityContribution = contributionDisplayValue(
    maturityContribution,
    isLoggedIn,
  );

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => handleCardKeyDown(event, onClick)}
      className={`px-13 py-8 bg-white rounded-xl border-[2px] shadow-sm flex flex-col justify-between min-h-[380px] w-full transition-all ${
        isInteractive ? "hover:shadow-md cursor-pointer" : ""
      } ${
        isBest ? "border-[#03BFA5]" : "border-[#E0DFDF] hover:border-[#03BFA5]"
      }`}
    >
      <div>
        <h3 className="text-[26px] font-semibold text-[#03BFA5] mb-2">TOP {rank}</h3>
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {tags.map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-sm text-[16px] shrink-0 ${getTagStyle(tag)}`}>{tag}</span>
          ))}
        </div>
        <h4 className="text-[30px] font-extrabold text-[#333333] mb-0.5 break-keep">{title}</h4>
        <p className="text-[18px] text-[#333333] font-semibold leading-normal mb-4">{subtitle}</p>
      </div>

      {hasContribution ? (
        <div>
          <div className="flex justify-between items-stretch mb-3 pt-1">
            <div>
              <p className="text-[14px] text-[#7A7A7A]">기여금 환산 수익률</p>
              <p className="text-[32px] font-bold text-[#181818] leading-none mt-[6px]">{displayedContributionRate}</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div>
              <p className="text-[14px] text-[#7A7A7A]">예상 만기 기여금 총액</p>
              <p className="text-[32px] font-bold text-[#03BFA5] leading-none mt-[6px]">{displayedMaturityContribution}</p>
            </div>
          </div>
          <div className="w-full rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-2 text-center text-[15px] text-[#03BFA5]">
            {contributionCaption}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-stretch px-2 mb-3 pt-1">
            <div>
              <p className="text-[14px] text-[#7A7A7A]">기본 금리</p>
              <p className="text-[32px] font-bold text-[#454545] leading-none mt-[6px]">연 {baseRate}%</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div>
              <p className="text-[14px] text-[#7A7A7A]">최고 금리</p>
              <p className="text-[32px] font-bold text-[#03BFA5] leading-none mt-[6px]">연 {maxRate}%</p>
            </div>
          </div>
          {contributionCaption ? (
            <div className="w-full rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-2 text-center text-[15px] text-[#03BFA5]">
              {contributionCaption}
            </div>
          ) : (
            /* 💡 비로그인 시 회색 처리 오류 수정 반영 */
            <div className={`w-full py-1 rounded-full border text-center text-[15px] ${
              ratePillActive ? "border-[#03BFA5] text-[#03BFA5] bg-[#EFFFFD]" : "border-gray-300 text-gray-400 bg-white"
            }`}>
              {ratePillLabel} <span className="ml-2 font-bold whitespace-nowrap">{ratePillDisplay}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 하단 세로형 리스트 아이템
export function ListItem({
  title,
  subtitle,
  baseRate,
  maxRate,
  myRate,
  tags,
  isLoggedIn,
  onClick,
  variant = "rate",
  contributionRate,
  maturityContribution,
  contributionCaption,
  rank,
  ratePillLabel = "내가 받을 금리",
  ratePillValue,
}) {
  const isContribution = variant === "contribution";
  const isInteractive = Boolean(onClick);
  const displayedContributionRate = contributionDisplayValue(contributionRate, isLoggedIn);
  const displayedMaturityContribution = contributionDisplayValue(
    maturityContribution,
    isLoggedIn,
  );
  const ratePillActive = ratePillValue !== undefined ? true : isLoggedIn;
  const ratePillDisplay = ratePillValue !== undefined ? ratePillValue : `연 ${isLoggedIn ? `${myRate}%` : "???%"}`;

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => handleCardKeyDown(event, onClick)}
      className={`px-2 py-[20px] bg-white flex flex-col lg:flex-row lg:items-center justify-between transition-all gap-4 ${
        isInteractive ? "cursor-pointer" : ""
      }`}
    >
      <div className={`grid ${rank !== undefined ? "grid-cols-[28px_1fr] gap-x-10" : "grid-cols-1"}`}>
        <div className={`${rank !== undefined ? "col-start-2" : "col-start-1"} row-start-1 flex gap-2 mb-2 flex-wrap`}>
          {tags.map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-[4px] text-[15px] ${getTagStyle(tag)}`}>{tag}</span>
          ))}
        </div>
        {rank !== undefined && (
          <span className={`col-start-1 row-start-2 self-center flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[22px] font-bold ${
            rank <= 3 ? "bg-[#F0FFFE] text-[#03BFA5]" : "bg-[#F2F3F5] text-[#797979]"
          }`}>
            {rank}
          </span>
        )}
        <h4 className={`${rank !== undefined ? "col-start-2" : "col-start-1"} row-start-2 text-[27px] font-bold text-[#333333]`}>{title}</h4>
        <p className={`${rank !== undefined ? "col-start-2" : "col-start-1"} row-start-3 mt-1 text-[15px] font-medium text-[#333333]`}>{subtitle}</p>
      </div>

      {isContribution ? (
        <div className="flex flex-col items-end mt-3">
          <div className="flex items-stretch gap-7">
            <div className="w-[115px] text-right">
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">기여금 환산 수익률</p>
              <p className="text-[32px] font-bold text-[#454545] leading-none mt-[4px] whitespace-nowrap">{displayedContributionRate}</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div className="w-[115px] text-right">
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">예상 만기 기여금 총액</p>
              <p className="text-[32px] font-bold text-[#03BFA5] leading-none mt-[4px] whitespace-nowrap">{displayedMaturityContribution}</p>
            </div>
          </div>
          <div className="mt-4 w-full rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-2 text-center text-[15px] text-[#03BFA5]">
            {contributionCaption}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-end mt-3">
          <div className="flex items-stretch gap-7">
            <div className="w-[115px] text-right">
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">기본 금리</p>
              <p className="text-[32px] font-bold text-[#454545] leading-none mt-[4px] whitespace-nowrap">연 {baseRate}%</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div className="w-[115px] text-right">
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">최고 금리</p>
              <p className="text-[32px] font-bold text-[#03BFA5] leading-none mt-[4px] whitespace-nowrap">연 {maxRate}%</p>
            </div>
          </div>
          {contributionCaption ? (
            <div className="mt-4 w-full rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-2 text-center text-[15px] text-[#03BFA5]">
              {contributionCaption}
            </div>
          ) : (
            <div className={`mt-4 w-full py-0.5 px-10 rounded-full border flex items-center justify-between font-medium text-[16px] ${
              ratePillActive ? "border-[#03BFA5] text-[#03BFA5] bg-[#EFFFFD]" : "border-gray-300 text-gray-400 bg-white"
            }`}>
              <span>{ratePillLabel}</span>
              <span className="w-[64px] text-[17px] text-right font-semibold whitespace-nowrap">{ratePillDisplay}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
