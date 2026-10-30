import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { investmentKeys, portfolioKeys } from '../../lib/queryClient';
import { formatPaise, formatPercent, formatUnits } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import ActionableEmptyState from '../../components/ui/ActionableEmptyState';
import InfoTooltip from '../../components/ui/InfoTooltip';
import RedeemDrawer from './RedeemDrawer';
import LinkToGoalModal from './LinkToGoalModal';
import MobileHoldingsList from './MobileHoldingsList';
import { CheckCircle2, Search, ArrowUpDown } from 'lucide-react';

export default function HoldingsAndXRayPage() {
  const queryClient = useQueryClient();
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [goalModalHolding, setGoalModalHolding] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('value');

  const { data: holdingsData = [], isLoading } = useQuery({
    queryKey: investmentKeys.holdings(),
    queryFn: async () => (await apiClient.get('/customer/investments')).data?.data?.holdings || [],
  });

  const { data: taxLotsData } = useQuery({
    queryKey: investmentKeys.taxLots(),
    queryFn: async () => (await apiClient.get('/customer/investments/tax-lots')).data?.data,
  });

  const { data: goalsList = [] } = useQuery({
    queryKey: ['goals', 'list'],
    queryFn: async () => (await apiClient.get('/goals')).data?.data?.goals || [],
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ planId, units }) =>
      (await apiClient.post('/customer/investments/redeem', { planId, units: parseFloat(units) })).data,
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      [investmentKeys.holdings(), portfolioKeys.summary(), investmentKeys.taxLots()].forEach((q) => queryClient.invalidateQueries({ queryKey: q }));
      setSelectedHolding(null);
    },
  });

  const linkGoalMutation = useMutation({
    mutationFn: async ({ holdingId, goalId }) =>
      (await apiClient.patch(`/customer/investments/${holdingId}/link-goal`, { goalId })).data,
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
      setGoalModalHolding(null);
    },
  });

  const filteredHoldings = useMemo(() => {
    if (!Array.isArray(holdingsData)) return [];
    return holdingsData
      .filter((inv) => {
        if (!inv) return false;
        const name = inv.plan?.name || '';
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === 'ALL' || inv.plan?.category === categoryFilter;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortKey === 'value') return (b.currentValuePaise || 0) - (a.currentValuePaise || 0);
        if (sortKey === 'gain') return (b.unrealizedPnlPaise || 0) - (a.unrealizedPnlPaise || 0);
        return (a.plan?.name || '').localeCompare(b.plan?.name || '');
      });
  }, [holdingsData, search, categoryFilter, sortKey]);

  return (
    <div>
      <EditorialHeader
        title="Holdings & Portfolio X-Ray"
        subtitle="Detailed security ledger with look-through holding decomposition and FIFO tax-lot tracking."
      />

      {successMsg && (
        <div className="mb-4 p-3 bg-[#F0FDF4] border border-[#0F5132] text-[#0F5132] text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-3 border border-[#E5E4DF]">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search holdings..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-[#D1D5DB] focus:outline-none focus:border-[#1E3A8A] font-sans"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'EQUITY', 'DEBT', 'HYBRID', 'GOLD'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                categoryFilter === cat ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#4B5563] border-[#D1D5DB] hover:bg-[#F3F4F6]'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSortKey(sortKey === 'value' ? 'gain' : sortKey === 'gain' ? 'name' : 'value')}
            className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] inline-flex items-center gap-1"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Sort: {sortKey}</span>
          </button>
        </div>
      </div>

      {/* Responsive Ledger Presentation: Mobile Dual-Mode List + Desktop Broadsheet */}
      {!isLoading && filteredHoldings.length > 0 && (
        <MobileHoldingsList
          holdings={filteredHoldings}
          onRedeem={(inv) => { setSelectedHolding(inv); setSuccessMsg(null); }}
          onLinkGoal={(inv) => setGoalModalHolding(inv)}
        />
      )}

      {/* Desktop Data Table */}
      <div className="hidden md:block border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
              <th className="py-3 px-4">Security / Fund</th>
              <th className="py-3 px-4 text-right">Units</th>
              <th className="py-3 px-4 text-right">Cost NAV</th>
              <th className="py-3 px-4 text-right">Live NAV</th>
              <th className="py-3 px-4 text-right">Invested</th>
              <th className="py-3 px-4 text-right">Current Value</th>
              <th className="py-3 px-4 text-right">
                <span className="inline-flex items-center justify-end">
                  Gain / Return
                  <InfoTooltip termKey="STCG" />
                </span>
              </th>
              <th className="py-3 px-4 text-center">Row Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] text-xs">
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-[#9CA3AF] font-mono">Loading records...</td></tr>
            ) : filteredHoldings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <ActionableEmptyState
                    title="No Matching Holdings Recorded"
                    description="No securities matching criteria are currently active in your portfolio."
                    actionLabel="Explore Investment Catalog"
                    onAction={() => window.location.assign('/marketplace')}
                  />
                </td>
              </tr>
            ) : (
              filteredHoldings.map((inv) => {
                const isGain = inv.unrealizedPnlPaise >= 0;
                return (
                  <tr key={inv._id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#111827]">{inv.plan?.name}</div>
                      <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-2 mt-0.5">
                        <span>{inv.folioNumber}</span>
                        <span>•</span>
                        <span>{inv.plan?.category}</span>
                        {inv.linkedGoal && (
                          <span className="text-[#1E3A8A] font-semibold">★ {inv.linkedGoal?.title || 'Linked Goal'}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111827]">{formatUnits(inv.units)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#4B5563]">
                      {parseFloat(inv.units) > 0 ? formatPaise(Math.round(inv.investedPaise / parseFloat(inv.units))) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111827]">{formatPaise(inv.plan?.navPaise)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#4B5563]">{formatPaise(inv.investedPaise)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">{formatPaise(inv.currentValuePaise)}</td>
                    <td className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${isGain ? 'text-[#0F5132]' : 'text-[#991B1B]'}`}>
                      <div>{formatPaise(inv.unrealizedPnlPaise)}</div>
                      <div className="text-[10px]">{formatPercent(inv.returnsPercentage / 100)}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/marketplace`}
                          className="px-2 py-0.5 text-[10px] font-mono uppercase border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-colors"
                        >
                          + Invest
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setSelectedHolding(inv); setSuccessMsg(null); }}
                          className="px-2 py-0.5 text-[10px] font-mono uppercase border border-[#E5E4DF] hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors"
                        >
                          Redeem
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoalModalHolding(inv)}
                          className="px-2 py-0.5 text-[10px] font-mono uppercase border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827]"
                        >
                          Link Goal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedHolding && (
        <RedeemDrawer
          holding={selectedHolding}
          taxLots={taxLotsData}
          onClose={() => { setSelectedHolding(null); setSuccessMsg(null); }}
          onRedeem={(data) => redeemMutation.mutate(data)}
          isPending={redeemMutation.isPending}
        />
      )}

      {goalModalHolding && (
        <LinkToGoalModal
          holding={goalModalHolding}
          goals={goalsList}
          onClose={() => setGoalModalHolding(null)}
          onSave={(holdingId, goalId) => linkGoalMutation.mutate({ holdingId, goalId })}
          isPending={linkGoalMutation.isPending}
        />
      )}
    </div>
  );
}
