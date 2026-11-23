import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client, { withAuth } from "../api/client";
import {
  CALENDAR_PROGRAMS,
  CALENDAR_REFERENCE_DATE,
  ALWAYS_PROGRAMS,
  MATURITY_EVENT,
  ONGOING_PROGRAMS,
  PLANNED_PROGRAMS,
} from "../data/calendarEvents";
import bellIcon from "../assets/calendar/ca794.svg";
import calendarIcon from "../assets/calendar/135be.svg";
import listIcon from "../assets/calendar/87b82.svg";
import prevIcon from "../assets/calendar/6b3dc.svg";
import nextIcon from "../assets/calendar/4be05.svg";
import lockIcon from "../assets/calendar/80622.svg";
import activeConditionIcon from "../assets/calendar/afb6a.svg";
import caretIcon from "../assets/calendar/1b1fd.svg";
import editIcon from "../assets/calendar/48452.svg";
import chevronIcon from "../assets/calendar/5e9c5.svg";
import favoriteIcon from "../assets/calendar/a1aea.svg";
import activeFavoriteIcon from "../assets/calendar/1f548.svg";
import closeIcon from "../assets/calendar/b8e4b.svg";
import infoIcon from "../assets/calendar/61b3e.svg";
import CalendarAlertButton from "../components/CalendarAlertButton";
import AlertSetupModal from "../components/AlertSetupModal";
import {
  formatNotificationDate,
  getNotificationDates,
  getUpcomingNotifications,
  loadCalendarNotifications,
  makeCalendarSubscription,
  saveCalendarNotifications,
} from "../utils/calendarNotifications";
import "../components/CalendarAlertButton.css";
import "./Calendar.css";

const STATUS_FILTERS = [
  { id: "all", label: "전체" },
  { id: "start", label: "신청 시작", tone: "start" },
  { id: "deadline", label: "신청 마감", tone: "deadline" },
  { id: "planned", label: "모집 예정", tone: "planned" },
  { id: "maturity", label: "내 만기", tone: "maturity", locked: true },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "전체" },
  { id: "yfin", label: "Y-Fin 정책상품" },
  { id: "support", label: "금융 지원 정책" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMonth(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function daysBetween(left, right) {
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

function formatMonth(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatSelectedDay(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

function getOccurrences(programs, includeMaturity) {
  const occurrences = [];
  programs.forEach((program) => {
    if (program.startDate) {
      occurrences.push({ id: `${program.id}-start`, date: program.startDate, type: "start", program });
    }
    if (program.endDate) {
      occurrences.push({ id: `${program.id}-deadline`, date: program.endDate, type: "deadline", program });
    }
  });
  PLANNED_PROGRAMS.forEach((program) => {
    occurrences.push({ id: `${program.id}-planned`, date: program.plannedDate, type: "planned", program });
  });
  if (includeMaturity) {
    occurrences.push({ id: `${MATURITY_EVENT.id}-maturity`, date: MATURITY_EVENT.endDate, type: "maturity", program: MATURITY_EVENT });
  }
  return occurrences;
}

function calculateAge(birthdate) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function matchesProfile(program, profile) {
  const age = profile?.display?.age ?? calculateAge(profile?.birthdate);
  if (age != null && program.minAge != null && (age < program.minAge || age > program.maxAge)) return false;
  const region = profile?.display?.region || profile?.region || "";
  if (program.tier === 2 || !region || !program.eligibleRegions) return true;
  return program.eligibleRegions.some((item) => region.includes(item) || item.includes(region));
}

function eventTone(type) {
  return type === "start" ? "start" : type === "deadline" ? "deadline" : type;
}

function ddayLabel(date, today = CALENDAR_REFERENCE_DATE) {
  const gap = daysBetween(today, parseDateKey(date));
  if (gap === 0) return "D-day";
  return gap > 0 ? `D-${gap}` : `D+${Math.abs(gap)}`;
}

function EventLabel({ occurrence, compact = false }) {
  const deadlineGap = daysBetween(CALENDAR_REFERENCE_DATE, parseDateKey(occurrence.date));
  const isDeadlineSoon = occurrence.type === "deadline" && deadlineGap >= 0 && deadlineGap <= 3;
  const label = occurrence.type === "start" ? "시작" : occurrence.type === "deadline" ? "마감" : occurrence.type === "planned" ? "예정" : "만기";
  return (
    <span className={`fc-event fc-event--${eventTone(occurrence.type)}${occurrence.program.category === "support" ? " is-support" : ""}${isDeadlineSoon ? " fc-event--urgent" : ""}${compact ? " fc-event--compact" : ""}`}>
      <span className="fc-event__label">{label}</span>
      <span className="fc-event__name">{occurrence.program.name}</span>
      {occurrence.type === "deadline" && daysBetween(CALENDAR_REFERENCE_DATE, parseDateKey(occurrence.date)) <= 7 && (
        <span className="fc-event__dday">{ddayLabel(occurrence.date)}</span>
      )}
    </span>
  );
}

function Icon({ src, className = "" }) {
  return <img className={`fc-icon ${className}`} src={src} alt="" aria-hidden="true" />;
}

export default function Calendar() {
  const { accessToken } = useAuth();
  const isLoggedIn = Boolean(accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMonth = parseMonth(searchParams.get("month")) || new Date(2026, 9, 1);
  const [displayMonth, setDisplayMonth] = useState(initialMonth);
  const [view, setView] = useState(() => searchParams.get("view") || (window.matchMedia("(max-width: 760px)").matches ? "list" : "month"));
  const [selectedDate, setSelectedDate] = useState(() => parseDateKey(searchParams.get("date")) || new Date(2026, 9, 8));
  const [selectedProgramId, setSelectedProgramId] = useState("moda-dream");
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const selected = searchParams.get("status")?.split(",").filter(Boolean);
    return selected?.length ? selected : ["all"];
  });
  const [category, setCategory] = useState(() => searchParams.get("category") || "all");
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [conditionsActive, setConditionsActive] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [drawerTab, setDrawerTab] = useState("year-round");
  const [showOngoingDrawer, setShowOngoingDrawer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [notificationState, setNotificationState] = useState(loadCalendarNotifications);
  const [alertSetup, setAlertSetup] = useState(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertEmailError, setAlertEmailError] = useState("");
  const [alertToast, setAlertToast] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [showPast, setShowPast] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem("fin-b2-banner-dismissed") === toDateKey(CALENDAR_REFERENCE_DATE));

  const allOccurrences = useMemo(() => getOccurrences(CALENDAR_PROGRAMS, isLoggedIn), [isLoggedIn]);
  const minMonth = addMonths(CALENDAR_REFERENCE_DATE, -3);
  const maxMonth = addMonths(CALENDAR_REFERENCE_DATE, 12);
  const atMinMonth = monthKey(displayMonth) <= monthKey(minMonth);
  const atMaxMonth = monthKey(displayMonth) >= monthKey(maxMonth);

  useEffect(() => {
    if (!accessToken) {
      setProfile(null);
      setProfileLoaded(false);
      setConditionsActive(false);
      return undefined;
    }
    setConditionsActive(true);
    let cancelled = false;
    client.get("/user/me/profile", withAuth(accessToken))
      .then((response) => { if (!cancelled) setProfile(response.data); })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setProfileLoaded(true); });
    return () => { cancelled = true; };
  }, [accessToken]);

  useEffect(() => {
    saveCalendarNotifications(notificationState);
  }, [notificationState]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const values = {
      month: monthKey(displayMonth),
      view,
      date: toDateKey(selectedDate),
      status: selectedStatuses.join(","),
      category,
    };
    Object.entries(values).forEach(([key, value]) => next.set(key, value));
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [category, displayMonth, searchParams, selectedDate, selectedStatuses, setSearchParams, view]);

  useEffect(() => {
    const stored = sessionStorage.getItem("fin-calendar-pending-action");
    if (isLoggedIn && stored) {
      try {
        const action = JSON.parse(stored);
        sessionStorage.removeItem("fin-calendar-pending-action");
        if (action.type === "notify" && action.programId) {
          const program = [...CALENDAR_PROGRAMS, ...PLANNED_PROGRAMS].find((item) => item.id === action.programId)
            || (action.programId === MATURITY_EVENT.id ? MATURITY_EVENT : null);
          if (program) {
            const requestedType = action.alertType === "planned" ? "start" : action.alertType;
            setAlertSetup({ program, type: requestedType || (program.category === "maturity" ? "maturity" : "deadline") });
            setAlertEmail(notificationState.email);
          }
          setSelectedProgramId(action.programId);
          const date = parseDateKey(program?.endDate || program?.plannedDate || program?.startDate);
          if (date) {
            setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            setSelectedDate(date);
          }
        } else if (action.type === "notify-next") {
          const nextProgram = [...PLANNED_PROGRAMS].sort((left, right) => left.plannedDate.localeCompare(right.plannedDate))[0];
          if (nextProgram) setAlertSetup({ program: nextProgram, type: "start" });
        } else if (action.type === "favorite" && action.programId) {
          setFavoriteIds((previous) => new Set(previous).add(action.programId));
          setSelectedProgramId(action.programId);
          const program = CALENDAR_PROGRAMS.find((item) => item.id === action.programId);
          const date = parseDateKey(program?.endDate || program?.startDate);
          if (date) {
            setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            setSelectedDate(date);
          }
        } else if (action.type === "conditions") {
          setConditionsActive(true);
        } else if (action.type === "maturity") {
          setSelectedStatuses(["maturity"]);
          setView("month");
        } else if (action.type === "alerts") {
          navigate("/mypage", { state: { activeTab: "alerts" } });
        }
      } catch {
        sessionStorage.removeItem("fin-calendar-pending-action");
      }
    }
  }, [isLoggedIn, navigate, notificationState.email]);

  useEffect(() => {
    if (!showLoginModal && !showOngoingDrawer) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowLoginModal(false);
        setShowOngoingDrawer(false);
        setConditionsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLoginModal, showOngoingDrawer]);

  const visibleOccurrences = useMemo(() => allOccurrences.filter((occurrence) => {
    if (conditionsActive && !matchesProfile(occurrence.program, profile)) return false;
    if (category !== "all" && occurrence.program.category !== category) return false;
    if (selectedStatuses.includes("all")) return true;
    return selectedStatuses.includes(occurrence.type);
  }), [allOccurrences, category, conditionsActive, profile, selectedStatuses]);

  const monthOccurrences = useMemo(() => visibleOccurrences.filter((occurrence) => {
    return occurrence.date.slice(0, 7) === monthKey(displayMonth);
  }), [displayMonth, visibleOccurrences]);
  const hasMonthEvents = monthOccurrences.length > 0;
  const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
  const gridStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1 - monthStart.getDay());
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const occurrences = monthOccurrences.filter((occurrence) => occurrence.date === dateKey);
    return { date, dateKey, inMonth: date.getMonth() === displayMonth.getMonth(), occurrences };
  });

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDayOccurrences = visibleOccurrences.filter((occurrence) => occurrence.date === selectedDateKey);
  const selectedProgram = CALENDAR_PROGRAMS.find((program) => program.id === selectedProgramId)
    || (selectedProgramId === MATURITY_EVENT.id ? MATURITY_EVENT : null)
    || selectedDayOccurrences[0]?.program
    || null;

  const activePrograms = CALENDAR_PROGRAMS.filter((program) => {
    return program.startDate <= toDateKey(CALENDAR_REFERENCE_DATE) && program.endDate >= toDateKey(CALENDAR_REFERENCE_DATE)
      && (!conditionsActive || matchesProfile(program, profile))
      && (category === "all" || program.category === category);
  }).sort((left, right) => left.endDate.localeCompare(right.endDate));
  const expiringSoonCount = activePrograms.filter((program) => daysBetween(CALENDAR_REFERENCE_DATE, parseDateKey(program.endDate)) <= 7).length;
  const startsThisMonth = visibleOccurrences.filter((occurrence) => occurrence.type === "start" && occurrence.date.slice(0, 7) === monthKey(displayMonth)).length;
  const filteredStatusCount = (status) => monthOccurrences.filter((occurrence) => status === "all" || occurrence.type === status).length;

  const listOccurrences = visibleOccurrences.filter((occurrence) => {
    const date = parseDateKey(occurrence.date);
    const afterReference = date >= CALENDAR_REFERENCE_DATE;
    const inRange = date <= addMonths(CALENDAR_REFERENCE_DATE, 12);
    const sameMonth = occurrence.date.slice(0, 7) === monthKey(displayMonth);
    return (afterReference && inRange && (sameMonth || occurrence.type === "maturity")) || (showPast && date < CALENDAR_REFERENCE_DATE);
  }).sort((left, right) => left.date.localeCompare(right.date));

  const nextPrograms = [...CALENDAR_PROGRAMS, ...PLANNED_PROGRAMS]
    .filter((program) => {
      const date = program.endDate || program.plannedDate;
      return date >= toDateKey(CALENDAR_REFERENCE_DATE) && (!conditionsActive || matchesProfile(program, profile));
    })
    .sort((left, right) => (left.endDate || left.plannedDate).localeCompare(right.endDate || right.plannedDate));
  const configuredAlertCount = notificationState.subscriptions.filter((item) => item.status !== "off").length;
  const reminderAlerts = getUpcomingNotifications(notificationState, 7);

  const updateMonth = useCallback((offset) => {
    const nextMonth = addMonths(displayMonth, offset);
    if (monthKey(nextMonth) < monthKey(minMonth) || monthKey(nextMonth) > monthKey(maxMonth)) return;
    setDisplayMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
    setSelectedProgramId("");
  }, [displayMonth, maxMonth, minMonth]);

  const handleStatusClick = (filter) => {
    if (filter.locked && !isLoggedIn) {
      beginLoginAction({ type: "maturity" });
      return;
    }
    if (filter.id === "all") {
      setSelectedStatuses(["all"]);
      return;
    }
    setSelectedStatuses((previous) => {
      const withoutAll = previous.filter((item) => item !== "all");
      const next = withoutAll.includes(filter.id)
        ? withoutAll.filter((item) => item !== filter.id)
        : [...withoutAll, filter.id];
      return next.length ? next : ["all"];
    });
  };

  const beginLoginAction = (action) => {
    setPendingAction(action);
    sessionStorage.setItem("fin-calendar-pending-action", JSON.stringify(action));
    setShowLoginModal(true);
  };

  const notificationId = (program, type) => `${program.id}:${type}`;
  const findNotification = (program, type) => notificationState.subscriptions.find((item) => item.id === notificationId(program, type) && item.status !== "off");

  const handleNotify = (program, type = "deadline") => {
    if (!isLoggedIn) {
      beginLoginAction({ type: "notify", programId: program.id, alertType: type });
      return;
    }
    if (findNotification(program, type)) return;
    const sendDates = getNotificationDates(program, type);
    if (!sendDates.length) {
      setAlertToast({ title: "설정할 수 있는 알림이 없어요", message: "남은 발송 시점이 있는지 일정을 확인해 주세요." });
      return;
    }
    const activeCount = notificationState.subscriptions.filter((item) => item.status === "active").length;
    if (activeCount >= 30) {
      setAlertToast({ title: "알림 설정 한도에 도달했어요", message: "받는 중인 알림은 최대 30건까지 설정할 수 있어요." });
      return;
    }
    if (notificationState.emailVerified) {
      const subscription = makeCalendarSubscription(program, type, true);
      setNotificationState((previous) => ({ ...previous, subscriptions: [...previous.subscriptions.filter((item) => item.id !== subscription.id), subscription] }));
      setAlertToast({ title: "알림을 켰어요", message: `${sendDates.map((item) => formatNotificationDate(item.date, true)).join(" · ")}에 ${notificationState.email}로 알려드릴게요.`, subscriptionId: subscription.id });
      return;
    }
    setAlertSetup({ program, type });
    setAlertEmail(notificationState.email);
    setAlertEmailError("");
  };

  const handleAlertSetupSubmit = (event) => {
    event.preventDefault();
    const email = alertEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlertEmailError("이메일 주소를 확인해 주세요.");
      return;
    }
    const isMockMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("mock") === "true";
    const emailVerified = notificationState.emailVerified || isMockMode;
    const subscription = makeCalendarSubscription(alertSetup.program, alertSetup.type, emailVerified);
    setNotificationState((previous) => ({
      ...previous,
      email,
      emailVerified,
      subscriptions: [...previous.subscriptions.filter((item) => item.id !== subscription.id), subscription],
    }));
    setAlertSetup(null);
    setAlertToast(emailVerified
      ? { title: "알림을 켰어요", message: `${subscription.sendDates.map((item) => formatNotificationDate(item.date, true)).join(" · ")}에 ${email}로 알려드릴게요.`, subscriptionId: subscription.id }
      : { title: "인증 대기로 설정했어요", message: "인증 메일 발송은 알림 서버 API 연결 후 동작합니다." });
  };

  const handleNotificationOff = (subscriptionId) => {
    setNotificationState((previous) => ({
      ...previous,
      subscriptions: previous.subscriptions.map((item) => item.id === subscriptionId ? { ...item, status: "off" } : item),
    }));
  };

  const handleNotificationResend = () => {
    setAlertToast({ title: "인증 메일 재발송", message: "인증 메일 발송은 알림 서버 API 연결 후 동작합니다." });
  };

  const handleAlertToastUndo = () => {
    if (alertToast?.subscriptionId) handleNotificationOff(alertToast.subscriptionId);
    setAlertToast(null);
  };

  const handleFavorite = (program) => {
    if (!isLoggedIn) {
      beginLoginAction({ type: "favorite", programId: program.id });
      return;
    }
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (next.has(program.id)) next.delete(program.id);
      else next.add(program.id);
      return next;
    });
  };

  const handleConditionsClick = () => {
    if (!isLoggedIn) {
      beginLoginAction({ type: "conditions" });
      return;
    }
    if (!profile && profileLoaded) {
      navigate("/mypage", { state: { activeTab: "info" } });
      return;
    }
    if (!profile) return;
    setConditionsActive((previous) => !previous);
    setConditionsOpen(false);
  };

  const openDetails = (program) => {
    if (program.tier === 2) {
      window.open("https://www.youthcenter.go.kr", "_blank", "noopener,noreferrer");
      return;
    }
    navigate("/recommend", { state: { calendarProgram: program, returnTo: `${location.pathname}${location.search}` } });
  };

  const selectOccurrence = (occurrence) => {
    const date = parseDateKey(occurrence.date);
    setSelectedDate(date);
    setSelectedProgramId(occurrence.program.id);
    if (date.getMonth() !== displayMonth.getMonth() || date.getFullYear() !== displayMonth.getFullYear()) {
      setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const selectStatus = (status) => {
    setSelectedStatuses(status === "all" ? ["all"] : [status]);
    setView("month");
  };

  const getSelectedProgramOccurrence = (program) => {
    if (program.category === "maturity") return { type: "maturity", date: program.endDate || selectedDateKey };
    const endOnSelected = program.endDate === selectedDateKey;
    return {
      type: endOnSelected ? "deadline" : "start",
      date: endOnSelected ? program.endDate : program.startDate || selectedDateKey,
    };
  };

  const openReminder = (item) => {
    const program = [...CALENDAR_PROGRAMS, ...PLANNED_PROGRAMS].find((candidate) => candidate.id === item.subscription.programId);
    if (!program) return;
    const date = parseDateKey(item.subscription.eventDate);
    if (program.tier === 2) {
      openDetails(program);
      return;
    }
    setView("month");
    if (date) {
      setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      setSelectedDate(date);
    }
    setSelectedProgramId(program.id);
  };

  const getAlertButtonProps = (program, type) => {
    let targetType = type === "planned" ? "start" : type;
    let dates = getNotificationDates(program, targetType);
    const fallbackToDeadline = type === "start" && dates.length === 0 && getNotificationDates(program, "deadline").length > 0;
    if (fallbackToDeadline) {
      targetType = "deadline";
      dates = getNotificationDates(program, targetType);
    }
    const subscription = findNotification(program, targetType);
    const limitReached = !subscription && configuredAlertCount >= 30;
    return {
      notification: subscription,
      notificationState,
      dates,
      disabled: limitReached || dates.length === 0,
      disabledReason: limitReached ? "받는 중인 알림은 최대 30건까지 설정할 수 있어요." : "남은 발송 시점이 없어요.",
      onSetup: () => handleNotify(program, targetType),
      onTurnOff: () => subscription && handleNotificationOff(subscription.id),
      onResend: handleNotificationResend,
    };
  };

  const toggleView = (nextView) => setView(nextView);

  return (
    <main className="fin-calendar">
      <div className="fc-wrap">
        {isLoggedIn && !bannerDismissed && reminderAlerts.length > 0 && (
          <ReminderBanner
            reminder={reminderAlerts[0]}
            count={reminderAlerts.length}
            onOpen={() => openReminder(reminderAlerts[0])}
            onDismiss={() => {
              localStorage.setItem("fin-b2-banner-dismissed", toDateKey(CALENDAR_REFERENCE_DATE));
              setBannerDismissed(true);
            }}
          />
        )}
        <header className="fc-page-heading">
          <div>
            <h1>Fin. 캘린더</h1>
            <p>청년 저축상품과 금융 지원 정책의 <strong>모집 일정</strong>을 한눈에 확인하세요</p>
          </div>
          <div className="fc-page-actions">
            <button className="fc-button fc-button--light" onClick={() => isLoggedIn ? navigate("/mypage", { state: { activeTab: "alerts" } }) : beginLoginAction({ type: "alerts" })}>
              <Icon src={bellIcon} />내 알림
            </button>
            <div className="fc-view-toggle" role="tablist" aria-label="캘린더 보기 방식">
              <button className={view === "month" ? "is-active" : ""} role="tab" aria-selected={view === "month"} onClick={() => toggleView("month")}>
                <Icon src={calendarIcon} />월간
              </button>
              <button className={view === "list" ? "is-active" : ""} role="tab" aria-selected={view === "list"} onClick={() => toggleView("list")}>
                <Icon src={listIcon} />리스트
              </button>
            </div>
          </div>
        </header>

        {isLoggedIn && <SummaryBar activeCount={activePrograms.length} expiringCount={expiringSoonCount} startCount={startsThisMonth} alertCount={configuredAlertCount} onClick={(kind) => kind === "alerts" ? navigate("/mypage", { state: { activeTab: "alerts" } }) : selectStatus(kind === "active" ? "all" : kind)} />}

        {view === "month" && !hasMonthEvents && (
          <div className="fc-planned-banner"><strong>12월 모집 예정</strong><span>청년미래적금 2차 모집이 12월 중 열릴 예정이에요 (일자 미확정 · 금융위원회 발표 기준)</span></div>
        )}

        <section className={`fc-main-layout ${view === "list" ? "fc-main-layout--list" : ""}`}>
          <div className="fc-calendar-column">
            <div className="fc-toolbar">
              <div className="fc-month-controls">
                <button className="fc-icon-button" aria-label="이전 달" disabled={atMinMonth} onClick={() => updateMonth(-1)}><Icon src={prevIcon} /></button>
                <h2>{formatMonth(displayMonth)}</h2>
                <button className="fc-icon-button" aria-label="다음 달" disabled={atMaxMonth} onClick={() => updateMonth(1)}><Icon src={nextIcon} /></button>
                <button className="fc-button fc-button--today" onClick={() => { setDisplayMonth(new Date(CALENDAR_REFERENCE_DATE.getFullYear(), CALENDAR_REFERENCE_DATE.getMonth(), 1)); setSelectedDate(CALENDAR_REFERENCE_DATE); setSelectedProgramId(""); }}>오늘</button>
              </div>
              <div className="fc-conditions-wrap">
                <button className={`fc-button fc-button--conditions${conditionsActive ? " is-on" : ""}`} onClick={() => setConditionsOpen((previous) => !previous)}>
                  {!isLoggedIn && <Icon src={lockIcon} />}내 조건 맞춤 <Icon src={conditionsActive ? activeConditionIcon : caretIcon} className="fc-condition-caret" />
                </button>
                {conditionsOpen && (
                  <div className="fc-condition-popover">
                    <div className="fc-condition-head"><strong>내 조건 맞춤</strong><button className={`fc-switch${conditionsActive ? " is-on" : ""}`} onClick={handleConditionsClick} aria-label="내 조건 맞춤 전환"><span /></button></div>
                    <p>켜두면 내 자격으로 신청할 수 없는 일정은 숨겨요</p>
                    <strong className="fc-condition-label">내 자격 정보</strong>
                    {profile ? (
                      <div className="fc-profile-chips">
                        {(profile.display?.age != null || profile.birthdate) && <span>만 {profile.display?.age ?? calculateAge(profile.birthdate)}세</span>}
                        {profile.annualIncome != null && <span>연소득 {Number(profile.annualIncome).toLocaleString()}만원</span>}
                        {profile.display?.region && <span>{profile.display.region} 거주</span>}
                      </div>
                    ) : <span className="fc-profile-empty">프로필 정보를 불러오는 중이에요</span>}
                    <button className="fc-text-button" onClick={() => navigate("/mypage", { state: { activeTab: "info" } })}><Icon src={editIcon} />내 정보 수정</button>
                  </div>
                )}
              </div>
            </div>

            <div className="fc-filters">
              <FilterRow label="신청 기간">
              {STATUS_FILTERS.map((filter) => {
                  const active = selectedStatuses.includes(filter.id) || (filter.id === "maturity" && false);
                  return (
                    <button key={filter.id} className={`fc-filter-chip${active ? " is-active" : ""}${filter.tone ? ` fc-filter-chip--${filter.tone}` : ""}${filter.locked ? " is-locked" : ""}`} onClick={() => handleStatusClick(filter)}>
                      {filter.tone && <span className="fc-filter-dot" />}{!isLoggedIn && filter.locked && <Icon src={lockIcon} />}{filter.label}
                      {filter.id !== "maturity" && <span className="fc-filter-count">{filteredStatusCount(filter.id)}</span>}
                    </button>
                  );
                })}
              </FilterRow>
              <FilterRow label="상품 분류">
                {CATEGORY_FILTERS.map((filter) => <button key={filter.id} className={`fc-filter-chip${category === filter.id ? " is-active" : ""}`} onClick={() => setCategory(filter.id)}>{filter.label}</button>)}
              </FilterRow>
            </div>

            {view === "month" ? (
              <>
                <div className="fc-calendar-meta">
                  <p>{conditionsActive && profile?.display?.region ? `${profile.display.region} 기준` : "전국 기준"} · 오늘 마감 <strong className="fc-red">{activePrograms.filter((program) => program.endDate === toDateKey(CALENDAR_REFERENCE_DATE)).length}건</strong> · 이번 주 시작 <strong className="fc-green">{activePrograms.filter((program) => program.startDate >= toDateKey(CALENDAR_REFERENCE_DATE) && daysBetween(CALENDAR_REFERENCE_DATE, parseDateKey(program.startDate)) < 7).length}건</strong></p>
                  <StatusLegend />
                </div>
                {!hasMonthEvents && <EmptyState onShowAll={() => { setSelectedStatuses(["all"]); setCategory("all"); setDisplayMonth(new Date(2026, 9, 1)); }} onNotify={() => {
                  const nextProgram = [...PLANNED_PROGRAMS].sort((left, right) => left.plannedDate.localeCompare(right.plannedDate))[0];
                  if (nextProgram) handleNotify(nextProgram, "start");
                  else beginLoginAction({ type: "notify-next" });
                }} />}
                <div className={`fc-calendar-grid${!hasMonthEvents ? " is-empty" : ""}`}>
                  <div className="fc-weekdays">{WEEKDAYS.map((weekday, index) => <div key={weekday} className={index === 0 ? "is-sunday" : ""}>{weekday}</div>)}</div>
                  <div className="fc-day-grid" style={{ "--fc-rows": cellCount / 7 }}>
                    {calendarDays.map((day) => {
                      const holiday = day.dateKey === "2026-10-03" ? "개천절" : day.dateKey === "2026-10-09" ? "한글날" : "";
                      const shown = day.occurrences.slice(0, 3);
                      return (
                        <button key={day.dateKey} className={`fc-day-cell${day.inMonth ? "" : " is-outside"}${day.dateKey === selectedDateKey ? " is-selected" : ""}`} onClick={() => { setSelectedDate(day.date); setSelectedProgramId(day.occurrences[0]?.program.id || ""); }}>
                          <span className={`fc-day-number${day.dateKey === toDateKey(CALENDAR_REFERENCE_DATE) ? " is-today" : ""}${day.date.getDay() === 0 || holiday ? " is-holiday" : ""}`}>{day.date.getDate()}</span>
                          {holiday && <span className="fc-holiday">{holiday}</span>}
                          <span className="fc-day-events">{shown.map((occurrence) => <span key={occurrence.id} onClick={(event) => { event.stopPropagation(); selectOccurrence(occurrence); }}><EventLabel occurrence={occurrence} compact /></span>)}{day.occurrences.length > 3 && <span className="fc-more-events">+{day.occurrences.length - 3}건</span>}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <CalendarList
                occurrences={listOccurrences}
                showPast={showPast}
                onTogglePast={() => setShowPast((previous) => !previous)}
                isLoggedIn={isLoggedIn}
                notificationState={notificationState}
                getAlertButtonProps={getAlertButtonProps}
                onDetails={openDetails}
                onSelect={selectOccurrence}
                onLogin={(occurrence) => beginLoginAction({ type: "notify", programId: occurrence?.program?.id, alertType: occurrence?.type })}
              />
            )}
          </div>

          {view === "month" && (
            <aside className="fc-sidebar">
              <AvailableCard programs={activePrograms} onSelect={(program) => { setSelectedDate(parseDateKey(program.endDate)); setSelectedProgramId(program.id); }} />
              {!hasMonthEvents && <NextScheduleCard programs={nextPrograms.slice(0, 2)} onGoToMonth={(date) => { const parsed = parseDateKey(date); if (parsed) { setDisplayMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1)); setSelectedDate(parsed); } }} />}
              {selectedProgram && (
                <SelectedProgramCard
                  program={selectedProgram}
                  selectedDate={selectedDate}
                  occurrence={getSelectedProgramOccurrence(selectedProgram)}
                  isLoggedIn={isLoggedIn}
                  alertButtonProps={getAlertButtonProps(selectedProgram, getSelectedProgramOccurrence(selectedProgram).type)}
                  isFavorite={favoriteIds.has(selectedProgram.id)}
                  conditionsActive={conditionsActive}
                  profile={profile}
                  onFavorite={() => handleFavorite(selectedProgram)}
                  onDetails={() => openDetails(selectedProgram)}
                  onLogin={() => beginLoginAction({ type: "notify", programId: selectedProgram.id, alertType: getSelectedProgramOccurrence(selectedProgram).type })}
                />
              )}
              {isLoggedIn && <MaturityCard onDetails={() => openDetails(MATURITY_EVENT)} alertButtonProps={getAlertButtonProps(MATURITY_EVENT, "maturity")} />}
              <OngoingCard onOpen={(tab) => { setDrawerTab(tab); setShowOngoingDrawer(true); }} />
            </aside>
          )}
        </section>

        <footer className="fc-disclaimer">
          <p>일정은 2026.10.05 06:00 온통청년 공고 기준이며 기관 사정에 따라 바뀔 수 있어요. 연말(12/31) 일괄 종료 정책은 ‘연중 접수’로 따로 모았어요.</p>
          <p>Y-Fin은 해당 상품의 판매·중개 주체가 아니며, 신청은 기관 공식 페이지에서 진행됩니다.</p>
        </footer>
      </div>

      {showLoginModal && <LoginPrompt onClose={() => setShowLoginModal(false)} onJoin={() => { setShowLoginModal(false); navigate("/terms", { state: { returnTo: `${location.pathname}${location.search}`, calendarAction: pendingAction } }); }} onLogin={() => { setShowLoginModal(false); navigate("/login", { state: { returnTo: `${location.pathname}${location.search}`, calendarAction: pendingAction } }); }} />}
      {alertSetup && <AlertSetupModal program={alertSetup.program} type={alertSetup.type} email={alertEmail} emailError={alertEmailError} onEmailChange={(value) => { setAlertEmail(value); setAlertEmailError(""); }} onSubmit={handleAlertSetupSubmit} onClose={() => setAlertSetup(null)} />}
      {alertToast && <div className="b2-alert-toast" role="status"><div><strong>{alertToast.title}</strong><span>{alertToast.message}</span></div>{alertToast.subscriptionId && <button type="button" onClick={handleAlertToastUndo}>실행 취소</button>}<button type="button" aria-label="닫기" onClick={() => setAlertToast(null)}>×</button></div>}
      {showOngoingDrawer && <OngoingDrawer tab={drawerTab} onTabChange={setDrawerTab} onClose={() => setShowOngoingDrawer(false)} />}
      {view === "month" && <div className="fc-mobile-sheet">{selectedDayOccurrences.length > 0 && <strong>{formatSelectedDay(selectedDate)} · {selectedDayOccurrences.length}건</strong>}{selectedDayOccurrences.slice(0, 2).map((occurrence) => <button key={occurrence.id} onClick={() => selectOccurrence(occurrence)}><EventLabel occurrence={occurrence} /></button>)}</div>}
    </main>
  );
}

function SummaryBar({ activeCount, expiringCount, startCount, alertCount, onClick }) {
  const items = [
    { type: "active", dot: "start", label: "지금 신청 가능", value: activeCount, unit: "개" },
    { type: "deadline", dot: "deadline", label: "마감 임박 · 7일 이내", value: expiringCount, unit: "건" },
    { type: "start", dot: "start", label: `${CALENDAR_REFERENCE_DATE.getMonth() + 1}월 시작`, value: startCount, unit: "건" },
    { type: "alerts", dot: "maturity", label: "설정해둔 알림", value: alertCount, unit: "건" },
  ];
  return <div className="fc-summary">{items.map((item) => <button key={item.type} className="fc-summary-item" onClick={() => onClick(item.type)}><span className={`fc-summary-label fc-summary-label--${item.dot}`}><i />{item.label}</span><strong>{item.value}<small>{item.unit}</small></strong></button>)}</div>;
}

function FilterRow({ label, children }) {
  return <div className="fc-filter-row"><strong>{label}</strong><div>{children}</div></div>;
}

function StatusLegend() {
  return <div className="fc-legend"><span className="fc-legend__start">시작</span><span className="fc-legend__deadline">마감</span><span className="fc-legend__urgent">마감 3일 이내</span><span className="fc-legend__planned">예정</span><span className="fc-legend__maturity">만기</span><i /> <small>회색 글씨 = 금융 지원 정책</small></div>;
}

function EmptyState({ onShowAll, onNotify }) {
  return <div className="fc-empty-state"><span className="fc-empty-calendar"><Icon src={calendarIcon} /></span><strong>이번 달 내 조건에 맞는 모집 일정이 없어요</strong><p>정책 저축상품은 대부분 1년에 1~2번만 모집해요.<br />다음 모집이 시작되면 놓치지 않게 알려드릴게요.</p><div><button className="fc-button fc-button--light" onClick={onShowAll}>전체 일정 보기</button><button className="fc-button fc-button--primary" onClick={onNotify}><Icon src={bellIcon} />다음 모집 알림 받기</button></div></div>;
}

function AvailableCard({ programs, onSelect }) {
  return <section className="fc-panel fc-available"><div className="fc-panel-heading"><h3>지금 신청 가능</h3><span>전체 {programs.length}건 <Icon src={chevronIcon} /></span></div><div className="fc-available-list">{programs.slice(0, 3).map((program) => <button key={program.id} className="fc-available-row" onClick={() => onSelect(program)}><span className="fc-status-badge">진행 중</span><span className="fc-available-copy"><strong>{program.name}</strong><small>~{program.endDate.slice(5).replace("-", ".")} 마감 · {program.institution}</small></span><b className={daysBetween(CALENDAR_REFERENCE_DATE, parseDateKey(program.endDate)) <= 7 ? "fc-red" : ""}>{ddayLabel(program.endDate)}</b><span className="fc-row-arrow"><Icon src={chevronIcon} /></span></button>)}</div></section>;
}

function SelectedProgramCard({ program, selectedDate, occurrence, isLoggedIn, alertButtonProps, isFavorite, conditionsActive, profile, onFavorite, onDetails, onLogin }) {
  const label = occurrence.type === "deadline" ? `마감 ${ddayLabel(occurrence.date)}` : occurrence.type === "maturity" ? `만기 ${ddayLabel(occurrence.date)}` : `시작 ${ddayLabel(occurrence.date)}`;
  const startDate = program.startDate ? parseDateKey(program.startDate) : parseDateKey(occurrence.date);
  const endDate = program.endDate ? parseDateKey(program.endDate) : parseDateKey(occurrence.date);
  const dateRange = `${startDate.getMonth() + 1}.${String(startDate.getDate()).padStart(2, "0")} (${WEEKDAYS[startDate.getDay()]}) ~ ${endDate.getMonth() + 1}.${String(endDate.getDate()).padStart(2, "0")} (${WEEKDAYS[endDate.getDay()]})`;
  return (
    <section className="fc-panel fc-selected-program">
      <div className="fc-panel-heading"><h3>{formatSelectedDay(selectedDate)}</h3><span>1건</span></div>
      <div className="fc-program-badges"><span className={`fc-status-pill fc-status-pill--${eventTone(occurrence.type)}`}>{label}</span><span className={`fc-category-pill${program.category === "support" ? " is-muted" : ""}`}>{program.category === "support" ? "금융 지원 정책" : "Y-Fin 정책상품"}</span>{program.tier !== 2 && <button className={`fc-favorite${isFavorite ? " is-active" : ""}`} aria-label="관심 상품" onClick={isLoggedIn ? onFavorite : onLogin}><Icon src={isFavorite ? activeFavoriteIcon : favoriteIcon} /></button>}</div>
      <h4>{program.name}</h4>
      <p className="fc-program-summary">{program.region || program.institution}{program.summary ? ` · ${program.summary}` : ""}</p>
      <dl className="fc-detail-rows"><div><dt>신청 기간</dt><dd>{dateRange}</dd></div><div><dt>대상</dt><dd>{program.age}{program.region && program.region !== "전국" ? ` · ${program.region}` : ""}</dd></div>{isLoggedIn && <div><dt>내 조건 맞춤</dt><dd className={matchesProfile(program, profile) ? "fc-green" : "fc-red"}>{matchesProfile(program, profile) ? "충족" : "미충족"}</dd></div>}</dl>
      <div className="fc-card-actions"><button className="fc-button fc-button--light" onClick={onDetails}>{program.tier === 2 ? "온통청년 보기 ↗" : "상세 보기"}</button><CalendarAlertButton {...alertButtonProps} onSetup={isLoggedIn ? alertButtonProps.onSetup : onLogin} /></div>
      <small className="fc-data-source">온통청년 10.05 기준</small>
    </section>
  );
}

function ReminderBanner({ reminder, count, onOpen, onDismiss }) {
  const { subscription, label } = reminder;
  return (
    <section className="b2-reminder-banner" aria-label="7일 이내 알림 예정">
      <div className="b2-reminder-title"><Icon src={bellIcon} />7일 이내 내 일정</div>
      <div className="b2-reminder-main">
        <span className={`b2-reminder-pill${subscription.type === "start" ? " is-start" : subscription.type === "maturity" ? " is-maturity" : ""}`}>{label.replace("마감 ", "마감 ").replace("D-0", "당일")}</span>
        <span>{subscription.name}</span>
        {count > 1 && <small>외 {count - 1}건</small>}
      </div>
      {subscription.tier === 2 && <button className="b2-reminder-action" onClick={onOpen}>온통청년 보기 ↗</button>}
      <button className="b2-reminder-action" onClick={onOpen}>내 일정 보기 ›</button>
      <button className="b2-reminder-dismiss" onClick={onDismiss} aria-label="오늘 배너 닫기">×</button>
    </section>
  );
}

function MaturityCard({ onDetails, alertButtonProps }) {
  return <section className="fc-panel fc-maturity-card"><h3>내 만기</h3><div className="fc-maturity-inner"><div className="fc-program-badges"><span className="fc-status-pill fc-status-pill--maturity">만기</span><span className="fc-maturity-dday">{ddayLabel(MATURITY_EVENT.endDate)}</span></div><h4>{MATURITY_EVENT.name}</h4><p>10.22 (목) 만기 · 12개월 · 내가 등록한 가입 상품</p><div className="fc-card-actions"><button className="fc-button fc-button--light" onClick={onDetails}>상세 보기</button><CalendarAlertButton {...alertButtonProps} /></div></div></section>;
}

function OngoingCard({ onOpen }) {
  return <section className="fc-panel fc-ongoing-card"><h3>연중 · 상시 일정</h3><button className="fc-ongoing-row" onClick={() => onOpen("year-round")}><span>연중</span><strong>연중 접수 중인 정책 9건</strong><Icon src={chevronIcon} /></button><button className="fc-ongoing-row" onClick={() => onOpen("always")}><span>상시</span><strong>상시 신청 가능한 정책 7건</strong><Icon src={chevronIcon} /></button><p>연중 접수는 예산 소진 시 조기 마감될 수 있어요</p></section>;
}

function NextScheduleCard({ programs, onGoToMonth }) {
  return <section className="fc-panel fc-next-schedule"><h3>가장 가까운 다음 일정</h3>{programs.map((program) => <div className="fc-next-row" key={program.id}><span className={`fc-status-pill fc-status-pill--${program.plannedDate ? "planned" : "deadline"}`}>{program.plannedDate ? "예정" : "마감"}</span><strong>{program.name}</strong><span>{program.period || program.endDate?.slice(5).replace("-", ".")}</span></div>)}<button className="fc-button fc-button--outline" onClick={() => onGoToMonth(programs[0]?.plannedDate || programs[0]?.endDate)}>12월로 이동 <Icon src={chevronIcon} /></button></section>;
}

function CalendarList({ occurrences, showPast, onTogglePast, isLoggedIn, getAlertButtonProps, onDetails, onSelect, onLogin }) {
  const groups = occurrences.reduce((result, occurrence) => {
    result[occurrence.date] ||= [];
    result[occurrence.date].push(occurrence);
    return result;
  }, {});
  const keys = Object.keys(groups).sort();
  return <div className="fc-list-view"><div className="fc-list-toolbar"><span>오늘 이후 일정 <strong>{keys.length}건</strong>을 날짜순으로 보여드려요</span><button onClick={onTogglePast}>{showPast ? "지난 일정 접기" : "지난 일정 2건 보기"}<Icon src={caretIcon} /></button></div>{keys.length === 0 ? <EmptyState onShowAll={() => {}} onNotify={() => onLogin()} /> : keys.map((date) => {
    const parsed = parseDateKey(date);
    return <div className="fc-list-date-group" key={date}><div className="fc-list-date"><strong>{date.slice(5).replace("-", ".")}</strong><span>{WEEKDAYS[parsed.getDay()]}요일</span></div><div className="fc-list-cards">{groups[date].map((occurrence) => <article className="fc-list-card" key={occurrence.id} onClick={() => onSelect(occurrence)}><EventLabel occurrence={occurrence} /><div className="fc-list-info"><strong>{occurrence.program.name}</strong><span className={`fc-category-pill${occurrence.program.category === "support" ? " is-muted" : ""}`}>{occurrence.program.category === "support" ? "금융 지원 정책" : "Y-Fin 정책상품"}</span><small>{occurrence.program.institution} · {occurrence.program.period || "전국"}</small></div><b className="fc-list-dday">{ddayLabel(occurrence.date)}</b><button className="fc-button fc-button--light" onClick={(event) => { event.stopPropagation(); onDetails(occurrence.program); }}>{occurrence.program.tier === 2 ? "온통청년 ↗" : "상세 보기"}</button><span onClick={(event) => event.stopPropagation()}><CalendarAlertButton compact {...getAlertButtonProps(occurrence.program, occurrence.type)} onSetup={isLoggedIn ? getAlertButtonProps(occurrence.program, occurrence.type).onSetup : () => onLogin(occurrence)} /></span></article>)}</div></div>;
  })}</div>;
}

function LoginPrompt({ onClose, onJoin, onLogin }) {
  return <div className="fc-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="fc-login-modal" role="dialog" aria-modal="true" aria-labelledby="fc-login-title"><button className="fc-modal-close" onClick={onClose} aria-label="닫기"><Icon src={closeIcon} /></button><span className="fc-login-lock"><Icon src={lockIcon} /></span><h2 id="fc-login-title">로그인 후 이용할 수 있어요</h2><p>마감 알림은 로그인한 회원에게 보내드려요</p><ul><li>내 자격 정보에 맞는 일정만 골라 보기</li><li>마감 7일·3일·1일 전에 이메일로 알림 받기</li><li>가입한 상품의 만기일도 캘린더에 표시</li></ul><button className="fc-button fc-button--primary" onClick={onJoin}>회원가입 후 이용하기</button><button className="fc-button fc-button--light" onClick={onLogin}>로그인하고 확인하기</button></section></div>;
}

function OngoingDrawer({ tab, onTabChange, onClose }) {
  const items = tab === "year-round" ? ONGOING_PROGRAMS : ALWAYS_PROGRAMS;
  const tagLabel = tab === "year-round" ? "연중 접수" : "상시 신청";
  return <div className="fc-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="fc-drawer" role="dialog" aria-modal="true" aria-labelledby="fc-drawer-title"><div className="fc-drawer-header"><div><h2 id="fc-drawer-title">연중 · 상시 일정</h2><p>신청 기간이 길거나 따로 없어 캘린더에 찍지 않은 정책이에요.<br />마감일이 없어 알림은 설정하지 않아요.</p></div><button onClick={onClose} aria-label="닫기"><Icon src={closeIcon} /></button></div><div className="fc-drawer-tabs"><button className={tab === "year-round" ? "is-active" : ""} onClick={() => onTabChange("year-round")}>연중 접수 9</button><button className={tab === "always" ? "is-active" : ""} onClick={() => onTabChange("always")}>상시 신청 7</button></div><div className="fc-drawer-meta"><span>부산 기준 · 최근 공고순</span><small>캘린더 필터 그대로 적용</small></div><div className="fc-drawer-warning"><Icon src={infoIcon} />연중 접수는 예산 소진 시 조기 마감될 수 있어요</div><div className="fc-drawer-list">{items.map((program) => <article key={program.id}><div><span className="fc-mini-tag">{tagLabel}</span><span className="fc-category-pill is-muted">금융 지원 정책</span><h3>{program.name}</h3><p>{program.institution} · {program.period}</p></div><button className="fc-button fc-button--light" onClick={() => window.open("https://www.youthcenter.go.kr", "_blank", "noopener,noreferrer")}>온통청년 보기 ↗</button></article>)}</div><p className="fc-drawer-more">아래로 내리면 5건 더 볼 수 있어요</p></aside></div>;
}

