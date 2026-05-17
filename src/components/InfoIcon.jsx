export default function InfoIcon({ onClick, className = "" }) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`w-3 h-3 rounded-full border border-[#03BFA5] text-[#03BFA5] flex items-center justify-center text-[11px] font-bold cursor-pointer hover:opacity-80 transition-opacity focus:outline-none ${className}`}
    >
      !
    </button>
  );
}