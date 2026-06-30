function handleCardKeyDown(event, onClick) {
  if (!onClick) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
}

function getTagStyle(tag) {
  if (tag.includes("적합도")) return "bg-[#FFF4E0] text-[#E65200]";
  if (tag.includes("_ok") || tag.includes("정부기여금") || tag.includes("우대")) {
    return "bg-[#E0FDF9] text-[#333333]";
  }
  if (tag.includes("내집마련") || tag.includes("청약")) return "bg-[#F4EFFF] text-[#7B42C8]";
  if (tag.includes("소득공제")) return "bg-[#EAF4FF] text-[#2C88D9]";
  return "bg-[#F2F3F5] text-[#333333]";
}

function ProductTag({ tag, compact = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[6px] font-normal leading-[1.2] ${getTagStyle(tag)} ${
        compact ? "shrink-0" : "min-w-0 max-w-full"
      } ${
        compact ? "h-[22px] px-[8px] text-[13px]" : "h-[32px] px-[13px] text-[18px]"
      }`}
    >
      {tag}
    </span>
  );
}

function ProductCardShell({ children, onClick, className = "" }) {
  return (
    <div
      className={`cursor-pointer transition-colors hover:border-[#03BFA5] ${className}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => handleCardKeyDown(event, onClick)}
    >
      {children}
    </div>
  );
}

function RatePair({ label, value, accent = false }) {
  return (
    <div className="flex w-[126.67px] flex-col items-start leading-[1.2]">
      <p className="h-[23px] text-left text-[17.2px] font-normal text-[#606060]">{label}</p>
      <p className={`h-[45px] whitespace-nowrap text-left text-[34.4px] font-bold ${accent ? "text-[#03BFA5]" : "text-[#181818]"}`}>
        연 {value}%
      </p>
    </div>
  );
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
}) {
  const visibleTags = tags.slice(0, 3);
  const hasContribution = showContribution && contributionRate && maturityContribution;
  const titleSize = title.length > 11 ? "text-[27px]" : "text-[32px]";

  return (
    <ProductCardShell
      onClick={onClick}
      className={`flex h-[423px] w-full flex-col items-center overflow-hidden rounded-[10px] border-2 px-[26px] pb-[46px] pt-[44px] ${
        isBest ? "border-[#03BFA5]" : "border-[#E0DFDF]"
      }`}
    >
      <div className="flex w-full max-w-[338px] flex-col gap-[26px]">
        <div className="flex flex-col gap-[19px]">
          <p className="h-[30px] text-[28px] font-semibold leading-[1.2] text-[#03BFA5]">TOP {rank}</p>
          <div className="flex max-w-full items-center gap-[5px] overflow-hidden">
            {visibleTags.map((tag) => (
              <div key={tag} className="min-w-0">
                <ProductTag tag={tag} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-[276px] flex-col gap-[14px] text-[#181818]">
          <h3 className={`font-semibold leading-[1.2] break-keep ${titleSize}`}>{title}</h3>
          <p className="text-[14px] font-medium leading-[1.25] text-[#181818]">{subtitle}</p>
        </div>
      </div>

      <div className={`mt-auto flex w-full flex-col items-center ${hasContribution ? "max-w-[382px] gap-[10px]" : "max-w-[338px] gap-[17px]"}`}>
        {hasContribution ? (
          <div className="flex w-full flex-col items-center gap-[10px]">
            <div className="flex w-full items-center justify-center gap-[27px]">
              <div className="flex w-[148px] flex-col items-start justify-center gap-[8px] leading-[1.2] text-[#454545]">
                <p className="h-[26px] whitespace-nowrap text-left text-[17.23px] font-normal">기여금 환산 수익률</p>
                <p className="h-[53px] whitespace-nowrap text-left text-[34.47px] font-bold">{contributionRate}</p>
              </div>
              <div className="h-[75px] w-px bg-[#D5D5D5]" />
              <div className="flex w-[165px] flex-col items-start justify-center gap-[8px] leading-[1.2]">
                <p className="h-[26px] whitespace-nowrap text-left text-[17.23px] font-normal text-[#454545]">예상 만기 기여금 총액</p>
                <p className="h-[52px] w-full whitespace-nowrap text-center text-[34.47px] font-bold text-[#03BFA5]">{maturityContribution}</p>
              </div>
            </div>
            <p className="w-full text-center text-[15.51px] font-normal leading-[1.2] text-[#606060]">
              {contributionCaption}
            </p>
          </div>
        ) : (
          <>
            <div className="flex h-[74px] w-full items-center justify-center gap-[14px] sm:gap-[35px]">
              <RatePair label="기본 금리" value={baseRate} />
              <div className="h-[65px] w-px bg-[#D5D5D5]" />
              <RatePair label="최대 수익 효과" value={maxRate} accent />
            </div>
            <div className="flex h-[31px] w-full max-w-[326px] items-center justify-start gap-[10px] rounded-full border border-[#03BFA5] bg-[#EFFFFD] pl-[clamp(24px,15%,50px)] pr-[12px] text-center leading-[1.2] text-[#03BFA5] sm:gap-[15.5px]">
              <span className="w-[147px] text-[15.5px] font-normal">내가 받을 수 있는 금리</span>
              <span className="text-[17.2px] font-semibold">
                {isLoggedIn ? `연 ${myRate}%` : "연 ??? %"}
              </span>
            </div>
          </>
        )}
      </div>
    </ProductCardShell>
  );
}

function ListRateBlock({ label, value, accent = false }) {
  return (
    <div className="flex w-[147px] flex-col items-start leading-[1.2]">
      <span className="h-[26px] w-full text-left text-[20px] font-normal text-[#606060]">{label}</span>
      <span className={`h-[52px] w-full whitespace-nowrap text-left text-[40px] font-bold ${accent ? "text-[#03BFA5]" : "text-[#454545]"}`}>
        연 {value}%
      </span>
    </div>
  );
}

function ContributionMetric({ label, value, accent = false, className = "", valueAlign = "left" }) {
  const valueAlignClass = valueAlign === "center" ? "text-center" : "text-left";

  return (
    <div className={`flex h-[75px] flex-col items-start justify-center gap-[8px] leading-[1.2] ${className}`}>
      <p className="h-[26px] whitespace-nowrap text-left text-[20px] font-normal text-[#606060]">{label}</p>
      <p className={`h-[52px] w-full whitespace-nowrap ${valueAlignClass} text-[40px] font-bold ${accent ? "text-[#03BFA5]" : "text-[#454545]"}`}>
        {value}
      </p>
    </div>
  );
}

function RatePill({ isLoggedIn, myRate }) {
  return (
    <div className="flex items-center gap-[10px] rounded-[164px] border border-[#03BFA5] bg-[#EFFFFD] px-[15px] py-[6px] leading-[1.2] text-[#03BFA5]">
      <span className="h-[22px] w-[170px] text-center text-[18px] font-normal">내가 받을 수 있는 금리</span>
      <span className="h-[22px] w-[80px] text-center text-[20px] font-semibold">
        {isLoggedIn ? `연 ${myRate} %` : "연 ??? %"}
      </span>
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
  isHighlighted = false,
  variant = "rate",
  contributionRate,
  maturityContribution,
  contributionCaption,
}) {
  const isContribution = variant === "contribution";

  return (
    <ProductCardShell
      onClick={onClick}
      className={`flex min-h-[175px] w-full flex-col items-start gap-[24px] rounded-[10px] bg-white px-[40px] py-[24px] min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between ${
        isHighlighted ? "border-2 border-[#03BFA5]" : `${isContribution ? "border" : "border-2"} border-[#D5D5D5]`
      }`}
    >
      <div className={`${isContribution ? "w-full min-[1100px]:w-[550px]" : "w-full min-[1100px]:w-[695px]"} min-w-0`}>
        <div className="mb-[13px] flex max-w-full flex-wrap gap-[9px]">
          {tags.slice(0, 4).map((tag) => (
            <ProductTag key={tag} tag={tag} />
          ))}
        </div>
        <h3 className="mb-[10px] text-[36px] font-semibold leading-[1.2] text-[#454545]">{title}</h3>
        <p className="text-[22px] font-medium leading-[1.2] text-[#333333]">{subtitle}</p>
      </div>

      {isContribution ? (
        <div className="flex w-full shrink-0 flex-col items-center gap-[19px] min-[1100px]:w-[443px]">
          <div className="flex w-full items-center justify-center gap-[41px]">
            <ContributionMetric label="기여금 환산 수익률" value={contributionRate} className="w-[170px]" />
            <div className="h-[75px] w-px bg-[#D5D5D5]" />
            <ContributionMetric label="예상 만기 기여금 총액" value={maturityContribution} accent className="w-[185px]" valueAlign="center" />
          </div>
          <p className="w-full text-center text-[18px] font-normal leading-[1.2] text-[#606060]">{contributionCaption}</p>
        </div>
      ) : (
        <div className="flex w-full shrink-0 flex-col items-center gap-[9px] min-[1100px]:w-[394px] min-[1100px]:items-end">
          <div className="flex h-[86px] w-[376px] items-center justify-center gap-[41px]">
            <ListRateBlock label="기본 금리" value={baseRate} />
            <div className="h-[75px] w-px bg-[#D5D5D5]" />
            <ListRateBlock label="최고 금리" value={maxRate} accent />
          </div>
          <RatePill isLoggedIn={isLoggedIn} myRate={myRate} />
        </div>
      )}
    </ProductCardShell>
  );
}
