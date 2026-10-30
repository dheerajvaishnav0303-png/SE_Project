import React from 'react';

/**
 * Boxless Horizontal Hairline Metric Strip
 * Displays financial figures aligned like a Swiss private banking statement.
 */
export function MetricStrip({ metrics = [] }) {
  if (!metrics.length) return null;

  return (
    <div className="w-full border-y border-[#E5E4DF] bg-[#FAF9F5] mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E5E4DF]">
        {metrics.map((m, idx) => {
          let valueColor = 'text-[#111827]';
          if (m.isPositive) valueColor = 'text-[#0F5132]';
          if (m.isNegative) valueColor = 'text-[#991B1B]';
          if (m.isHighlight) valueColor = 'text-[#1E3A8A]';

          return (
            <div key={idx} className="py-4 px-4 sm:px-6">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#4B5563] block mb-1">
                {m.label}
              </span>
              <div className={`text-xl sm:text-2xl font-mono tabular-nums tracking-tight font-medium ${valueColor}`}>
                {m.value}
              </div>
              {m.subtext && (
                <div className="text-[11px] font-mono tabular-nums text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                  {m.subtext}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

