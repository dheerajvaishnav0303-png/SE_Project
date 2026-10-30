import React from 'react';
import { formatPaise } from '../../lib/formatters';
import InfoTooltip from '../../components/ui/InfoTooltip';

export function InflationTab() {
  return (
    <div className="p-6 border border-[#E5E4DF] bg-white space-y-4 text-xs font-mono tabular-nums">
      <h3 className="text-base font-serif font-medium text-[#111827]">Real Purchasing-Power of ₹1.00 Crore over Time</h3>
      <p className="text-xs text-[#4B5563] font-sans">
        How inflation degrades the real goods-and-services value of a nominal lump sum:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {[10, 20, 30].map((yrs) => {
          const valAt6Pct = Math.round(10000000 / Math.pow(1.06, yrs));
          const valAt85Pct = Math.round(10000000 / Math.pow(1.085, yrs));
          return (
            <div key={yrs} className="p-4 border border-[#E5E4DF] bg-[#FAF9F5]">
              <span className="text-[11px] font-semibold text-[#111827] uppercase block mb-1">{yrs} Years Elapsed</span>
              <div className="text-sm font-bold text-[#991B1B]">At 6% CPI: {formatPaise(valAt6Pct * 100)}</div>
              <div className="text-xs text-[#B45309] mt-1">At 8.5% Ed. Infl: {formatPaise(valAt85Pct * 100)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FireTab() {
  return (
    <div className="p-6 border border-[#E5E4DF] bg-white space-y-4 text-xs font-mono tabular-nums">
      <h3 className="text-base font-serif font-medium text-[#111827]">
        Financial Independence (FIRE) Corpus Model
        <InfoTooltip
          title="Safe Withdrawal Rate (SWR)"
          content="Calculated as 25x or 30x annual expenses allowing perpetual drawdown without depleting real principal."
        />
      </h3>
      <p className="text-xs text-[#4B5563] font-sans">
        Rule of 25 (4% SWR) vs. Rule of 30 (3.33% Conservative Institutional SWR) for perpetual drawdown:
      </p>
      <div className="p-4 bg-[#FAF9F5] border border-[#E5E4DF] space-y-2">
        <div>Monthly Living Expense: ₹1,50,000</div>
        <div className="text-sm font-bold text-[#1E3A8A]">Conservative Target Corpus: ₹5,40,00,000 (30x Annual)</div>
      </div>
    </div>
  );
}

