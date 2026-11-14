// 대분류별 저축 목표(저축 기간 옵션 ID + 금액[만원]).
// TODO: 백엔드 프로필 API(PUT /user/me/profile)에 shortTermGoal/longTermGoal 필드가 생기면
// 이 파일의 저장소를 localStorage에서 API로 교체한다. (임시 처리: 시연용)
import { findCategoryByGroup, getSavingPlanType } from "./recommendationPayload";

const STORAGE_KEY = "fin:savingsGoals";

const EMPTY_GOALS = { shortTerm: null, longTerm: null };

export function loadSavingsGoals() {
  if (typeof window === "undefined") return { ...EMPTY_GOALS };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return { ...EMPTY_GOALS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...EMPTY_GOALS };
  }
}

export function saveSavingsGoals(goals) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_GOALS, ...goals }));
  } catch {
    // 저장소를 쓸 수 없어도 화면 동작은 계속 진행한다.
  }
}

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

// 서버에 저장된 프로필(선택한 저축 기간 + monthlySavingsGoal)에서 목표를 만든다. categories는 /api/categories 원본.
export function goalFromProfile(profile, categories) {
  const period = findCategoryByGroup(categories, "savingPeriod")?.options?.find((option) =>
    (profile?.selectedOptionIds || []).includes(option.optionId),
  );
  return buildGoal(period, profile?.monthlySavingsGoal);
}

// 해당 대분류 칸이 비어 있을 때만 채워 저장한다. 이미 있으면 사용자가 입력해 둔 값을 존중해 건드리지 않는다.
export function fillGoalIfEmpty(goalKey, goal) {
  const stored = loadSavingsGoals();
  if (stored[goalKey]) return false;
  saveSavingsGoals({ ...stored, [goalKey]: goal });
  return true;
}
