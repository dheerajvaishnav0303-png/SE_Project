import React, { useState } from 'react';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';

export default function AddGoalSheet({ isOpen, onClose, onSubmit, isPending }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'RETIREMENT',
    targetCorpusRupees: '10000000',
    targetDate: '2045-12-31',
    inflationRate: '0.06',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetCorpusPaise: Math.round(parseFloat(formData.targetCorpusRupees) * 100),
      targetDate: new Date(formData.targetDate).toISOString(),
      inflationRate: parseFloat(formData.inflationRate) || 0.06,
    });
  };

  return (
    <SlideOverSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Establish Financial Goal"
      subtitle="Calibrate forward inflation-adjusted glidepaths and stochastic probability targets."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Goal Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Higher Education 2035"
            className="w-full px-3 py-2 border border-[#E5E4DF] text-xs text-[#111827]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-[#E5E4DF] text-xs"
          >
            <option value="RETIREMENT">Retirement (6.0% CPI)</option>
            <option value="EDUCATION">Education (8.5% Inflation)</option>
            <option value="HEALTHCARE">Healthcare (9.0% Inflation)</option>
            <option value="REAL_ESTATE">Real Estate (7.5% Inflation)</option>
            <option value="GENERAL">General Wealth (6.0% CPI)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Target Corpus (₹)</label>
          <input
            type="number"
            min="10000"
            required
            value={formData.targetCorpusRupees}
            onChange={(e) => setFormData({ ...formData, targetCorpusRupees: e.target.value })}
            className="w-full px-3 py-2 border border-[#E5E4DF] text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Target Date</label>
          <input
            type="date"
            required
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className="w-full px-3 py-2 border border-[#E5E4DF] text-xs font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 py-2.5 bg-[#1E3A8A] text-white text-xs font-mono uppercase hover:bg-[#111827]"
        >
          {isPending ? 'Simulating...' : 'Compile Glidepath'}
        </button>
      </form>
    </SlideOverSheet>
  );
}

