import { useEffect, useRef, useState } from "react";

const baseInput ="border border-[#D9D9D9] rounded-[4px] px-3 text-[18px] text-[#454545] focus:outline-none focus:border-[#03BFA5]";
const baseSelect = "border border-[#D9D9D9] rounded-[4px] px-3 text-[18px] text-[#454545] focus:outline-none focus:border-[#03BFA5]";

export function FormInput({ className = "", ...props }) {
  return <input className={`${baseInput} ${className}`} {...props} />;
}

export function FormSelect({ children, className = "", ...props }) {
  return (
    <select className={`${baseSelect} ${className}`} {...props}>
      {children}
    </select>
  );
}

// 항상 아래로 펼쳐지는 드롭다운. 네이티브 <select>는 펼침 방향을 브라우저가 창의 남은 공간으로
// 정해서 CSS로 강제할 수 없기 때문에, 방향이 고정돼야 하는 곳(생년월일 등)에서 대신 쓴다.
// options: 문자열/숫자 배열이거나 { value, label } 배열. onChange에는 항상 문자열 value가 넘어간다.
// borderColor/textSize: 화면마다 다른 select 디자인(테두리 색, 글자 크기)에 맞추기 위한 값.
export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "선택",
  className = "",
  borderColor = "border-[#D9D9D9]",
  textSize = "text-[18px]",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const selected = value === "" || value === undefined || value === null ? "" : String(value);
  const items = options.map((option) =>
    typeof option === "object" && option !== null
      ? { value: String(option.value), label: String(option.label) }
      : { value: String(option), label: String(option) },
  );
  const selectedLabel = items.find((item) => item.value === selected)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // 열릴 때 현재 선택한 항목이 목록 안에서 보이도록 스크롤한다.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const current = listRef.current.querySelector('[aria-selected="true"]');
    if (current) listRef.current.scrollTop = Math.max(0, current.offsetTop - 40);
  }, [open]);

  const choose = (next) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-full w-full cursor-pointer items-center justify-between rounded-[4px] border bg-white px-3 text-left font-medium text-[#454545] focus:outline-none focus:border-[#03BFA5] ${textSize} ${
          open ? "border-[#03BFA5]" : borderColor
        }`}
      >
        <span>{selectedLabel || placeholder}</span>
        <svg className={`ml-2 size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 max-h-[260px] w-full overflow-y-auto rounded-[4px] border border-[#D9D9D9] bg-white py-1 shadow-lg"
        >
          {[{ value: "", label: placeholder }, ...items].map((option) => (
            <li
              key={option.value || "__placeholder"}
              role="option"
              aria-selected={option.value === selected}
              onClick={() => choose(option.value)}
              className={`cursor-pointer px-3 py-2 ${textSize} ${
                option.value === selected
                  ? "bg-[#F0FFFE] font-semibold text-[#03BFA5]"
                  : "text-[#454545] hover:bg-[#F7FFFE]"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
