import client, { withAuth } from "../api/client";
import { clearRecommendationCache, persistRecommendation } from "./recommendationResult";
import { clearProductListView } from "./productListView";

function collectDetailTargets(result) {
  const candidates = [
    ...(Array.isArray(result?.governmentRanked) ? result.governmentRanked : []),
    ...(Array.isArray(result?.bankRanked) ? result.bankRanked : []),
    ...(Array.isArray(result?.subscriptionProducts) ? result.subscriptionProducts : []),
    // 단기 예·적금도 상품별 키워드(핵심 혜택/은행 우대)가 상세에 있어, 카드 태그를 상품에 맞게 보여주려면 필요하다.
    ...(Array.isArray(result?.depositSavingsProducts) ? result.depositSavingsProducts : []),
    // 파킹통장도 마찬가지(상품별 키워드 태그에 필요).
    ...(Array.isArray(result?.parkingProducts) ? result.parkingProducts : []),
  ].filter((item) => item?.productId !== undefined && item?.productId !== null);

  return [...new Map(candidates.map((item) => [String(item.productId), item])).values()];
}

async function fetchProductDetails(result, request, accessToken) {
  const targets = collectDetailTargets(result);

  const detailResults = await Promise.allSettled(
    targets.map(async (target) => {
      const response = await client.post(
        `/search/products/${target.productId}/detail`,
        {
          productPropertyId: target.productPropertyId ?? null,
          options: request.options,
          detailedOptions: request.detailedOptions,
        },
        withAuth(accessToken),
      );
      return response.data ?? null;
    }),
  );

  return detailResults.flatMap((detailResult) =>
    detailResult.status === "fulfilled" && detailResult.value
      ? [detailResult.value]
      : [],
  );
}

// preserveCache: 대분류 토글로 반대 대분류만 추가 조회할 때 true. 입력값이 바뀌는 일반 검색은
// 기존 대분류별 캐시가 낡은 값이 되므로 먼저 비운다.
export async function runProductSearch(request, accessToken, { preserveCache = false, selectedKeywords = null } = {}) {
  let result;
  try {
    const res = await client.post("/search/products", request, withAuth(accessToken));
    result = res.data;
  } catch (e) {
    const errorBody = e?.response?.data;
    throw new Error(errorBody?.message || errorBody?.error || "상품 분석에 실패했습니다.");
  }

  const productDetails = await fetchProductDetails(result, request, accessToken);
  const recommendation = {
    request,
    result: {
      ...result,
      productDetails,
      // 사용자가 1단계에서 고른 핵심 혜택/은행 우대 조건 이름(단기 예적금 카드의 키워드 태그에 쓴다).
      selectedKeywords,
      monthlySavingsGoal: request?.detailedOptions?.monthlySavingsGoal ?? null,
    },
  };

  if (!preserveCache) {
    clearRecommendationCache();
    clearProductListView(); // 새 분석이면 이전에 보던 탭/필터 상태는 비운다.
  }
  persistRecommendation({ request: recommendation.request, result: recommendation.result });
  return recommendation;
}
