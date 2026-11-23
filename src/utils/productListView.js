// 상품 목록에서 보고 있던 화면 상태(정렬 탭, 파킹/예적금 탭, 필터, 검색어)를 sessionStorage에 보관한다.
// 상품 상세에 들어갔다가 "상품 리스트로 돌아가기"/뒤로 가기로 돌아와도 보던 필터 화면 그대로 보이게 하기 위함.
// 새로 분석하면(runProductSearch) 이전 화면 상태는 의미가 없으므로 비우고, 로그아웃할 때도 함께 지운다.
const VIEW_KEY = "fin:product-list-view";

export function loadProductListView() {
  if (typeof window === "undefined") return null;

  try {
    const view = JSON.parse(window.sessionStorage.getItem(VIEW_KEY) || "null");
    return view && typeof view === "object" ? view : null;
  } catch {
    return null;
  }
}

export function saveProductListView(view) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // 저장소를 쓸 수 없어도 목록 화면은 그대로 동작한다.
  }
}

export function clearProductListView() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(VIEW_KEY);
  } catch {
    // 지우지 못해도 다음 분석 결과 화면에 영향이 없도록 조용히 넘어간다.
  }
}
