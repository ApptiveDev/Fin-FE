import client, { withAuth } from "../api/client";
import { buildRecommendationRequestFromProfile, buildSelectedKeywordsFromProfile } from "./recommendationPayload";
import { goalsFromProfile } from "./savingsGoals";
import { runProductSearch } from "./productSearch";

// 서버에 저장해 둔 프로필(저축 기간 + 금액 등)로 바로 상품을 검색한다.
// 저장된 저축 목표가 없으면(처음이거나 저장하지 않았으면) null을 돌려줘서, 호출한 쪽이 입력 화면으로 보내게 한다.
export async function searchWithSavedProfile(accessToken) {
  const [profileRes, categoriesRes] = await Promise.all([
    client.get("/user/me/profile", withAuth(accessToken)),
    client.get("/api/categories", withAuth(accessToken)),
  ]);
  const profile = profileRes.data;
  const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data ?? []);

  const goals = goalsFromProfile(profile, categories);
  if (!goals.shortTerm && !goals.longTerm) return null;

  const request = buildRecommendationRequestFromProfile(profile, categories);
  return runProductSearch(request, accessToken, {
    selectedKeywords: buildSelectedKeywordsFromProfile(profile, categories),
  });
}
