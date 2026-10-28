import test from "node:test";
import assert from "node:assert/strict";
import { buildProductListFromResult, compareProductPayout, contributionDisplayValue } from "./recommendationResult.js";

function bankResult(overrides = {}) {
  return {
    monthlySavingsGoal: 3_000_000,
    bankRanked: [{ productId: 1 }],
    bankRateRanked: [{ productId: 1, achievableRate: 3.4 }],
    productDetails: [{ productId: 1, productType: "DEPOSIT", saveTrms: [3], bank: { baseRate: 2, maxRate: 4 } }],
    ...overrides,
  };
}

test("guest contribution values stay masked even when calculated values exist", () => {
  assert.equal(contributionDisplayValue("216 만원", false), "??? 만원");
  assert.equal(contributionDisplayValue("연 33.3%", false), "연 ??? %");
  assert.equal(contributionDisplayValue("??? 만원", true), "계산 정보 없음");
});

test("three-month deposits include principal and interest after tax", () => {
  const [product] = buildProductListFromResult(bankResult(), "short");
  assert.equal(product.netMaturityAmountWon, 3_021_573);
});

test("short savings divide the deposit budget across the selected short term", () => {
  const result = bankResult({
    bankRateRanked: [{ productId: 1, achievableRate: 4.4 }],
    productDetails: [{ productId: 1, productType: "SAVING", saveTrms: [1, 3, 12] }],
  });
  const [product] = buildProductListFromResult(result, "short");
  assert.equal(product.netMaturityAmountWon, 3_018_612);
});

test("missing payment and rate data never create a made-up maturity amount", () => {
  assert.equal(buildProductListFromResult(bankResult({ monthlySavingsGoal: null }))[0].netMaturityAmountWon, null);
  assert.equal(buildProductListFromResult(bankResult({ bankRateRanked: [] }))[0].netMaturityAmountWon, null);
});

test("government payouts sort by contribution amount and missing bank amounts sort last", () => {
  const government = [{ category: "정부 청년 상품", contributionAmountWon: 100, suitability: 100 }, { category: "정부 청년 상품", contributionAmountWon: 200, suitability: 0 }];
  assert.equal(government.sort(compareProductPayout)[0].contributionAmountWon, 200);
  const bank = [{ netMaturityAmountWon: null, suitability: 100 }, { netMaturityAmountWon: 100, suitability: 0 }];
  assert.equal(bank.sort(compareProductPayout)[0].netMaturityAmountWon, 100);
});

test("parking maximum-rate limits remain distinct from deposit limits", () => {
  const result = { parkingRanked: [{ productId: 7, productName: "파킹통장", baseRate: 2.5, maxRate: 5.1, maxRateLimitText: "잔액의 50%" }] };
  const [product] = buildProductListFromResult(result);
  assert.equal(product.isParking, true);
  assert.equal(product.maxRate, "5.1");
  assert.equal(product.maxRateLimitDisplay, "잔액의 50%");
});
