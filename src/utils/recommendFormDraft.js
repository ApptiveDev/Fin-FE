// 추천 입력 중인 폼(입력값 + 현재 단계)을 sessionStorage에 보관한다.
// 입력 중에 서비스 소개 등 다른 화면으로 갔다 와도(컴포넌트가 사라졌다 다시 만들어져도) 이어서 입력할 수 있게 하기 위함.
// 브라우저 탭을 닫으면 사라지고, 로그아웃할 때(clearPersistedRecommendation)도 함께 지운다.
const DRAFT_KEY = "fin:recommend-form-draft";

export function loadFormDraft() {
  if (typeof window === "undefined") return null;

  try {
    const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null");
    if (!draft || typeof draft !== "object") return null;
    return {
      formData: draft.formData && typeof draft.formData === "object" ? draft.formData : {},
      step: Number.isInteger(draft.step) && draft.step >= 0 ? draft.step : 0,
    };
  } catch {
    return null;
  }
}

export function saveFormDraft(draft) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 저장소를 쓸 수 없어도 입력 자체는 계속 진행한다.
  }
}

export function clearFormDraft() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // 지우지 못해도 다음 로그인 흐름에 영향이 없도록 조용히 넘어간다.
  }
}
