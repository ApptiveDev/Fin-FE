export default function InfoIcon({ text }) {
  return (
    <div className="relative inline-flex items-center group cursor-pointer ml-1">
      
      {/* 기본 느낌표/인포 아이콘 */}
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-[#03BFA5] bg-white transition-colors group-hover:bg-[#03BFA5]">
        <span className="pt-0.5 text-[12px] font-bold leading-none text-[#03BFA5] transition-colors group-hover:text-white">i</span>
      </div>

        {text && (
          <div className="absolute bottom-full left-0 mb-3 hidden group-hover:flex items-center
          bg-[#F0FFFE] border border-[#03BFA5] rounded-[4px] px-3 py-1 z-50 shadow-sm transition-all
          whitespace-pre">

          <div className="absolute -bottom-[4px] left-[8px] w-1.5 h-1.5 bg-[#F0FFFE] border-r border-b border-[#03BFA5] rotate-45"></div>
        
          {/* 설명 텍스트 */}
          <span className="text-[#03BFA5] text-[13px] font-pretendard font-medium text-left relative z-10 tracking-tight leading-relaxed">
            {text}
          </span>
        </div>
        )}
    </div>
  );
}
