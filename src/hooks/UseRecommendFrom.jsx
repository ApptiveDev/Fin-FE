import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import client, { withAuth } from "../api/client";
import {
  buildProfileUpdateFromRequest,
  buildRecommendationRequest,
  buildSelectedKeywordsFromForm,
  mapRecommendCategories,
} from "../utils/recommendationPayload";
import { runProductSearch } from "../utils/productSearch";
import { goalFromFormData, keepOtherGoalInProfileBody } from "../utils/savingsGoals";
import { loadFormDraft, saveFormDraft } from "../utils/recommendFormDraft";

const BANK_CATEGORIES = [
  { id: '시중', title: '시중은행', banks: ['KB국민', '신한', '하나', '우리', 'SC제일', 'iM뱅크'] },
  { id: '인터넷', title: '인터넷은행', banks: ['카카오뱅크', '토스뱅크', '케이뱅크'] },
  { id: '특수', title: '특수은행', banks: ['NH농협', 'Sh수협', 'IBK기업'] },
  { id: '지방', title: '지방은행', banks: ['BNK부산', '광주은행', '제주은행', '전북은행', 'BNK경남은행'] },
];

const INCOME_LEVELS = [
  { label: "중위소득 60%", amount: "월 154만원 이하" },
  { label: "중위소득 80%", amount: "월 205만원 이하" },
  { label: "중위소득 100%", amount: "월 256만원 이하" },
  { label: "중위소득 120%", amount: "월 308만원 이하" },
  { label: "중위소득 150%", amount: "월 385만원 이하" },
  { label: "중위소득 180%", amount: "" },
];

const MOCK_CATEGORIES = {
  regions: [
    { optionId: "mock_seoul", optionValue: "서울특별시" },
    { optionId: "mock_busan", optionValue: "부산광역시" },
    { optionId: "mock_ulsan", optionValue: "울산광역시" },
    { optionId: "mock_gyeongnam", optionValue: "경상남도" },
    { optionId: "mock_gwangju", optionValue: "광주광역시" },
    { optionId: "mock_jeonnam", optionValue: "전라남도" },
    { optionId: "mock_jeonbuk", optionValue: "전북특별자치도" },
    { optionId: "mock_jeju", optionValue: "제주특별자치도" },
  ],
  status: [
    { optionId: "mock_student", optionValue: "학생" },
    { optionId: "mock_jobseeker", optionValue: "취업준비생" },
    { optionId: "mock_worker", optionValue: "직장인" },
  ],
  savingPeriod: [
    { optionId: "mock_1m", optionValue: "1개월" },
    { optionId: "mock_3m", optionValue: "3개월" },
    { optionId: "mock_6m", optionValue: "6개월" },
    { optionId: "mock_1y", optionValue: "1년" },
    { optionId: "mock_2y", optionValue: "2년" },
    { optionId: "mock_3y", optionValue: "3년" },
  ],
  benefits: [
    { optionId: "mock_rate", optionValue: "우대금리" },
    { optionId: "mock_support", optionValue: "정부지원" },
  ],
  bankRelation: [
    { optionId: "mock_transfer", optionValue: "자동이체_우대" },
    { optionId: "mock_card", optionValue: "카드실적_우대" },
    { optionId: "mock_salary", optionValue: "급여이체_우대" },
    { optionId: "mock_marketing", optionValue: "마케팅_동의_OK" },
  ],
  categoryIds: {},
  bankCategories: BANK_CATEGORIES,
  incomeLevel: INCOME_LEVELS,
};

function isMockRecommendMode() {
  return import.meta.env.DEV
    && new URLSearchParams(window.location.search).get("mock") === "true";
}

export default function useRecommendForm() {
  const { accessToken } = useAuth();
  // 입력 중 다른 화면에 갔다 와도 이어서 입력할 수 있도록, 마지막 입력값/단계를 sessionStorage에서 복원한다.
  const [step, setStep] = useState(() => loadFormDraft()?.step ?? 0);
  const [formData, setFormData] = useState(() => loadFormDraft()?.formData ?? {});
  const [cats, setCats] = useState(null);
  const [loading, setLoading] = useState(true);
  const mockMode = isMockRecommendMode();

  useEffect(() => {
    if (mockMode) {
      setCats(MOCK_CATEGORIES);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await client.get("/api/categories", withAuth(accessToken));
        setCats(mapRecommendCategories(res.data, {
          bankCategories: BANK_CATEGORIES,
          incomeLevel: INCOME_LEVELS,
        }));
      } catch (e) {
        console.error("카테고리 불러오기 실패:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [accessToken, mockMode]);

  useEffect(() => {
    saveFormDraft({ step, formData });
  }, [step, formData]);

  const handleSubmit = async ({ saveProfile = false } = {}) => {
    const request = buildRecommendationRequest(formData, cats);

    if (mockMode) {
      return { request, result: null };
    }

    const recommendationPromise = runProductSearch(request, accessToken, {
      selectedKeywords: buildSelectedKeywordsFromForm(formData, cats),
    });
    // 프로필 저장은 추천과 별개 기능이라, 서버가 거절(예: 403)해도 분석 결과까지 막지 않고 콘솔에만 남긴다.
    const saveProfileToServer = async () => {
      let body = buildProfileUpdateFromRequest(request);
      // PUT은 프로필을 통째로 덮어쓰므로, 방금 입력하지 않은 대분류의 저장된 목표가 지워지지 않게 함께 보낸다.
      const submitted = goalFromFormData(formData, cats);
      if (submitted) {
        const saved = await client.get("/user/me/profile", withAuth(accessToken)).catch(() => null);
        if (saved?.data) body = keepOtherGoalInProfileBody(body, submitted.goalKey, saved.data, cats?.savingPeriod);
      }
      await client.put("/user/me/profile", body, withAuth(accessToken));
    };
    const profileSavePromise = saveProfile && accessToken
      ? saveProfileToServer().catch((error) => {
        console.error("입력 정보 저장에 실패했어요(분석은 계속 진행해요):", error?.response?.status, error?.response?.data ?? error);
      })
      : Promise.resolve();

    const [recommendation] = await Promise.all([recommendationPromise, profileSavePromise]);

    // 분석이 끝나면 다음에 열 때 처음 단계부터 보이도록 단계만 되돌린다(입력값은 유지).
    setStep(0);

    return recommendation;
  };

  const go = (n) => () => setStep(n);

  return { step, formData, setFormData, cats, loading, go, handleSubmit };
}
