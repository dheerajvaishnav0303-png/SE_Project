import React, { useState, useEffect } from 'react';
import { formatPaise } from '../../lib/formatters';

export default function LinkToGoalModal({ holding, goals = [], onClose, onSave, isPending }) {
  const getGoalId = (h) => {
    if (!h || !h.linkedGoal) return '';
    return typeof h.linkedGoal === 'object' ? h.linkedGoal._id || '' : String(h.linkedGoal);
  };

  const [selectedGoalId, setSelectedGoalId] = useState(() => getGoalId(holding));

  useEffect(() => {
    setSelectedGoalId(getGoalId(holding));
  }, [holding]);

  if (!holding) return null;

  const safeGoals = Array.isArray(goals) ? goals : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E4DF] p-6 space-y-4 font-sans">
        <h4 className="font-serif text-base font-semibold text-[#111827]">
          Link Holding to Financial Goal
        </h4>
        <p className="text-xs text-[#6B7280]">
          Assign <strong className="text-[#111827]">{holding.plan?.name || 'Selected Holding'}</strong> to an active goal glidepath for automated tracking.
        </p>
        <select
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="w-full px-3 py-2 border border-[#D1D5DB] text-xs font-mono bg-white focus:outline-none"
        >
          <option value="">-- No Linked Goal (Unassigned) --</option>
          {safeGoals.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title} ({formatPaise(g.targetAmountPaise || g.targetCorpusPaise || 0)})
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase border border-[#D1D5DB] text-[#4B5563] hover:bg-[#F3F4F6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(holding._id, selectedGoalId || null)}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-mono uppercase bg-[#111827] text-white hover:bg-[#1E3A8A]"
          >
            {isPending ? 'Saving...' : 'Save Linkage'}
          </button>
        </div>
      </div>
    </div>
  );
}
