// 추천 입력 화면의 자동 스크롤(검색창 열기/단계 이동/접기, 가구 소득 선택 보정 등) 켜고 끄는 스위치.
// 촬영 등으로 잠시 꺼 두려면 false로 바꾼다.
export const RECOMMEND_AUTO_SCROLL = true;

// 가구 정보(중위소득) 화면의 스크롤: 소득을 고르면 카드 맨 아래가 보이게 내리고,
// "다음 단계"를 누르면 다음 화면의 글씨가 다 보이도록 검색창 위치(맨 위쪽)로 올린다.
// 위 스위치(RECOMMEND_AUTO_SCROLL)가 꺼져 있어도 이 화면만은 동작시키고 싶을 때 true.
export const HOUSEHOLD_STEP_SCROLL = true;
