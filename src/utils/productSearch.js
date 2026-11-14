import client, { withAuth } from "../api/client";
import { clearRecommendationCache, persistRecommendation } from "./recommendationResult";

function collectDetailTargets(result) {
  const candidates = [
    ...(Array.isArray(result?.governmentRanked) ? result.governmentRanked : []),
    ...(Array.isArray(result?.bankRanked) ? result.bankRanked : []),
    ...(Array.isArray(result?.subscriptionProducts) ? result.subscriptionProducts : []),
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
export async function runProductSearch(request, accessToken, { preserveCache = false } = {}) {
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
      monthlySavingsGoal: request?.detailedOptions?.monthlySavingsGoal ?? null,
    },
  };

  if (!preserveCache) clearRecommendationCache();
  persistRecommendation({ request: recommendation.request, result: recommendation.result });
  return recommendation;
}
