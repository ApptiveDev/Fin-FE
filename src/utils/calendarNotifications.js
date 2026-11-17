import { CALENDAR_REFERENCE_DATE } from "../data/calendarEvents";

const STORAGE_KEY = "fin-b2-calendar-notifications";
const DAY_MS = 24 * 60 * 60 * 1000;

function dateFromKey(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function daysBefore(value, amount) {
  const result = dateFromKey(value);
  if (!result) return null;
  result.setDate(result.getDate() - amount);
  return dateKey(result);
}

export function getNotificationDates(program, type, today = CALENDAR_REFERENCE_DATE) {
  const eventDate = type === "start" ? (program.startDate || program.plannedDate) : program.endDate;
  if (!eventDate) return [];
  const offsets = type === "start" ? [1, 0] : type === "maturity" ? [30, 7] : [7, 3, 1];
  const todayKey = dateKey(today);
  return offsets.map((offset) => ({
    label: type === "start" ? (offset === 0 ? "시작 당일" : "시작 전날") : `${type === "maturity" ? "만기" : "마감"} D-${offset}`,
    date: daysBefore(eventDate, offset),
    offset,
  })).filter((item) => item.date && item.date >= todayKey);
}

export function loadCalendarNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      email: typeof saved?.email === "string" ? saved.email : "",
      pendingEmail: typeof saved?.pendingEmail === "string" ? saved.pendingEmail : "",
      emailVerified: Boolean(saved?.emailVerified),
      paused: Boolean(saved?.paused),
      subscriptions: Array.isArray(saved?.subscriptions) ? saved.subscriptions : [],
    };
  } catch {
    return { email: "", pendingEmail: "", emailVerified: false, paused: false, subscriptions: [] };
  }
}

export function saveCalendarNotifications(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function makeCalendarSubscription(program, type, emailVerified) {
  const id = `${program.id}:${type}`;
  return {
    id,
    programId: program.id,
    name: program.name,
    institution: program.institution,
    tier: program.tier,
    type,
    period: program.period,
    eventDate: type === "start" ? program.startDate : program.endDate,
    sendDates: getNotificationDates(program, type),
    status: emailVerified ? "active" : "pending",
    createdAt: new Date().toISOString(),
  };
}

export function formatNotificationDate(value, includeTime = false) {
  const date = dateFromKey(value);
  if (!date) return "일정 확인 필요";
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")} (${weekdays[date.getDay()]})${includeTime ? " 오전 9시" : ""}`;
}

export function getNotificationDday(value, today = CALENDAR_REFERENCE_DATE) {
  const date = dateFromKey(value);
  if (!date) return "";
  const gap = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  return gap === 0 ? "D-day" : gap > 0 ? `D-${gap}` : `D+${Math.abs(gap)}`;
}

export function getUpcomingNotifications(state, withinDays = null) {
  const todayKey = dateKey(CALENDAR_REFERENCE_DATE);
  const upperBound = withinDays == null
    ? null
    : dateKey(new Date(CALENDAR_REFERENCE_DATE.getTime() + withinDays * DAY_MS));
  return (state?.subscriptions || [])
    .filter((subscription) => subscription.status === "active" && !state?.paused)
    .flatMap((subscription) => (subscription.sendDates || []).map((sendDate) => ({ ...sendDate, subscription })))
    .filter((item) => item.date >= todayKey && (!upperBound || item.date <= upperBound))
    .sort((left, right) => left.date.localeCompare(right.date));
}

