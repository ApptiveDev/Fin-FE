import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useMyPage, { splitTrailingParen } from "../hooks/UseMyPage";
import heartIcon from "../assets/green_heart.png";

function ExternalLinkIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
    </svg>
  );
}

function ChevronIcon({ direction = "left", className = "" }) {
  return (
    <svg
      className={`${className} ${direction === "right" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PencilIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/* ---------- 상단 탭 ---------- */

function Tabs({ active, onChange, likedCount }) {
  const tabs = [
    { key: "liked", label: "찜해둔 Fin.", badge: likedCount },
    { key: "info", label: "개인정보" },
  ];

  return (
    <div className="flex items-center gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center gap-1.5 py-4 text-[17px] font-semibold transition-colors ${
            active === tab.key ? "text-[#03BFA5]" : "text-[#A5A5A5] hover:text-[#606060]"
          }`}
        >
          {tab.label}
          {typeof tab.badge === "number" && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#03BFA5] px-1 text-[12px] font-bold leading-none text-white">
              {tab.badge}
            </span>
          )}
          {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#03BFA5]" />}
        </button>
      ))}
    </div>
  );
}

/* ---------- 찜해둔 Fin. 탭 ---------- */

function mapFavoriteItem(item) {
  const isContribution = Boolean(item.excludeFromRateComparison);
  const metrics = item.metrics || {};

  return {
    id: item.productPropertyId,
    title: item.productName,
    subtitle: item.summaryLine,
    tags: [`적합도 ${item.fitScore}%`, ...(item.keywords || [])],
    isContribution,
    contributionRate:
      isContribution && metrics.contributionYieldRate != null ? `연 ${metrics.contributionYieldRate.toFixed(1)}%` : null,
    maturityContribution:
      isContribution && metrics.expectedMaturityAmount != null
        ? `${Math.round(metrics.expectedMaturityAmount).toLocaleString()}만 원`
        : null,
    contributionCaption: item.calcBasisCaption,
    baseRate: !isContribution && metrics.baseRate != null ? metrics.baseRate.toFixed(1) : null,
    maxRate: !isContribution && metrics.maxRate != null ? metrics.maxRate.toFixed(1) : null,
    myRate: !isContribution && metrics.achievableRate != null ? metrics.achievableRate.toFixed(1) : null,
    applyUrl: item.applyUrl,
  };
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center justify-center rounded-lg border px-4 text-[14px] font-medium transition-colors ${
        active ? "border-[#03BFA5] bg-[#EFFFFD] text-[#03BFA5]" : "border-[#E0DFDF] bg-white text-[#606060] hover:border-[#03BFA5]"
      }`}
    >
      {label}
    </button>
  );
}

function SortDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-[#E0DFDF] bg-white px-4 text-[14px] font-medium text-[#454545] transition-colors hover:border-[#03BFA5]"
      >
        찜 최신순
        <ChevronDownIcon className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-32 overflow-hidden rounded-lg border border-[#EBEBEB] bg-white py-1 shadow-md">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-2 text-left text-[14px] font-medium text-[#03BFA5]"
          >
            찜 최신순
          </button>
        </div>
      )}
    </div>
  );
}

function LikedCard({ product, onRemove }) {
  const visibleTags = product.tags.slice(0, 3);

  return (
    <div className="relative flex w-[380px] shrink-0 flex-col gap-4 rounded-[10px] border-2 border-[#E0DFDF] bg-white px-7 py-6">
      <div className="flex flex-wrap items-center gap-2 pr-8">
        {visibleTags.map((tag) => (
          <span key={tag} className="rounded-md bg-[#F2F3F5] px-2 py-1 text-[13px] font-medium text-[#333333]">
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onRemove(product.id)}
        aria-label="찜 해제"
        className="absolute right-6 top-6 text-[#03BFA5]"
      >
        <img src={heartIcon} alt="찜 해제" className="size-6 object-contain" />
      </button>

      <div>
        <h3 className="text-[24px] font-bold leading-[1.2] text-[#181818]">{product.title}</h3>
        <p className="mt-1 text-[14px] font-medium text-[#606060]">{product.subtitle}</p>
      </div>

      {product.isContribution ? (
        <div className="flex flex-col items-center gap-2 rounded-[8px] bg-[#FAFAFA] py-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-start">
              <span className="text-[13px] text-[#8A8A8A]">기여금 환산 수익률</span>
              <span className="text-[22px] font-bold text-[#181818]">{product.contributionRate}</span>
            </div>
            <div className="h-10 w-px bg-[#D5D5D5]" />
            <div className="flex flex-col items-start">
              <span className="text-[13px] text-[#8A8A8A]">예상 만기 기여금 총액</span>
              <span className="text-[22px] font-bold text-[#03BFA5]">{product.maturityContribution}</span>
            </div>
          </div>
          {product.contributionCaption && (
            <p className="text-center text-[13px] text-[#8A8A8A]">{product.contributionCaption}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[8px] bg-[#FAFAFA] py-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-start">
              <span className="text-[13px] text-[#8A8A8A]">기본 금리</span>
              <span className="text-[22px] font-bold text-[#181818]">연 {product.baseRate}%</span>
            </div>
            <div className="h-10 w-px bg-[#D5D5D5]" />
            <div className="flex flex-col items-start">
              <span className="text-[13px] text-[#8A8A8A]">최고 금리</span>
              <span className="text-[22px] font-bold text-[#03BFA5]">연 {product.maxRate}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#03BFA5] bg-[#EFFFFD] px-4 py-1.5 text-[13px] text-[#03BFA5]">
            <span>내가 달성 가능한 금리</span>
            <span className="font-semibold">연 {product.myRate}%</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (product.applyUrl) window.open(product.applyUrl, "_blank", "noopener,noreferrer");
        }}
        className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#03BFA5] bg-[#03BFA5] text-[16px] font-semibold text-white transition-colors hover:bg-[#02A892]"
      >
        신청하러 가기
        <ExternalLinkIcon className="size-4" />
      </button>
    </div>
  );
}

function LikedProductsCarousel({ products, onRemove }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 400, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="이전 상품"
        className="absolute -left-5 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D5D5D5] bg-white text-[#606060] shadow-sm transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
      >
        <ChevronIcon direction="left" className="size-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <LikedCard key={product.id} product={product} onRemove={onRemove} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="다음 상품"
        className="absolute -right-5 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D5D5D5] bg-white text-[#606060] shadow-sm transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
      >
        <ChevronIcon direction="right" className="size-5" />
      </button>
    </div>
  );
}

function EmptyLikedState({ onGoRecommend }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#EFFFFD]">
        <img src={heartIcon} alt="" className="size-9 object-contain" />
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#181818]">아직 찜해둔 상품이 없어요</p>
        <div className="mt-2 text-[15px] leading-relaxed text-[#8A8A8A]">
          <p className="flex flex-wrap items-center justify-center gap-1">
            추천 결과에서 마음에 드는 상품의
            <img src={heartIcon} alt="하트" className="inline-block size-4 object-contain" />를 누르면
          </p>
          <p>여기에 모아두고 좌우로 비교할 수 있어요.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onGoRecommend}
        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#03BFA5] px-6 text-[17px] font-medium text-white transition-colors hover:bg-[#02A892]"
      >
        내 추천 상품 보러 가기 →
      </button>
      <p className="text-[13px] text-[#8A8A8A]">최대 20개까지 찜할 수 있어요</p>
    </div>
  );
}

function LikedTab({ favorites, showComparisonNotice, onRemove, onGoRecommend }) {
  const [filter, setFilter] = useState("all");

  const govCount = favorites.filter((item) => item.excludeFromRateComparison).length;
  const bankCount = favorites.length - govCount;

  const filtered = favorites.filter((item) => {
    if (filter === "gov") return item.excludeFromRateComparison;
    if (filter === "bank") return !item.excludeFromRateComparison;
    return true;
  });

  const mappedProducts = useMemo(() => filtered.map(mapFavoriteItem), [filtered]);

  if (favorites.length === 0) {
    return <EmptyLikedState onGoRecommend={onGoRecommend} />;
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip label="전체" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip label={`정부 지원 ${govCount}`} active={filter === "gov"} onClick={() => setFilter("gov")} />
          <FilterChip label={`은행 예·적금 ${bankCount}`} active={filter === "bank"} onClick={() => setFilter("bank")} />
        </div>
        <SortDropdown />
      </div>

      {showComparisonNotice && (
        <div className="mb-5 rounded-full bg-[#EFFFFD] px-6 py-3 text-center text-[14px] text-[#03BFA5]">
          정부 상품의 기여금 환산 수익률과 은행 상품의 달성 가능 금리는 산정 기준이 달라 수치를 직접 비교할 수 없어요.
        </div>
      )}

      {mappedProducts.length > 0 ? (
        <LikedProductsCarousel products={mappedProducts} onRemove={onRemove} />
      ) : (
        <p className="rounded-[10px] border border-dashed border-[#D5D5D5] py-16 text-center text-[#8A8A8A]">
          해당 조건의 찜한 상품이 없어요.
        </p>
      )}

      <p className="mt-4 text-center text-[13px] text-[#8A8A8A]">
        Y-Fin은 해당 상품의 판매·중개 주체가 아니며, 신청은 기관 공식 페이지에서 진행됩니다.
      </p>
    </section>
  );
}

/* ---------- 개인정보 탭 ---------- */

function FieldShell({ label, required, empty, emptyHelper, onEdit, className = "", children }) {
  return (
    <div
      className={`relative rounded-[10px] border bg-white px-5 py-4 pr-12 ${
        empty ? "border-dashed border-[#03BFA5]" : "border-[#EBEBEB]"
      } ${className}`}
    >
      <p className="mb-1.5 flex items-center gap-1 text-[14px] font-medium text-[#8A8A8A]">
        {label}
        {required && <span className="text-[#03BFA5]">*</span>}
      </p>

      {empty ? (
        <>
          <p className="text-[16px] font-semibold text-[#B5B5B5]">미입력</p>
          {emptyHelper && <p className="mt-1 text-[12px] text-[#8A8A8A]">{emptyHelper}</p>}
        </>
      ) : (
        children
      )}

      <button
        type="button"
        onClick={onEdit}
        aria-label={`${label} 수정`}
        className={`absolute right-3 top-3 flex size-7 items-center justify-center rounded-md border text-[#03BFA5] transition-colors hover:border-[#03BFA5] ${
          empty ? "border-[#03BFA5]" : "border-[#D8D8D8]"
        }`}
      >
        <PencilIcon className="size-3.5" />
      </button>
    </div>
  );
}

function TextField({ label, required, value, caption, emptyHelper, onEdit }) {
  return (
    <FieldShell label={label} required={required} empty={!value} emptyHelper={emptyHelper} onEdit={onEdit}>
      <p className="text-[16px] font-bold leading-[1.3] text-[#26313A]">
        {value}
        {caption && <span className="ml-1.5 text-[12px] font-medium text-[#8A8A8A]">· {caption}</span>}
      </p>
    </FieldShell>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-md border border-[#E0DFDF] bg-white px-2.5 py-1 text-[13px] font-medium text-[#454545]">
      {children}
    </span>
  );
}

function TagField({ label, required, tags, caption, groups, emptyHelper, onEdit, className = "" }) {
  const hasGroups = Array.isArray(groups);
  const visibleGroups = hasGroups ? groups.filter((group) => group.tags.length > 0) : [];
  const empty = hasGroups ? visibleGroups.length === 0 : !tags || tags.length === 0;

  return (
    <FieldShell label={label} required={required} empty={empty} emptyHelper={emptyHelper} onEdit={onEdit} className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {hasGroups
          ? visibleGroups.map((group, index) => (
              <span key={group.label} className="flex flex-wrap items-center gap-2">
                {index > 0 && <span className="h-4 w-px bg-[#D5D5D5]" aria-hidden="true" />}
                <span className="text-[13px] font-medium text-[#8A8A8A]">{group.label}</span>
                {group.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </span>
            ))
          : tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
        {caption && <span className="text-[13px] text-[#8A8A8A]">{caption}</span>}
      </div>
    </FieldShell>
  );
}

function EditFieldModal({ fieldLabel, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[400px] rounded-[20px] bg-white p-8 text-center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="mb-2 text-[18px] font-bold text-[#181818]">{fieldLabel} 수정</p>
        <p className="mb-6 text-[14px] leading-relaxed text-[#8A8A8A]">
          해당 항목 편집 기능은 준비 중이에요.
          <br />
          곧 만나보실 수 있어요.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-full bg-[#03BFA5] text-[15px] font-semibold text-white transition-colors hover:bg-[#02A892]"
        >
          확인
        </button>
      </div>
    </div>
  );
}

function InfoTab({ profile, optionTags, onEditField, onResubmit }) {
  if (!profile) {
    return <p className="py-24 text-center text-[#8A8A8A]">개인정보를 불러오지 못했어요.</p>;
  }

  const display = profile.display || {};
  const transactionHistory = display.transactionHistory || {};

  const savingPeriodRaw = optionTags.savingPeriod[0] || "";
  const { main: savingPeriodMain, caption: savingPeriodCaption } = splitTrailingParen(savingPeriodRaw);
  const statusRaw = optionTags.status[0] || "";

  const hasHousingInfo = profile.isHomeless != null && profile.isHouseholder != null;
  const hasTransactionHistory =
    (transactionHistory.firstTransactionBanks || []).length > 0 || (transactionHistory.redepositBanks || []).length > 0;

  const requiredFilled = [
    Boolean(profile.birthdate),
    Boolean(profile.annualIncome),
    Boolean(profile.householdSize && profile.householdIncomePercent),
    hasTransactionHistory,
    Boolean(profile.monthlySavingsGoal),
    Boolean(savingPeriodRaw),
    optionTags.bankRelation.length > 0,
  ].filter(Boolean).length;

  const optionalFilled = [
    Boolean(display.region),
    Boolean(profile.tenureMonths),
    hasHousingInfo,
    Boolean(statusRaw),
    optionTags.benefits.length > 0,
  ].filter(Boolean).length;

  const totalFilled = requiredFilled + optionalFilled;
  const summaryCaption =
    totalFilled === 12
      ? "저장된 12개 입력값이 정보 입력 화면에 미리 입력돼요."
      : `필수 ${requiredFilled}개는 입력됐어요 · 선택 항목은 언제든 추가할 수 있어요.`;

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-lg bg-[#EFFFFD] border border-[#03BFA5] px-5 py-4 text-[15px] leading-relaxed text-[#0C7C6E]">
        <p>다음 추천 시 자동으로 채워지는 정보예요.</p>
        <p className="flex flex-wrap items-center gap-1 font-semibold">
          항목 편집은 각 항목의 <PencilIcon className="size-3.5" /> 버튼을 눌러 진행할 수 있어요.
        </p>
      </div>

      <div className="rounded-lg border border-[#E7ECEA] bg-white px-5 py-4">
        <h3 className="mb-5 text-[19px] font-extrabold text-[#26313A]">자격 정보</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            required
            label="생년월일"
            value={profile.birthdate ? profile.birthdate.replaceAll("-", ".") : ""}
            caption={profile.birthdate ? `만 ${display.age}세 · 자동 계산` : ""}
            emptyHelper="생년월일 입력이 필요해요."
            onEdit={() => onEditField("생년월일")}
          />
          <TextField
            required
            label="개인 연 소득"
            value={profile.annualIncome ? `${profile.annualIncome.toLocaleString()} 만원` : ""}
            emptyHelper="연 소득 입력이 필요해요."
            onEdit={() => onEditField("개인 연 소득")}
          />
          <TextField
            required
            label="가구원 수 · 가구 소득"
            value={
              profile.householdSize ? `${profile.householdSize}인 · 중위 ${profile.householdIncomePercent}% 이하` : ""
            }
            caption={display.householdIncomeGuide ? `월 ${display.householdIncomeGuide.toLocaleString()}만 원 이하` : ""}
            emptyHelper="가구 정보 입력이 필요해요."
            onEdit={() => onEditField("가구원 수 · 가구 소득")}
          />

          <TextField
            label="거주 지역"
            value={display.region || ""}
            emptyHelper="지역 전용 상품 추천에 필요해요."
            onEdit={() => onEditField("거주 지역")}
          />
          <TextField
            label="근속 기간"
            value={profile.tenureMonths ? `${profile.tenureMonths}개월` : ""}
            caption={profile.isFirstJob ? "첫 직장" : ""}
            emptyHelper="재직 기간 우대 상품 추천에 필요해요."
            onEdit={() => onEditField("근속 기간")}
          />
          <TextField
            label="무주택 여부 · 세대주"
            value={
              hasHousingInfo
                ? `${profile.isHomeless ? "무주택" : "유주택"} · ${profile.isHouseholder ? "세대주 본인" : "세대원"}`
                : ""
            }
            emptyHelper="청약 상품 추천에 필요해요."
            onEdit={() => onEditField("무주택 여부 · 세대주")}
          />

          <TagField
            required
            className="sm:col-span-3"
            label="거래 이력"
            groups={[
              { label: "첫거래", tags: transactionHistory.firstTransactionBanks || [] },
              { label: "재예치", tags: transactionHistory.redepositBanks || [] },
            ]}
            emptyHelper="거래 은행 정보가 필요해요."
            onEdit={() => onEditField("거래 이력")}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#E7ECEA] bg-white px-5 py-4">
        <h3 className="mb-5 text-[19px] font-bold text-[#181818]">추천 조건</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            required
            label="월 납입 희망액"
            value={profile.monthlySavingsGoal ? `${profile.monthlySavingsGoal.toLocaleString()}만 원` : ""}
            emptyHelper="월 납입 희망액 입력이 필요해요."
            onEdit={() => onEditField("월 납입 희망액")}
          />
          <TagField
            required
            label="저축 기간"
            tags={savingPeriodMain ? [`#${savingPeriodMain}`] : []}
            caption={savingPeriodCaption}
            emptyHelper="저축 기간 선택이 필요해요."
            onEdit={() => onEditField("저축 기간")}
          />
          <TagField
            label="현재 신분"
            tags={statusRaw ? [`#${statusRaw}`] : []}
            emptyHelper="신분별 맞춤 상품 추천에 필요해요."
            onEdit={() => onEditField("현재 신분")}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TagField
            label="핵심 혜택(선호)"
            tags={optionTags.benefits.map((tag) => `#${tag}`)}
            emptyHelper="선호 혜택을 고르면 정렬이 정확해져요."
            onEdit={() => onEditField("핵심 혜택")}
          />
          <TagField
            required
            label="은행 거래 우대(선호)"
            tags={optionTags.bankRelation.map((tag) => `#${tag}`)}
            emptyHelper="은행 거래 우대 선택이 필요해요."
            onEdit={() => onEditField("은행 거래 우대")}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onResubmit}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#03BFA5] text-[18px] font-medium text-white transition-colors hover:bg-[#02A892]"
        >
          이 정보로 다시 추천 받기 →
        </button>
        <p className="text-[13px] text-[#8A8A8A]">{summaryCaption}</p>
      </div>
    </section>
  );
}

/* ---------- 마이페이지 ---------- */

export default function MyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("liked");
  const [editingField, setEditingField] = useState(null);
  const { profile, optionTagsByCategory, favorites, showComparisonNotice, loading, removeFavorite } = useMyPage();

  return (
    <div className="flex min-h-screen flex-col bg-white font-inter">
      <div className="border-1 border-[#EBEBEB]">
        <div className="mx-auto max-w-[1480px] px-6">
          <Tabs active={activeTab} onChange={setActiveTab} likedCount={favorites.length} />
        </div>
      </div>

      <div className="flex-1 bg-[#F8FAF9]">
        <main className="mx-auto max-w-[1480px] px-6 py-10">
          {loading ? (
            <p className="py-24 text-center text-[#8A8A8A]">불러오는 중이에요...</p>
          ) : activeTab === "liked" ? (
            <LikedTab
              favorites={favorites}
              showComparisonNotice={showComparisonNotice}
              onRemove={removeFavorite}
              onGoRecommend={() => navigate("/recommend")}
            />
          ) : (
            <InfoTab
              profile={profile}
              optionTags={optionTagsByCategory}
              onEditField={setEditingField}
              onResubmit={() => navigate("/recommend")}
            />
          )}
        </main>
      </div>

      {editingField && <EditFieldModal fieldLabel={editingField} onClose={() => setEditingField(null)} />}
    </div>
  );
}
