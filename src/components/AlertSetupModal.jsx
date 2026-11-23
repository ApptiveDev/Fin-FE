import { formatNotificationDate, getNotificationDates } from "../utils/calendarNotifications";
import { CALENDAR_REFERENCE_DATE } from "../data/calendarEvents";

function getDday(value) {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const gap = Math.round((target.getTime() - CALENDAR_REFERENCE_DATE.getTime()) / 86400000);
  return gap === 0 ? "D-day" : gap > 0 ? `D-${gap}` : `D+${Math.abs(gap)}`;
}

export default function AlertSetupModal({ program, type, email, emailError, onEmailChange, onSubmit, onClose }) {
  const isEmailMode = type === "email";
  const dates = isEmailMode ? [] : getNotificationDates(program, type);
  const title = isEmailMode ? "알림 받을 이메일 등록" : type === "start" ? "시작 알림 받기" : type === "maturity" ? "만기 알림 받기" : "마감 알림 받기";
  const category = isEmailMode ? "이메일 인증" : type === "maturity" ? "가입 등록 상품" : program.tier === 2 ? "금융 지원 정책" : "Y-Fin 정책상품";
  const eventDate = isEmailMode ? null : type === "start" ? (program.startDate || program.plannedDate) : program.endDate;
  const dateBadge = isEmailMode ? "이메일 변경" : type === "start" ? "시작 예정" : type === "maturity" ? "만기" : `마감 ${getDday(eventDate)}`;
  return (
    <div className="b2-alert-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="b2-alert-modal" role="dialog" aria-modal="true" aria-labelledby="b2-alert-modal-title" onSubmit={onSubmit}>
        <div className="b2-alert-modal-head"><h2 id="b2-alert-modal-title">{title}</h2><button type="button" onClick={onClose} aria-label="닫기">×</button></div>
        {!isEmailMode && <div className="b2-alert-target">
          <div className="b2-alert-target-tags"><span>{dateBadge}</span><span>{category}</span></div>
          <strong>{program.name}</strong>
          <small>{program.period || `${program.institution} 일정`}</small>
        </div>}
        {!isEmailMode && <div className="b2-alert-dates">
          <strong>이렇게 알려드려요</strong>
          <ul>{dates.map((item) => <li key={`${item.label}-${item.date}`}><b>{item.offset === 0 ? "당일" : `D-${item.offset}`}</b><span>{formatNotificationDate(item.date, true)}</span></li>)}</ul>
          <p>마감 7일·3일·1일 전, 시작 전날·당일 오전 9시에 알려드려요. 이미 지난 시점은 건너뛰어요.</p>
        </div>}
        <label htmlFor="b2-alert-email">알림 받을 이메일</label>
        <div className="b2-alert-email-input"><span>✉</span><input id="b2-alert-email" type="email" autoComplete="email" placeholder="알림 받을 이메일을 입력해 주세요" value={email} onChange={(event) => onEmailChange(event.target.value)} aria-invalid={Boolean(emailError)} /></div>
        {emailError ? <p className="b2-alert-email-error">{emailError}</p> : <p className="b2-alert-email-note">{isEmailMode ? "이메일 인증을 완료하면 새 주소로 알림을 보내드려요. 인증 전까지는 기존 이메일로 받아요." : "처음 한 번만 이메일을 확인해요. 인증 후부터 알림이 발송돼요."}</p>}
        <p className="b2-alert-privacy-note">알림 발송은 회원가입 때 동의한 개인정보 수집·이용 범위에서 진행돼요. 알림 메일에서 언제든 전체 수신을 끌 수 있어요.</p>
        <div className="b2-alert-modal-actions"><button type="button" className="b2-alert-modal-cancel" onClick={onClose}>취소</button><button type="submit" className="b2-alert-modal-submit" disabled={!isEmailMode && dates.length === 0}>✉ 인증 메일 받기</button></div>
      </form>
    </div>
  );
}
