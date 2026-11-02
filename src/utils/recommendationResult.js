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
    return `${formatNumber(won / 10_000, 1)} 만원`;
  }

  return `${formatNumber(won, 0)} 원`;
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

export function persistRecommendation(recommendation) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(RECOMMENDATION_SESSION_KEY, JSON.stringify(recommendation));
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

  try {
    window.sessionStorage.removeItem(RECOMMENDATION_SESSION_KEY);
  } catch {
    // 로그아웃 자체는 브라우저 저장소 상태와 무관하게 완료되어야 한다.
  }
}

export function getActiveRecommendationResult(location) {
  return location?.state?.recommendationResult ?? readPersistedRecommendation()?.result ?? null;
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
  const rate = govRates.get(id) || bankRates.get(id) || subscriptionRates.get(id);
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
  const maxRateNum = toFiniteNumber(detail?.bank?.maxRate) ?? baseRateNum;
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
  const contributionCaption = monthlyDeposit && contributionPeriodLabel
    ? `${reserveTypeShortLabel(detail?.reserveType)} 매칭 · 본인 월 ${monthlyDeposit}, ${contributionPeriodLabel} 납입 기준`
    : rate?.subscriptionNote || null;

  const tags = [
    ...(score !== null ? [`적합도 ${Math.round(score)}%`] : []),
    ...asArray(detail?.keywords)
      .filter((code) => !code.startsWith("REGION_"))
      .map(keywordLabel),
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
    baseRate: baseRateNum !== null ? formatNumber(baseRateNum) : "0",
    maxRate: maxRateNum !== null ? formatNumber(maxRateNum) : "0",
    myRate: achievableRateNum !== null ? formatNumber(achievableRateNum) : "0",
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

function buildParkingProductView(p) {
  const limitCaption = buildMaxRateLimitCaption(p);

  return {
    id: String(p.productId),
    productId: p.productId,
    category: "파킹통장",
    title: p.productName,
    institution: p.providerName,
    subtitle: [p.providerName, p.interestPaymentMethod, p.depositProtection ? "예금자보호" : null]
      .filter(Boolean)
      .join(" · "),
    baseRate: formatNumber(toFiniteNumber(p.baseRate) ?? 0),
    maxRate: formatNumber(toFiniteNumber(p.maxRate) ?? 0),
    myRate: formatNumber(toFiniteNumber(p.maxRate) ?? 0),
    suitability: toFiniteNumber(p.maxRate) ?? 0,
    tags: [p.depositProtection ? "예금자보호" : null, p.interestPaymentMethod].filter(Boolean),
    filterTags: ["예금"],
    applyUrl: p.applyUrl || null,
    // 파킹통장은 로그인 여부와 무관하게 공개되는 공시금리라 "내가 받을 금리" 대신
    // 최고금리가 실제로 적용되는 잔액 구간을 보여준다.
    ratePillLabel: "최고금리 적용한도",
    ratePillValue: limitCaption ? `${limitCaption}까지` : null,
  };
}

function buildDepositSavingsProductView(p) {
  const typeLabel = productTypeLabel(p.productType) || null;
  const saveTrm = toFiniteNumber(p.saveTrm);
  const principal = toFiniteNumber(p.principal);
  const principalLabel = formatContributionAmount(principal);
  const monthlyAmount = p.productType === "SAVING" && saveTrm ? Math.round(principal / saveTrm) : null;
  const principalCaption = principalLabel && saveTrm
    ? (monthlyAmount
        ? `원금 ${principalLabel} · 본인 월 ${formatMonthlyDeposit(monthlyAmount)}, ${saveTrm}개월 납입 기준`
        : `원금 ${principalLabel} · ${saveTrm}개월 예치 기준`)
    : null;

  return {
    id: String(p.productId),
    productId: p.productId,
    category: "단기 예·적금",
    title: p.productName,
    institution: p.providerName,
    subtitle: [p.providerName, p.saveTrm ? `${p.saveTrm}개월` : null, typeLabel].filter(Boolean).join(" · "),
    baseRate: formatNumber(toFiniteNumber(p.baseRate) ?? 0),
    maxRate: formatNumber(toFiniteNumber(p.achievableRate) ?? 0),
    myRate: formatNumber(toFiniteNumber(p.achievableRate) ?? 0),
    suitability: toFiniteNumber(p.achievableRate) ?? 0,
    tags: [typeLabel].filter(Boolean),
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
  return asArray(result.parkingProducts).map(buildParkingProductView).sort((a, b) => b.suitability - a.suitability);
}

// 단기예치(SHORT_TERM)의 단기 예·적금(탭D) 전용 평면 목록. 마찬가지로 섹터 구분 없이
// 세후 실수령액(achievableRate) 기준 하나의 목록으로만 보여준다.
export function buildDepositSavingsProductListFromResult(result) {
  if (!result) return [];
  return asArray(result.depositSavingsProducts).map(buildDepositSavingsProductView).sort((a, b) => b.suitability - a.suitability);
}

export function findProductViewById(result, productId) {
  if (!result || productId === undefined || productId === null) return null;

  const indices = buildIndices(result);
  const id = String(productId);
  if (!collectAllIds(indices).has(id)) return null;

  return buildProductView(id, indices, result?.monthlySavingsGoal);
}
