const keywords = {
  tax: "BENEFIT_TAX_FREE",
  marketing: "BANK_MARKETING",
  salary: "BANK_SALARY_TRANSFER",
  easy: "BENEFIT_EASY_CONDITION",
  auto: "BANK_AUTO_TRANSFER",
};

function detail({
  id,
  name,
  provider,
  type = "SAVING",
  terms = [24],
  min = 10000,
  max = 500000,
  baseRate = 2,
  maxRate = 5,
  achievableRate = maxRate,
  tags = [],
  maxRateLimitText,
  government,
}) {
  return {
    productId: id,
    productPropertyId: id * 10,
    productName: name,
    providerName: provider,
    productType: type,
    saveTrms: terms,
    minMonthlyLimit: min,
    maxMonthlyLimit: max,
    keywords: tags,
    bank: { baseRate, maxRate, achievableRate, maxRateLimitText },
    government,
  };
}

const products = [
  detail({ id: 1, name: "청년 미래 적금", provider: "정부 지원", terms: [36], tags: [keywords.tax, "BENEFIT_GOV_SUBSIDY"], government: { annualizedYield: 4, expectedTotalContribution: 2160000, effectiveMonthlyDeposit: 500000, contributionPeriodMonths: 36 } }),
  detail({ id: 2, name: "급여하나 월복리 적금", provider: "하나은행", terms: [12, 24, 36], min: 10000, max: 3000000, baseRate: 2, maxRate: 3.35, achievableRate: 2.8, tags: [keywords.salary] }),
  detail({ id: 3, name: "청년 내일 저축 계좌", provider: "정부 지원", terms: [36], tags: [keywords.tax, "BENEFIT_GOV_SUBSIDY"], government: { annualizedYield: 33.3, expectedTotalContribution: 10800000, effectiveMonthlyDeposit: 300000, contributionPeriodMonths: 36 } }),
  detail({ id: 4, name: "NH1934 월복리 적금", provider: "NH농협은행", terms: [24], min: 10000, max: 500000, baseRate: 2, maxRate: 5, achievableRate: 4.35, tags: [keywords.easy, keywords.marketing] }),
  detail({ id: 5, name: "부산청년 기쁨두배통장", provider: "정부 지원", terms: [24], tags: [keywords.tax, "BENEFIT_GOV_SUBSIDY"], government: { annualizedYield: 50, expectedTotalContribution: 2400000, effectiveMonthlyDeposit: 100000, contributionPeriodMonths: 24 } }),
  detail({ id: 6, name: "매일이자 Wa파킹통장", provider: "광주은행", type: "PARKING", terms: [], min: 0, max: 30000000, baseRate: 2.5, maxRate: 5.1, tags: [keywords.marketing], maxRateLimitText: "30만원" }),
  detail({ id: 7, name: "스마트박스 통장", provider: "SC제일은행", type: "PARKING", terms: [], min: 0, max: null, baseRate: 0.3, maxRate: 5, tags: [keywords.salary], maxRateLimitText: "잔액의 50%" }),
  detail({ id: 8, name: "씨드모아(소액우대) 통장", provider: "전북은행", type: "PARKING", terms: [], min: 0, max: null, baseRate: 1.8, maxRate: 4, tags: [keywords.marketing], maxRateLimitText: "5,000만원" }),
  detail({ id: 9, name: "카카오뱅크 저금통", provider: "카카오뱅크", type: "PARKING", terms: [], min: 10000, max: 5000000, baseRate: 4, maxRate: 4, tags: [keywords.marketing], maxRateLimitText: "10만원" }),
  detail({ id: 10, name: "헤이(hey) 정기예금", provider: "Sh수협은행", type: "DEPOSIT", terms: [3], min: 100000, max: 100000000, baseRate: 3.2, maxRate: 3.4, achievableRate: 3.4, tags: [keywords.marketing] }),
  detail({ id: 11, name: "KB 특★한 적금", provider: "KB국민은행", type: "SAVING", terms: [1, 3], min: 1000, max: 300000, baseRate: 3.5, maxRate: 4.4, achievableRate: 4.4, tags: [keywords.easy, keywords.auto] }),
  detail({ id: 12, name: "부산이라 좋다 Big적금", provider: "부산은행", type: "SAVING", terms: [1, 3], min: 1000, max: 1000000, baseRate: 3.1, maxRate: 3.8, achievableRate: 3.8, tags: [keywords.auto, keywords.salary] }),
  detail({ id: 13, name: "NH올원e 미니적금", provider: "NH농협은행", type: "SAVING", terms: [1, 3], min: 1000, max: 1550000, baseRate: 3, maxRate: 3.3, achievableRate: 3.3, tags: [keywords.easy, keywords.auto] }),
];

const byId = new Map(products.map((product) => [product.productId, product]));
const ranked = (ids, scores) => ids.map((productId, index) => ({
  productId,
  productPropertyId: productId * 10,
  productName: byId.get(productId).productName,
  providerName: byId.get(productId).providerName,
  totalScore: scores?.[index] ?? 80 - index,
  baseRate: byId.get(productId).bank.baseRate,
  maxRate: byId.get(productId).bank.maxRate,
  maxRateLimitText: byId.get(productId).bank.maxRateLimitText,
}));
const rateRanked = (ids) => ids.map((productId) => ({
  productId,
  productPropertyId: productId * 10,
  productName: byId.get(productId).productName,
  providerName: byId.get(productId).providerName,
  baseRate: byId.get(productId).bank.baseRate,
  achievableRate: byId.get(productId).bank.achievableRate,
}));

export const PRODUCT_LIST_MOCK_RESULT = {
  savingPlan: "goal",
  savingMonths: 3,
  monthlySavingsGoal: 3000000,
  eligibleProductCount: 336,
  tabs: { tabBEnabled: true },
  governmentRanked: ranked([1, 3, 5], [92, 84, 80]),
  governmentRateRanked: rateRanked([1, 3, 5]),
  bankRanked: ranked([2, 4, 10, 11, 12, 13], [88, 82, 78, 76, 74, 72]),
  bankRateRanked: rateRanked([2, 4, 10, 11, 12, 13]),
  parkingRanked: ranked([6, 7, 8, 9], [90, 88, 86, 84]),
  productDetails: products,
};
