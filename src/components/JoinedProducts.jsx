import { useEffect, useState } from "react";
import { formatNotificationDate, getNotificationDday } from "../utils/calendarNotifications";

const key = "fin-joined-products";
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function maturityDate(joined, months) {
  if (!joined) return null;
  const [year, month, day] = joined.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return date;
}
export default function JoinedProducts({ favorites, onRegister, onRecommend }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } });
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [joined, setJoined] = useState(dateKey(new Date()));
  useEffect(() => { const openForProduct = (event) => { setSelected(String(event.detail)); setOpen(true); }; window.addEventListener("fin:register-product", openForProduct); return () => window.removeEventListener("fin:register-product", openForProduct); }, []);
  const [months, setMonths] = useState(12);
  const product = favorites.find((item) => String(item.productPropertyId) === selected);
  const maturity = maturityDate(joined, months);
  const endDate = maturity ? dateKey(maturity) : "";
  const save = (event) => {
    event.preventDefault();
    if (!product || !endDate) return;
    const record = { id: `joined-${product.productPropertyId}`, name: product.productName, institution: product.summaryLine, joined, months, endDate, tier: 1 };
    const next = [...items.filter((item) => item.id !== record.id), record];
    localStorage.setItem(key, JSON.stringify(next)); setItems(next); setOpen(false); onRegister(record);
  };
  return <section className="mt-10">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[24px] font-bold">내 가입 상품 <span className="text-[#03BFA5]">{items.length}</span></h2><button className="flex h-[60px] w-[232px] items-center justify-center gap-[6px] rounded-[14px] border-2 border-[#03BFA5] bg-[#EFFFFD] px-[30px] text-[22px] font-medium text-[#03BFA5]" onClick={() => setOpen(true)}>＋ 가입 상품 등록</button></div>
    <div className="flex flex-col gap-4">{items.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-6 rounded-[18px] border border-[#03BFA5] bg-white p-7"><span className="rounded-full bg-[#F3EBFA] px-3 py-1 font-semibold text-[#7A20A2]">만기</span><div className="flex-1"><h3 className="text-[18px] font-bold">{item.name}</h3><p className="mt-2 text-[14px] text-[#8A8F99]">{item.joined.replaceAll("-", ".")} 가입 · {item.months}개월 · 만기 30일·7일 전 알림</p></div><div><p className="text-[14px] text-[#8A8F99]">만기 예정일</p><strong className="text-[20px]">{item.endDate.replaceAll("-", ".")}</strong></div><b className="text-[28px] text-[#7A20A2]">{getNotificationDday(item.endDate, new Date())}</b><button onClick={onRecommend} className="rounded-xl bg-[#03BFA5] px-5 py-3 font-semibold text-white">다음 가입 상품 추천받기 ›</button></article>)}</div>
    {!items.length && <p className="rounded-xl border border-dashed border-[#D5D5D5] py-10 text-center text-[#8A8F99]">가입한 상품을 등록하고 만기 일정을 확인하세요.</p>}
    <p className="mt-4 text-[14px] text-[#8A8F99]">만기일은 가입일과 저축 기간으로 계산한 예정일이에요. 실제 지급일은 은행 영업일 규칙을 따라요.</p>
    {open && <div className="b2-alert-modal-backdrop"><form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="joined-title" className="b2-alert-modal joined-product-modal"><div className="b2-alert-modal-head"><h2 id="joined-title">가입한 상품 등록</h2><button type="button" onClick={() => setOpen(false)} aria-label="닫기">×</button></div><p className="mb-6 text-[#8A8F99]">가입일을 알려주시면 만기 전에 미리 알려드릴게요</p><label htmlFor="joined-product">찜해둔 상품</label><select id="joined-product" required value={selected} onChange={(event) => { setSelected(event.target.value); const item = favorites.find((entry) => String(entry.productPropertyId) === event.target.value); setMonths(Number(item?.saveTrm) || 12); }} className="mb-6 w-full rounded-xl border border-[#E6E8EB] bg-[#FAFAFB] p-4"><option value="">등록할 상품을 선택해 주세요</option>{favorites.map((item) => <option key={item.productPropertyId} value={item.productPropertyId}>{item.productName}</option>)}</select><label htmlFor="joined-date">가입일</label><input id="joined-date" type="date" required max={dateKey(new Date())} value={joined} onChange={(event) => setJoined(event.target.value)} className="mb-6 w-full rounded-xl border border-[#E6E8EB] p-4"/><label>저축 기간 · 상품 기간으로 미리 채웠어요</label><div className="mb-6 flex flex-wrap gap-2">{[1,3,6,12,24,36].map((value) => <button key={value} type="button" onClick={() => setMonths(value)} className={`rounded-full border px-4 py-2 ${months === value ? "border-[#03BFA5] bg-[#EFFFFD] text-[#03BFA5]" : "border-[#E6E8EB]"}`}>{value}개월</button>)}</div><div className="mb-6 flex items-center justify-between rounded-xl bg-[#F3EBFA] p-6"><div><p className="text-[#7A20A2]">만기 예정일</p><strong className="text-[28px]">{endDate.replaceAll("-", ".")}</strong></div><b className="text-[30px] text-[#7A20A2]">{getNotificationDday(endDate, new Date())}</b></div><div className="mb-6 rounded-xl bg-[#EFFFFD] p-5"><strong>이렇게 알려드려요</strong>{[30,7].map((offset) => { const date = maturity ? new Date(maturity) : null; date?.setDate(date.getDate()-offset); return <p key={offset} className="mt-3"><b className="mr-4 text-[#03BFA5]">D-{offset}</b>{date ? formatNotificationDate(dateKey(date), true) : "가입일을 선택해 주세요"}</p>; })}</div><button disabled={!product} className="w-full rounded-xl bg-[#03BFA5] py-4 text-[20px] font-semibold text-white disabled:opacity-40">등록하고 만기 알림 받기</button></form></div>}
  </section>;
}
