import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import client, { withAuth } from "../api/client";
import { MOCK_PROFILE, MOCK_OPTION_CATEGORIES, MOCK_FAVORITES } from "../data/mypage";

const CATEGORY_NAME_BY_GROUP = {
  savingPeriod: "저축기간",
  status: "현재신분",
  benefits: "핵심혜택",
  bankRelation: "은행거래",
};

export function splitTrailingParen(value) {
  if (!value) return { main: "", caption: "" };
  const match = value.match(/^(.*?)(\([^)]*\))\s*$/);
  if (!match) return { main: value, caption: "" };
  return { main: match[1].trim(), caption: match[2] };
}

function isMockMode() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get("mock") === "true";
}

function buildOptionTagsByCategory(profile, categories) {
  const groups = { savingPeriod: [], status: [], benefits: [], bankRelation: [] };
  if (!profile || !categories) return groups;

  const optionMap = {};
  categories.forEach((category) => {
    (category.options || []).forEach((option) => {
      optionMap[option.optionId] = { categoryName: category.categoryName, optionValue: option.optionValue };
    });
  });

  (profile.selectedOptionIds || []).forEach((id) => {
    const option = optionMap[id];
    if (!option) return;
    const groupKey = Object.keys(CATEGORY_NAME_BY_GROUP).find(
      (key) => CATEGORY_NAME_BY_GROUP[key] === option.categoryName,
    );
    if (groupKey) groups[groupKey].push(option.optionValue);
  });

  return groups;
}

export default function useMyPage() {
  const { accessToken } = useAuth();
  const mockMode = isMockMode();

  const [profile, setProfile] = useState(mockMode ? MOCK_PROFILE : null);
  const [categories, setCategories] = useState(mockMode ? MOCK_OPTION_CATEGORIES : null);
  const [favorites, setFavorites] = useState(mockMode ? MOCK_FAVORITES.items : []);
  const [showComparisonNotice, setShowComparisonNotice] = useState(
    mockMode ? MOCK_FAVORITES.showComparisonNotice : false,
  );
  const [loading, setLoading] = useState(!mockMode);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mockMode || !accessToken) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, categoriesRes, favoritesRes] = await Promise.all([
          client.get("/user/me/profile", withAuth(accessToken)),
          client.get("/api/categories", withAuth(accessToken)),
          client.get("/favorites", withAuth(accessToken)),
        ]);
        if (cancelled) return;
        setProfile(profileRes.data);
        setCategories(categoriesRes.data || []);
        setFavorites(favoritesRes.data?.items || []);
        setShowComparisonNotice(Boolean(favoritesRes.data?.showComparisonNotice));
      } catch (e) {
        if (!cancelled) setError(e);
        console.error("마이페이지 정보를 불러오지 못했습니다:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, mockMode]);

  const optionTagsByCategory = useMemo(
    () => buildOptionTagsByCategory(profile, categories),
    [profile, categories],
  );

  const removeFavorite = async (productPropertyId) => {
    const prevFavorites = favorites;
    setFavorites((prev) => prev.filter((item) => item.productPropertyId !== productPropertyId));

    if (mockMode) return;
    try {
      await client.delete(`/favorites/${productPropertyId}`, withAuth(accessToken));
    } catch (e) {
      console.error("찜 삭제에 실패했습니다:", e);
      setFavorites(prevFavorites);
    }
  };

  return {
    profile,
    optionTagsByCategory,
    favorites,
    showComparisonNotice,
    loading,
    error,
    removeFavorite,
  };
}
