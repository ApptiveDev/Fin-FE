import { useState } from "react";
import { formatNotificationDate } from "../utils/calendarNotifications";
import bellIcon from "../assets/calendar/ca794.svg";

export default function CalendarAlertButton({
  notification,
  notificationState,
  dates = [],
  disabled = false,
  disabledReason = "지금 받을 수 있는 알림 일정이 없어요.",
  onSetup,
  onTurnOff,
  onResend,
  compact = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPending = notification?.status === "pending";
  const isActive = notification?.status === "active";
  const isPaused = Boolean(notificationState?.paused);
  const label = isPending ? "인증 대기 중" : isActive ? (isPaused ? "알림 일시정지" : "알림 받는 중") : "알림 받기";

  const handleClick = () => {
    if (notification && (isActive || isPending)) setMenuOpen((open) => !open);
    else if (!disabled) onSetup?.();
  };

  return (
    <div className={`b2-alert-button-wrap${compact ? " is-compact" : ""}`}>
      <button
        type="button"
        className={`b2-alert-button${isActive ? " is-active" : ""}${isPending ? " is-pending" : ""}`}
        onClick={handleClick}
        disabled={!notification && disabled}
        aria-expanded={Boolean(notification && menuOpen)}
        title={!notification && disabled ? disabledReason : undefined}
      >
        <img src={bellIcon} alt="" aria-hidden="true" />
        <span>{label}</span>
      </button>

      {menuOpen && notification && (
        <div className="b2-alert-menu" role="dialog" aria-label="알림 설정">
          {isPending ? (
            <>
              <strong>이메일 인증을 완료해 주세요</strong>
              <p>{notificationState?.email || "등록한 이메일"}으로 보낸 인증이 끝나면 알림이 시작돼요.</p>
              <div className="b2-alert-menu-actions">
                <button type="button" onClick={() => onResend?.()}>인증 메일 다시 받기</button>
              </div>
            </>
          ) : (
            <>
              <strong>보낼 알림</strong>
              <ul>{(notification.sendDates || []).map((date) => <li key={`${notification.id}-${date.date}`}><b>{date.label}</b><span>{formatNotificationDate(date.date, true)}</span></li>)}</ul>
              <p className="b2-alert-menu-email">✉ {notificationState?.email || "알림 이메일 미등록"}</p>
              <button type="button" className="b2-alert-menu-off" onClick={() => { onTurnOff?.(); setMenuOpen(false); }}>알림 끄기</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
