import { clearFormDraft } from "./recommendFormDraft";
import { clearProductListView } from "./productListView";
import {
  interestTypeLabel,
  keywordLabel,
  productTypeLabel,
  reserveTypeLabel,
  reserveTypeShortLabel,
} from "./productLabels";

const RECOMMENDATION_SESSION_KEY = "fin:last-recommendation";
const DUMMY_CONTRIBUTION_RATE = "연 4.00%";
const DUMMY_CONTRIBUTION_AMOUNT = "100 만원";
const RATE_NOTICE = "취급기관 공시 기반 참고용입니다. 실제 적용 금리 및 조건은 신청 시점 기준으로 상이할 수 있어요.";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);
}

// 금리 표시용: 소수점 최소 1자리(2 -> 2.0), 최대 2자리(2.35 -> 2.35)
function formatRateValue(value) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(value) {
  const rate = toFiniteNumber(value);
  return rate === null ? null : formatNumber(rate);
}

function formatContributionRate(value) {
  const rate = toFiniteNumber(value);
  return rate === null ? null : `연 ${formatNumber(rate)}%`;
}

function formatContributionAmount(value) {
  const won = toFiniteNumber(value);
  if (won === null) return null;

  if (won % 10_000 === 0) {
    return `${formatNumber(won / 10_000, 1)} 만`;
  }

  return `${formatNumber(won, 0)} `;
}

// 캡션의 원금 표기: 만원 단위면 "300만"(공백/원 없이), 아니면 "123,456원".
function formatPrincipal(value) {
  const won = toFiniteNumber(value);
  if (won === null) return null;
  return won % 10_000 === 0 ? `${formatNumber(won / 10_000, 0)}만` : `${formatNumber(won, 0)}원`;
}

function formatMonthlyDeposit(value) {
  const won = toFiniteNumber(value);
  if (won === null) return null;
  if (won % 10_000 === 0) return `${formatNumber(won / 10_000, 1)}만원`;
  return `${formatNumber(won, 0)}원`;
}

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// 대분류(SHORT_TERM/LONG_TERM)별로 한 번 받은 추천 결과를 들고 있는 캐시. 토글 시 재호출을 피한다.
// 입력값이 바뀌어 새로 검색하면(runProductSearch) 비워진다.
const RECOMMENDATION_CACHE_KEY = `${RECOMMENDATION_SESSION_KEY}:byCategory`;

export function readRecommendationCache() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.sessionStorage.getItem(RECOMMENDATION_CACHE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// 한 대분류의 캐시만 버린다(마이페이지에서 그 대분류의 목표를 바꿨을 때, 낡은 결과가 남지 않도록).
export function dropCachedRecommendation(category) {
  if (typeof window === "undefined") return;

  try {
    const next = { ...readRecommendationCache() };
    delete next[category];
    window.sessionStorage.setItem(RECOMMENDATION_CACHE_KEY, JSON.stringify(next));
  } catch {
    // 캐시를 못 비워도 다음 토글에서 서버 응답으로 덮어쓴다.
  }
}

export function clearRecommendationCache() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(RECOMMENDATION_CACHE_KEY);
  } catch {
    // 캐시를 못 비워도 다음 검색에서 덮어쓴다.
  }
}

export function persistRecommendation(recommendation) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(RECOMMENDATION_SESSION_KEY, JSON.stringify(recommendation));

    const category = recommendation?.result?.category;
    if (category) {
      window.sessionStorage.setItem(
        RECOMMENDATION_CACHE_KEY,
        JSON.stringify({ ...readRecommendationCache(), [category]: recommendation }),
      );
    }
  } catch {
    // 브라우저 저장소를 사용할 수 없어도 현재 화면 이동은 계속 진행한다.
  }
}

export function readPersistedRecommendation() {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(RECOMMENDATION_SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function clearPersistedRecommendation() {
  if (typeof window === "undefined") return;
  clearFormDraft(); // 로그아웃 시 이전 사용자가 입력하던 값이 남지 않게 함께 지운다.
  clearProductListView();

  try {
    window.sessionStorage.removeItem(RECOMMENDATION_SESSION_KEY);
    window.sessionStorage.removeItem(RECOMMENDATION_CACHE_KEY);
  } catch {
    // 로그아웃 자체는 브라우저 저장소 상태와 무관하게 완료되어야 한다.
  }
}

// 세그먼트 토글로 결과가 바뀌면 저장된 값이 가장 최신이므로 저장소를 우선한다.
// (검색/재검색은 항상 persistRecommendation을 거치므로 location.state와 같은 값이다.)
export function getActiveRecommendationResult(location) {
  return readPersistedRecommendation()?.result ?? location?.state?.recommendationResult ?? null;
}

export function getPersistedRecommendationRequest() {
  return readPersistedRecommendation()?.request ?? null;
}

export function contributionDisplayValue(value, isLoggedIn) {
  if (isLoggedIn && String(value || "").includes("?")) {
    return String(value).includes("만원")
      ? DUMMY_CONTRIBUTION_AMOUNT
      : DUMMY_CONTRIBUTION_RATE;
  }
  return value;
}

function indexByProductId(items) {
  const map = new Map();
  asArray(items).forEach((item) => {
    if (item?.productId !== undefined && item?.productId !== null) {
      map.set(String(item.productId), item);
    }
  });
  return map;
}

function buildIndices(result) {
  return {
    govMatches: indexByProductId(result?.governmentRanked),
    bankMatches: indexByProductId(result?.bankRanked),
    govRates: indexByProductId(result?.governmentRateRanked),
    bankRates: indexByProductId(result?.bankRateRanked),
    subscriptionRates: indexByProductId(result?.subscriptionProducts),
    // 단기 예치(파킹통장, 단기 예·적금) 상품: 목록은 전용 빌더로 만들지만, 상세 화면은 같은 id로 찾을 수 있어야 한다.
    parkingRates: indexByProductId(result?.parkingProducts),
    depositRates: indexByProductId(result?.depositSavingsProducts),
    details: indexByProductId(result?.productDetails),
  };
}

function collectAllIds(indices) {
  return new Set([
    ...indices.govMatches.keys(),
    ...indices.bankMatches.keys(),
    ...indices.govRates.keys(),
    ...indices.bankRates.keys(),
    ...indices.subscriptionRates.keys(),
    ...indices.details.keys(),
  ]);
}

function buildSubtitle(providerName, detail) {
  const periods = asArray(detail?.saveTrms).map(toFiniteNumber).filter((p) => p !== null);
  const period = periods.length > 0 ? `${Math.max(...periods)}개월` : null;
  const minLimit = formatMonthlyDeposit(detail?.minMonthlyLimit);
  const maxLimit = formatMonthlyDeposit(detail?.maxMonthlyLimit);
  const amountRange = minLimit && maxLimit
    ? `월 ${minLimit}~${maxLimit}`
    : maxLimit
      ? `월 최대 ${maxLimit}`
      : null;

  return [providerName, period, amountRange].filter(Boolean).join(" · ") || providerName || "";
}

function buildRateConditionRows(bank, rateTable) {
  const metRows = asArray(bank?.metConditions).map((condition) => ({
    label: condition.description || keywordLabel(condition.keywordCode),
    value: `+${formatRate(condition.rate) ?? "0"}%`,
    status: "matched",
  }));
  const unmetRows = asArray(bank?.unmetConditions).map((condition) => ({
    label: condition.description || keywordLabel(condition.keywordCode),
    value: `+${formatRate(condition.rate) ?? "0"}%`,
    status: "missed",
  }));

  const intrRateType = asArray(rateTable)[0]?.intrRateType;
  const interestRow = intrRateType
    ? [{ label: "이자 계산 방식", value: interestTypeLabel(intrRateType), status: "neutral" }]
    : [];

  return [...metRows, ...unmetRows, ...interestRow];
}

function buildCalculatorConfig({ detail, baseRateNum, achievableRateNum, monthlySavingsGoal }) {
  const bank = detail?.bank;
  const months = Math.max(...asArray(detail?.saveTrms).map(toFiniteNumber).filter((p) => p !== null), 0) || 12;
  const maxLimit = toFiniteNumber(detail?.maxMonthlyLimit) ?? 500_000;
  const minLimit = toFiniteNumber(detail?.minMonthlyLimit);
  const requestedAmount = toFiniteNumber(monthlySavingsGoal);
  const monthlyAmount = requestedAmount !== null
    ? Math.min(maxLimit, Math.max(minLimit ?? requestedAmount, requestedAmount))
    : maxLimit;
  const accumulationType = reserveTypeShortLabel(detail?.reserveType);
  const intrRateType = asArray(detail?.rateTable)[0]?.intrRateType;
  const interestType = interestTypeLabel(intrRateType) || "단리";
  const isTaxFree = asArray(detail?.keywords).includes("BENEFIT_TAX_FREE");
  const taxType = isTaxFree ? "비과세 0%" : "일반 15.4%";
  const headlineRateNum = achievableRateNum ?? baseRateNum ?? 0;
  const bonusRate = baseRateNum !== null ? Math.max(headlineRateNum - baseRateNum, 0) : 0;

  const conditions = [
    ...asArray(bank?.metConditions).map((condition) => ({
      id: condition.keywordCode || condition.description,
      label: `${condition.description || keywordLabel(condition.keywordCode)} ${formatRate(condition.rate) ?? "0"}%`,
      rate: toFiniteNumber(condition.rate) ?? 0,
      active: true,
    })),
    ...asArray(bank?.unmetConditions).map((condition) => ({
      id: condition.keywordCode || condition.description,
      label: `${condition.description || keywordLabel(condition.keywordCode)} ${formatRate(condition.rate) ?? "0"}%`,
      rate: toFiniteNumber(condition.rate) ?? 0,
      active: false,
    })),
  ];

  return {
    headlineRate: `${formatNumber(headlineRateNum)}%`,
    baseText: `기본 ${formatNumber(baseRateNum ?? 0)}% + 충족 우대 ${formatNumber(bonusRate)}%`,
    baseRate: baseRateNum ?? 0,
    conditions,
    // 기존 화면과의 호환을 위해 유지합니다.
    chips: conditions,
    monthlyAmount: Math.min(monthlyAmount, 3_000_000),
    months,
    accumulationType,
    interestType,
    taxType,
  };
}

function buildProductView(id, indices, monthlySavingsGoal) {
  const { govMatches, bankMatches, govRates, bankRates, subscriptionRates, details } = indices;

  const match = govMatches.get(id) || bankMatches.get(id);
  const rate = govRates.get(id) || bankRates.get(id) || subscriptionRates.get(id)
    || indices.depositRates.get(id) || indices.parkingRates.get(id);
  const detail = details.get(id);

  const isSubscription = Boolean(rate?.isSubscription) || subscriptionRates.has(id);
  const isGovernment = govMatches.has(id) || govRates.has(id) || Boolean(detail?.government);
  const category = isSubscription
    ? "청약 상품"
    : isGovernment
      ? "정부 청년 상품"
      : "시중 은행 상품 · 제 1금융권";

  const productName = match?.productName || rate?.productName || detail?.productName || "";
  const providerName = match?.providerName || rate?.providerName || detail?.providerName || "";
  const score = toFiniteNumber(match?.totalScore ?? detail?.matchScore);
  const baseRateNum = toFiniteNumber(rate?.baseRate ?? detail?.bank?.baseRate);
  const maxRateNum = toFiniteNumber(detail?.bank?.maxRate) ?? toFiniteNumber(rate?.maxRate) ?? baseRateNum;
  const achievableRateNum = toFiniteNumber(rate?.achievableRate ?? detail?.bank?.achievableRate);

  const government = detail?.government;
  const rawContributionRate = formatContributionRate(government?.annualizedYield ?? achievableRateNum);
  const rawMaturityContribution = formatContributionAmount(government?.expectedTotalContribution);
  const monthlyDeposit = formatMonthlyDeposit(government?.effectiveMonthlyDeposit);
  const contributionMonths = toFiniteNumber(government?.contributionPeriodMonths);
  const hasCalculatedContribution = Boolean(government && rawContributionRate && rawMaturityContribution);
  const contributionPeriodLabel = contributionMonths
    ? (contributionMonths % 12 === 0 ? `${contributionMonths / 12}년` : `${contributionMonths}개월`)
    : null;
  // 시중은행 상품: 원금 · 본인 월 납입액, 납입기간 기준 (정부 상품과 같은 형식).
  // 백엔드 응답에 principal/saveTrm이 있으면 그걸 쓰고, 월 납입액은 원금 ÷ 개월수로 구한다.
  const bankPrincipal = toFiniteNumber(rate?.principal);
  const bankSaveTrm = toFiniteNumber(rate?.saveTrm);
  const bankMonthly = bankPrincipal && bankSaveTrm ? Math.round(bankPrincipal / bankSaveTrm) : null;
  const bankPeriodLabel = bankSaveTrm
    ? (bankSaveTrm % 12 === 0 ? `${bankSaveTrm / 12}년` : `${bankSaveTrm}개월`)
    : null;
  const bankCaption = !isGovernment && !isSubscription && bankMonthly
    ? `원금 ${formatPrincipal(bankPrincipal)} · 본인 월 ${formatMonthlyDeposit(bankMonthly)}, ${bankPeriodLabel} 납입 기준`
    : null;
  const contributionCaption = monthlyDeposit && contributionPeriodLabel
    ? `${reserveTypeShortLabel(detail?.reserveType)} 매칭 · 본인 월 ${monthlyDeposit}, ${contributionPeriodLabel} 납입 기준`
    : bankCaption || rate?.subscriptionNote || null;

  // 키워드 태그: 지역/상품 종류(예적금·대출)는 보여주지 않는다. 핵심 혜택은 회색(benefit), 은행 우대 조건은 파랑(bank)으로
  // 색이 정해진 태그로, 정부 지원금과 그 외(기간/신분 등)는 기존 문자열 태그 그대로 둔다.
  const keywordTags = asArray(detail?.keywords)
    .filter((code) => !code.startsWith("REGION_") && !code.startsWith("INTEREST_") && code !== "BANK_ETC")
    .map((code) => {
      if (code.startsWith("BANK_")) return { label: keywordLabel(code), kind: "bank" };
      if (code.startsWith("BENEFIT_") && code !== "BENEFIT_GOV_SUBSIDY") return { label: keywordLabel(code), kind: "benefit" };
      return keywordLabel(code);
    });

  // 적합도 태그: 정부 청년 상품은 기존 주황색 문자열 태그 그대로, 시중은행 상품은 보라색(suitabilityBank) 태그로 구분한다.
  const isBankProduct = !isGovernment && !isSubscription;
  const suitabilityLabel = `적합도 ${Math.round(score)}%`;
  // 단기 예치(파킹통장, 단기 예·적금)에는 적합도 점수 개념이 없다(서버가 0을 줘서 "적합도 0%"로 보였다).
  // 적합도 태그는 빼고, 파킹통장은 목록 카드와 같은 "예금자보호/이자 지급 방식" 태그를 보여준다.
  const parkingItem = indices.parkingRates.get(id);
  const isShortTermProduct = Boolean(parkingItem) || indices.depositRates.has(id);
  const parkingTags = parkingItem
    ? [parkingItem.depositProtection ? "예금자보호" : null, parkingItem.interestPaymentMethod].filter(Boolean)
    : [];
  const tags = isShortTermProduct
    ? [...parkingTags, ...keywordTags]
    : [
      ...(score !== null ? [isBankProduct ? { label: suitabilityLabel, kind: "suitabilityBank" } : suitabilityLabel] : []),
      ...keywordTags,
    ];

  const filterTags = [
    detail?.productType ? productTypeLabel(detail.productType) : null,
    isGovernment ? "정부 지원" : null,
  ].filter(Boolean);

  const saveTrms = asArray(detail?.saveTrms).map(toFiniteNumber).filter((p) => p !== null);
  const maxTerm = saveTrms.length > 0 ? Math.max(...saveTrms) : null;
  const minLimit = formatMonthlyDeposit(detail?.minMonthlyLimit);
  const maxLimit = formatMonthlyDeposit(detail?.maxMonthlyLimit);

  return {
    id,
    productId: id,
    productPropertyId: toFiniteNumber(match?.productPropertyId ?? detail?.productPropertyId),
    category,
    title: productName,
    institution: providerName,
    metaInstitution: providerName ? `기관 ${providerName}` : "",
    detailTitle: productName,
    subtitle: buildSubtitle(providerName, detail),
    periodSummary: maxTerm ? `${maxTerm}개월` : "상시",
    amountSummary: minLimit && maxLimit ? `월 납입 ${minLimit}~${maxLimit}` : "가입 조건 확인 필요",
    baseRate: baseRateNum !== null ? formatRateValue(baseRateNum) : "0",
    maxRate: maxRateNum !== null ? formatRateValue(maxRateNum) : "0",
    myRate: achievableRateNum !== null ? formatRateValue(achievableRateNum) : "0",
    // 파킹통장은 공시금리라 개인별 "내가 받을 수 있는 금리"가 없다. 상세 화면은 이 값이 있으면 금리 대신
    // 목록과 같은 "최고금리 적용한도" 알약을 보여준다.
    ratePill: indices.parkingRates.has(id)
      ? { label: "최고금리 적용한도", value: buildMaxRateLimitCaption(indices.parkingRates.get(id)) ?? "정보 없음" }
      : null,
    suitability: score ?? 0,
    tags: tags.length > 0 ? tags : ["추천 상품"],
    filterTags,
    contributionRate: rawContributionRate ?? DUMMY_CONTRIBUTION_RATE,
    maturityContribution: rawMaturityContribution ?? DUMMY_CONTRIBUTION_AMOUNT,
    contributionCaption,
    hasCalculatedContribution,

    // ProductDetail / ProductRateCalculator 전용 필드
    productType: [productTypeLabel(detail?.productType), reserveTypeLabel(detail?.reserveType)]
      .filter(Boolean)
      .join(" · ") || "정기적금",
    savingPeriod: maxTerm ? `${maxTerm}개월 만기` : "상시 가입",
    depositRange: minLimit && maxLimit ? `월 ${minLimit} ~ ${maxLimit}` : "가입 조건 확인 필요",
    applicationMethod: detail?.joinMethod || "취급기관 앱 / 영업점",
    target: splitLines(detail?.eligibilityText).length > 0
      ? splitLines(detail?.eligibilityText)
      : ["가입 대상 정보를 준비 중이에요."],
    caution: splitLines(detail?.cautionText).length > 0
      ? splitLines(detail?.cautionText)
      : ["유의 사항 정보를 준비 중이에요."],
    rateTerm: maxTerm ? `${maxTerm}개월` : "상시",
    baseRateDisplay: baseRateNum !== null ? `${formatNumber(baseRateNum)}%` : "0.00%",
    maxRateDisplay: maxRateNum !== null ? `${formatNumber(maxRateNum)}%` : "0.00%",
    rateNotice: RATE_NOTICE,
    rateConditions: buildRateConditionRows(detail?.bank, detail?.rateTable),
    // 구조화된 우대금리 조건(충족/미충족 목록)이 없는 상품(파킹통장 등)은 서버가 주는 요약 문구로 대신 안내한다.
    rateConditionSummary: detail?.contentSummary || null,
    recruitPeriod: detail?.recruitmentPeriod || "취급기관 상시 확인 필요",
    applyUrl: detail?.applyUrl || null,
    providerName: detail?.providerName || providerName || null,
    officialChannelUrl: detail?.officialChannelUrl || null,
    officialChannelName: detail?.officialChannelName || null,
    calculator: buildCalculatorConfig({ detail, baseRateNum, achievableRateNum, monthlySavingsGoal }),

    detail,
  };
}

export function buildProductListFromResult(result) {
  if (!result) return [];

  const indices = buildIndices(result);
  const ids = collectAllIds(indices);

  return [...ids]
    .map((id) => buildProductView(id, indices, result?.monthlySavingsGoal))
    .sort((a, b) => b.suitability - a.suitability);
}

// 최고금리가 적용되는 잔액 구간. 백엔드는 금액(won) 상/하한만 내려주고 비율(%) 필드는 없다.
function buildMaxRateLimitCaption(p) {
  const minAmount = toFiniteNumber(p.maxRateApplicableMinAmount);
  const maxAmount = toFiniteNumber(p.maxRateApplicableMaxAmount);
  if (!maxAmount) return null;

  const maxLabel = formatMonthlyDeposit(maxAmount);
  const value = minAmount
    ? `${formatMonthlyDeposit(minAmount)}~${maxLabel}`
    : maxLabel;
  return value;
}

function buildParkingProductView(p, detail) {
  const limitCaption = buildMaxRateLimitCaption(p);

  return {
    id: String(p.productId),
    productId: p.productId,
    category: "파킹통장",
    title: p.productName,
    institution: p.providerName,
    // 부제목에서는 "예금자보호"를 보여주지 않는다(값은 depositProtection으로 그대로 보관).
    subtitle: [p.providerName, p.interestPaymentMethod]
      .filter(Boolean)
      .join(" · "),
    depositProtection: Boolean(p.depositProtection),
    baseRate: formatRateValue(toFiniteNumber(p.baseRate) ?? 0),
    maxRate: formatRateValue(toFiniteNumber(p.maxRate) ?? 0),
    myRate: formatRateValue(toFiniteNumber(p.maxRate) ?? 0),
    suitability: toFiniteNumber(p.maxRate) ?? 0,
    // 단기 예적금과 같은 규칙: 이 상품이 가진 핵심 혜택(회색)/은행 우대(파랑) 키워드를 태그로 보여준다.
    // 해당하는 키워드가 없거나 상세를 아직 못 받았으면 기존 태그(예금자보호/이자 지급 방식)로 대신한다.
    tags: (() => {
      const keywordTags = ownKeywordTags(detail);
      return keywordTags.length > 0
        ? keywordTags
        : [p.depositProtection ? "예금자보호" : null, p.interestPaymentMethod].filter(Boolean);
    })(),
    filterTags: ["예금"],
    applyUrl: p.applyUrl || null,
    // 파킹통장은 로그인 여부와 무관하게 공개되는 공시금리라 "내가 받을 금리" 대신
    // 최고금리가 실제로 적용되는 잔액 구간을 보여준다.
    ratePillLabel: "최고금리 적용한도",
    // 공시에 최고금리 적용 한도가 없는 상품(파킹통장 45개 중 26개)은 값이 비어 알약이 빈칸으로 보이므로 문구로 채운다.
    ratePillValue: limitCaption ?? "정보 없음",
  };
}

// 단기 예적금 카드의 "예상 세후 실수령액" 표기: 1만원 이상이면 "30.2만원", 그보다 작으면 "5,000원".
function formatNetReturn(value) {
  const won = toFiniteNumber(value);
  if (won === null) return null;
  return won >= 10_000 ? `${formatNumber(won / 10_000, 1)}만원` : `${formatNumber(won, 0)}원`;
}

// 단기 예적금 카드 태그: 사용자가 고른 키워드와 상관없이, 그 상품이 가진 핵심 혜택(BENEFIT_*, 회색)과
// 은행 우대 조건(BANK_*, 파랑)을 상품 상세의 keywords에서 가져와 보여준다. 이름은 목돈 만들기 카드와 같은 키워드 이름을 쓴다.
// 상세를 아직 못 받았거나 해당하는 키워드가 하나도 없는 상품만 예금/적금 구분 태그로 대신한다.
function ownKeywordTags(detail) {
  return asArray(detail?.keywords).flatMap((code) => {
    if (code === "BANK_ETC") return [];
    if (code.startsWith("BANK_")) return [{ label: keywordLabel(code), kind: "bank" }];
    if (code.startsWith("BENEFIT_")) return [{ label: keywordLabel(code), kind: "benefit" }];
    return [];
  });
}

function depositKeywordTags(typeLabel, detail) {
  const tags = ownKeywordTags(detail);
  return tags.length > 0 ? tags : [typeLabel].filter(Boolean);
}

function buildDepositSavingsProductView(p, detail) {
  const typeLabel = productTypeLabel(p.productType) || null;
  const saveTrm = toFiniteNumber(p.saveTrm);
  const principal = toFiniteNumber(p.principal);
  const principalLabel = formatPrincipal(principal);
  const monthlyAmount = p.productType === "SAVING" && saveTrm ? Math.round(principal / saveTrm) : null;
  const principalCaption = principalLabel && saveTrm
    ? (monthlyAmount
        ? `원금 ${principalLabel} · 본인 월 ${formatMonthlyDeposit(monthlyAmount)}, ${saveTrm}개월 납입 기준`
        : `원금 ${principalLabel} · 본인 ${saveTrm}개월 예치 기준`)
    : null;

  return {
    id: String(p.productId),
    productId: p.productId,
    category: "단기 예·적금",
    title: p.productName,
    institution: p.providerName,
    subtitle: [p.providerName, p.saveTrm ? `${p.saveTrm}개월` : null, typeLabel].filter(Boolean).join(" · "),
    baseRate: formatRateValue(toFiniteNumber(p.baseRate) ?? 0),
    maxRate: formatRateValue(toFiniteNumber(p.achievableRate) ?? 0),
    myRate: formatRateValue(toFiniteNumber(p.achievableRate) ?? 0),
    suitability: toFiniteNumber(p.achievableRate) ?? 0,
    // 단기 예적금 카드는 예금/적금 구분 대신, 이 상품이 가진 핵심 혜택(회색)/은행 우대 조건(파랑) 키워드를 태그로 보여준다.
    // 필터(예금/적금)는 filterTags로 그대로 동작한다.
    tags: depositKeywordTags(typeLabel, detail),
    // 카드 금리 영역에 "내가 받을 금리 / 예상 세후 실수령액"을 보여주기 위한 값(값이 없으면 빈 문자열이라 가려져 보인다).
    netReturnDisplay: formatNetReturn(p.netReturn) ?? "",
    filterTags: [typeLabel].filter(Boolean),
    applyUrl: null,
    // 기존 "내가 받을 금리" 바는 그대로 두고, 그 아래에 원금·납입 조건을 추가로 보여준다.
    contributionCaption: principalCaption,
  };
}

// 단기예치(SHORT_TERM)의 파킹통장(탭C) 전용 평면 목록. 백엔드가 섹터 구분을 내려주지 않아
// 정부/은행 구분 없이 최고 금리 기준 하나의 목록으로만 보여준다.
export function buildParkingProductListFromResult(result) {
  if (!result) return [];
  const details = indexByProductId(result.productDetails);
  return asArray(result.parkingProducts)
    .map((p) => buildParkingProductView(p, details.get(String(p.productId))))
    .sort((a, b) => b.suitability - a.suitability);
}

// 단기예치(SHORT_TERM)의 단기 예·적금(탭D) 전용 평면 목록. 마찬가지로 섹터 구분 없이
// 세후 실수령액(achievableRate) 기준 하나의 목록으로만 보여준다.
export function buildDepositSavingsProductListFromResult(result) {
  if (!result) return [];
  const details = indexByProductId(result.productDetails);
  return asArray(result.depositSavingsProducts)
    .map((p) => buildDepositSavingsProductView(p, details.get(String(p.productId))))
    .sort((a, b) => b.suitability - a.suitability);
}

// 단기 예치 목록(파킹통장/단기 예·적금)에 있는 상품이면 그 항목을, 아니면 null.
export function findShortTermListItem(result, productId) {
  if (!result || productId === undefined || productId === null) return null;
  const id = String(productId);
  const indices = buildIndices(result);
  return indices.parkingRates.get(id) || indices.depositRates.get(id) || null;
}

// 단기 예치 상품은 검색 응답에 상세(productDetails)가 없어서, 상세 화면이 따로 불러와야 하는지 알려준다.
export function shortTermNeedsDetail(result, productId) {
  const item = findShortTermListItem(result, productId);
  if (!item) return null;
  const hasDetail = buildIndices(result).details.has(String(productId));
  return hasDetail ? null : item;
}

export function findProductViewById(result, productId) {
  if (!result || productId === undefined || productId === null) return null;

  const indices = buildIndices(result);
  const id = String(productId);
  const known = collectAllIds(indices).has(id) || indices.parkingRates.has(id) || indices.depositRates.has(id);
  if (!known) return null;

  return buildProductView(id, indices, result?.monthlySavingsGoal);
}
