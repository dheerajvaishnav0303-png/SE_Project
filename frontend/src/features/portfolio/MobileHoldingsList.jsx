import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPaise, formatPercent, formatUnits } from '../../lib/formatters';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MobileHoldingsList({ holdings, onRedeem, onLinkGoal }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="md:hidden divide-y divide-[#E5E4DF] border border-[#E5E4DF] bg-white font-sans">
      {holdings.map((inv) => {
        const isExpanded = expandedId === inv._id;
        const isGain = inv.unrealizedPnlPaise >= 0;
        const avgNav = parseFloat(inv.units) > 0 ? Math.round(inv.investedPaise / parseFloat(inv.units)) : 0;

        return (
          <div key={inv._id} className="p-3 transition-colors">
            {/* Header / Summary Row */}
            <div
              onClick={() => toggle(inv._id)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex-1 pr-2">
                <div className="font-medium text-xs text-[#111827] line-clamp-1">{inv.plan?.name}</div>
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1.5 mt-0.5">
                  <span>{inv.plan?.category}</span>
                  <span>•</span>
                  <span>{inv.folioNumber}</span>
                  {inv.linkedGoal && (
                    <span className="text-[#1E3A8A] font-semibold">★ {inv.linkedGoal?.title || 'Goal'}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#111827] tabular-nums">
                    {formatPaise(inv.currentValuePaise)}
                  </div>
                  <div className={`text-[10px] font-mono tabular-nums ${isGain ? 'text-[#0F5132]' : 'text-[#991B1B]'}`}>
                    {formatPercent(inv.returnsPercentage / 100)}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />}
              </div>
            </div>

            {/* Expanded Ledger Tray */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[#F3F1EC] space-y-2.5 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F5] p-2 border border-[#E5E4DF]">
                  <div>
                    <span className="text-[#6B7280] block text-[9px] uppercase">Units</span>
                    <span className="tabular-nums font-semibold">{formatUnits(inv.units)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[9px] uppercase">Cost NAV</span>
                    <span className="tabular-nums">{avgNav > 0 ? formatPaise(avgNav) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[9px] uppercase">Invested</span>
                    <span className="tabular-nums text-[#4B5563]">{formatPaise(inv.investedPaise)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[9px] uppercase">Gain / Loss</span>
                    <span className={`tabular-nums font-semibold ${isGain ? 'text-[#0F5132]' : 'text-[#991B1B]'}`}>
                      {formatPaise(inv.unrealizedPnlPaise)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/marketplace"
                    className="flex-1 py-1 text-center text-[10px] font-mono uppercase border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white"
                  >
                    + Invest
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRedeem(inv)}
                    className="flex-1 py-1 text-center text-[10px] font-mono uppercase border border-[#E5E4DF] hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                  >
                    Redeem
                  </button>
                  <button
                    type="button"
                    onClick={() => onLinkGoal(inv)}
                    className="flex-1 py-1 text-center text-[10px] font-mono uppercase border border-[#D1D5DB] text-[#4B5563]"
                  >
                    Link Goal
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
