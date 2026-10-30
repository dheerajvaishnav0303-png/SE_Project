import React, { useState } from 'react';
import { formatPaise } from '../../lib/formatters';

export default function ManualLedgerModal({ user, onClose, onSubmit, isPending }) {
  const [adjustAmount, setAdjustAmount] = useState('1000');
  const [adjustDirection, setAdjustDirection] = useState('CREDIT');
  const [adjustReason, setAdjustReason] = useState('Administrative compensation credit');

  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      id: user._id,
      payload: {
        action: 'LEDGER_ADJUSTMENT',
        amountPaise: Math.round(parseFloat(adjustAmount) * 100),
        direction: adjustDirection,
        reason: adjustReason,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-[#E5E4DF] p-5 space-y-3 font-mono text-xs"
      >
        <h4 className="font-serif text-sm font-semibold text-[#111827]">Manual Double-Entry Adjustment</h4>
        <p className="text-[11px] text-[#6B7280]">
          Target: {user.email} (Balance: {formatPaise(user.walletBalancePaise)})
        </p>
        <div className="flex gap-2">
          {['CREDIT', 'DEBIT'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setAdjustDirection(d)}
              className={`flex-1 py-1 text-center border uppercase text-[10px] ${
                adjustDirection === d ? 'bg-[#111827] text-white' : 'bg-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="100"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="w-full px-2 py-1 border border-[#D1D5DB]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Mandatory Audit Reason</label>
          <input
            type="text"
            required
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="w-full px-2 py-1 border border-[#D1D5DB]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-2.5 py-1 border border-[#D1D5DB]">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="px-2.5 py-1 bg-[#1E3A8A] text-white uppercase">
            Confirm Leg
          </button>
        </div>
      </form>
    </div>
  );
}

