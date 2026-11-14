import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InfoIcon from "../components/InfoIcon";
import { TopCard, ListItem } from "../components/ProductComponents";
import {
  buildProductListFromResult,
  buildParkingProductListFromResult,
  buildDepositSavingsProductListFromResult,
  getActiveRecommendationResult,
} from "../utils/recommendationResult";
import { MOCK_LONG_TERM_RESULT, MOCK_SHORT_TERM_RESULT } from "../data/productList";

const LONG_TERM_SECTIONS = [
  { name: "정부 청년 상품" },
  { name: "시중 은행 상품 · 제 1금융권" },
];

const CATEGORY_LABEL = { SHORT_TERM: "단기 예치", LONG_TERM: "목돈 만들기" };
const SUITABILITY_TAB = "적합도순";
const NET_RETURN_TAB = "실수령액순";
const PARKING_TAB = "파킹통장";
const DEPOSIT_TAB = "단기 예적금";

// 실수령액순 탭에서만 섹션 제목 옆에 붙는 정렬 기준 민트 라벨.
const NET_RETURN_SORT_LABEL = {
  "정부 청년 상품": "만기 기여금 총액 높은 순",
  "시중 은행 상품 · 제 1금융권": "세후 실수령액 높은 순",
};

// 단기예치 탭(파킹통장/단기 예·적금)은 섹터가 없어, 정렬 기준 라벨만 섹션 제목과 같은 스타일로 보여준다.
const SHORT_TERM_SORT_LABEL = {
  [PARKING_TAB]: "최고금리 높은 순",
  [DEPOSIT_TAB]: "세후 실수령액 높은 순",
};

// 단기예치 탭에서는 "자격요건 미충족" 안내 대신, 탭별 주의/설명 문구를 같은 자리에 보여준다.
const SHORT_TERM_GUIDANCE_TEXT = {
  [PARKING_TAB]: "파킹통장은 잔액 전체가 아니라 한도 금액까지만 최고금리가 붙는 경우가 많아요. 가입 전 최고금리의 적용한도를 꼭 확인하세요.",
  [DEPOSIT_TAB]: "세후 실수령액이란? 만기까지 넣었을 때 세금(이자소득세 15.4%)을 빼고 실제로 받는 금액이에요. 우대조건을 반영한 '내가 받을 금리'로 실수령액을 계산해요.",
};

function isMockMode() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get("mock") === "true";
}

export default function ProductList() {
  const { accessToken } = useAuth();
  const isLoggedIn = Boolean(accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const sectionListRef = useRef(null);
  const mockMode = isMockMode();
  const mockCategory = new URLSearchParams(location.search).get("category") === "SHORT_TERM" ? "SHORT_TERM" : "LONG_TERM";

  const liveRecommendationResult = useMemo(
    () => getActiveRecommendationResult(location),
    [location],
  );
  const recommendationResult = mockMode
    ? (mockCategory === "SHORT_TERM" ? MOCK_SHORT_TERM_RESULT : MOCK_LONG_TERM_RESULT)
    : liveRecommendationResult;

  // 대분류(단기예치/목돈만들기) 세그먼트. 서버 응답의 category를 초기값으로 쓰고, 이후엔 토글로만 바뀐다.
  // TODO: 세그먼트 전환 시 실제로는 반대 대분류 결과를 서버에서 새로 받아와야 한다 (PRD "세그먼트 전환 상태 관리").
  // mock 모드가 아닌 실서비스에서는 아직 이 재요청이 연결돼 있지 않아, 토글해도 같은 recommendationResult를 보여준다.
  const [activeCategory, setActiveCategory] = useState(recommendationResult?.category || "LONG_TERM");
  const displayResult = mockMode
    ? (activeCategory === "SHORT_TERM" ? MOCK_SHORT_TERM_RESULT : MOCK_LONG_TERM_RESULT)
    : recommendationResult;

  const isShortTerm = activeCategory === "SHORT_TERM";
  // 실제 백엔드 응답으로 확인: 단기예치는 탭C가 단기 예·적금(로그인 시 실수령액 정렬 가능, 잠금 사유 있음),
  // 탭D가 파킹통장(비로그인도 항상 열림, 스키마에 잠금 사유 필드 자체가 없음)이다.
  const rateTabEnabled = isShortTerm
    ? displayResult?.tabs?.tabCEnabled === true
    : displayResult?.tabs?.tabBEnabled === true;
  const rateTabDisabledReason = isShortTerm
    ? displayResult?.tabs?.tabCDisabledReason
    : displayResult?.tabs?.tabBDisabledReason;
  const needsAmountForCategory = activeCategory === "SHORT_TERM"
    ? displayResult?.needsDepositAmount
    : displayResult?.needsMonthlySavingsGoal;

  useEffect(() => {
    if (!mockMode && !liveRecommendationResult) {
      navigate("/recommend", { replace: true });
    }
  }, [mockMode, liveRecommendationResult, navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(SUITABILITY_TAB);
  const [shortTermTab, setShortTermTab] = useState(PARKING_TAB);
  const [activeFilter, setActiveFilter] = useState("전체");
  const [blockedModalReason, setBlockedModalReason] = useState(null); // "login" | "profile" | null
  const effectiveActiveTab = !rateTabEnabled && activeTab === NET_RETURN_TAB ? SUITABILITY_TAB : activeTab;
  const SECTIONS = LONG_TERM_SECTIONS;
  const recommendationProducts = useMemo(() => {
    if (isShortTerm) {
      return shortTermTab === DEPOSIT_TAB
        ? buildDepositSavingsProductListFromResult(displayResult)
        : buildParkingProductListFromResult(displayResult);
    }
    return buildProductListFromResult(displayResult);
  }, [displayResult, isShortTerm, shortTermTab]);

  // eligibleProductCount: 백엔드가 조건 매칭을 검토한 전체 후보 상품 수.
  // recommendationProducts: 그중 조건을 충족해 실제로 추천 목록에 포함된 상품 수.
  // eligibleProductCount가 응답에 없으면 추천 개수를 총 개수로 대체해 미충족 0개로 표시한다.
  const recommendationCount = displayResult ? recommendationProducts.length : null;
  const totalCandidateCount = displayResult?.eligibleProductCount ?? recommendationCount;
  const excludedCount = totalCandidateCount !== null && recommendationCount !== null
    ? Math.max(0, totalCandidateCount - recommendationCount)
    : null;

  const filters = [
    { label: "전체" },
    { label: "예금" },
    { label: "적금" },
    { label: "정부 지원" },
  ];

  const handleTabClick = (tabName) => {
    if (tabName === NET_RETURN_TAB && !rateTabEnabled) {
      setBlockedModalReason(isLoggedIn ? "profile" : "login");
      return;
    }
    setActiveTab(tabName);
  };

  const handleShortTermTabClick = (tabName) => {
    if (tabName === DEPOSIT_TAB && !rateTabEnabled) {
      setBlockedModalReason(isLoggedIn ? "profile" : "login");
      return;
    }
    setShortTermTab(tabName);
  };

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const scrollToSectionList = () => {
    if (!sectionListRef.current) return;
    const top = sectionListRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const processedProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return recommendationProducts.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.title, product.subtitle, product.institution].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesFilter =
        activeFilter === "전체" || (product.filterTags ?? []).includes(activeFilter);
      return matchesSearch && matchesFilter;
    }).sort((a, b) =>
      effectiveActiveTab === SUITABILITY_TAB ? b.suitability - a.suitability : parseFloat(b.myRate) - parseFloat(a.myRate),
    );
  }, [activeFilter, effectiveActiveTab, recommendationProducts, searchTerm]);

  // 목돈 만들기 - 적합도순의 시중은행 상품은 캡션 대신 "내가 받을 금리 연 n%" 알약을 보여준다.
  const getContributionCaption = (product) =>
    !isShortTerm && effectiveActiveTab === SUITABILITY_TAB && product.category === "시중 은행 상품 · 제 1금융권"
      ? null
      : product.contributionCaption;

  const topThree = processedProducts.slice(0, 3);
  const remainingProducts = processedProducts.slice(3);

  if (!displayResult) return null;

  return (
    <div className="w-full bg-white pb-[80px] select-none font-pretendard px-[clamp(16px,3vw,40px)]">

      {/* 상단 고정 영역: 검색창 + 탭 + 필터 */}
      <div className="bg-white">

        {/* 상단 고정 검색바 영역 */}
        <div className="bg-white mt-10 mb-10 shrink-0">
          <div className="max-w-310 mx-auto ">
            <div className="relative w-full">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6.5 h-6.5 text-[#A4BAB2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text" placeholder="상품명으로 검색하기" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[clamp(43px,4.5vw,54px)] pl-[clamp(33px,4vw,53px)] rounded-full border-2 border-[#DCDCDC] placeholder-[#A4BAB2] text-[clamp(14px,1.1vw,17px)] text-[#A4BAB2] focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        <div className="max-w-310 w-full mx-auto flex flex-col">

          {/* 대분류 세그먼트: 단기예치 | 목돈만들기 */}
          <div className="mb-8 inline-flex w-fit items-center rounded-[24px] bg-[#F1F3F2] p-1">
            {["SHORT_TERM", "LONG_TERM"].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-[22px] px-8 py-3 text-[17px] font-semibold transition-colors ${
                  activeCategory === category
                    ? "bg-[#03BFA5] text-white"
                    : "text-[#8A8F99] hover:text-[#454545]"
                }`}
              >
                {CATEGORY_LABEL[category]}
              </button>
            ))}
          </div>

          {needsAmountForCategory && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-[#03BFA5] bg-[#F0FFFE] px-5 py-3">
              <span className="text-[15px] text-[#0C7C6E]">
                {activeCategory === "SHORT_TERM"
                  ? "단기예치 희망액을 입력하면 이 대분류의 추천 결과를 볼 수 있어요."
                  : "목돈만들기 월 저축액을 입력하면 이 대분류의 추천 결과를 볼 수 있어요."}
              </span>
              <button
                type="button"
                onClick={() => navigate("/recommend", { state: { openForm: true } })}
                className="shrink-0 rounded-full bg-[#03BFA5] px-4 py-1.5 text-[14px] font-medium text-white hover:bg-[#02A892]"
              >
                입력하러 가기
              </button>
            </div>
          )}

          <div className="flex items-end justify-between gap-4 border-b-1 border-[#D5D5D5]">
            <div className="flex items-end gap-2">
              {/* 탭 버튼 묶음 */}
              {isShortTerm ? (
                <>
                  <button
                    onClick={() => handleShortTermTabClick(PARKING_TAB)}
                    className={`relative px-3 pb-1.5 flex items-center justify-center text-[17px] font-bold transition-colors ${
                      shortTermTab === PARKING_TAB
                        ? "text-[#03BFA5]"
                        : "text-[#8A8F99] hover:text-[#454545]"
                    }`}
                  >
                    파킹통장
                    {shortTermTab === PARKING_TAB && (
                      <span className="absolute inset-x-0 bottom-[-1.5px] h-[3px] bg-[#03BFA5]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleShortTermTabClick(DEPOSIT_TAB)}
                    className={`relative px-3 pb-1.5 flex items-center justify-center text-[17px] font-bold transition-colors ${
                      shortTermTab === DEPOSIT_TAB
                        ? "text-[#03BFA5]"
                        : "text-[#8A8F99] hover:text-[#454545]"
                    }`}
                  >
                    {!rateTabEnabled && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    단기 예적금
                    {shortTermTab === DEPOSIT_TAB && (
                      <span className="absolute inset-x-0 bottom-[-1.5px] h-[3px] bg-[#03BFA5]" />
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleTabClick(SUITABILITY_TAB)}
                    className={`relative px-3 pb-1.5 flex items-center justify-center text-[17px] font-bold transition-colors ${
                      effectiveActiveTab === SUITABILITY_TAB
                        ? "text-[#03BFA5]"
                        : "text-[#8A8F99] hover:text-[#454545]"
                    }`}
                  >
                    적합도순
                    {effectiveActiveTab === SUITABILITY_TAB && (
                      <>
                        <InfoIcon text={"선택하신 키워드(핵심 혜택 · 저축 기간 · 현재 신분 · 은행 거래)를\n기준으로 산정한 매칭 점수예요. 높을수록 당신의 선호도를 잘 반영해요."} />
                        <span className="absolute inset-x-0 bottom-[-1.5px] h-[3px] bg-[#03BFA5]" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleTabClick(NET_RETURN_TAB)}
                    className={`relative px-3 pb-1.5 flex items-center justify-center text-[17px] font-bold transition-colors ${
                      effectiveActiveTab === NET_RETURN_TAB
                        ? "text-[#03BFA5]"
                        : "text-[#8A8F99] hover:text-[#454545]"
                    }`}
                  >
                    {!rateTabEnabled && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    실수령액순
                    {effectiveActiveTab === NET_RETURN_TAB && (
                      <>
                        <span className="ml-1"><InfoIcon /></span>
                        <span className="absolute inset-x-0 bottom-[-1.5px] h-[3px] bg-[#03BFA5]" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  navigate("/mypage", { state: { activeTab: "info" } });
                } else {
                  navigate("/recommend", { state: { openForm: true } });
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 mb-2 rounded-sm border-[2px] border-[#F1F3F4] bg-white text-[17px] text-[#454545] font-semibold hover:bg-gray-50 hover:shadow-sm whitespace-nowrap"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              입력 정보 수정
            </button>
          </div>

          <div className="bg-white">

            {/* 필터 버튼 바 */}
            <div className="pt-6 pb-3 shrink-0 bg-white">
              <div className="flex gap-2">
                {filters.map(filter => (
                  <button key={filter.label} onClick={() => setActiveFilter(filter.label)} className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[16px] font-medium transition-colors ${activeFilter === filter.label ? "border-[2px] border-[#03BFA5] text-[#03BFA5] bg-[#F0FFFE]" : "border-[2px] border-[#E0DFDF] text-[#454545] bg-white hover:bg-gray-50"}`}>
                    {filter.label}
                  </button>
                ))}
              </div>

              {isShortTerm ? (
                <>
                  <h2 className="mt-8 text-[29px] font-bold text-[#03BFA5]">
                    {SHORT_TERM_SORT_LABEL[shortTermTab]}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-4 mb-2 text-[15px] font-medium text-[#606060] text-[15px] font-bold">
                    <div className="w-[16px] h-[16px] rounded-full bg-[#03BFA5] text-white flex items-center justify-center">i</div>
                    <span>{SHORT_TERM_GUIDANCE_TEXT[shortTermTab]}</span>
                  </div>
                </>
              ) : (
                /* 안내 문구 */
                <div className="flex items-center gap-1.5 mt-6 text-[15px] font-medium text-[#606060] text-[15px] font-bold">
                  {rateTabEnabled ? (
                    <>
                      <div className="w-[16px] h-[16px] rounded-full bg-[#03BFA5] text-white flex items-center justify-center">i</div>
                      <span>
                        {recommendationCount === null
                          ? "입력 정보를 바탕으로 나에게 맞는 상품을 정렬했어요."
                          : `총 ${totalCandidateCount}개 상품 중 자격 요건 미충족 상품 ${excludedCount}개가 제외되었어요.`}
                      </span>
                    </>
                  ) : (
                    <><div className="w-[16px] h-[16px] rounded-full bg-[#03BFA5] text-white flex items-center justify-center">i</div><span>{rateTabDisabledReason || (isLoggedIn ? "상세 정보를 입력하면 자격요건 필터링 결과와 내가 받을 수 있는 금리를 확인할 수 있어요." : "로그인하면 자격요건 필터링 결과와 내가 받을 수 있는 금리를 확인할 수 있어요.")}</span></>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 메인 콘텐츠 영역 바구니 */}
      <div className="max-w-310 w-full mx-auto pb-6 flex flex-col">
        <div className="bg-white flex flex-col pb-[clamp(12px,1.8vw,20px)]">

          <div className=" pt-0 bg-white">

            {/* TOP 3 */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    isLoggedIn={rateTabEnabled}
                    contributionRate={product.contributionRate}
                    maturityContribution={product.maturityContribution}
                    contributionCaption={getContributionCaption(product)}
                    showContribution={product.category === "정부 청년 상품"}
                    ratePillLabel={product.ratePillLabel}
                    ratePillValue={product.ratePillValue}
                    onClick={() => goToProductDetail(product.id)}
                  />
                ))}
              </div>
            </div>

            {/* 하단 세로형 분리 목록 */}
            {processedProducts.length === 0 ? (
              <div className="mt-8 flex min-h-[160px] items-center justify-center rounded-[10px] border border-[#E0DFDF] text-[17px] font-medium text-[#606060]">
                검색 결과가 없어요.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={scrollToSectionList}
                  aria-label="목록 더보기"
                  className="mt-2 flex w-full justify-center"
                >
                  <svg width="32" height="32" viewBox="0 0 53 53" fill="none" aria-hidden="true">
                    <path d="M15 21L26.5 32.5L38 21" stroke="#03BFA5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div ref={sectionListRef}>
                {isShortTerm ? (
                  <div className="mt-4 divide-y-1 divide-[#D5D5D5] border-b border-[#D5D5D5]">
                    {remainingProducts.map((product) => (
                      <ListItem
                        key={product.id}
                        title={product.title}
                        subtitle={product.subtitle}
                        baseRate={product.baseRate}
                        maxRate={product.maxRate}
                        myRate={product.myRate}
                        tags={product.tags}
                        isLoggedIn={rateTabEnabled}
                        variant="rate"
                        contributionCaption={product.contributionCaption}
                        ratePillLabel={product.ratePillLabel}
                        ratePillValue={product.ratePillValue}
                        onClick={() => goToProductDetail(product.id)}
                      />
                    ))}
                  </div>
                ) : SECTIONS.map((sec) => {
                  const sectionProducts = remainingProducts.filter(p => p.category === sec.name);
                  if (sectionProducts.length === 0) return null;

                  const isNetReturnTab = effectiveActiveTab === NET_RETURN_TAB;

                  return (
                    <section key={sec.name} className="mt-14 flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="ml-1 shrink-0 text-[29px] font-bold text-[#03BFA5]">
                          {sec.name}
                        </h2>
                        {isNetReturnTab && (
                          <span className="mt-0.5 rounded-md bg-[#F0FFFE] px-3 py-1 text-[18px] font-bold text-[#03BFA5] whitespace-nowrap">
                            {NET_RETURN_SORT_LABEL[sec.name]}
                          </span>
                        )}
                      </div>

                      {isNetReturnTab && sec.name === "정부 청년 상품" && (
                        <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#FFF4E0] px-4 py-2 text-[16px] font-medium text-[#E63200]">
                          <span className="pt-0.5">⚠</span>
                          <p className="leading-relaxed">
                            일부 정부 상품은 금리가 공시되지 않아 이자수익을 계산할 수 없어요.
                            <br />
                            그래서 정부가 확정 지급하는 기여금 총액(본인 원금·이자 제외)을 기준으로 정렬했어요.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 divide-y-1 divide-[#D5D5D5] border-b border-[#D5D5D5]">
                        {sectionProducts.map((product, index) => (
                          <ListItem
                            key={product.id}
                            title={product.title}
                            subtitle={product.subtitle}
                            baseRate={product.baseRate}
                            maxRate={product.maxRate}
                            myRate={product.myRate}
                            tags={isNetReturnTab ? product.tags.filter((tag) => !tag.startsWith("적합도")) : product.tags}
                            isLoggedIn={rateTabEnabled}
                            variant={sec.name === "정부 청년 상품" ? "contribution" : "rate"}
                            contributionRate={product.contributionRate}
                            maturityContribution={product.maturityContribution}
                            contributionCaption={getContributionCaption(product)}
                            rank={isNetReturnTab ? index + 1 : undefined}
                            onClick={() => goToProductDetail(product.id)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* 모달 팝업 */}
      {blockedModalReason && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-[550px] px-22 py-18 text-center shadow-2xl relative">
            <button onClick={() => setBlockedModalReason(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 bg-[#F0FFFE] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#03BFA5]" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            </div>
            {blockedModalReason === "profile" ? (
              <>
                <p className="text-[22px] font-semibold text-[#03BFA5] mb-2">상세 정보 입력 후 이용할 수 있어요</p>
                <p className="text-[13px] text-[#03BFA5] mb-9 leading-relaxed">나에게 맞는 실질 우대금리를<br/>상세 정보 입력 후 바로 확인해보세요.</p>
              </>
            ) : (
              <>
                <p className="text-[22px] font-semibold text-[#03BFA5] mb-2">로그인 후 이용할 수 있어요</p>
                <p className="text-[13px] text-[#03BFA5] mb-9 leading-relaxed">나에게 맞는 실질 우대금리를<br/>로그인 후 바로 확인해보세요.</p>
              </>
            )}
            <div className="flex flex-col gap-2.5 mb-2.5 text-left">
              {["소득·근속·주거래 은행 등 내 정보를 바탕으로 실질 금리를 계산해드려요.", "실제 충족 가능한 우대조건만 적용해 정확한 금리를 보여드려요.","단계2 정보 입력 후 더 정밀한 맞춤 추천이 활성화됩니다."].map((text, i) => (
                <div key={i} className="flex items-start gap-3 border border-[#03BFA5] rounded-lg px-4 py-3 bg-[#F0FFFE]">
                  <div className="mt-2.5 mr-0.5 w-4 h-4 rounded-sm bg-[#03BFA5] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-[14px] text-[#454545] leading-snug">{text}</span>
                </div>
              ))}
            </div>
            {blockedModalReason === "profile" ? (
              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate("/mypage", { state: { activeTab: "info" } })} className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-[14px] hover:bg-gray-50">상세 정보 입력하기</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate("/login")} className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-[14px] hover:bg-gray-50">로그인하고 확인하기</button>
                <button onClick={() => navigate("/terms")} className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-[14px] hover:bg-gray-50">회원가입 후 이용하기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
