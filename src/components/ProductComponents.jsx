import { contributionDisplayValue } from "../utils/recommendationResult";
import lockIcon from "../assets/product-list/lock.svg";
import dividerIcon from "../assets/product-list/divider.svg";

function handleCardKeyDown(event, onClick) {
  if (event.target !== event.currentTarget || !onClick) return;
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); }
}

function tagTone(tag, government) {
  if (tag.includes("적합도")) return government ? "match-government" : "match-bank";
  if (tag.includes("기여금") || tag.includes("정부 지원")) return "support";
  if (/마케팅|우대/.test(tag)) return "benefit";
  return "neutral";
}

function ProductTags({ tags = [], government, hideSuitability }) {
  return <div className="product-tags">{tags.filter((tag) => !hideSuitability || !tag.includes("적합도")).map((tag, index) => <span key={`${tag}-${index}`} className={tagTone(tag, government)}>{tag}</span>)}</div>;
}

function ProductSummary({ product, contribution, payout, parking, onLogin }) {
  const { isLoggedIn, baseRate, maxRate, myRate, contributionRate, maturityContribution, contributionCaption, netMaturityAmount, payoutCaption, maxRateLimitDisplay } = product;
  const labelA = contribution ? "기여금 환산 수익률" : payout ? "내가 받을 금리" : "기본 금리";
  const labelB = contribution ? "예상 만기 기여금 총액" : payout ? "예상 세후 실수령액" : "최고 금리";
  const valueA = contribution ? contributionDisplayValue(contributionRate, isLoggedIn) : `연 ${payout ? myRate : baseRate}%`;
  const valueB = contribution ? contributionDisplayValue(maturityContribution, isLoggedIn) : payout ? netMaturityAmount : `연 ${maxRate}%`;
  const needsLogin = !parking && !isLoggedIn;
  return <div className="product-summary">
    <div className="product-metrics"><div><p>{labelA}</p><strong>{valueA}</strong></div><img src={dividerIcon} alt="" /><div><p>{labelB}</p><strong>{valueB}</strong></div></div>
    {needsLogin ? <button type="button" className="product-summary-pill" onClick={(event) => { event.stopPropagation(); onLogin?.(); }}><img src={lockIcon} alt="" />로그인하고 내 {contribution ? "기여금" : "금리"} 확인하기</button>
      : <p className="product-summary-pill">{parking ? <>최고금리 적용한도 <b>{maxRateLimitDisplay}</b></> : contribution ? contributionCaption : payout ? payoutCaption : <>내가 받을 금리 <b>연 {myRate}%</b></>}</p>}
  </div>;
}

export function TopCard(props) {
  const { rank, title, subtitle, tags, isBest, onClick, showContribution = false, payoutMode = false, parking = false, onLogin } = props;
  return <article role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(event) => handleCardKeyDown(event, onClick)} className={`product-top-card ${isBest ? "best" : ""}`}>
    <div className="product-card-copy"><h3>TOP {rank}</h3><ProductTags tags={tags} government={showContribution} hideSuitability={payoutMode || parking} /><h4>{title}</h4><p>{subtitle}</p></div>
    <ProductSummary product={props} contribution={showContribution} payout={payoutMode} parking={parking} onLogin={onLogin} />
  </article>;
}

export function ListItem(props) {
  const { title, subtitle, tags, onClick, variant = "rate", payoutMode = false, parking = false, rank, onLogin } = props;
  const government = variant === "contribution";
  return <article role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(event) => handleCardKeyDown(event, onClick)} className="product-list-item">
    {rank && <span className={`product-list-rank ${rank > 3 ? "secondary" : ""}`}>{rank}</span>}
    <div className="product-list-description"><ProductTags tags={tags} government={government} hideSuitability={payoutMode || parking} /><h4>{title}</h4><p>{subtitle}</p></div>
    <ProductSummary product={props} contribution={government} payout={payoutMode} parking={parking} onLogin={onLogin} />
  </article>;
}
