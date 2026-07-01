import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TopCard, ListItem } from "../components/ProductComponents";
import icon_1_fin_sector from "../assets/icon_1_fin_sector.png";
import icon_gov_support from "../assets/icon_gov_support.png";
import icon_subscription from "../assets/icon_subscription.png";
import { PRODUCTS } from "../data/products";

const MINT = "#03BFA5";

const FILTERS = [
  { label: "전체", icon: null },
  { label: "정부 지원", icon: icon_gov_support },
  { label: "제 1금융권", icon: icon_1_fin_sector },
  { label: "청약", icon: icon_subscription },
];

const SECTIONS = [
  { name: "정부 청년 상품", filterKey: "정부 지원" },
  { name: "시중 은행 상품 · 제 1금융권", filterKey: "제 1금융권" },
  { name: "청약 상품", filterKey: "청약" },
];

function SearchIcon() {
  return (
    <svg width="43" height="43" viewBox="0 0 43 43" fill="none" aria-hidden="true">
      <circle cx="19.1" cy="19.1" r="15.5" stroke="#03BFA5" strokeWidth="4" />
      <path d="M30.5 30.5L39 39" stroke="#03BFA5" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="29" height="28" viewBox="0 0 29 28" fill="none" aria-hidden="true">
      <path d="M5.8 14H22.3" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M15.2 6.3L22.9 14L15.2 21.7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="4" y="7.5" width="10" height="8" rx="1.8" stroke={active ? "white" : MINT} strokeWidth="1.7" />
      <path d="M6.2 7.5V5.9C6.2 3.9 7.4 2.5 9 2.5C10.6 2.5 11.8 3.9 11.8 5.9V7.5" stroke={active ? "white" : MINT} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function InfoMark() {
  return (
    <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#03BFA5] text-[13px] font-semibold leading-none text-white">
      i
    </span>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M12.7 4.4L17.6 9.3" stroke="#454545" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 16.9L8.7 16.1L18.1 6.7C18.8 6 18.8 4.9 18.1 4.2L17.8 3.9C17.1 3.2 16 3.2 15.3 3.9L5.9 13.3L5 16.9Z" stroke="#454545" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 19H18.5" stroke="#454545" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="53" height="53" viewBox="0 0 53 53" fill="none" aria-hidden="true">
      <path d="M15 21L26.5 32.5L38 21" stroke="#03BFA5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <span className="flex h-[28.875px] w-[28.875px] shrink-0 items-center justify-center rounded-[4px] bg-[#03BFA5]">
      <svg width="18" height="15" viewBox="0 0 16 13" fill="none" aria-hidden="true">
        <path d="M2 6.3L6.4 10.6L14 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ModalLockIcon() {
  return (
    <div className="mb-[20px] flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3.5px] border-[#03BFA5] bg-[#F0FFFE]">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <path
          d="M10.9 15.4V11.5C10.9 7.9 13.3 5.5 17 5.5C20.7 5.5 23.1 7.9 23.1 11.5V15.4"
          stroke="#03BFA5"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <rect x="9.1" y="15.3" width="15.8" height="14.2" rx="1.5" stroke="#03BFA5" strokeWidth="3.4" />
        <circle cx="17" cy="22.4" r="2.55" fill="#03BFA5" />
      </svg>
    </div>
  );
}

function SortInfo({ activeTab }) {
  const isSuitability = activeTab === "나에게 맞는 순";
  const label = isSuitability ? "적합도란?" : "달성 가능 금리란?";
  const tooltip = isSuitability
    ? "적합도란? 선택하신 키워드(핵심 혜택 ∙ 저축 기간 ∙ 현재 신분 ∙ 은행 거래)를 기준으로 산정한 매칭 점수예요.정부 지원 상품과 제 1금융권 상품별로 가중치를 다르게 반영하여 산정했어요."
    : "달성 가능 금리란? 입력하신 정보(소득 ∙ 근속 ∙ 주거래 은행 등)와 단계 1 키워드를 기반으로 실제로 받을 수 있는 우대조건만 적용한 실질 금리예요. 정부 상품과 시중은행 상품의 계산 방식이 달라요.";
  const labelWeight = isSuitability ? "font-medium" : "font-normal";
  const tooltipSize = isSuitability
    ? "left-[140px] top-[-22px] min-h-[72px] w-[420px] pb-[8px] pl-[22px] pr-[12px] pt-[8px] text-[13.5px] text-[#03BFA5]"
    : "left-[180px] top-[-22px] min-h-[72px] w-[430px] pb-[8px] pl-[24px] pr-[12px] pt-[8px] text-[13.5px] text-[#03BFA5]";

  return (
    <div className="group relative flex h-[45px] items-center gap-[9px] pl-[18px] text-[20px] font-normal leading-[1.2] text-[#03BFA5]">
      <span className={labelWeight}>{label}</span>
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.8px] border-[#03BFA5] text-[12px] font-semibold leading-none">
        i
      </span>
      <div className={`pointer-events-none absolute z-20 hidden rounded-[4px] border border-[#03BFA5] bg-[#F0FFFE] font-medium leading-[1.376] shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:block ${tooltipSize}`}>
        <span className="absolute left-[-16px] top-[31px] h-0 w-0 border-y-[9px] border-r-[16px] border-y-transparent border-r-[#03BFA5]" />
        <span className="absolute left-[-13px] top-[32px] h-0 w-0 border-y-[8px] border-r-[14px] border-y-transparent border-r-[#F0FFFE]" />
        {tooltip}
      </div>
    </div>
  );
}

function SortTab({ children, active, locked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[45px] shrink-0 items-center justify-center gap-[8px] border-2 px-[16px] text-[16px] font-medium leading-[1.2] transition-colors first:rounded-tl-[3px] last:rounded-tr-[3px] sm:px-[18px] sm:text-[21px] ${
        active ? "border-[#03BFA5] bg-[#03BFA5] text-white" : "border-[#03BFA5] bg-white text-[#03BFA5] hover:bg-[#F0FFFE]"
      }`}
    >
      {locked && <LockIcon active={active} />}
      {children}
    </button>
  );
}

function FilterButton({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[42px] items-center justify-center gap-[7px] rounded-[10px] border-2 px-[16px] py-[8px] text-[16px] font-medium leading-[1.2] transition-colors sm:h-[45px] sm:px-[20px] sm:text-[21px] ${
        active ? "border-[#03BFA5] bg-[#F0FFFE] text-[#03BFA5]" : "border-[#E0DFDF] bg-white text-[#454545] hover:border-[#03BFA5]"
      }`}
    >
      {icon && <img src={icon} alt="" className="h-[23px] w-[23px] object-contain" />}
      {label}
    </button>
  );
}

function LoginRequiredModal({ onClose, onLogin, onSignup }) {
  const guideItems = [
    <>
      <span className="font-medium">소득 ∙ 근속 ∙ 주거래 은행</span>
      <span> 등 내 정보를 바탕으로 실질 금리를 계산해드려요.</span>
    </>,
    <>
      <span>실제 </span>
      <span className="font-medium">충족 가능한 우대조건</span>
      <span>만 적용해 정확한 금리를 보여드려요.</span>
    </>,
    <>
      <span>단계2 정보 입력 후 더 정밀한 맞춤 추천이 활성화됩니다.</span>
    </>,
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#989898]/[0.53] px-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="flex max-h-[calc(100vh-32px)] w-full max-w-[587px] flex-col items-center overflow-y-auto rounded-[28px] bg-white px-[26px] py-[52px] text-center sm:h-[740px] sm:px-[85px] sm:pb-0 sm:pt-[85px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ModalLockIcon />
        <h2 id="login-modal-title" className="mb-[20px] text-[26.5px] font-semibold leading-[1.22] text-[#03BFA5]">
          로그인 후 이용할 수 있어요
        </h2>
        <p className="mb-[35px] text-[18px] font-normal leading-[1.44] text-[#454545]">
          나에게 맞는 실질 우대금리를
          <br />
          로그인 후 바로 확인해보세요.
        </p>

        <div className="mb-[10.31px] flex w-full flex-col gap-[10.31px]">
          {guideItems.map((content, index) => (
            <div
              key={index}
              className="flex h-[74.25px] w-full items-center gap-[13.4px] rounded-[10.313px] border-[1.031px] border-[#03BFA5] bg-[#F0FFFE] pl-[20.6px] pr-[23.7px] text-left"
            >
              <CheckSquareIcon />
              <p className="w-[323.813px] text-[16.5px] font-normal leading-[1.22] text-[#454545]">{content}</p>
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-[10.31px]">
          <button
            type="button"
            onClick={onLogin}
            className="h-[49.5px] w-full rounded-[10.313px] border-[1.031px] border-[#D5D5D5] bg-white text-[17.5px] font-medium leading-[1.22] text-[#454545] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
          >
            로그인하고 확인하기
          </button>
          <button
            type="button"
            onClick={onSignup}
            className="h-[49.5px] w-full rounded-[10.313px] border-[1.031px] border-[#D5D5D5] bg-white text-[17.5px] font-medium leading-[1.22] text-[#454545] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
          >
            회원가입 후 이용하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductList() {
  const { accessToken } = useAuth();
  const isLoggedIn = !!accessToken;
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("나에게 맞는 순");
  const [activeFilter, setActiveFilter] = useState("전체");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const effectiveActiveTab = !isLoggedIn && activeTab === "내가 받을 수 있는 금리 순" ? "나에게 맞는 순" : activeTab;

  const handleTabClick = (tabName) => {
    if (tabName === "내가 받을 수 있는 금리 순" && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tabName);
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const processedProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.title, product.subtitle, product.institution].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesFilter =
        activeFilter === "전체" ||
        SECTIONS.some((section) => section.filterKey === activeFilter && section.name === product.category);
      return matchesSearch && matchesFilter;
    }).sort((a, b) =>
      effectiveActiveTab === "나에게 맞는 순" ? b.suitability - a.suitability : parseFloat(b.myRate) - parseFloat(a.myRate),
    );
  }, [activeFilter, effectiveActiveTab, searchTerm]);

  const topThree = processedProducts.slice(0, 3);

  const sectionProducts = SECTIONS
    .filter((section) => activeFilter === "전체" || activeFilter === section.filterKey)
    .map((section) => ({
      ...section,
      products: processedProducts.filter((product) => product.category === section.name),
    }))
    .filter((section) => section.products.length > 0);

  return (
    <main className="min-h-screen bg-white pb-[96px] font-inter text-[#454545]">
      <section className="pt-[95px]">
        <div className="mx-auto w-full max-w-[1202px] px-4 min-[1280px]:px-0">
          <div className="relative h-[85px] w-full">
            <div className="pointer-events-none absolute left-[29px] top-[21px]">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="상품명으로 검색하기"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-[85px] w-full rounded-[66px] border-2 border-[#03BFA5] bg-white pl-[74px] pr-[86px] text-[20px] font-normal leading-[1.2] text-[#454545] placeholder:text-[#A4BAB2] focus:outline-none sm:pl-[99px] sm:pr-[102px] sm:text-[26px]"
            />
            <button
              type="button"
              aria-label="상품 검색"
              className="absolute right-[21px] top-[14px] flex h-[55px] w-[55px] items-center justify-center rounded-full bg-[#03BFA5] transition-colors hover:bg-[#02A68F]"
            >
              <ArrowIcon />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-[62px] w-full max-w-[1670px] px-4 min-[1720px]:px-0">
          <div className="flex h-[45px] items-end">
            <div className="flex shrink-0">
              <SortTab active={effectiveActiveTab === "나에게 맞는 순"} onClick={() => handleTabClick("나에게 맞는 순")}>
                나에게 맞는 순
              </SortTab>
              <SortTab
                active={effectiveActiveTab === "내가 받을 수 있는 금리 순"}
                locked={!isLoggedIn}
                onClick={() => handleTabClick("내가 받을 수 있는 금리 순")}
              >
                내가 받을 수 있는 금리 순
              </SortTab>
            </div>
            <SortInfo activeTab={effectiveActiveTab} />
          </div>

          <section className="min-h-[745px] rounded-[3px] border border-[#D5D5D5] bg-white px-[clamp(28px,6.35vw,122px)] pb-[76px] pt-[56px]">
            <div className="mx-auto w-full max-w-[1426px]">
              <div className="flex flex-wrap items-center justify-between gap-[18px]">
                <div className="flex flex-wrap gap-[10px]">
                  {FILTERS.map((filter) => (
                    <FilterButton
                      key={filter.label}
                      label={filter.label}
                      icon={filter.icon}
                      active={activeFilter === filter.label}
                      onClick={() => setActiveFilter(filter.label)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="flex h-[42px] items-center justify-center gap-[9px] rounded-[10px] border-2 border-[#E0DFDF] bg-white px-[16px] text-[16px] font-medium leading-[1.2] text-[#454545] transition-colors hover:border-[#03BFA5] sm:h-[45px] sm:px-[20px] sm:text-[21px]"
                >
                  <EditIcon />
                  입력 정보 수정
                </button>
              </div>

              <div className="mt-[22px] flex items-start gap-[8px] text-[17px] font-medium leading-[1.3] text-[#03BFA5] sm:items-center sm:text-[20px]">
                {isLoggedIn ? (
                  <>
                    <InfoMark />
                    <span>총 160개 상품 중 자격요건 미충족 상품 23개가 제외되었어요.</span>
                  </>
                ) : (
                  <>
                    <InfoMark />
                    <span>로그인하면 자격요건 필터링 결과와 내가 달성 가능한 금리를 확인할 수 있어요.</span>
                  </>
                )}
              </div>

              <div className="mt-[34px] grid grid-cols-1 gap-[22px] lg:grid-cols-3">
                {topThree.map((product, index) => (
                  <TopCard
                    key={product.id}
                    rank={index + 1}
                    title={product.title}
                    subtitle={product.subtitle}
                    baseRate={product.baseRate}
                    maxRate={product.maxRate}
                    myRate={product.myRate}
                    tags={product.tags}
                    isBest={index === 0}
                    isLoggedIn={isLoggedIn}
                    contributionRate={product.contributionRate}
                    maturityContribution={product.maturityContribution}
                    contributionCaption={product.contributionCaption}
                    showContribution={product.category === "정부 청년 상품" || product.category === "청약 상품"}
                    onClick={() => goToProductDetail(product.id)}
                  />
                ))}
              </div>

              {processedProducts.length === 0 ? (
                <div className="mt-[70px] flex min-h-[240px] items-center justify-center rounded-[10px] border border-[#E0DFDF] text-[22px] font-medium text-[#606060]">
                  검색 결과가 없어요.
                </div>
              ) : (
                <>
                  <div className="mt-[24px] flex justify-center">
                    <ChevronDownIcon />
                  </div>

                  <div className="mt-[57px] space-y-[57px]">
                    {sectionProducts.map((section) => (
                      <section key={section.name}>
                        <h2 className="mb-[12px] text-[24px] font-medium leading-[1.2] text-[#454545]">{section.name}</h2>
                        <div className="space-y-[16px]">
                          {section.products.map((product) => (
                            <ListItem
                              key={product.id}
                              title={product.title}
                              subtitle={product.subtitle}
                              baseRate={product.baseRate}
                              maxRate={product.maxRate}
                              myRate={product.myRate}
                              tags={product.tags}
                              isLoggedIn={isLoggedIn}
                              variant={section.name === "정부 청년 상품" ? "contribution" : "rate"}
                              contributionRate={product.contributionRate}
                              maturityContribution={product.maturityContribution}
                              contributionCaption={product.contributionCaption}
                              onClick={() => goToProductDetail(product.id)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </section>

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login")}
          onSignup={() => navigate("/terms")}
        />
      )}
    </main>
  );
}
