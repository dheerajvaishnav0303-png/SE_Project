import React from 'react';
import { formatPaise, formatPercent } from '../../lib/formatters';

const ASSET_COLORS = {
  equity: { bg: 'bg-[#1E3A8A]', label: 'Equity (Large/Mid/Small)' },
  debt: { bg: 'bg-[#4B5563]', label: 'Fixed Income & Bonds' },
  hybrid: { bg: 'bg-[#2563EB]', label: 'Hybrid & Balanced' },
  gold: { bg: 'bg-[#B45309]', label: 'Sovereign Bullion' },
  cash: { bg: 'bg-[#9CA3AF]', label: 'Liquid Cash & Escrow' },
};

/**
 * Horizontal Stacked Allocation Bar
 * Complete replacement for circular/donut/pie charts under institutional broadsheet rules.
 */
export function StackedAllocationBar({ allocation, totalPaise }) {
  if (!totalPaise || totalPaise <= 0) return null;

  const segments = [
    { key: 'equity', amountPaise: allocation?.equityPaise || 0 },
    { key: 'debt', amountPaise: allocation?.debtPaise || 0 },
    { key: 'hybrid', amountPaise: allocation?.hybridPaise || 0 },
    { key: 'gold', amountPaise: allocation?.goldPaise || 0 },
    { key: 'cash', amountPaise: allocation?.cashPaise || 0 },
  ].filter((s) => s.amountPaise > 0);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4B5563]">
          Asset Allocation Composition
        </span>
        <span className="text-xs font-mono tabular-nums text-[#9CA3AF]">
          Total: {formatPaise(totalPaise)}
        </span>
      </div>

      {/* 14px Continuous Stacked Bar with 1px Paper Dividers */}
      <div className="w-full h-3.5 flex overflow-hidden bg-[#E5E4DF] border border-[#E5E4DF] rounded-none">
        {segments.map((seg, idx) => {
          const widthPct = (seg.amountPaise / totalPaise) * 100;
          return (
            <div
              key={seg.key}
              style={{ width: `${widthPct}%` }}
              className={`${ASSET_COLORS[seg.key]?.bg} h-full border-r border-[#FAF9F5] last:border-r-0 transition-all duration-300`}
              title={`${ASSET_COLORS[seg.key]?.label}: ${widthPct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Tabular Broadsheet Legend Underneath */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-[#E5E4DF]">
        {segments.map((seg) => {
          const pct = seg.amountPaise / totalPaise;
          return (
            <div key={seg.key} className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-2 h-2 rounded-none ${ASSET_COLORS[seg.key]?.bg}`} />
                <span className="text-[11px] text-[#4B5563] truncate font-medium">
                  {ASSET_COLORS[seg.key]?.label.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                <span className="text-xs font-semibold text-[#111827]">
                  {formatPercent(pct, false)}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  ({formatPaise(seg.amountPaise)})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

