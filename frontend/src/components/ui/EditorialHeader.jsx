import React from 'react';

/**
 * Editorial Broadsheet Header with authoritative serif title and action strip
 */
export function EditorialHeader({ title, subtitle, date, children }) {
  return (
    <div className="border-b border-[#E5E4DF] pb-5 mb-8 pt-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {date && (
            <p className="text-[11px] font-mono tracking-wider uppercase text-[#9CA3AF] mb-1 tabular-nums">
              {date}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-serif font-normal text-[#111827] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-[#4B5563] mt-1 max-w-2xl font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

