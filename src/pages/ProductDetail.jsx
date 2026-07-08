import { useNavigate, useParams } from "react-router-dom";
import { findProductById, PRODUCTS } from "../data/products";
import { getProductApplicationBadge, getProductApplicationBadgeVariant, openProductApplication } from "../utils/productApplyLink";

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19 8 12l7-7" />
    </svg>
  );
}

function BuildingIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

function ClockIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 2" />
    </svg>
  );
}

function WonIcon({ className = "" }) {
  return <span className={`font-semibold leading-none ${className}`}>￦</span>;
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

function StarIcon({ className = "" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.7 2.8 5.68 6.27.91-4.54 4.42 1.07 6.24L12 17l-5.6 2.95 1.07-6.24-4.54-4.42 6.27-.91L12 2.7Z" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
    </svg>
  );
}

function HeartIcon({ className = "" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.3 10.6 19C5.6 14.5 2.3 11.5 2.3 7.8A5.28 5.28 0 0 1 7.6 2.5c2 0 3.9.94 5.1 2.42A6.36 6.36 0 0 1 17.8 2.5a5.28 5.28 0 0 1 5.3 5.3c0 3.7-3.3 6.7-8.3 11.25l-1.4 1.25a2.06 2.06 0 0 1-1.4 0Z" />
    </svg>
  );
}

function CalendarIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function CalculatorIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function DetailBadge({ label }) {
  const isSuitability = label.includes("적합도");
  const isMint = label.includes("_ok") || label.includes("정부기여금") || label.includes("비과세 혜택");

  return (
    <span
      className={`flex h-[33px] items-center justify-center rounded-[6px] px-[13px] text-[20.6px] font-normal leading-[1.2] ${
        isSuitability
          ? "bg-[#FFF4E0] text-[#E65200]"
          : isMint
            ? "bg-[#E0FDF9] text-[#333333]"
            : "bg-[#F2F3F5] text-[#333333]"
      }`}
    >
      {label}
    </span>
  );
}

function SectionTitle({ icon, children, className = "" }) {
  return (
    <div className={`flex h-[26px] items-center gap-[10px] text-[#454545] ${className}`}>
      {icon}
      <h2 className="text-[24px] font-medium leading-[1.2]">{children}</h2>
    </div>
  );
}

function ProductInfoCard({ product }) {
  const rows = [
    { label: "상품 유형", value: product.productType },
    { label: "저축 기간", value: product.savingPeriod },
    { label: "납입 가능 금액", value: product.depositRange },
    { label: "가입 방법", value: product.applicationMethod },
    { label: "가입 대상", value: product.target, highlight: true },
    { label: "유의 사항", value: product.caution },
  ];

  return (
    <div className="rounded-[10px] border border-[#D5D5D5] px-6 py-8 lg:h-[552px] lg:px-[40px] lg:py-[57px]">
      <div className="flex flex-col lg:w-[736px]">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid grid-cols-1 gap-2 py-[20px] text-[22px] leading-[1.3] lg:grid-cols-[134px_1fr] lg:gap-[114px] ${
              index === 0 ? "pt-0" : "border-t border-[#E5E5E5]"
            } ${index === rows.length - 1 ? "pb-0" : ""}`}
          >
            <dt className="font-normal text-[#6B6B6B]">{row.label}</dt>
            <dd className={`text-[23px] font-medium ${row.highlight ? "text-[#03BFA5]" : "text-[#454545]"}`}>
              {Array.isArray(row.value)
                ? row.value.map((line) => <p key={line}>{line}</p>)
                : row.value}
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateTable({ product }) {
  return (
    <div className="w-full overflow-hidden rounded-[10px] text-[20px] font-medium leading-[1.2] lg:w-[736px]">
      <div className="grid h-[50px] grid-cols-3 items-center border border-b-0 border-[#03BFA5] bg-[#F7FFFE] px-[22px] text-[#6B6B6B]">
        <span>기간</span>
        <span className="text-center">기본금리</span>
        <span className="text-right">최고금리</span>
      </div>
      <div className="grid h-[50px] grid-cols-3 items-center border border-[#03BFA5] px-[22px] text-[#454545]">
        <span>{product.rateTerm}</span>
        <span className="text-center">{product.baseRateDisplay}</span>
        <span className="text-right">{product.maxRateDisplay}</span>
      </div>
    </div>
  );
}

function ConditionIcon({ status }) {
  if (status === "neutral") return null;

  const isMatched = status === "matched";

  return (
    <span className={`flex size-[28px] shrink-0 items-center justify-center rounded-full ${isMatched ? "bg-[#03BFA5]" : "bg-[#D3455B]"}`}>
      {isMatched ? (
        <svg className="size-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m6 12 4 4 8-8" />
        </svg>
      ) : (
        <svg className="size-[16px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 6l12 12M18 6 6 18" />
        </svg>
      )}
    </span>
  );
}

function RateConditionRow({ item }) {
  const statusClass = {
    matched: "border-[#03BFA5] bg-[#F7FFFE]",
    missed: "border-[#D3455B] bg-[#FCF4F5]",
    neutral: "border-[#C6D3D3] bg-white",
  }[item.status];

  const valueColor = item.status === "matched" ? "text-[#03BFA5]" : item.status === "missed" ? "text-[#D3455B]" : "text-[#454545]";

  return (
    <div className={`flex h-[65px] items-center rounded-[10px] border px-[20px] ${statusClass}`}>
      <div className="flex w-full items-center gap-[20px]">
        <ConditionIcon status={item.status} />
        <div className={`flex flex-1 items-center justify-between text-[22px] leading-[1.2] ${item.status === "neutral" ? "pl-[10px]" : ""}`}>
          <span className="font-medium text-[#454545]">{item.label}</span>
          <span className={`font-semibold ${valueColor}`}>{item.value}</span>
        </div>
      </div>
    </div>
  );
}

function RateInfoCard({ product }) {
  return (
    <div className="rounded-[10px] border border-[#D5D5D5] px-6 py-8 lg:h-[610px] lg:px-[40px] lg:py-[35px]">
      <div className="flex flex-col gap-[30px] lg:w-[736px]">
        <RateTable product={product} />
        <div className="flex flex-col gap-[20px] lg:w-[710px]">
          <SectionTitle icon={<StarIcon className="size-[26px] text-[#03BFA5]" />}>우대금리 조건</SectionTitle>
          <div className="flex flex-col gap-[7px] lg:w-[736px]">
            {product.rateConditions.map((item) => (
              <RateConditionRow key={`${item.label}-${item.value}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeBox({ children }) {
  return (
    <div className="flex min-h-[86px] items-center justify-center rounded-[10px] border border-[#03BFA5] bg-[#F7FFFE] px-[34px] py-[20px] text-[#454545] lg:w-[816px]">
      <div className="flex max-w-[645px] items-start gap-[11px]">
        <InfoCircleIcon className="mt-[1px] size-[20px] shrink-0 text-[#03BFA5]" />
        <p className="text-[18px] font-normal leading-[1.3]">{children}</p>
      </div>
    </div>
  );
}

function BankRateSummary({ product }) {
  const baseRate = product.baseRateDisplay || `${product.baseRate}%`;
  const maxRate = product.maxRateDisplay || `${product.maxRate}%`;

  return (
    <div className="flex h-[303px] flex-col items-center justify-center rounded-[10px] border border-[#D5D5D5] px-6 py-8 lg:w-[699px] lg:px-[37px] lg:py-[48px]">
      <div className="grid w-full grid-cols-1 items-center justify-items-center gap-7 md:grid-cols-[1fr_1px_1fr] md:gap-0">
        <div className="w-fit max-w-full text-left">
          <p className="whitespace-nowrap text-[27.62px] font-medium leading-[1.2] text-[#454545]">기본 금리</p>
          <p className="mt-[13px] whitespace-nowrap text-[55.88px] font-bold leading-[1.2] text-[#454545]">{baseRate}</p>
        </div>
        <div className="hidden h-[121px] w-px bg-[#D5D5D5] md:block" />
        <div className="w-fit max-w-full text-left">
          <p className="whitespace-nowrap text-[27.62px] font-medium leading-[1.2] text-[#454545]">최고 금리</p>
          <p className="mt-[13px] whitespace-nowrap text-[55.88px] font-bold leading-[1.2] text-[#03BFA5]">{maxRate}</p>
        </div>
      </div>
      <div className="mt-[16px] flex h-[44px] w-full max-w-[461px] items-center justify-center gap-[22px] rounded-full border border-[#03BFA5] bg-[#EFFFFD] px-[26px] leading-[1.2] text-[#03BFA5]">
        <span className="whitespace-nowrap text-center text-[21.93px] font-normal">내가 달성 가능한 금리</span>
        <span className="whitespace-nowrap text-center text-[24.37px] font-semibold">연 ??? %</span>
      </div>
    </div>
  );
}

function ContributionSummary({ product }) {
  return (
    <div className="flex min-h-[262px] flex-col items-center justify-center rounded-[10px] border border-[#D5D5D5] px-6 py-8 lg:w-[699px] lg:px-[37px] lg:py-[41px]">
      <div className="grid w-full grid-cols-1 items-center justify-items-center gap-7 md:grid-cols-[1fr_1px_1fr] md:gap-0">
        <div className="w-fit max-w-full text-left">
          <p className="whitespace-nowrap text-[24.7px] font-medium leading-[1.2] text-[#454545]">기여금 환산 수익률</p>
          <p className="mt-[11px] whitespace-nowrap text-[49.4px] font-bold leading-[1.2] text-[#454545]">{product.contributionRate}</p>
        </div>
        <div className="hidden h-[108px] w-px bg-[#D5D5D5] md:block" />
        <div className="w-fit max-w-full text-left">
          <p className="whitespace-nowrap text-[24.7px] font-medium leading-[1.2] text-[#454545]">예상 만기 기여금 총액</p>
          <p className="mt-[11px] whitespace-nowrap text-[49.4px] font-bold leading-[1.2] text-[#03BFA5]">{product.maturityContribution}</p>
        </div>
      </div>
      <p className="mt-[22px] w-full text-center text-[23.1px] font-medium leading-[1.2] text-[#606060]">{product.contributionCaption}</p>
    </div>
  );
}

function ProductSummary({ product, isBankProduct }) {
  return isBankProduct ? <BankRateSummary product={product} /> : <ContributionSummary product={product} />;
}

function RightPanel({ product, onEditRate }) {
  const applicationBadgeVariant = getProductApplicationBadgeVariant(product);
  const isBankProduct = applicationBadgeVariant === "bank";
  const applicationBadgeClass = applicationBadgeVariant === "bank"
    ? "bg-[#F4F5F6] text-[#454545]"
    : "bg-[#F7FFFE] text-[#03BFA5]";

  return (
    <aside className="relative flex flex-col lg:w-[699px] lg:pt-[295px]">
      <ProductSummary product={product} isBankProduct={isBankProduct} />

      <div className={`${isBankProduct ? "mt-[30px]" : "mt-[21px]"} flex flex-col`}>
        <div className="grid grid-cols-[1fr_82px] gap-[10px]">
          <button
            type="button"
            onClick={() => openProductApplication(product)}
            className="flex h-[80px] items-center justify-center gap-[20px] rounded-[10px] border border-[#03BFA5] bg-[#03BFA5] text-[30px] font-medium leading-[1.2] text-white transition-colors hover:bg-[#02A892]"
          >
            <ExternalLinkIcon className="size-[30px]" />
            신청하러 가기
          </button>
          <button className="flex h-[80px] items-center justify-center rounded-[10px] border-2 border-[#D4D4D4] text-[#D4D4D4] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]" aria-label="관심 상품">
            <HeartIcon className="size-[40px]" />
          </button>
        </div>
        {isBankProduct && product.calculator && (
          <button
            type="button"
            onClick={onEditRate}
            className="mt-[10px] flex h-[80px] w-full items-center justify-center gap-[16px] rounded-[10px] border-2 border-[#03BFA5] bg-white text-[30px] font-medium leading-[1.2] text-[#03BFA5] transition-colors hover:bg-[#F7FFFE]"
          >
            <CalculatorIcon className="size-[30px]" />
            수익률 계산기
          </button>
        )}

        {!isBankProduct && (
          <div className="mt-[32px] flex flex-col">
            <div className="flex items-center gap-[10px] text-black">
              <CalendarIcon className="size-[30px]" />
              <h2 className="text-[26px] font-medium leading-[1.2]">모집 기간</h2>
            </div>
            <div className="mt-[18px] flex h-[80px] items-center justify-center rounded-[10px] border-2 border-[#03BFA5] bg-[#F7FFFE] px-[34px] text-center text-[30px] font-medium leading-[1.2] text-[#03BFA5]">
              {product.recruitPeriod}
            </div>
          </div>
        )}

        <div className={`${isBankProduct ? "mt-[24px] h-[60px]" : "mt-[30px] h-[58px]"} flex w-fit items-center justify-center rounded-[10px] px-[37px] text-[26px] font-semibold leading-[1.2] ${applicationBadgeClass}`}>
          {getProductApplicationBadge(product)}
        </div>
        <div className="mt-[34px] h-px w-full bg-[#D5D5D5]" />
        <p className="mt-[27px] text-[24px] font-normal leading-[1.35] text-[#9C9C9C]">
          Y-Fin은 해당 상품의 판매 ∙ 중개 주체가 아니며,<br />
          신청은 기관 공식 페이지에서 진행됩니다.
        </p>
      </div>
    </aside>
  );
}

function ProductHeader({ product }) {
  return (
    <div className="flex flex-col gap-[30px]">
      <div className="flex flex-wrap gap-[9px]">
        {product.tags.map((tag) => (
          <DetailBadge key={tag} label={tag} />
        ))}
      </div>

      <div className="flex flex-col gap-[15px]">
        <h1 className="text-[40px] font-bold leading-[1.2] text-[#373737]">{product.detailTitle}</h1>
        <div className="flex flex-wrap items-center gap-[18px] text-[22px] font-medium leading-[1.2] text-[#454545]">
          <span className="flex items-center gap-[5px]">
            <BuildingIcon className="h-[18px] w-[16px]" />
            {product.metaInstitution}
          </span>
          <span className="flex items-center gap-[5px]">
            <ClockIcon className="size-[22px]" />
            기간 {product.periodSummary}
          </span>
          <span className="flex items-center gap-[5px]">
            <WonIcon />
            {product.amountSummary}
          </span>
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ product, onBack }) {
  return (
    <div className="flex flex-col gap-[25px] lg:w-[816px]">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-[8px] text-[20px] font-medium leading-[1.2] text-[#454545] transition-colors hover:text-[#03BFA5]"
      >
        <ArrowLeftIcon className="size-[24px]" />
        상품 리스트로 돌아가기
      </button>

      <div className="flex flex-col gap-[50px]">
        <ProductHeader product={product} />

        <section className="flex flex-col gap-[20px]">
          <SectionTitle icon={<InfoCircleIcon className="size-[22px] text-[#03BFA5]" />}>상품 안내</SectionTitle>
          <ProductInfoCard product={product} />
        </section>

        <section className="flex flex-col gap-[10px]">
          <div className="flex flex-col gap-[20px]">
            <SectionTitle icon={<span className="text-[26px] font-semibold leading-none text-[#03BFA5]">%</span>}>금리 안내</SectionTitle>
            <RateInfoCard product={product} />
          </div>
          <NoticeBox>{product.rateNotice}</NoticeBox>
        </section>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = findProductById(productId) || PRODUCTS[0];

  return (
    <main className="min-h-screen bg-white font-inter text-[#454545]">
      <div className="mx-auto mt-[13px] w-full max-w-[1670px] rounded-[3px] border border-[#D5D5D5] px-6 pb-[70px] pt-[46px] lg:px-[61px]">
        <div className="mx-auto grid w-full max-w-[1548px] gap-[33px] xl:grid-cols-[816px_699px]">
          <LeftPanel product={product} onBack={() => navigate("/products")} />
          <RightPanel product={product} onEditRate={() => navigate(`/products/${product.id}/calculator`)} />
        </div>
      </div>
    </main>
  );
}
