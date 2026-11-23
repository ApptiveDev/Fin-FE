import { contributionDisplayValue } from "../utils/recommendationResult";

function handleCardKeyDown(event, onClick) {
  if (!onClick) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
}

// 태그는 문자열이거나, 키워드 태그처럼 색이 정해진 { label, kind } 객체다.
// kind: benefit(핵심 혜택, 회색 배경) / bank(은행 거래 우대, 파란 배경)
const KEYWORD_TAG_STYLE = {
  benefit: "bg-[#F2F3F5] text-[#333333] font-medium",
  bank: "bg-[#E2F3FD] text-[#1664C0] font-medium",
  suitabilityBank: "bg-[#FEE7FF] text-[#7A20A2] font-medium",
};

function tagLabel(tag) {
  return typeof tag === "string" ? tag : tag.label;
}

// 목록 카드에서 숨기는 태그(데이터는 그대로 두고 화면에서만 가린다).
const HIDDEN_CARD_TAGS = new Set(["예금자보호"]);

function visibleCardTags(tags) {
  return tags.filter((tag) => !HIDDEN_CARD_TAGS.has(tagLabel(tag)));
}

function getTagStyle(tag) {
  if (typeof tag !== "string") return KEYWORD_TAG_STYLE[tag.kind] ?? "bg-[#F5F5F5] text-[#333333] font-medium";
  let tagStyle = "bg-[#F5F5F5] text-[#333333] font-medium";
  if (tag.includes("적합도")) tagStyle = "bg-[#FFF4E0] text-[#E65200] font-medium";
  if (tag.includes("정부기여금") || tag.includes("정부 지원금")) tagStyle = "bg-[#E0FDF9] text-[#333333] font-medium";
  if (tag.includes("내집마련")) tagStyle = "bg-[#F0F2FF] text-[#6B4EFF] font-medium";
  return tagStyle;
}

// TOP 카드 알약: 기본은 카드 패딩 안쪽 폭(min-w-full)이지만, 글자가 길면 패딩(52px)을 침범해
// 카드 테두리에서 12px 안쪽까지(좌우 42px씩 = 84px) 늘어나 되도록 한 줄로 보이게 한다.
// (카드 패딩 52px + 테두리 2px - 여백 12px = 42px)
const TOP_PILL_WIDTH = "shrink-0 min-w-full w-max max-w-[calc(100%+84px)]";

// 단기 예적금 카드의 금리 영역: 기본/최고 금리 대신 "내가 받을 금리 / 예상 세후 실수령액"을 보여준다.
// netReturnDisplay가 넘어오면(문자열) 이 모드이고, 비로그인이면 값을 가린다.
function getRateStats({ netReturnDisplay, isLoggedIn, myRate, baseRate, maxRate }) {
  if (netReturnDisplay === undefined) {
    return {
      left: { label: "기본 금리", value: `연 ${baseRate}%` },
      right: { label: "최고 금리", value: `연 ${maxRate}%` },
      isNet: false,
    };
  }
  return {
    left: { label: "내가 받을 금리", value: isLoggedIn ? `연 ${myRate}%` : "연 ??? %" },
    right: { label: "예상 세후 실수령액", value: isLoggedIn && netReturnDisplay ? netReturnDisplay : "??? 원" },
    isNet: true,
  };
}

// TOP 카드는 폭이 좁아서 숫자가 길어지면(예: "연 3.06%" + "302.3만원") 줄바꿈이 생긴다.
// 줄바꿈 대신 두 값의 글자 수 합에 따라 글자 크기를 단계적으로 줄이고, 줄바꿈은 막는다.
function topCardRateTextSize(leftValue, rightValue) {
  const length = String(leftValue).length + String(rightValue).length;
  if (length <= 13) return "text-[32px]";
  if (length <= 15) return "text-[28px]";
  if (length <= 17) return "text-[24px]";
  return "text-[20px]";
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
  netReturnDisplay,
}) {
  const rateStats = getRateStats({ netReturnDisplay, isLoggedIn, myRate, baseRate, maxRate });
  const rateTextSize = topCardRateTextSize(rateStats.left.value, rateStats.right.value);
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
      className={`px-13 py-8 bg-white rounded-xl border-[2px] shadow-sm flex flex-col justify-between min-h-[380px] w-full min-w-0 transition-all ${
        isInteractive ? "hover:shadow-md cursor-pointer" : ""
      } ${
        isBest ? "border-[#03BFA5]" : "border-[#E0DFDF] hover:border-[#03BFA5]"
      }`}
    >
      <div>
        <h3 className="text-[26px] font-semibold text-[#03BFA5] mb-2">TOP {rank}</h3>
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {visibleCardTags(tags).map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-sm text-[16px] shrink-0 ${getTagStyle(tag)}`}>{tagLabel(tag)}</span>
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
          <div className="flex justify-center">
            <div className={`${TOP_PILL_WIDTH} rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-4 text-center text-[15px] text-[#03BFA5]`}>
              {contributionCaption}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-stretch px-2 mb-3 pt-1">
            <div>
              <p className="text-[14px] text-[#7A7A7A]">{rateStats.left.label}</p>
              <p className={`${rateTextSize} font-bold text-[#454545] leading-none mt-[6px] whitespace-nowrap`}>{rateStats.left.value}</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div>
              <p className="text-[14px] text-[#7A7A7A]">{rateStats.right.label}</p>
              <p className={`${rateTextSize} font-bold text-[#03BFA5] leading-none mt-[6px] whitespace-nowrap`}>{rateStats.right.value}</p>
            </div>
          </div>
          <div className="flex justify-center">
            {contributionCaption ? (
              <div className={`${TOP_PILL_WIDTH} rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-4 text-center text-[15px] text-[#03BFA5]`}>
                {contributionCaption}
              </div>
            ) : rateStats.isNet ? null : (
              /* 💡 비로그인 시 회색 처리 오류 수정 반영 */
              <div className={`${TOP_PILL_WIDTH} py-1 rounded-full border text-center text-[15px] ${
                ratePillActive ? "border-[#03BFA5] text-[#03BFA5] bg-[#EFFFFD]" : "border-gray-300 text-gray-400 bg-white"
              }`}>
                {ratePillLabel} <span className="ml-2 font-bold whitespace-nowrap">{ratePillDisplay}</span>
              </div>
            )}
          </div>
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
  netReturnDisplay,
}) {
  const rateStats = getRateStats({ netReturnDisplay, isLoggedIn, myRate, baseRate, maxRate });
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
          {visibleCardTags(tags).map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-[4px] text-[15px] ${getTagStyle(tag)}`}>{tagLabel(tag)}</span>
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
            <div className={`${rateStats.isNet ? "min-w-[115px]" : "w-[115px]"} text-right`}>
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">{rateStats.left.label}</p>
              <p className="text-[32px] font-bold text-[#454545] leading-none mt-[4px] whitespace-nowrap">{rateStats.left.value}</p>
            </div>
            <div className="w-px bg-[#E0E0E0]" />
            <div className={`${rateStats.isNet ? "min-w-[115px]" : "w-[115px]"} text-right`}>
              <p className="text-[14px] text-[#7A7A7A] mb-0.5 whitespace-nowrap">{rateStats.right.label}</p>
              <p className="text-[32px] font-bold text-[#03BFA5] leading-none mt-[4px] whitespace-nowrap">{rateStats.right.value}</p>
            </div>
          </div>
          {/* 금리 영역(115*2 + 1 + 28*2 = 287px)과 같은 폭의 박스 안에서 알약만 가운데 정렬 */}
          <div className="mt-4 flex w-[287px] justify-center">
            {contributionCaption ? (
              <div className="shrink-0 min-w-[250px] rounded-full border border-[#03BFA5] bg-[#EFFFFD] py-1 px-5 text-center text-[15px] text-[#03BFA5]">
                {contributionCaption}
              </div>
            ) : rateStats.isNet ? null : (
              <div className={`shrink-0 min-w-[64px] py-[7px] px-10 rounded-full border flex items-center justify-between gap-4 font-normal text-[15px] leading-none ${
                ratePillActive ? "border-[#03BFA5] text-[#03BFA5] bg-[#EFFFFD]" : "border-gray-300 text-gray-400 bg-white"
              }`}>
                <span>{ratePillLabel}</span>
                <span className="min-w-[64px] text-right font-semibold leading-none whitespace-nowrap">{ratePillDisplay}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
