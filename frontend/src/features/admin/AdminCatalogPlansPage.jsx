import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatPaise, formatPercent } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';
import { Plus, Edit2, Users, PauseCircle, PlayCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function AdminCatalogPlansPage() {
  const queryClient = useQueryClient();
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [navModalPlan, setNavModalPlan] = useState(null);
  const [newNavRupees, setNewNavRupees] = useState('');
  const [holdersModalPlan, setHoldersModalPlan] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Form State for New Plan
  const [form, setForm] = useState({
    name: '', category: 'EQUITY', subCategory: 'Flexi Cap', riskLevel: 'HIGH',
    navRupees: '100', amc: 'Direct Asset Management', benchmarkIndex: 'NIFTY 50 TRI',
    expenseRatio: '0.005', eqWeight: '70', debtWeight: '20', goldWeight: '10', cashWeight: '0',
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => (await apiClient.get('/investments')).data?.data?.plans || [],
  });

  const { data: holdersData } = useQuery({
    queryKey: ['admin', 'planHolders', holdersModalPlan?._id],
    queryFn: async () => (await apiClient.get(`/admin/plans/${holdersModalPlan._id}/holders`)).data?.data,
    enabled: Boolean(holdersModalPlan),
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      const eq = parseInt(form.eqWeight, 10) || 0;
      const debt = parseInt(form.debtWeight, 10) || 0;
      const gold = parseInt(form.goldWeight, 10) || 0;
      const cash = parseInt(form.cashWeight, 10) || 0;
      if (eq + debt + gold + cash !== 100) throw new Error(`Asset weights must sum to 100% (currently ${eq + debt + gold + cash}%).`);

      return (await apiClient.post('/admin/plans', {
        name: form.name,
        category: form.category,
        subCategory: form.subCategory,
        riskLevel: form.riskLevel,
        navPaise: Math.round(parseFloat(form.navRupees) * 100),
        amc: form.amc,
        benchmarkIndex: form.benchmarkIndex,
        expenseRatio: parseFloat(form.expenseRatio),
        assetWeights: { equity: eq, debt, gold, cash },
      })).data;
    },
    onSuccess: () => { setFeedback({ type: 'success', message: 'New investment plan published.' }); refreshAll(); setIsPublishOpen(false); },
    onError: (err) => setFeedback({ type: 'error', message: err.response?.data?.message || err.message }),
  });

  const navMutation = useMutation({
    mutationFn: async ({ id, navPaise }) =>
      (await apiClient.patch(`/admin/plans/${id}/nav`, { navPaise })).data,
    onSuccess: (res) => { setFeedback({ type: 'success', message: res.message }); refreshAll(); setNavModalPlan(null); },
  });

  const inflowMutation = useMutation({
    mutationFn: async (id) => (await apiClient.patch(`/admin/plans/${id}/inflow`)).data,
    onSuccess: (res) => { setFeedback({ type: 'success', message: res.message }); refreshAll(); },
  });

  return (
    <div>
      <EditorialHeader
        title="Investment Catalog & NAV Lifecycle Manager"
        subtitle="Direct mutual funds, index funds, and gold bullion. Safe soft-close controls protect investor holdings."
      >
        <button
          type="button"
          onClick={() => setIsPublishOpen(true)}
          className="px-3.5 py-1.5 bg-[#1E3A8A] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Publish New Scheme</span>
        </button>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Plans Table */}
      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] uppercase font-semibold text-[#4B5563]">
              <th className="py-2.5 px-3">Plan Name</th>
              <th className="py-2.5 px-3">Asset Class</th>
              <th className="py-2.5 px-3 text-right">Current NAV</th>
              <th className="py-2.5 px-3 text-right">TER</th>
              <th className="py-2.5 px-3 text-center">Inflow Status</th>
              <th className="py-2.5 px-3 text-center">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {plans.map((p) => (
              <tr key={p._id} className="hover:bg-[#FAF9F5]">
                <td className="py-2.5 px-3">
                  <div className="font-sans font-medium text-[#111827]">{p.name}</div>
                  <div className="text-[10px] text-[#9CA3AF]">{p.amc} • {p.benchmarkIndex}</div>
                </td>
                <td className="py-2.5 px-3 text-[11px] text-[#4B5563]">{p.category} ({p.subCategory})</td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#111827]">{formatPaise(p.navPaise)}</td>
                <td className="py-2.5 px-3 text-right text-[#4B5563]">{formatPercent(p.expenseRatio, false)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold ${p.allowNewInflows !== false ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FFFBEB] text-[#B45309]'}`}>
                    {p.allowNewInflows !== false ? 'OPEN' : 'SOFT_CLOSED'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setNavModalPlan(p); setNewNavRupees((p.navPaise / 100).toString()); }}
                      className="px-2 py-0.5 border border-[#1E3A8A] text-[#1E3A8A] text-[10px] uppercase font-mono hover:bg-[#1E3A8A] hover:text-white"
                      title="Update Live NAV & Recalculate Portfolio Values"
                    >
                      Update NAV
                    </button>
                    <button
                      type="button"
                      onClick={() => inflowMutation.mutate(p._id)}
                      className="p-1 border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827]"
                      title={p.allowNewInflows !== false ? 'Pause New Inflows' : 'Resume Inflows'}
                    >
                      {p.allowNewInflows !== false ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5 text-[#0F5132]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoldersModalPlan(p)}
                      className="p-1 border border-[#D1D5DB] text-[#4B5563] hover:text-[#1E3A8A]"
                      title="Inspect Plan Holders"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update NAV Modal */}
      {navModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navMutation.mutate({ id: navModalPlan._id, navPaise: Math.round(parseFloat(newNavRupees) * 100) });
            }}
            className="w-full max-w-sm bg-white border border-[#E5E4DF] p-5 space-y-3 font-mono text-xs"
          >
            <h4 className="font-serif text-sm font-semibold text-[#111827]">Update NAV & Recalculate Holders</h4>
            <p className="text-[11px] text-[#6B7280]">{navModalPlan.name}</p>
            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase mb-1">New Unit Price (₹)</label>
              <input type="number" step="0.01" min="0.01" required value={newNavRupees} onChange={(e) => setNewNavRupees(e.target.value)} className="w-full px-2.5 py-1.5 border border-[#D1D5DB] text-sm font-bold" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNavModalPlan(null)} className="px-2.5 py-1 border border-[#D1D5DB]">Cancel</button>
              <button type="submit" disabled={navMutation.isPending} className="px-2.5 py-1 bg-[#1E3A8A] text-white uppercase">Recalculate</button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Holders Drawer */}
      <SlideOverSheet isOpen={Boolean(holdersModalPlan)} onClose={() => setHoldersModalPlan(null)} title="Scheme Investors & AUM Share" subtitle={holdersModalPlan?.name}>
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E4DF] flex justify-between">
            <span>Total Scheme AUM:</span>
            <span className="font-bold text-[#111827]">{formatPaise(holdersData?.totalAumPaise)}</span>
          </div>
          <div className="border border-[#E5E4DF]">
            <table className="w-full text-left text-[11px] tabular-nums">
              <thead className="bg-[#FAF9F5] border-b border-[#E5E4DF] uppercase">
                <tr><th className="py-1.5 px-2">Investor</th><th className="py-1.5 px-2 text-right">Value</th><th className="py-1.5 px-2 text-right">AUM Share</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF]">
                {holdersData?.holders?.map((h) => (
                  <tr key={h.holdingId}>
                    <td className="py-1.5 px-2 font-sans">{h.user?.firstName} {h.user?.lastName}</td>
                    <td className="py-1.5 px-2 text-right">{formatPaise(h.currentValuePaise)}</td>
                    <td className="py-1.5 px-2 text-right font-semibold text-[#1E3A8A]">{h.aumSharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SlideOverSheet>

      {/* Publish Plan Sheet */}
      <SlideOverSheet isOpen={isPublishOpen} onClose={() => setIsPublishOpen(false)} title="Publish New Scheme" subtitle="Allocation weights must sum to exactly 100%.">
        <form onSubmit={(e) => { e.preventDefault(); publishMutation.mutate(); }} className="space-y-3 font-mono text-xs">
          <div><label className="block uppercase text-[10px] mb-1">Scheme Name</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-2 py-1.5 border border-[#D1D5DB]" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block uppercase text-[10px] mb-1">Asset Class</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-2 py-1.5 border border-[#D1D5DB]"><option value="EQUITY">EQUITY</option><option value="DEBT">DEBT</option><option value="GOLD">GOLD</option></select></div>
            <div><label className="block uppercase text-[10px] mb-1">Initial NAV (₹)</label><input type="number" step="0.01" value={form.navRupees} onChange={(e) => setForm({ ...form, navRupees: e.target.value })} className="w-full px-2 py-1.5 border border-[#D1D5DB]" /></div>
          </div>
          <div><label className="block uppercase text-[10px] mb-1">Allocation Weights (Eq% / Debt% / Gold%)</label><div className="flex gap-2"><input type="number" placeholder="Eq%" value={form.eqWeight} onChange={(e) => setForm({ ...form, eqWeight: e.target.value })} className="flex-1 px-2 py-1 border border-[#D1D5DB]" /><input type="number" placeholder="Debt%" value={form.debtWeight} onChange={(e) => setForm({ ...form, debtWeight: e.target.value })} className="flex-1 px-2 py-1 border border-[#D1D5DB]" /><input type="number" placeholder="Gold%" value={form.goldWeight} onChange={(e) => setForm({ ...form, goldWeight: e.target.value })} className="flex-1 px-2 py-1 border border-[#D1D5DB]" /></div></div>
          <button type="submit" disabled={publishMutation.isPending} className="w-full mt-4 py-2 bg-[#1E3A8A] text-white uppercase font-bold">Publish to Catalog</button>
        </form>
      </SlideOverSheet>
    </div>
  );
}

