import JoinedProducts from "../components/JoinedProducts";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useMyPage, { findCategoryOptions } from "../hooks/UseMyPage";
import EditFieldModal from "../components/MyPageEditModals";
import { MOCK_SAVINGS_GOALS } from "../data/mypage";
import heartIcon from "../assets/green_heart.png";
import { useAuth } from "../context/AuthContext";
import { buildRecommendationRequestFromProfile } from "../utils/recommendationPayload";
import { runProductSearch } from "../utils/productSearch";
import { keywordLabel } from "../utils/productLabels";
import CalendarAlertButton from "../components/CalendarAlertButton";
import AlertSetupModal from "../components/AlertSetupModal";
import {
  formatNotificationDate,
  getNotificationDday,
  getUpcomingNotifications,
  loadCalendarNotifications,
  makeCalendarSubscription,
  saveCalendarNotifications,
} from "../utils/calendarNotifications";
import "../components/CalendarAlertButton.css";

function isMockMode() {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).get("mock") === "true";
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ProductComponents.jsx의 getTagStyle과 동일한 색상 규칙(팀원 담당 파일은 직접 import하지 않고 복제).
function getTagStyle(tag) {
  let tagStyle = "bg-[#F2F3F5] text-[#333333]";
  if (tag.includes("적합도")) tagStyle = "bg-[#FFF4E0] text-[#E65200]";
  if (tag.includes("정부기여금") || tag.includes("정부 지원")) tagStyle = "bg-[#E0FDF9] text-[#333333]";
  if (tag.includes("내집마련")) tagStyle = "bg-[#F0F2FF] text-[#6B4EFF]";
  return tagStyle;
}

function PencilIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TargetIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.8" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* ---------- 상단 탭 ---------- */

function Tabs({ active, onChange, likedCount }) {
  const tabs = [
    { key: "liked", label: "찜해둔 Fin.", badge: likedCount },
    { key: "alerts", label: "내 알림" },
    { key: "info", label: "개인정보" },
  ];

  return (
    <div className="flex items-center gap-8 px-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center gap-1.5 py-4 text-[17px] font-semibold transition-colors ${
            active === tab.key ? "text-[#03BFA5]" : "text-[#A5A5A5] hover:text-[#606060]"
          }`}
        >
          {tab.label}
          {typeof tab.badge === "number" && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#03BFA5] text-[12px] font-bold leading-none text-white">
              {tab.badge}
            </span>
          )}
          {active === tab.key && <span className="absolute inset-x-0 -bottom-0.5 h-0.75 bg-[#03BFA5]" />}
        </button>
      ))}
    </div>
  );
}

function AlertsTab({ alertState, onAlertStateChange, onSetup, onOff, onEmailEdit, onDetails }) {
  const [upcomingFilter, setUpcomingFilter] = useState("all");
  const subscriptions = alertState.subscriptions.filter((item) => item.status !== "off");
  const upcoming = getUpcomingNotifications(alertState).slice(0, 10);
  const filteredSubscriptions = subscriptions.filter((item) => upcomingFilter === "all" || item.type === "deadline");

  const subscriptionProgram = (item) => ({
    ...item,
    id: item.programId,
    startDate: item.type === "start" ? item.eventDate : undefined,
    endDate: item.type === "start" ? undefined : item.eventDate,
    plannedDate: item.type === "start" ? item.eventDate : undefined,
  });

  return (
    <section className="b2-my-alerts">
      <div className="b2-my-alerts-notice">마감 일정은 7일 · 3일 · 1일 전, 시작 일정은 전날과 당일, 만기는 30일 · 7일 전에 오전 9시에 이메일로 알려드려요.</div>

      <section className="b2-my-alerts-section">
        <div className="b2-alert-toggle-row">
          <div>
            <h2>알림 받는 곳</h2>
            <div className="b2-alert-recipient"><span>✉</span>{alertState.email || "등록된 이메일이 없어요"}<span className={`b2-email-status${alertState.emailVerified ? " is-verified" : ""}`}>{alertState.email ? (alertState.emailVerified ? "인증 완료" : "인증 대기") : ""}</span><button type="button" onClick={onEmailEdit}>{alertState.email ? "변경" : "등록"}</button></div>
            {alertState.pendingEmail && <p className="b2-email-pending">변경할 이메일 인증 대기 · {alertState.pendingEmail}</p>}
            <div className="b2-alert-channel-note"><span>웹 푸시 · 준비 중</span><span>카카오 알림톡 · 준비 중</span></div>
          </div>
          <label>전체 알림 <button type="button" aria-label="전체 알림 일시정지" className={`b2-alert-toggle${!alertState.paused ? " is-on" : ""}`} onClick={() => {
            const nextPaused = !alertState.paused;
            if (nextPaused && !window.confirm("모든 알림을 일시정지할까요? 일시정지 중 지난 일정 알림은 나중에 다시 보내지 않아요.")) return;
            onAlertStateChange((previous) => ({ ...previous, paused: nextPaused }));
          }} /></label>
        </div>
      </section>

      <section className="b2-my-alerts-section">
        <div className="b2-alerts-section-heading">
          <h2>다가오는 알림 <small>{upcoming.length}건 · 날짜순</small></h2>

        </div>
        {upcoming.length ? <div className="b2-upcoming-list">{upcoming.map((item, index) => <div className="b2-upcoming-row" key={`${item.subscription.id}-${item.date}-${index}`}><span className="b2-upcoming-label">{formatNotificationDate(item.date)} 발송 예정</span><span className={`b2-upcoming-tag is-${item.subscription.type}`}>{item.label}</span><strong>{item.subscription.name}</strong><span className="b2-upcoming-time">09:00 발송 예정</span></div>)}</div> : <p className="b2-subscription-empty">다가오는 알림이 없어요.</p>}
      </section>

      <section className="b2-my-alerts-section b2-my-alerts-subscriptions">
        <div className="b2-alerts-section-heading">
          <h2>설정해둔 알림 <b>{subscriptions.length}</b></h2>
          <div className="b2-alerts-filters"><button type="button" className={upcomingFilter === "all" ? "is-active" : ""} onClick={() => setUpcomingFilter("all")}>전체 {subscriptions.length}</button><button type="button" className={upcomingFilter === "deadline" ? "is-active" : ""} onClick={() => setUpcomingFilter("deadline")}>마감 임박 {subscriptions.filter((item) => item.type === "deadline").length}</button></div>
          <span className="b2-alerts-limit">최대 30개</span>
        </div>
        {filteredSubscriptions.length ? <div className="b2-subscription-grid">{filteredSubscriptions.map((item) => {
          const program = subscriptionProgram(item);
          const notificationState = alertState;
          return <article className="b2-subscription-card" key={item.id}>
            <div className="b2-subscription-tags"><span className={item.type === "start" ? "is-start" : item.type === "maturity" ? "is-maturity" : ""}>{item.type === "start" ? `시작 ${getNotificationDday(item.eventDate, item.type === "maturity" ? new Date() : undefined)}` : item.type === "maturity" ? `만기 ${getNotificationDday(item.eventDate, item.type === "maturity" ? new Date() : undefined)}` : `마감 ${getNotificationDday(item.eventDate, item.type === "maturity" ? new Date() : undefined)}`}</span><span className={item.tier === 2 ? "is-policy" : "is-product"}>{item.tier === 2 ? "금융 지원 정책" : "Y-Fin"}</span></div>
            <strong>{item.name}</strong>
            <small>{item.period || item.institution}</small>
            <div className="b2-subscription-meta"><span>자동 알림</span>{(item.sendDates || []).map((date) => <span key={`${item.id}-${date.date}`}>{date.offset === 0 ? "당일" : `D-${date.offset}`}</span>)}</div>
            {item.status === "pending" && <p className="b2-subscription-pending">인증이 완료되면 알림을 보내드려요.</p>}
            <div className="b2-subscription-actions"><button type="button" className="b2-subscription-details" onClick={() => onDetails(program)}>{item.tier === 2 ? "온통청년 보기 ↗" : "상세 보기"}</button><CalendarAlertButton compact notification={item} notificationState={notificationState} dates={item.sendDates || []} onSetup={() => onSetup(program)} onTurnOff={() => onOff(item.id)} onResend={() => {}} /></div>
          </article>;
        })}</div> : <p className="b2-subscription-empty">설정해둔 알림이 없어요. 캘린더에서 관심 있는 일정의 알림을 켜보세요.</p>}
      </section>
    </section>
  );
}

/* ---------- 찜해둔 Fin. 탭 ---------- */

// sourceCode는 "GOV" 외에도 "ONTONG" 등 다양한 값으로 내려오고 excludeFromRateComparison도
// 누락될 수 있어, 정부 상품에서만 채워지는 기여금 환산 지표(metrics)도 함께 확인해 판단한다.
function isGovernmentItem(item) {
  const metrics = item.metrics || {};
  return (
    item.sourceCode === "GOV" ||
    Boolean(item.excludeFromRateComparison) ||
    metrics.contributionYieldRate != null ||
    metrics.expectedMaturityAmount != null
  );
}

function mapFavoriteItem(item) {
  const isContribution = isGovernmentItem(item);
  const metrics = item.metrics || {};

  return {
    id: item.productPropertyId,
    productId: item.productId,
    title: item.productName,
    subtitle: item.summaryLine,
    tags: [
      ...(item.fitScore != null ? [`적합도 ${item.fitScore}%`] : []),
      ...(item.keywords || []).map(keywordLabel),
    ],
    isContribution,
    contributionRate:
      isContribution && metrics.contributionYieldRate != null ? `연 ${metrics.contributionYieldRate.toFixed(1)}%` : null,
    maturityContribution:
      isContribution && metrics.expectedMaturityAmount != null
        ? `${Math.round(metrics.expectedMaturityAmount).toLocaleString()}만 원`
        : null,
    contributionCaption: item.calcBasisCaption,
    baseRate: !isContribution && metrics.baseRate != null ? metrics.baseRate.toFixed(1) : null,
    maxRate: !isContribution && metrics.maxRate != null ? metrics.maxRate.toFixed(1) : null,
    myRate: !isContribution && metrics.achievableRate != null ? metrics.achievableRate.toFixed(1) : null,
    applyUrl: item.applyUrl,
    endDate: item.endDate || item.applicationEndDate,
    tier: 1,
  };
}

function LikedCard({ product, onRemove, onViewDetails, onNotify }) {
  const joined = !product.isContribution && JSON.parse(localStorage.getItem("fin-joined-products") || "[]").find((item) => String(item.id) === `joined-${product.id}`);
  const visibleTags = product.tags.slice(0, 3);

  return (
    <article className="relative flex min-h-[444px] w-full flex-col gap-4 rounded-[20px] border border-[#E0DFDF] bg-white px-[40px] py-[35px]">
      <div className="flex flex-wrap items-center gap-2 pr-8">
        {visibleTags.map((tag) => (
          <span key={tag} className={`rounded-md px-3 py-1.5 text-[18px] font-medium ${getTagStyle(tag)}`}>
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onRemove(product.id)}
        aria-label="찜 해제"
        className="absolute right-7 top-6 flex size-10 items-center justify-center rounded-full text-[24px] leading-none text-[#EF5B6E] hover:bg-[#FCF4F5]"
      >
        <span aria-hidden="true">♥</span>
      </button>

      <div>
        <h3 className="text-[32px] font-semibold leading-[1.2] text-[#181818]">{product.title}</h3>
        <p className="mt-2 text-[18px] font-medium leading-snug text-[#726E6E]">{product.subtitle}</p>
      </div>

      {product.isContribution ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex min-h-[119px] w-full items-stretch rounded-xl border border-[#EDF1EF]">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-3">
              <span className="text-[14px] text-[#8A928F]">기여금 환산 수익률</span>
              <span className="text-[30px] font-bold text-[#26313A]">{product.contributionRate}</span>
            </div>
            <div className="w-px bg-[#EDF1EF]" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-3">
              <span className="text-[14px] text-[#8A928F]">예상 만기 기여금 총액</span>
              <span className="text-[30px] font-bold text-[#03BFA5]">{product.maturityContribution}</span>
            </div>
          </div>
          {product.contributionCaption && (
            <p className="mt-2 text-center text-[14px] text-[#A0A7A3]">{product.contributionCaption}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="flex min-h-[119px] w-full items-stretch rounded-xl border border-[#EDF1EF]">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-3">
              <span className="text-[14px] text-[#8A928F]">기본 금리</span>
              <span className="text-[30px] font-bold text-[#26313A]">{product.baseRate != null ? `연 ${product.baseRate}%` : "정보 없음"}</span>
            </div>
            <div className="w-px bg-[#EDF1EF]" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-3">
              <span className="text-[14px] text-[#8A928F]">최고 금리</span>
              <span className="text-[30px] font-bold text-[#03BFA5]">{product.maxRate != null ? `연 ${product.maxRate}%` : "정보 없음"}</span>
            </div>
          </div>
          <p className="mt-2 text-center text-[14px] text-[#A0A7A3]">상품별 금리 적용 조건은 상세 보기에서 확인해 주세요</p>
        </div>
      )}

      <div className="mt-auto flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onViewDetails(product)}
          className="flex h-[60px] min-w-0 flex-1 items-center justify-center rounded-xl border border-[#E6E8EB] bg-white text-[20px] font-semibold text-[#3D3D3D] hover:border-[#03BFA5]"
        >
          상세 보기
        </button>
        <button type="button" onClick={() => product.isContribution ? onNotify(product) : window.dispatchEvent(new CustomEvent("fin:register-product", { detail: product.id }))} className={`flex h-[60px] min-w-0 flex-1 items-center justify-center rounded-xl text-[20px] font-semibold ${joined ? "border border-[#E6E8EB] bg-white text-[#7A20A2]" : "bg-[#03BFA5] text-white hover:bg-[#02A892]"}`}>{product.isContribution ? "♧ 알림 받기" : joined ? `가입함 · 만기 ${getNotificationDday(joined.endDate, new Date())}` : "가입했어요"}</button>
      </div>
    </article>
  );
}

const LIKED_PAGE_SIZE = 3;

function LikedProductsCarousel({ products, onRemove, onViewDetails, onNotify }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(products.length / LIKED_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleProducts = products.slice(
    currentPage * LIKED_PAGE_SIZE,
    currentPage * LIKED_PAGE_SIZE + LIKED_PAGE_SIZE,
  );

  const goToPage = (next) => setPage(Math.min(totalPages - 1, Math.max(0, next)));

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="이전 상품"
          className="absolute -left-5 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D5D5D5] bg-white pb-0.5 pr-0.5 text-[19px] font-medium text-[#726E6E] shadow-sm transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="inline-block scale-y-180">&lt;</span>
        </button>

        <div className="grid grid-cols-1 gap-5 py-2 sm:grid-cols-2 min-[1500px]:grid-cols-3">
          {visibleProducts.map((product) => (
            <LikedCard key={product.id} product={product} onRemove={onRemove} onViewDetails={onViewDetails} onNotify={onNotify} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          aria-label="다음 상품"
          className="absolute -right-5 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D5D5D5] bg-white pb-0.5 pl-0.5 text-[19px] font-medium text-[#726E6E] shadow-sm transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="inline-block scale-y-180">&gt;</span>
        </button>
      </div>

      {totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`${i + 1}번째 페이지`}
              className={`h-2 rounded-full transition-all ${i === currentPage ? "w-6.5 bg-[#03BFA5]" : "w-2 bg-[#CFD8D4]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyLikedState({ onGoRecommend }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#EFFFFD]">
        <img src={heartIcon} alt="" className="size-9 object-contain" />
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#181818]">아직 찜해둔 상품이 없어요</p>
        <div className="mt-2 text-[15px] leading-relaxed text-[#8A8A8A]">
          <p className="flex flex-wrap items-center justify-center gap-1">
            추천 결과에서 마음에 드는 상품의
            <img src={heartIcon} alt="하트" className="inline-block size-4 object-contain" />를 누르면
          </p>
          <p>여기에 모아두고 좌우로 비교할 수 있어요.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onGoRecommend}
        className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#03BFA5] px-7 text-[17px] font-medium text-white transition-colors hover:bg-[#02A892]"
      >
        내 추천 상품 보러 가기 →
      </button>
      <p className="text-[13px] text-[#8A8A8A]">최대 20개까지 찜할 수 있어요</p>
    </div>
  );
}

function LikedTab({ favorites, showComparisonNotice, onRemove, onGoRecommend, onViewDetails, onRegister, onNotify }) {
  const mappedProducts = useMemo(() => favorites.map(mapFavoriteItem), [favorites]);

  if (favorites.length === 0) {
    return <><EmptyLikedState onGoRecommend={onGoRecommend} /><JoinedProducts favorites={favorites} onRegister={onRegister} onRecommend={onGoRecommend} /></>;
  }

  return (
    <section>
      <h1 className="mb-5 text-[28px] font-bold text-[#222222]">찜해둔 Fin. <span className="text-[#03BFA5]">{favorites.length}</span></h1>
      {showComparisonNotice && (
        <div className="mb-3 rounded-lg border border-[#03BFA5] bg-[#EFFFFD] px-6 py-3 text-center text-[17px] text-[#0C7C6E]">
          정부 상품의 기여금 환산 수익률과 은행 상품의 달성 가능 금리는 산정 기준이 달라 수치를 직접 비교할 수 없어요.
        </div>
      )}

      {mappedProducts.length > 0 ? (
        <LikedProductsCarousel products={mappedProducts} onRemove={onRemove} onViewDetails={onViewDetails} onNotify={onNotify} />
      ) : (
        <p className="rounded-[10px] border border-dashed border-[#D5D5D5] py-16 text-center text-[#8A8A8A]">
          해당 조건의 찜한 상품이 없어요.
        </p>
      )}

      <p className="mt-7 text-center text-[14px] text-[#626866]">
        Y-Fin은 해당 상품의 판매·중개 주체가 아니며, 신청은 기관 공식 페이지에서 진행됩니다.
      </p>
      <JoinedProducts favorites={favorites} onRegister={onRegister} onRecommend={onGoRecommend} />
    </section>
  );
}

/* ---------- 개인정보 탭 ---------- */

function FieldShell({ label, required, empty, emptyHelper, onEdit, className = "", children }) {
  return (
    <div
      className={`relative rounded-[10px] border px-5 py-4 pr-12 ${
        empty ? "border-dashed border-[#03BFA5]" : "bg-white border-[#E6E9E8]"
      } ${className}`}
    >
      <p className={`mb-1 flex items-center gap-1 text-[17px] font-medium ${empty ? "text-[#8A8F99]" : "text-[#626866]"}`}>
        {label}
        {required && <span className="text-[#EF5B6E]">*</span>}
      </p>

      {empty ? (
        <>
          <p className="text-[21px] font-semibold text-[#8A8F99]">미입력</p>
          {emptyHelper && <p className="text-[17px] text-[#8A8F99]">{emptyHelper}</p>}
        </>
      ) : (
        children
      )}

      <button
        type="button"
        onClick={onEdit}
        aria-label={`${label} 수정`}
        className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-md border text-[#03BFA5] transition-colors hover:border-[#03BFA5] ${
          empty ? "border-[#03BFA5]" : "bg-white border-[#E6E9E8]"
        }`}
      >
        <PencilIcon className="size-4" />
      </button>
    </div>
  );
}

function TextField({ label, required, value, caption, emptyHelper, onEdit, inlineCaption = false }) {
  return (
    <FieldShell label={label} required={required} empty={!value} emptyHelper={emptyHelper} onEdit={onEdit}>
      <p className="text-[21px] font-bold leading-[1.3] text-[#26313A]">
        {value}
        {inlineCaption ? (
          caption && <span className="text-[17px] font-medium text-[#8A928F]"> · {caption}</span>
        ) : (
          <>
            <br />
            {caption && <span className="text-[17px] font-medium text-[#8A8A8A]">{caption}</span>}
          </>
        )}
      </p>
    </FieldShell>
  );
}

function Pill({ children, variant = "outline" }) {
  const variantClass =
    variant === "solid"
      ? "rounded-full bg-[#03BFA5] text-[16.5px] font-normal text-white"
      : "rounded-md border border-[#DCE3E0] bg-white text-[18.5px] font-bold text-black";

  return <span className={`px-3.5 py-1.25 ${variantClass}`}>{children}</span>;
}

function TagField({ label, required, tags, caption, groups, emptyHelper, onEdit, className = "", pillVariant = "outline" }) {
  const hasGroups = Array.isArray(groups);
  const visibleGroups = hasGroups ? groups.filter((group) => group.tags.length > 0) : [];
  const empty = hasGroups ? visibleGroups.length === 0 : !tags || tags.length === 0;

  return (
    <FieldShell label={label} required={required} empty={empty} emptyHelper={emptyHelper} onEdit={onEdit} className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {hasGroups
          ? visibleGroups.map((group, index) => (
              <span key={group.label} className="flex flex-wrap items-center gap-2">
                {index > 0 && <span className="h-6 mx-1 w-px bg-[#E4E9E6]" aria-hidden="true" />}
                <span className="text-[16.5px] font-bold text-[#626866]">{group.label}</span>
                {group.tags.map((tag) => (
                  <Pill key={tag} variant={pillVariant}>{tag}</Pill>
                ))}
              </span>
            ))
          : tags.map((tag) => <Pill key={tag} variant={pillVariant}>{tag}</Pill>)}
        {caption && <span className="text-[16px] text-[#8A8A8A]">{caption}</span>}
      </div>
    </FieldShell>
  );
}

const SAVINGS_GOAL_COPY = {
  shortTerm: {
    title: "단기 예치",
    amountLabel: "예치 희망액",
    description: "1 · 3개월 저축 가능한 상품 추천도 받아보세요.",
    addHint: "저축기간 · 월 저축액만 추가하면 돼요.",
    addLabel: "+ 저축기간 · 예치 희망액 추가",
  },
  longTerm: {
    title: "목돈 만들기",
    amountLabel: "월 납입 희망액",
    description: "6개월 이상 저축 가능한 상품 추천도 받아보세요.",
    addHint: "저축기간 · 월 납입 희망액만 추가하면 돼요.",
    addLabel: "+ 저축기간 · 월 저축액 추가",
  },
};

function SavingsGoalBox({ goalKey, goal, categories, onEdit }) {
  const copy = SAVINGS_GOAL_COPY[goalKey];
  const period = goal
    ? findCategoryOptions(categories, "savingPeriod").find((option) => option.optionId === goal.savingPeriodOptionId)
    : null;

  if (!goal) {
    return (
      <div className="flex flex-col rounded-[10px] border border-dashed border-[#D5D5D5] bg-[#FAFAFA] p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[20px] font-bold text-[#8A8F99]">{copy.title}</span>
          <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[15px] font-semibold text-[#8A8F99]">미입력</span>
        </div>
        <p className="mb-4 text-[16px] leading-relaxed text-[#8A8F99]">
          {copy.description}
          <br />
          {copy.addHint}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="mt-auto rounded-full border border-[#03BFA5] bg-white py-2.5 text-[17px] font-medium text-[#03BFA5] transition-colors hover:bg-[#F7FFFE]"
        >
          {copy.addLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border-[2.5px] border-[#03BFA5] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-bold text-[#26313A]">{copy.title}</span>
          <span className="rounded-full bg-[#EFFFFD] px-2 py-0.5 text-[15px] font-semibold text-[#03BFA5]">추천 중</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${copy.title} 수정`}
          className="flex size-8 items-center justify-center rounded-md border bg-white border-[#E6E9E8] text-[#03BFA5] transition-colors hover:border-[#03BFA5]"
        >
          <PencilIcon className="size-4" />
        </button>
      </div>
      <p className="mb-2.5 text-[16px] text-[#8A8A8A]">저축 기간</p>
      <Pill variant="solid">#{period?.optionValue || ""}</Pill>
      <p className="mb-1 mt-3 text-[16px] text-[#8A8A8A]">{copy.amountLabel}</p>
      <div className="flex items-center gap-1">
        <span className="text-[25px] font-bold text-[#03BFA5]">{goal.amount}</span>
        <span className="text-[17px] font-medium text-black">만원</span>
      </div>
    </div>
  );
}

function SavingsGoalsField({ savingsGoals, categories, onEditShortTerm, onEditLongTerm }) {
  return (
    <div className="mb-4 rounded-[10px] border border-[#E6E9E8] bg-white p-5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <TargetIcon className="size-5 shrink-0 text-[#03BFA5]" />
        <h4 className="text-[19px] font-bold text-[#26313A]">대분류별 저축 목표</h4>
        <span className="text-[18px] font-semibold text-[#EF5B6E]">*</span>
      </div>
      <p className="mb-4 text-[16px] leading-relaxed text-[#767676]">
        저축기간에 따라 상품군 대분류가 정해져요. 설정한 대분류만 추천 리스트에 나오고, 두 개를 다 채우면 결과에서{" "}
        <span className="font-semibold text-[#03BFA5]">단기 예치 | 목돈 만들기</span> 탭을 전환하며 볼 수 있어요.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SavingsGoalBox goalKey="shortTerm" goal={savingsGoals.shortTerm} categories={categories} onEdit={onEditShortTerm} />
        <SavingsGoalBox goalKey="longTerm" goal={savingsGoals.longTerm} categories={categories} onEdit={onEditLongTerm} />
      </div>
    </div>
  );
}

function InfoTab({ profile, categories, optionTags, savingsGoals, onEditField, onResubmit, resubmitting, resubmitError }) {
  if (!profile) {
    return <p className="py-24 text-center text-[#8A8A8A]">개인정보를 불러오지 못했어요.</p>;
  }

  const display = profile.display || {};
  const transactionHistory = display.transactionHistory || {};

  const statusRaw = optionTags.status[0] || "";

  const hasTransactionHistory =
    (transactionHistory.firstTransactionBanks || []).length > 0 || (transactionHistory.redepositBanks || []).length > 0;

  const requiredFilled = [
    Boolean(profile.birthdate),
    profile.annualIncome !== null && profile.annualIncome !== undefined,
    Boolean(profile.householdSize && profile.householdIncomePercent),
    hasTransactionHistory,
    Boolean(savingsGoals.shortTerm),
    Boolean(savingsGoals.longTerm),
    optionTags.bankRelation.length > 0,
  ].filter(Boolean).length;

  const optionalFilled = [
    Boolean(display.region),
    Boolean(profile.tenureMonths),
    Boolean(statusRaw),
    optionTags.benefits.length > 0,
  ].filter(Boolean).length;

  const totalFilled = requiredFilled + optionalFilled;
  const summaryCaption = `저장된 ${totalFilled}개 입력값이 정보 입력 화면에 미리 입력돼요.`;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg bg-[#EFFFFD] px-5 py-3 text-[18px] leading-snug text-[#03BFA5]">
        <p>다음 추천 시 자동으로 채워지는 정보예요.</p>
        <p className="flex flex-wrap items-center gap-1 font-semibold">
          항목 편집은 각 항목의 <PencilIcon className="size-3.5" /> 버튼을 눌러 진행할 수 있어요.
        </p>
      </div>

      <div className="pt-2">
        <h3 className="mb-5 text-[21px] font-extrabold text-[#26313A]">자격 정보</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            required
            label="생년월일"
            value={profile.birthdate ? profile.birthdate.replaceAll("-", ".") : ""}
            caption={profile.birthdate ? `만 ${display.age}세 · 자동 계산` : ""}
            emptyHelper="생년월일 입력이 필요해요."
            onEdit={() => onEditField("birthdate")}
          />
          <TextField
            required
            label="개인 연 소득"
            value={profile.annualIncome !== null && profile.annualIncome !== undefined ? `${profile.annualIncome.toLocaleString()} 만원` : ""}
            emptyHelper="연 소득 입력이 필요해요."
            onEdit={() => onEditField("income")}
          />
          <TextField
            required
            label="가구원 수 · 가구 소득"
            value={
              profile.householdSize ? `${profile.householdSize}인 · 중위 ${profile.householdIncomePercent}% 이하` : ""
            }
            caption={display.householdIncomeGuide ? `월 ${display.householdIncomeGuide.toLocaleString()}만 원 이하` : ""}
            emptyHelper="가구 정보 입력이 필요해요."
            onEdit={() => onEditField("household")}
          />

          <TextField
            label="거주 지역"
            value={display.region || ""}
            emptyHelper="지역 전용 상품 추천에 필요해요."
            onEdit={() => onEditField("region")}
          />
          <TextField
            label="근속 기간"
            value={profile.tenureMonths ? `${profile.tenureMonths}개월` : ""}
            caption={profile.isFirstJob ? "첫 직장" : ""}
            inlineCaption
            emptyHelper="재직 기간 우대 상품 추천에 필요해요."
            onEdit={() => onEditField("tenure")}
          />
          <TagField
            required
            className="sm:col-span-3"
            label="거래 이력"
            groups={[
              { label: "첫거래", tags: transactionHistory.firstTransactionBanks || [] },
              { label: "재예치", tags: transactionHistory.redepositBanks || [] },
            ]}
            emptyHelper="거래 은행 정보가 필요해요."
            onEdit={() => onEditField("transaction")}
          />
        </div>
      </div>

      <div className="pt-2">
        <h3 className="mb-5 text-[21px] font-extrabold text-[#26313A]">추천 조건</h3>

        <SavingsGoalsField
          savingsGoals={savingsGoals}
          categories={categories}
          onEditShortTerm={() => onEditField("shortTermGoal")}
          onEditLongTerm={() => onEditField("longTermGoal")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TagField
            label="현재 신분"
            tags={statusRaw ? [`#${statusRaw}`] : []}
            emptyHelper="신분별 맞춤 상품 추천에 필요해요."
            onEdit={() => onEditField("status")}
            pillVariant="solid"
          />
          <TagField
            label="핵심 혜택(선호)"
            tags={optionTags.benefits.map((tag) => `#${tag}`)}
            emptyHelper="선호 혜택을 고르면 정렬이 정확해져요."
            onEdit={() => onEditField("benefits")}
            pillVariant="solid"
          />
          <TagField
            required
            label="은행 거래 우대(선호)"
            tags={optionTags.bankRelation.map((tag) => `#${tag}`)}
            emptyHelper="은행 거래 우대 선택이 필요해요."
            onEdit={() => onEditField("bankRelation")}
            pillVariant="solid"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onResubmit}
          disabled={resubmitting}
          className="flex h-15 w-full items-center justify-center gap-2 rounded-lg bg-[#03BFA5] text-[21px] font-medium text-white transition-colors hover:bg-[#02A892] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resubmitting ? "분석 중이에요..." : "이 정보로 다시 추천 받기 →"}
        </button>
        {resubmitError && <p className="text-[16px] text-[#D3455B]">{resubmitError}</p>}
        <p className="text-[16px] text-[#8A8A8A]">{summaryCaption}</p>
      </div>
    </section>
  );
}

/* ---------- 마이페이지 ---------- */

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState(["liked", "info", "alerts"].includes(location.state?.activeTab) ? location.state.activeTab : "liked");
  const [editingField, setEditingField] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState(null);
  const [alertState, setAlertState] = useState(loadCalendarNotifications);
  const [alertSetup, setAlertSetup] = useState(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertEmailError, setAlertEmailError] = useState("");
  // 대분류별 저축 목표는 아직 백엔드가 저장하지 못해 화면에서만 들고 있는 상태다.
  const [savingsGoals, setSavingsGoals] = useState(
    isMockMode() ? MOCK_SAVINGS_GOALS : { shortTerm: null, longTerm: null },
  );
  const { profile, categories, optionTagsByCategory, favorites, showComparisonNotice, loading, updateProfile, removeFavorite } =
    useMyPage();

  useEffect(() => saveCalendarNotifications(alertState), [alertState]);

  const handleSaveField = async (patch) => {
    const result = await updateProfile(patch);
    if (result.ok) setEditingField(null);
  };

  const handleSaveSavingsGoal = (key, goal) => {
    setSavingsGoals((prev) => ({ ...prev, [key]: goal }));
    setEditingField(null);
  };

  const handleResubmit = async () => {
    setResubmitError(null);
    setResubmitting(true);
    try {
      const request = buildRecommendationRequestFromProfile(profile, categories);
      const recommendation = await runProductSearch(request, accessToken);
      navigate("/products", {
        state: {
          recommendationResult: recommendation.result,
          recommendationRequest: recommendation.request,
        },
      });
    } catch (error) {
      console.error("이 정보로 다시 추천 받기 실패:", error);
      setResubmitError(error.message || "상품 재검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setResubmitting(false);
    }
  };

  const handleAlertSetup = (subscription) => {
    if (alertState.emailVerified) {
      setAlertState((previous) => ({ ...previous, subscriptions: previous.subscriptions.map((item) => item.id === subscription.id ? { ...item, status: "active" } : item) }));
      return;
    }
    setAlertSetup(subscription);
    setAlertEmail(alertState.email);
    setAlertEmailError("");
  };

  const handleAlertSetupSubmit = (event) => {
    event.preventDefault();
    const email = alertEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlertEmailError("이메일 주소를 확인해 주세요.");
      return;
    }
    if (alertSetup.type === "email") {
      setAlertState((previous) => previous.emailVerified
        ? { ...previous, pendingEmail: email }
        : { ...previous, email, emailVerified: false });
      setAlertSetup(null);
      return;
    }
    const isMockMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("mock") === "true";
    const emailVerified = alertState.emailVerified || isMockMode;
    const subscription = makeCalendarSubscription(alertSetup, alertSetup.type, emailVerified);
    setAlertState((previous) => ({
      ...previous,
      email,
      emailVerified,
      subscriptions: [...previous.subscriptions.filter((item) => item.id !== subscription.id), subscription],
    }));
    setAlertSetup(null);
  };

  const handleAlertOff = (subscriptionId) => {
    setAlertState((previous) => ({
      ...previous,
      subscriptions: previous.subscriptions.map((item) => item.id === subscriptionId ? { ...item, status: "off" } : item),
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-pretendard">
      <div className="border border-[#EBEBEB]">
        <div className="mx-auto w-full max-w-[1920px] px-[clamp(24px,5.625vw,108px)] py-0.5">
          <Tabs active={activeTab} onChange={setActiveTab} likedCount={favorites.length} />
        </div>
      </div>

      <div className="flex-1 bg-[#F8FAF9]">
        <main className="mx-auto w-full max-w-[1920px] px-[clamp(24px,5.625vw,108px)] py-8">
          {loading ? (
            <p className="py-24 text-center text-[#8A8A8A]">불러오는 중이에요...</p>
          ) : activeTab === "liked" ? (
            <LikedTab
              favorites={favorites}
              showComparisonNotice={showComparisonNotice}
              onRemove={removeFavorite}
              onGoRecommend={() => navigate("/recommend")}
              onNotify={(product) => {
                if (!product.endDate) {
                  window.alert("이 상품의 모집 일정이 아직 연결되지 않았어요. 캘린더에서 일정을 확인해 주세요.");
                  return;
                }
                setAlertSetup({ ...product, id: product.productId ?? product.id, name: product.title, type: "deadline" });
                setAlertEmail(alertState.email);
              }}
              onRegister={(program) => {
                const subscription = makeCalendarSubscription(program, "maturity", alertState.emailVerified);
                setAlertState((previous) => ({ ...previous, subscriptions: [...previous.subscriptions.filter((item) => item.id !== subscription.id), subscription] }));
                if (!alertState.emailVerified) {
                  setAlertSetup({ ...program, type: "maturity" });
                  setAlertEmail(alertState.email);
                }
              }}
              onViewDetails={(product) => {
                if (product.productId != null) {
                  navigate(`/products/${product.productId}`);
                } else if (product.applyUrl) {
                  window.open(product.applyUrl, "_blank", "noopener,noreferrer");
                }
              }}
            />
          ) : activeTab === "alerts" ? (
            <AlertsTab
              alertState={alertState}
              onAlertStateChange={setAlertState}
              onSetup={handleAlertSetup}
              onOff={handleAlertOff}
              onEmailEdit={() => {
                setAlertSetup({ type: "email", name: "알림 받을 이메일" });
                setAlertEmail(alertState.pendingEmail || alertState.email);
                setAlertEmailError("");
              }}
              onDetails={(program) => program.tier === 2 ? window.open("https://www.youthcenter.go.kr", "_blank", "noopener,noreferrer") : navigate("/recommend", { state: { calendarProgram: program } })}
            />
          ) : (
            <InfoTab
              profile={profile}
              categories={categories}
              optionTags={optionTagsByCategory}
              savingsGoals={savingsGoals}
              onEditField={setEditingField}
              onResubmit={handleResubmit}
              resubmitting={resubmitting}
              resubmitError={resubmitError}
            />
          )}
        </main>
      </div>

      {editingField && (
        <EditFieldModal
          fieldKey={editingField}
          profile={profile}
          categories={categories}
          savingsGoals={savingsGoals}
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
          onSaveGoal={handleSaveSavingsGoal}
        />
      )}
      {alertSetup && <AlertSetupModal program={alertSetup} type={alertSetup.type} email={alertEmail} emailError={alertEmailError} onEmailChange={(value) => { setAlertEmail(value); setAlertEmailError(""); }} onSubmit={handleAlertSetupSubmit} onClose={() => setAlertSetup(null)} />}
    </div>
  );
}
