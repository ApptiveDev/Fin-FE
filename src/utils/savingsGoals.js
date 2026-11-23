// 대분류별 저축 목표(저축 기간 옵션 ID + 금액[만원]).
// 원본은 서버 프로필(저축 기간 selectedOptionIds + 단기 예치 depositAmount / 목돈 만들기 monthlySavingsGoal)뿐이다.
// 여기에는 프로필 값과 목표 객체 사이를 오가는 순수 함수만 둔다. (브라우저 저장소에는 따로 저장하지 않는다.)
import { findCategoryByGroup, getSavingPlanType } from "./recommendationPayload";

export function goalKeyOfCategory(category) {
  return category === "SHORT_TERM" ? "shortTerm" : "longTerm";
}

export function categoryOfGoalKey(goalKey) {
  return goalKey === "shortTerm" ? "SHORT_TERM" : "LONG_TERM";
}

// 선택한 저축 기간 옵션 + 금액(만원)으로 "어느 대분류의 어떤 목표인지"를 만든다. 값이 부족하면 null.
function buildGoal(periodOption, amount) {
  const value = Number(amount);
  if (!periodOption || !Number.isFinite(value) || value <= 0) return null;

  return {
    goalKey: getSavingPlanType(periodOption) === "short" ? "shortTerm" : "longTerm",
    goal: { savingPeriodOptionId: periodOption.optionId, amount: value },
  };
}

// 추천 입력 폼(저축 기간 + 금액)에서 목표를 만든다. cats는 mapRecommendCategories 결과.
export function goalFromFormData(formData, cats) {
  const period = (cats?.savingPeriod || []).find((option) =>
    (formData?.savingPeriod || []).includes(option.optionId),
  );
  return buildGoal(period, formData?.monthlyAmount);
}

// 서버 프로필에서 대분류별 목표를 만든다. categories는 /api/categories 원본.
// 저축 기간은 selectedOptionIds에서 대분류별로 찾고, 금액은 단기 예치 -> depositAmount, 목돈 만들기 -> monthlySavingsGoal.
// 반환: { shortTerm, longTerm } (없으면 null)
export function goalsFromProfile(profile, categories) {
  const selectedIds = profile?.selectedOptionIds || [];
  const periods = (findCategoryByGroup(categories, "savingPeriod")?.options || []).filter((option) =>
    selectedIds.includes(option.optionId),
  );
  const shortPeriod = periods.filter((option) => getSavingPlanType(option) === "short").at(-1);
  const longPeriod = periods.filter((option) => getSavingPlanType(option) === "goal").at(-1);

  // 예전에는 단기 예치 금액도 monthlySavingsGoal에 저장했다. 다른 대분류 기간이 없을 때만 그 값을 이어 쓴다.
  const shortAmount = profile?.depositAmount ?? (longPeriod ? null : profile?.monthlySavingsGoal);

  return {
    shortTerm: buildGoal(shortPeriod, shortAmount)?.goal ?? null,
    longTerm: buildGoal(longPeriod, profile?.monthlySavingsGoal)?.goal ?? null,
  };
}

// 한 대분류의 목표를 프로필 수정 patch(저축 기간 + 금액 필드)로 바꾼다.
// 같은 대분류의 기존 저축 기간은 빼고 새 기간을 넣으며, 다른 대분류의 기간은 그대로 둔다.
export function profilePatchFromGoal(goalKey, goal, profile, categories) {
  const planType = goalKey === "shortTerm" ? "short" : "goal";
  const samePlanIds = (findCategoryByGroup(categories, "savingPeriod")?.options || [])
    .filter((option) => getSavingPlanType(option) === planType)
    .map((option) => option.optionId);

  return {
    selectedOptionIds: [
      ...(profile?.selectedOptionIds || []).filter((id) => !samePlanIds.includes(id)),
      goal.savingPeriodOptionId,
    ],
    ...(goalKey === "shortTerm" ? { depositAmount: goal.amount } : { monthlySavingsGoal: goal.amount }),
  };
}

// 프로필 PUT은 보낸 값으로 전체를 덮어쓴다. 추천 폼은 한 대분류만 입력받으므로,
// 서버에 이미 저장된 다른 대분류의 목표(저축 기간 + 금액)를 요청에 함께 실어 지워지지 않게 한다.
// savingPeriodOptions는 추천 폼 카테고리의 저축 기간 옵션 목록(cats.savingPeriod)이다.
export function keepOtherGoalInProfileBody(body, submittedGoalKey, savedProfile, savingPeriodOptions) {
  const submittedPlanType = submittedGoalKey === "shortTerm" ? "short" : "goal";
  const savedIds = savedProfile?.selectedOptionIds || [];
  const otherIds = (savingPeriodOptions || [])
    .filter((option) => savedIds.includes(option.optionId) && getSavingPlanType(option) !== submittedPlanType)
    .map((option) => option.optionId);
  if (otherIds.length === 0) return body;

  return {
    ...body,
    selectedOptionIds: [...new Set([...(body.selectedOptionIds || []), ...otherIds])],
    ...(submittedPlanType === "goal"
      ? { depositAmount: savedProfile?.depositAmount ?? null }
      : { monthlySavingsGoal: savedProfile?.monthlySavingsGoal ?? null }),
  };
}
