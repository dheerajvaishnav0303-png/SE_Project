import React, { useState } from 'react';
import { formatPaise, formatUnits } from '../../lib/formatters';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';

export default function RedeemDrawer({ holding, taxLots, onClose, onRedeem, isPending }) {
  const [redeemUnits, setRedeemUnits] = useState('');

  if (!holding) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!redeemUnits) return;
    const planId = holding.plan?._id || holding.plan;
    onRedeem({ planId, units: redeemUnits });
  };

  return (
    <SlideOverSheet
      isOpen={Boolean(holding)}
      onClose={onClose}
      title={holding.plan?.name || 'Holding Details'}
      subtitle={`Folio: ${holding.folioNumber} | Total Units: ${formatUnits(holding.units)}`}
      width="max-w-xl"
    >
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] block mb-2">
            Active FIFO Tax Lots Queue
          </span>
          <div className="border border-[#E5E4DF] overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#FAF9F5] border-b border-[#E5E4DF] text-[#4B5563] uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-2 px-3">Tenure</th>
                  <th className="py-2 px-3 text-right">Units</th>
                  <th className="py-2 px-3 text-right">Cost</th>
                  <th className="py-2 px-3 text-center">Tax Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
                {taxLots?.analyzedLots?.filter((l) => l.remainingUnits > 0).slice(0, 5).map((lot, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F5]">
                    <td className="py-2 px-3">{lot.daysHeld}d held</td>
                    <td className="py-2 px-3 text-right font-medium">{formatUnits(lot.remainingUnits)}</td>
                    <td className="py-2 px-3 text-right">{formatPaise(lot.purchaseNavPaise)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold ${lot.isLongTerm ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FFFBEB] text-[#B45309]'}`}>
                        {lot.isLongTerm ? 'LTCG (12.5%)' : 'STCG (20%)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 border-t border-[#E5E4DF] space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
              Units to Redeem (Max: {formatUnits(holding.units)})
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              max={holding.units}
              required
              value={redeemUnits}
              onChange={(e) => setRedeemUnits(e.target.value)}
              placeholder="e.g. 50.0000"
              className="w-full px-3 py-2 border border-[#E5E4DF] text-sm font-mono tabular-nums text-[#111827] focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>
          {redeemUnits && (
            <div className="p-3 bg-[#FAF9F5] border border-[#E5E4DF] text-xs font-mono tabular-nums text-[#4B5563]">
              Estimated Proceeds: <strong className="text-[#111827]">{formatPaise(Math.round(parseFloat(redeemUnits) * holding.plan.navPaise))}</strong>
            </div>
          )}
          <button
            type="submit"
            disabled={isPending || !redeemUnits}
            className="w-full py-2.5 px-4 bg-[#111827] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Executing Settlement...' : 'Execute FIFO Redemption'}
          </button>
        </form>
      </div>
    </SlideOverSheet>
  );
}

