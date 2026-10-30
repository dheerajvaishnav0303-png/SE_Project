import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { investmentKeys, portfolioKeys, sipKeys } from '../../lib/queryClient';
import { formatPaise, formatPercent } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';
import { CheckCircle2, Shield, TrendingUp } from 'lucide-react';

export default function CuratedPlansPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mode, setMode] = useState('LUMP_SUM'); // 'LUMP_SUM' or 'SIP'
  const [amountRupees, setAmountRupees] = useState('5000');
  const [debitDay, setDebitDay] = useState(15);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const monthly = params.get('monthly');
    const stepUp = params.get('stepUp');
    if (monthly) {
      setAmountRupees(monthly);
      setMode('SIP');
    }
    if (stepUp) {
      setStepUpPct(Number(stepUp));
    }
  }, [location.search]);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: investmentKeys.catalog({ category: categoryFilter }),
    queryFn: async () => {
      const url = categoryFilter ? `/investments?category=${categoryFilter}` : '/investments';
      const res = await apiClient.get(url);
      return res.data?.data?.plans || [];
    },
  });

  const investMutation = useMutation({
    mutationFn: async () => {
      const amountPaise = Math.round(parseFloat(amountRupees) * 100);
      if (mode === 'LUMP_SUM') {
        const res = await apiClient.post('/customer/investments/purchase', {
          planId: selectedPlan._id,
          amountPaise,
        });
        return res.data;
      } else {
        const res = await apiClient.post('/sips', {
          planId: selectedPlan._id,
          amountPaise,
          stepUpPercentage: parseFloat(stepUpPct) || 0,
          debitDay: parseInt(debitDay, 10),
        });
        return res.data;
      }
    },
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.summary() });
      queryClient.invalidateQueries({ queryKey: sipKeys.list() });
      setSelectedPlan(null);
    },
  });

  return (
    <div>
      <EditorialHeader
        title="Curated Investment Catalog"
        subtitle="Institutional direct mutual funds, index trackers, corporate debt, and sovereign bullion."
      />

      {successMsg && (
        <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#0F5132] text-[#0F5132] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category Filter Bar */}
      <div className="flex border-b border-[#E5E4DF] mb-6 space-x-2">
        {['', 'EQUITY', 'DEBT', 'GOLD'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              categoryFilter === cat
                ? 'border-[#1E3A8A] text-[#111827]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
            }`}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs font-mono text-[#9CA3AF]">
            Loading catalog schemes...
          </div>
        ) : plans.map((plan) => (
          <div key={plan._id} className="p-5 border border-[#E5E4DF] bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
                <span>{plan.category} • {plan.subCategory}</span>
                <span className="text-[#1E3A8A] font-semibold">{plan.riskLevel} RISK</span>
              </div>
              <h3 className="text-base font-serif font-medium text-[#111827]">{plan.name}</h3>
              <p className="text-xs text-[#4B5563] mt-0.5">{plan.amc} | Benchmark: {plan.benchmarkIndex}</p>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E5E4DF] text-xs font-mono tabular-nums">
                <div>
                  <span className="text-[10px] text-[#9CA3AF] block uppercase">Current NAV</span>
                  <span className="font-semibold text-[#111827]">{formatPaise(plan.navPaise)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] block uppercase">1Y CAGR</span>
                  <span className="text-[#0F5132] font-semibold">{formatPercent(plan.cagr1Y)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] block uppercase">TER</span>
                  <span className="text-[#4B5563] font-semibold">{formatPercent(plan.expenseRatio, false)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setSelectedPlan(plan); setSuccessMsg(null); }}
              className="mt-5 w-full py-2 bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] transition-colors text-xs font-semibold uppercase tracking-wider text-[#111827] rounded-none"
            >
              Invest / Start SIP
            </button>
          </div>
        ))}
      </div>

      {/* Investment Slide-Over Sheet */}
      <SlideOverSheet
        isOpen={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.name || 'Investment Plan'}
        subtitle={`Current NAV: ${formatPaise(selectedPlan?.navPaise)} | Min: ₹${(selectedPlan?.minInvestmentPaise || 50000) / 100}`}
      >
        {selectedPlan && (
          <form onSubmit={(e) => { e.preventDefault(); investMutation.mutate(); }} className="space-y-4">
            <div className="flex border-b border-[#E5E4DF]">
              <button
                type="button"
                onClick={() => setMode('LUMP_SUM')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 ${mode === 'LUMP_SUM' ? 'border-[#1E3A8A] text-[#111827]' : 'border-transparent text-[#9CA3AF]'}`}
              >
                One-Time Lump Sum
              </button>
              <button
                type="button"
                onClick={() => setMode('SIP')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 ${mode === 'SIP' ? 'border-[#1E3A8A] text-[#111827]' : 'border-transparent text-[#9CA3AF]'}`}
              >
                Recurring Step-Up SIP
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                Investment Amount (₹)
              </label>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E4DF] text-sm font-mono tabular-nums text-[#111827] rounded-none"
              />
            </div>

            {mode === 'SIP' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                    Monthly Debit Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={debitDay}
                    onChange={(e) => setDebitDay(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E4DF] text-xs font-mono tabular-nums text-[#111827] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                    Annual Step-Up (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stepUpPct}
                    onChange={(e) => setStepUpPct(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E4DF] text-xs font-mono tabular-nums text-[#111827] rounded-none"
                  />
                </div>
              </div>
            )}

            {investMutation.isError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#991B1B] text-[#991B1B] text-xs">
                {investMutation.error?.response?.data?.detail || investMutation.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={investMutation.isPending}
              className="w-full mt-4 py-2.5 bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111827] transition-colors rounded-none disabled:opacity-50"
            >
              {investMutation.isPending ? 'Processing Order...' : mode === 'LUMP_SUM' ? 'Confirm One-Time Purchase' : 'Bind Step-Up SIP Mandate'}
            </button>
          </form>
        )}
      </SlideOverSheet>
    </div>
  );
}

