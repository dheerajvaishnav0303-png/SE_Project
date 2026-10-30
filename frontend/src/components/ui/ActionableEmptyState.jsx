import React from 'react';

export default function ActionableEmptyState({
  title = 'No Records Recorded',
  description = 'There are no active records found under this ledger section.',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  badge = 'FOLIO INVENTORY',
}) {
  return (
    <div className="p-8 my-4 text-center bg-[#FAF9F5] border border-[#E5E4DF] rounded-none">
      <div className="inline-block px-2 py-0.5 mb-3 text-[10px] font-mono font-medium tracking-widest uppercase bg-[#FFFFFF] border border-[#E5E4DF] text-[#6B7280]">
        {badge}
      </div>
      <h3 className="font-serif text-lg font-normal text-[#111827] tracking-tight">
        {title}
      </h3>
      <p className="max-w-md mx-auto mt-2 text-xs text-[#6B7280] leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-mono font-medium tracking-wide uppercase bg-[#111827] text-white hover:bg-[#1E3A8A] transition-colors rounded-none focus:outline-none"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="px-4 py-2 text-xs font-mono font-medium tracking-wide uppercase bg-[#FFFFFF] text-[#111827] border border-[#D1D5DB] hover:bg-[#F3F4F6] transition-colors rounded-none focus:outline-none"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

