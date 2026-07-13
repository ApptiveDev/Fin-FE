import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductTag } from "../components/ProductComponents";
import { openProductApplication } from "../utils/productApplyLink";
import { PRODUCTS } from "../data/products";
import { MOCK_PERSONAL_INFO, MOCK_LIKED_PRODUCT_IDS } from "../data/mypage";

function ExternalLinkIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
    </svg>
  );
}

function HeartIcon({ className = "", filled = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      aria-hidden="true"
    >
      <path d="M12 20.3 10.6 19C5.6 14.5 2.3 11.5 2.3 7.8A5.28 5.28 0 0 1 7.6 2.5c2 0 3.9.94 5.1 2.42A6.36 6.36 0 0 1 17.8 2.5a5.28 5.28 0 0 1 5.3 5.3c0 3.7-3.3 6.7-8.3 11.25l-1.4 1.25a2.06 2.06 0 0 1-1.4 0Z" />
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

function InfoBox({ label, children }) {
  return (
    <div className="rounded-[10px] border border-[#EBEBEB] bg-white px-6 py-5">
      <p className="mb-2 text-[15px] font-medium text-[#8A8A8A]">{label}</p>
      <div className="text-[20px] font-bold leading-[1.3] text-[#181818]">{children}</div>
    </div>
  );
}

function PersonalInfoSection({ info, onEdit }) {
  return (
    <section className="rounded-[16px] border border-[#EBEBEB] bg-white p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2">
          <span className="text-[24px] font-bold text-[#181818]">개인 정보</span>
          <span className="text-[15px] font-medium text-[#8A8A8A]">저장된 입력값</span>
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-[#D5D5D5] px-4 py-2 text-[14px] font-medium text-[#454545] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
        >
          정보 수정하러 가기
          <ExternalLinkIcon className="size-4" />
        </button>
      </div>

      <div className="rounded-full bg-[#EFFFFD] px-6 py-3 text-center text-[15px] font-medium text-[#03BFA5]">
        다음 추천 시 자동으로 채워지는 정보예요. 편집은 추천받기 화면(정보 입력)에서 할 수 있어요.
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoBox label="생년월일">
          {info.birthDate}{" "}
          <span className="text-[15px] font-medium text-[#8A8A8A]">· 만 {info.age}세 (자동 계산)</span>
        </InfoBox>
        <InfoBox label="개인 연 소득">{info.annualIncome}</InfoBox>
        <InfoBox label="가구원 수 · 가구소득">
          {info.householdCount}인 · {info.incomeLevelLabel}{" "}
          <span className="text-[15px] font-medium text-[#8A8A8A]">({info.incomeLevelDetail})</span>
        </InfoBox>
        <InfoBox label="거주 지역">{info.region}</InfoBox>
        <InfoBox label="우대조건 (선호)">
          <div className="flex flex-wrap gap-2">
            {info.preferredBenefits.map((tag) => (
              <ProductTag key={tag} tag={tag} compact />
            ))}
          </div>
        </InfoBox>
        <InfoBox label="거래 이력">
          <p>첫거래: {info.firstTradeBanks.join(", ")}</p>
          <p>재예치: {info.maturedBanks.join(", ")}</p>
        </InfoBox>
      </div>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-[#8A8A8A]">
        월 납입 희망액 · 저축 기간 등 나머지 입력값도 저장되어 다음 추천 시 자동 반영돼요.
        <br />
        (이 화면에는 표시되지 않아요.)
      </p>
    </section>
  );
}

function LikedCard({ product, liked, onToggleLike, onClick }) {
  const isContribution = product.category === "정부 청년 상품" || product.category === "청약 상품";
  const visibleTags = product.tags.slice(0, 3);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative flex w-[380px] shrink-0 cursor-pointer flex-col gap-4 rounded-[10px] border-2 border-[#E0DFDF] bg-white px-7 py-6 transition-colors hover:border-[#03BFA5]"
    >
      <div className="flex flex-wrap items-center gap-2 pr-8">
        {visibleTags.map((tag) => (
          <ProductTag key={tag} tag={tag} compact />
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike();
        }}
        aria-label="찜 해제"
        className="absolute right-6 top-6 text-[#03BFA5]"
      >
        <HeartIcon filled={liked} className="size-6" />
      </button>

      <div>
        <h3 className="text-[24px] font-bold leading-[1.2] text-[#181818]">{product.title}</h3>
        <p className="mt-1 text-[14px] font-medium text-[#606060]">{product.subtitle}</p>
      </div>

      {isContribution ? (
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
          <p className="text-center text-[13px] text-[#8A8A8A]">{product.contributionCaption}</p>
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
        onClick={(e) => {
          e.stopPropagation();
          openProductApplication(product);
        }}
        className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#03BFA5] bg-[#03BFA5] text-[16px] font-semibold text-white transition-colors hover:bg-[#02A892]"
      >
        신청하러 가기
        <ExternalLinkIcon className="size-4" />
      </button>
    </div>
  );
}

function LikedProductsCarousel({ products, likedIds, onToggleLike, onOpenDetail }) {
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
          <LikedCard
            key={product.id}
            product={product}
            liked={likedIds.includes(product.id)}
            onToggleLike={() => onToggleLike(product.id)}
            onClick={() => onOpenDetail(product.id)}
          />
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

function LikedProductsSection({ likedIds, onToggleLike, onOpenDetail }) {
  const likedProducts = useMemo(
    () => likedIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean),
    [likedIds],
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="flex items-baseline gap-2">
          <span className="text-[24px] font-bold text-[#181818]">찜해둔 Fin.</span>
          <span className="text-[20px] font-bold text-[#03BFA5]">{likedProducts.length}</span>
        </h2>
        <span className="flex items-center gap-1 text-[14px] text-[#8A8A8A]">
          <ChevronIcon direction="left" className="size-3.5" />
          <ChevronIcon direction="right" className="-ml-2.5 size-3.5" />
          좌우로 비교 가능
        </span>
      </div>

      <div className="mb-5 rounded-full bg-[#FFF8E8] px-6 py-3 text-center text-[14px] text-[#B7791F]">
        정부 상품의 기여금 환산 수익률과 은행 상품의 달성 가능 금리는 산정 기준이 달라 수치를 직접 비교할 수 없어요.
      </div>

      {likedProducts.length > 0 ? (
        <LikedProductsCarousel
          products={likedProducts}
          likedIds={likedIds}
          onToggleLike={onToggleLike}
          onOpenDetail={onOpenDetail}
        />
      ) : (
        <p className="rounded-[10px] border border-dashed border-[#D5D5D5] py-16 text-center text-[#8A8A8A]">
          아직 찜해둔 상품이 없어요.
        </p>
      )}

      <p className="mt-4 text-center text-[13px] text-[#8A8A8A]">
        Y-Fin은 해당 상품의 판매·중개 주체가 아니며, 신청은 기관 공식 페이지에서 진행됩니다.
      </p>
    </section>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  // TODO: 백엔드 API 준비되면 개인정보/찜 목록 조회로 교체 (src/api/client.js의 withAuth 사용)
  const [likedIds, setLikedIds] = useState(MOCK_LIKED_PRODUCT_IDS);

  const toggleLike = (productId) => {
    setLikedIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
    // TODO: 찜 토글 API 연결 (POST/DELETE /mypage/liked/:productId)
  };

  return (
    <main className="mx-auto flex max-w-[1480px] flex-col gap-10 px-6 py-12">
      <PersonalInfoSection info={MOCK_PERSONAL_INFO} onEdit={() => navigate("/recommend")} />
      <LikedProductsSection
        likedIds={likedIds}
        onToggleLike={toggleLike}
        onOpenDetail={(id) => navigate(`/products/${id}`)}
      />
    </main>
  );
}
