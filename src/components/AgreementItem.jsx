import React from 'react';

function AgreementItem({ id, label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100/60 rounded-xl transition-all hover:bg-gray-200/50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange(id)}>
        {}
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700 group-hover:text-black">
          {label}
        </span>
      </div>
      <button className="text-[10px] text-gray-400 underline hover:text-gray-600">
        전문보기
      </button>
    </div>
  );
}

export default AgreementItem;