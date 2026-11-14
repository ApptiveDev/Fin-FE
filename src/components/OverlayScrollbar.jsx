import { useEffect, useRef, useState } from "react";

// 화면 전체 스크롤바. 브라우저 기본 스크롤바는 화면 오른쪽에 자기 자리(폭)를 차지하지만,
// 이 막대는 기존 화면 위에 떠 있기만 해서 레이아웃 폭을 줄이지 않는다.
// 기본 스크롤바는 index.css에서 html에 한해 숨기고(wheel/키보드/터치 스크롤은 그대로 동작), 여기서 대신 그린다.
const INSET_RIGHT = 4; // 화면 오른쪽 끝에서 띄우는 간격(px)
const INSET_Y = 7; // 위/아래 여백(px)
const MIN_THUMB_HEIGHT = 40;
const HIT_WIDTH = 18; // 잡기 쉽도록 막대보다 넓게 잡는 클릭 영역(px)

function measure() {
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  if (documentHeight <= viewportHeight + 1) return { visible: false, height: 0, top: 0 };

  const trackHeight = viewportHeight - INSET_Y * 2;
  const height = Math.max(MIN_THUMB_HEIGHT, (trackHeight * viewportHeight) / documentHeight);
  const maxScroll = documentHeight - viewportHeight;
  const top = INSET_Y + (window.scrollY / maxScroll) * (trackHeight - height);
  return { visible: true, height, top };
}

export default function OverlayScrollbar() {
  const [thumb, setThumb] = useState({ visible: false, height: 0, top: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    const update = () => setThumb(measure());
    const frame = requestAnimationFrame(update);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // 폼이 펼쳐지는 등 문서 높이가 바뀔 때도 막대 크기/위치를 맞춘다.
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  const handlePointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startScroll: window.scrollY };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const { height } = measure();
    const trackRange = viewportHeight - INSET_Y * 2 - height;
    if (trackRange <= 0) return;

    const ratio = (documentHeight - viewportHeight) / trackRange;
    window.scrollTo({ top: drag.startScroll + (event.clientY - drag.startY) * ratio });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  if (!thumb.visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed z-[90] flex cursor-pointer justify-end touch-none"
      style={{
        top: thumb.top,
        height: thumb.height,
        right: INSET_RIGHT - (HIT_WIDTH - 6) / 2,
        width: HIT_WIDTH,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`h-full w-[5px] rounded-full transition-colors ${
          dragging ? "bg-[rgba(90,90,90,0.6)]" : "bg-[rgba(110,110,110,0.4)] hover:bg-[rgba(90,90,90,0.55)]"
        }`}
        style={{ marginRight: (HIT_WIDTH - 6) / 2 }}
      />
    </div>
  );
}
