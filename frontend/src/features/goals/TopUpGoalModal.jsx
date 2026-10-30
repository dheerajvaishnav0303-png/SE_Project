import React, { useState } from 'react';

export default function TopUpGoalModal({ goal, onClose, onConfirm, isPending }) {
  const [topUpAmount, setTopUpAmount] = useState('10000');

  if (!goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white border border-[#E5E4DF] p-6 space-y-4">
        <h4 className="font-serif text-base font-semibold text-[#111827]">Top-Up Goal Corpus</h4>
        <p className="text-xs text-[#6B7280]">
          Allocate wallet cash toward <strong className="text-[#111827]">{goal.title}</strong>.
        </p>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Amount (₹)</label>
          <input
            type="number"
            min="500"
            step="500"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D1D5DB] font-mono text-xs focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase border border-[#D1D5DB]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(goal._id, Math.round(parseFloat(topUpAmount) * 100))}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-mono uppercase bg-[#111827] text-white hover:bg-[#0F5132]"
          >
            {isPending ? 'Processing...' : 'Confirm Top-Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

