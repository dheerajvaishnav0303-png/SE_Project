import React, { useState } from 'react';

export default function ModifySipModal({ sip, onClose, onSave, isPending }) {
  const [editAmount, setEditAmount] = useState((sip?.amountPaise ? sip.amountPaise / 100 : 5000).toString());
  const [editStepUp, setEditStepUp] = useState((sip?.stepUpPercentage ?? 10).toString());

  if (!sip) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      amountPaise: Math.round(parseFloat(editAmount) * 100),
      stepUpPercentage: parseFloat(editStepUp),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#E5E4DF] p-6 space-y-4">
        <h4 className="font-serif text-base font-semibold text-[#111827]">
          Modify Mandate: {sip.plan?.name}
        </h4>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">
            Monthly Amount (₹)
          </label>
          <input
            type="number"
            min="500"
            step="100"
            required
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D1D5DB] font-mono text-xs focus:outline-none focus:border-[#1E3A8A]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">
            Annual Step-Up Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="1"
            required
            value={editStepUp}
            onChange={(e) => setEditStepUp(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D1D5DB] font-mono text-xs focus:outline-none focus:border-[#1E3A8A]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase border border-[#D1D5DB] text-[#4B5563]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-mono uppercase bg-[#111827] text-white hover:bg-[#1E3A8A]"
          >
            {isPending ? 'Updating...' : 'Save Mandate'}
          </button>
        </div>
      </form>
    </div>
  );
}

