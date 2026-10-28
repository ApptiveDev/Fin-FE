import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import tabInfoIcon from "../assets/product-list/tab-info.svg";
import { TopCard, ListItem } from "../components/ProductComponents";
import { buildProductListFromResult, compareProductPayout, getActiveRecommendationResult } from "../utils/recommendationResult";
import searchIcon from "../assets/product-list/search.svg";
import lockIcon from "../assets/product-list/lock.svg";
import gateLockIcon from "../assets/product-list/gate-lock.svg";
import checkIcon from "../assets/product-list/check.svg";
import editIcon from "../assets/product-list/edit.svg";
import infoIcon from "../assets/product-list/info.svg";
import "./ProductList.css";
import { PRODUCT_LIST_MOCK_RESULT } from "../data/productListMock";

const SECTIONS = ["정부 청년 상품", "시중 은행 상품 · 제 1금융권", "청약 상품"];
const FILTERS = ["전체", "예금", "적금", "정부 지원"];
const MATCH_HELP = "선택하신 키워드(핵심 혜택 · 저축 기간 · 현재 신분 · 은행 거래)를 기준으로 산정한 매칭 점수예요. 높을수록 당신의 선호도를 잘 반영해요.";
const PAYOUT_HELP = "만기까지 넣었을 때 세금(이자소득세 15.4%)을 빼고 실제로 받는 금액이에요. 은행 상품은 우대조건을 반영한 ‘내가 받을 금리’로 실수령액을 계산해요. 정부 상품은 정부가 확정 지급하는 ‘기여금 총액’으로 비교해요.";

function TabHelp({ text }) {
  return <span className="product-tab-help"><img src={tabInfoIcon} alt="도움말" /><span role="tooltip">{text}</span></span>;
}

export default function ProductList() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preview = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const previewResult = preview?.get("mock") === "true" ? PRODUCT_LIST_MOCK_RESULT : null;
  const isLoggedIn = Boolean(accessToken) || preview?.get("auth") === "true";
  const result = useMemo(() => previewResult ?? getActiveRecommendationResult(location), [location, previewResult]);
  const personalized = isLoggedIn && result?.tabs?.tabBEnabled === true;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("match");
  const [filter, setFilter] = useState("전체");
  const [plan, setPlan] = useState(() => result?.savingPlan || "goal");
  const [blocked, setBlocked] = useState(null);
  const [shortTab, setShortTab] = useState("parking");
  const products = useMemo(() => buildProductListFromResult(result, plan), [result, plan]);
  const isShort = plan === "short";
  const parking = isShort && shortTab === "parking";
  const payoutMode = personalized && (isShort ? !parking : tab === "payout");
  const showTopCards = isShort || !payoutMode;

  useEffect(() => {
    if (!result) navigate("/recommend", { replace: true });
  }, [result, navigate]);
  useEffect(() => {
    if (!blocked) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setBlocked(null); };
    document.addEventListener("keydown", onKeyDown);
    const previousFocus = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previous; previousFocus?.focus(); };
  }, [blocked]);

  const filtered = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [product.title, product.subtitle, product.institution].some((text) => text?.toLowerCase().includes(query));
    const matchesType = filter === "전체" || (filter === "정부 지원" ? product.category === "정부 청년 상품" : filter === "예금" ? product.productTypeCode === "DEPOSIT" || product.isParking : product.productTypeCode === "SAVING");
    const short = product.isParking || product.saveTerms.some((months) => months <= 3);
    const matchesPlan = isShort ? (parking ? product.isParking : short && !product.isParking) : !product.isParking && (product.saveTerms.length === 0 || product.saveTerms.some((months) => months > 3));
    return matchesSearch && matchesType && matchesPlan;
  }).sort((a, b) => parking
    ? parseFloat(b.maxRate) - parseFloat(a.maxRate)
      || parseFloat(b.baseRate) - parseFloat(a.baseRate)
      || a.title.localeCompare(b.title, "ko")
    : payoutMode && isShort ? compareProductPayout(a, b) : b.suitability - a.suitability), [products, search, filter, isShort, parking, payoutMode]);
  const topThree = showTopCards ? filtered.slice(0, 3) : [];
  const remaining = showTopCards ? filtered.slice(3) : filtered;
  const total = result?.eligibleProductCount ?? products.length;
  const excluded = Math.max(0, total - products.length);
  const openGate = () => setBlocked(isLoggedIn ? "profile" : "login");
  const edit = () => navigate(isLoggedIn ? "/mypage" : "/recommend", { state: isLoggedIn ? { activeTab: "info" } : { openForm: true } });
  const commonProps = (product) => ({
    ...product, isLoggedIn: personalized, parking, payoutMode,
    onClick: () => navigate(`/products/${product.id}`), onLogin: openGate,
  });

  if (!result) return null;
  return (
    <main className="product-results font-pretendard">
      <div className="product-results-sticky">
        <form className="product-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <img src={searchIcon} alt="" />
          <input aria-label="상품명으로 검색하기" placeholder="상품명으로 검색하기" value={search} onChange={(event) => setSearch(event.target.value)} />

        </form>
        <div className="product-plan-row">
          <div className="product-plan" role="group" aria-label="저축 상품군">
            {[{ id: "short", label: "단기 예치" }, { id: "goal", label: "목돈 만들기" }].map((item) => (
              <button key={item.id} type="button" aria-pressed={plan === item.id} onClick={() => { setPlan(item.id); setFilter("전체"); }} className={plan === item.id ? "selected" : ""}>{item.label}</button>
            ))}
          </div>

        </div>
        <div className="product-sort-row">
          <div role="group" aria-label={isShort ? "단기 예치 상품 유형" : "상품 정렬"} className="product-sort">
            <button type="button" aria-pressed={isShort ? parking : !payoutMode} className={(isShort ? parking : !payoutMode) ? "selected" : ""} onClick={() => isShort ? setShortTab("parking") : setTab("match")}>
              {isShort ? "파킹통장" : "적합도순"}{(isShort ? parking : !payoutMode) && <TabHelp text={isShort ? "최고금리를 기준으로 파킹통장을 비교해요. 최고금리 적용한도를 함께 확인하세요." : MATCH_HELP} />}
            </button>
            <button type="button" aria-pressed={isShort ? !parking : payoutMode} className={(isShort ? !parking : payoutMode) ? "selected" : ""} onClick={() => personalized ? (isShort ? setShortTab("deposit") : setTab("payout")) : openGate()}>
              {!personalized && <img src={lockIcon} alt="잠김" />}{isShort ? "단기예적금" : "실수령액순"}{(isShort ? !parking : payoutMode) && <TabHelp text={PAYOUT_HELP} />}
            </button>
          </div>
          <button type="button" className="product-edit" onClick={edit}><img src={editIcon} alt="" />입력 정보 수정</button>
        </div>
        <div className="product-filter-row">
          <div className="product-filters">{FILTERS.map((label) => <button type="button" key={label} aria-pressed={filter === label} className={filter === label ? "selected" : ""} onClick={() => setFilter(label)}>{label}</button>)}</div>
        </div>
      </div>
      <div className="product-results-body">
        {isShort && <h1 className="product-short-heading">{parking ? "최고금리 높은 순" : "세후 실수령액 높은 순"}</h1>}
        <p className="product-result-notice"><span className="product-notice-icon"><img src={infoIcon} alt="" /></span>{isShort ? (parking ? "파킹통장은 잔액 전체가 아니라 한도 금액까지만 최고금리가 붙는 경우가 많아요. 가입 전 최고금리의 적용한도를 꼭 확인하세요." : "세후 실수령액이란? 만기까지 넣었을 때 세금(이자소득세 15.4%)을 빼고 실제로 받는 금액이에요. 우대조건을 반영한 ‘내가 받을 금리’로 실수령액을 계산해요.") : personalized
          ? `총 ${total}개 상품 중 자격요건 미충족 상품 ${excluded}개가 제외되었어요.`
          : isLoggedIn ? (result?.tabs?.tabBDisabledReason || "상세 정보를 입력하면 내가 받을 금리와 기여금을 확인할 수 있어요.")
            : "로그인하면 자격요건 필터링 결과와 내가 달성 가능한 금리를 확인할 수 있어요."}</p>
        {topThree.length > 0 && <div className="product-top-grid">{topThree.map((product, index) => <TopCard key={product.id} {...commonProps(product)} rank={index + 1} isBest={index === 0} showContribution={product.category === "정부 청년 상품"} />)}</div>}
        {filtered.length === 0 && <div className="product-empty">선택한 조건에 맞는 상품이 없어요.</div>}
        <div className="product-sections">
          {(isShort ? ["단기 예치"] : SECTIONS).map((name) => {
            const items = isShort ? [...remaining] : remaining.filter((product) => product.category === name);
            if (!items.length) return null;
            if (payoutMode) items.sort(compareProductPayout);
            const government = name === "정부 청년 상품";
            return <section key={name} className="product-section">
              {!isShort && <div className="product-section-heading"><h2>{name}</h2>{payoutMode && <span>{government ? "만기 기여금 총액 높은 순" : "세후 실수령액 높은 순"}</span>}</div>}
              {payoutMode && government && <p className="product-payout-notice">⚠ 일부 정부 상품은 금리가 공시되지 않아 이자수익을 계산할 수 없어요.<br />그래서 정부가 확정 지급하는 기여금 총액(본인 원금·이자 제외)을 기준으로 정렬했어요.</p>}
              {items.map((product, index) => <ListItem key={product.id} {...commonProps(product)} variant={government ? "contribution" : "rate"} payoutMode={payoutMode} rank={payoutMode && !isShort ? index + 1 : undefined} />)}
            </section>;
          })}
        </div>
      </div>
      {blocked && <div className="product-gate-backdrop" onClick={() => setBlocked(null)}>
        <section className="product-gate" onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = event.currentTarget.querySelectorAll("button");
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }} role="dialog" aria-modal="true" aria-labelledby="product-gate-title" onClick={(event) => event.stopPropagation()}>
          <img src={gateLockIcon} alt="" />
          <h2 id="product-gate-title">{blocked === "login" ? "로그인 후 이용할 수 있어요" : "상세 정보 입력 후 이용할 수 있어요"}</h2>
          <p>내가 받을 금리와 실수령액을<br />{blocked === "login" ? "로그인 후" : "상세 정보 입력 후"} 바로 확인해보세요.</p>
          <ul><li><img src={checkIcon} alt="" /><span>실제 충족 가능한 우대조건만 적용해 내가 받을 금리와 실수령액을 계산해드려요.</span></li><li><img src={checkIcon} alt="" /><span>단계2 정보 입력 후 가입할 수 있는 상품을 기준으로 더 정밀한 맞춤 추천이 활성화됩니다.</span></li></ul>
          {blocked === "login" ? <><button autoFocus onClick={() => navigate("/terms")}>회원가입 후 이용하기</button><button onClick={() => navigate("/login")}>로그인하고 확인하기</button></> : <button autoFocus onClick={edit}>상세 정보 입력하기</button>}
        </section>
      </div>}
    </main>
  );
}
