export function getTagStyle(tag) {
  if (tag.includes("적합도")) return "bg-[#FFF4E0] text-[#E65200]";
  if (tag.includes("정부기여금") || tag.includes("비과세") || tag.includes("우대")) {
    return "bg-[#E0FDF9] text-[#333333]";
  }
  if (tag.includes("내집마련") || tag.includes("청약")) return "bg-[#F4EFFF] text-[#7B42C8]";
  if (tag.includes("소득공제")) return "bg-[#EAF4FF] text-[#2C88D9]";
  return "bg-[#F2F3F5] text-[#333333]";
}
