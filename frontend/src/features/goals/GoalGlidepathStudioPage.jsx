import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { goalKeys, portfolioKeys } from '../../lib/queryClient';
import { formatPaise, formatPercent, formatDate } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import ActionableEmptyState from '../../components/ui/ActionableEmptyState';
import InfoTooltip from '../../components/ui/InfoTooltip';
import AddGoalSheet from './AddGoalSheet';
import TopUpGoalModal from './TopUpGoalModal';
import { Plus, Trash2, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function GoalGlidepathStudioPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [topUpGoal, setTopUpGoal] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: goalKeys.list(),
    queryFn: async () => (await apiClient.get('/goals')).data?.data?.goals || [],
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: goalKeys.list() });
    queryClient.invalidateQueries({ queryKey: portfolioKeys.summary() });
  };

  const createGoalMutation = useMutation({
    mutationFn: async (payload) => (await apiClient.post('/goals', payload)).data,
    onSuccess: () => { refreshAll(); setIsSheetOpen(false); },
  });

  const topUpMutation = useMutation({
    mutationFn: async ({ id, amountPaise }) =>
      (await apiClient.post(`/goals/${id}/top-up`, { amountPaise })).data,
    onSuccess: (res) => { setFeedback(res.message); refreshAll(); setTopUpGoal(null); },
  });

  const rebalanceMutation = useMutation({
    mutationFn: async (id) => (await apiClient.post(`/goals/${id}/rebalance`)).data,
    onSuccess: (res) => { setFeedback(res.message); refreshAll(); },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => { await apiClient.delete(`/goals/${id}`); },
    onSuccess: () => refreshAll(),
  });

  return (
    <div>
      <EditorialHeader
        title="Goal Glidepath & Monte Carlo Studio"
        subtitle="Dynamic inflation indexation, 1,000-run stochastic probability modeling, and automated asset de-risking."
      >
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="px-3.5 py-1.5 bg-[#1E3A8A] text-white text-xs font-mono font-medium uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Goal</span>
        </button>
      </EditorialHeader>

      {feedback && (
        <div className="mb-4 p-3 bg-[#F0FDF4] border border-[#0F5132] text-[#0F5132] text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#9CA3AF]">Loading glidepaths...</div>
        ) : goals.length === 0 ? (
          <ActionableEmptyState
            title="No Financial Goals Defined"
            description="Calibrate target corpuses with dynamic inflation modeling, Monte Carlo risk bounds, and glidepath de-risking."
            actionLabel="+ Establish Target Goal"
            onAction={() => setIsSheetOpen(true)}
          />
        ) : (
          goals.map((g) => {
            const isPreservation = g.glidepath?.isWithinDeRiskingWindow;
            return (
              <div key={g._id} className="border border-[#E5E4DF] bg-white p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E5E4DF] gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
                      {g.category} • Target Horizon: {formatDate(g.targetDate)} ({g.glidepath?.yearsRemaining}y)
                    </span>
                    <h3 className="text-lg font-serif font-medium text-[#111827]">{g.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 border text-[10px] font-mono uppercase font-semibold bg-[#F0FDF4] text-[#0F5132] border-[#0F5132]">
                      {g.simulation?.healthStatus?.replace('_', ' ')} ({g.simulation?.probabilityScore}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Delete goal "${g.title}"?`)) deleteGoalMutation.mutate(g._id); }}
                      className="p-1 text-[#9CA3AF] hover:text-[#991B1B]"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-[#E5E4DF] text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Current Corpus</span>
                    <span className="font-semibold text-[#111827]">{formatPaise(g.currentCorpusPaise)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Inflation Target</span>
                    <span className="font-semibold text-[#111827]">{formatPaise(g.glidepath?.adjustedTargetCorpusPaise)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Sector CPI</span>
                    <span className="text-[#4B5563]">{formatPercent(g.glidepath?.inflationRate, false)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Req. Monthly SIP</span>
                    <span className="font-semibold text-[#1E3A8A]">{formatPaise(g.glidepath?.requiredMonthlySavingsPaise)}</span>
                  </div>
                </div>

                <div className="py-3 border-b border-[#E5E4DF]">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#4B5563] mb-1.5">
                    <span className="inline-flex items-center">
                      Monte Carlo Projection (1,000 runs)
                      <InfoTooltip termKey="P10_P50_P90" />
                    </span>
                    <span className="text-[#9CA3AF]">Brownian Motion</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums bg-[#FAF9F5] p-2.5 border border-[#E5E4DF]">
                    <div>
                      <span className="text-[10px] text-[#9CA3AF] block uppercase">P10 Bear</span>
                      <span className="text-[#B45309] font-medium">{formatPaise(g.simulation?.p10ConservativePaise)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9CA3AF] block uppercase">P50 Median</span>
                      <span className="text-[#111827] font-semibold">{formatPaise(g.simulation?.p50MedianPaise)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9CA3AF] block uppercase">P90 Bull</span>
                      <span className="text-[#0F5132] font-medium">{formatPaise(g.simulation?.p90OptimisticPaise)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[11px] text-[#4B5563]">Target Glidepath:</span>
                    <span className="font-semibold text-[#111827]">
                      {g.glidepath?.recommendedAssetAllocation?.equityPercent}% Eq / {g.glidepath?.recommendedAssetAllocation?.debtPercent}% Debt
                    </span>
                    {isPreservation && (
                      <span className="px-1.5 py-0.5 bg-[#FFFBEB] text-[#B45309] text-[9px] uppercase border border-[#B45309]">Preservation</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTopUpGoal(g)}
                      className="px-2.5 py-1 text-[10px] font-mono uppercase border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-colors"
                    >
                      + Top-Up
                    </button>
                    <Link
                      to="/marketplace"
                      className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[#1E3A8A] text-white hover:bg-[#111827] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Start SIP</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => rebalanceMutation.mutate(g._id)}
                      disabled={rebalanceMutation.isPending}
                      className="px-2.5 py-1 text-[10px] font-mono uppercase border border-[#B45309] text-[#B45309] hover:bg-[#B45309] hover:text-white transition-colors inline-flex items-center gap-1"
                      title="De-risk to Safe Sovereign Debt"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Rebalance</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TopUpGoalModal
        goal={topUpGoal}
        onClose={() => setTopUpGoal(null)}
        onConfirm={(id, amountPaise) => topUpMutation.mutate({ id, amountPaise })}
        isPending={topUpMutation.isPending}
      />

      <AddGoalSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={(payload) => createGoalMutation.mutate(payload)}
        isPending={createGoalMutation.isPending}
      />
    </div>
  );
}
