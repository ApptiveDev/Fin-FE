const RECOMMENDATION_SESSION_KEY = "fin:last-recommendation";
const DUMMY_CONTRIBUTION_RATE = "연 4.00%";
const DUMMY_CONTRIBUTION_AMOUNT = "100 만원";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProductName(value = "") {
  return String(value).replace(/\s+/g, "").toLowerCase();
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

function updateSuitabilityTag(tags, score) {
  if (score === null) return tags;
  const nextTag = `적합도 ${Math.round(score)}%`;
  const remainingTags = asArray(tags).filter((tag) => !String(tag).includes("적합도"));
  return [nextTag, ...remainingTags];
}

function mapByProductName(items) {
  return new Map(
    asArray(items)
      .filter((item) => item?.productName)
      .map((item) => [normalizeProductName(item.productName), item]),
  );
}

function productSubtitle(detail) {
  const providerName = detail.providerName || "정부 지원";
  const periods = asArray(detail.saveTrms)
    .map(toFiniteNumber)
    .filter((period) => period !== null);
  const period = periods.length > 0 ? `${Math.max(...periods)}개월` : null;
  const minMonthlyLimit = formatMonthlyDeposit(detail.minMonthlyLimit);
  const maxMonthlyLimit = formatMonthlyDeposit(detail.maxMonthlyLimit);
  const monthlyLimit = minMonthlyLimit && maxMonthlyLimit
    ? `월 ${minMonthlyLimit}~${maxMonthlyLimit}`
    : maxMonthlyLimit
      ? `월 최대 ${maxMonthlyLimit}`
      : null;

  return [providerName, period, monthlyLimit].filter(Boolean).join(" · ");
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

export function applyRecommendationResult(products, result, isLoggedIn) {
  if (!isLoggedIn || !result) return products;

  const matchByName = mapByProductName([
    ...asArray(result.governmentRanked),
    ...asArray(result.bankRanked),
  ]);
  const rateByName = mapByProductName([
    ...asArray(result.governmentRateRanked),
    ...asArray(result.bankRateRanked),
  ]);
  const detailByName = mapByProductName(result.governmentDetails);

  const hydratedProducts = products.map((product) => {
    const key = normalizeProductName(product.title);
    const match = matchByName.get(key);
    const rate = rateByName.get(key);
    const detail = detailByName.get(key);
    const government = detail?.government;
    const score = toFiniteNumber(match?.totalScore);
    const achievableRate = toFiniteNumber(rate?.achievableRate);

    const contributionRate = formatContributionRate(
      government?.annualizedYield ?? achievableRate,
    );
    const maturityContribution = formatContributionAmount(
      government?.expectedTotalContribution,
    );
    const monthlyDeposit = formatMonthlyDeposit(government?.effectiveMonthlyDeposit);
    const contributionMonths = toFiniteNumber(government?.contributionPeriodMonths);
    const contributionCaption = monthlyDeposit && contributionMonths
      ? `월 ${monthlyDeposit} 납입 · ${contributionMonths}개월 기준`
      : product.contributionCaption;

    return {
      ...product,
      suitability: score ?? product.suitability,
      tags: updateSuitabilityTag(product.tags, score),
      myRate: achievableRate === null ? product.myRate : formatNumber(achievableRate),
      contributionRate: contributionRate ?? product.contributionRate,
      maturityContribution: maturityContribution ?? product.maturityContribution,
      contributionCaption,
      hasCalculatedContribution: Boolean(contributionRate && maturityContribution),
    };
  });

  const localProductByName = new Map(
    products.map((product) => [normalizeProductName(product.title), product]),
  );
  const calculatedGovernmentProducts = asArray(result.governmentDetails).flatMap((detail) => {
    if (!detail?.government || !detail?.productName) return [];

    const key = normalizeProductName(detail.productName);
    const localProduct = localProductByName.get(key);
    const match = matchByName.get(key);
    const rate = rateByName.get(key);
    const government = detail.government;
    const score = toFiniteNumber(match?.totalScore);
    const contributionRate = formatContributionRate(
      government.annualizedYield ?? rate?.achievableRate,
    );
    const maturityContribution = formatContributionAmount(
      government.expectedTotalContribution,
    );
    const monthlyDeposit = formatMonthlyDeposit(government.effectiveMonthlyDeposit);
    const contributionMonths = toFiniteNumber(government.contributionPeriodMonths);
    const contributionCaption = monthlyDeposit && contributionMonths
      ? `월 ${monthlyDeposit} 납입 · ${contributionMonths}개월 기준`
      : localProduct?.contributionCaption || "입력 정보를 기준으로 계산했어요.";

    return [{
      ...localProduct,
      id: localProduct?.id ?? `recommended-${detail.productId}`,
      backendProductId: detail.productId,
      isBackendOnly: !localProduct,
      category: "정부 청년 상품",
      title: detail.productName,
      institution: detail.providerName || "정부 지원",
      subtitle: localProduct?.subtitle || productSubtitle(detail),
      baseRate: localProduct?.baseRate || "0",
      maxRate: localProduct?.maxRate || "0",
      myRate: formatNumber(toFiniteNumber(rate?.achievableRate) ?? 0),
      suitability: score ?? localProduct?.suitability ?? 0,
      tags: updateSuitabilityTag(
        localProduct?.tags || ["정부지원"],
        score,
      ),
      contributionRate: contributionRate || DUMMY_CONTRIBUTION_RATE,
      maturityContribution: maturityContribution || DUMMY_CONTRIBUTION_AMOUNT,
      contributionCaption,
      hasCalculatedContribution: Boolean(contributionRate && maturityContribution),
    }];
  });

  if (calculatedGovernmentProducts.length === 0) return hydratedProducts;

  return [
    ...calculatedGovernmentProducts,
    ...hydratedProducts.filter((product) => product.category !== "정부 청년 상품"),
  ];
}

export function contributionDisplayValue(value, isLoggedIn) {
  if (isLoggedIn && String(value || "").includes("?")) {
    return String(value).includes("만원")
      ? DUMMY_CONTRIBUTION_AMOUNT
      : DUMMY_CONTRIBUTION_RATE;
  }
  return value;
}
