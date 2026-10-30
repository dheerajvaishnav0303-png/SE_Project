import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { formatPaise, formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { MetricStrip } from '../../components/ui/MetricStrip';
import { 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Send
} from 'lucide-react';

export default function AdminOverviewPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);

  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: async () => (await apiClient.get('/admin/kpis')).data?.data,
  });

  const { data: reconData } = useQuery({
    queryKey: ['admin', 'reconciliation'],
    queryFn: async () => (await apiClient.get('/admin/reconciliation')).data?.data,
  });

  const mtmMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/run-mtm')).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => setFeedback({ type: 'error', message: err.message }),
  });

  const metrics = [
    { label: 'Platform Total AUM', value: formatPaise(kpiData?.totalAumPaise), subtext: 'Mark-to-Market', isHighlight: true },
    { label: 'Investor Wallet Liquidity', value: formatPaise(kpiData?.walletLiquidityPaise), subtext: 'User cash float' },
    { label: 'Funds in Escrow Hold', value: formatPaise(kpiData?.escrowLockedPaise), subtext: 'Maker-Checker queue', isWarning: (kpiData?.escrowLockedPaise || 0) > 0 },
    { label: 'Monthly SIP Commitment', value: formatPaise(kpiData?.activeMonthlySipBookPaise), subtext: 'Recurring pipeline' },
    {
      label: '30-Day Net Platform Flow',
      value: formatPaise(Math.abs(kpiData?.netMonthlyFlowPaise || 0)),
      subtext: (kpiData?.netMonthlyFlowPaise || 0) >= 0 ? 'Net Inflow (+)' : 'Net Outflow (-)',
      isPositive: (kpiData?.netMonthlyFlowPaise || 0) >= 0,
      isNegative: (kpiData?.netMonthlyFlowPaise || 0) < 0,
    },
  ];

  return (
    <div>
      <EditorialHeader
        title="Treasury Command & Platform Telemetry"
        subtitle="Real-time multi-asset solvency tracking, escrow monitoring, and double-entry ledger verification."
        date={`Updated ${formatDateTime(new Date())}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => mtmMutation.mutate()}
            disabled={mtmMutation.isPending}
            className="px-3 py-1.5 bg-[#0F5132] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${mtmMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{mtmMutation.isPending ? 'Recalculating...' : 'Run MTM Valuation Now'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/system')}
            className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#111827] text-xs font-mono uppercase tracking-wider hover:bg-[#F3F4F6] flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-6 p-3.5 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Primary Financial Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Operations Action Required Queues */}
      <div className="my-8">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E4DF]">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#111827]">
            Immediate Action Required Operational Queues
          </span>
          <span className="text-[10px] font-mono text-[#9CA3AF]">Dual-Control Authorization</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/admin/settlements')}
            className="p-4 bg-white border border-[#E5E4DF] hover:border-[#1E3A8A] transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B45309] font-semibold block">
                Pending Settlements
              </span>
              <div className="text-xl font-mono tabular-nums font-bold text-[#111827] mt-1">
                {kpiData?.actionRequired?.pendingWithdrawalsCount || 0}
              </div>
              <span className="text-[11px] text-[#6B7280]">Awaiting Maker-Checker authorization</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>

          <div
            onClick={() => navigate('/admin/users')}
            className="p-4 bg-white border border-[#E5E4DF] hover:border-[#1E3A8A] transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase text-[#1E3A8A] font-semibold block">
                KYC Verification Requests
              </span>
              <div className="text-xl font-mono tabular-nums font-bold text-[#111827] mt-1">
                {kpiData?.actionRequired?.pendingKycCount || 0}
              </div>
              <span className="text-[11px] text-[#6B7280]">Investors awaiting PAN compliance review</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>

          <div
            onClick={() => navigate('/admin/analytics')}
            className="p-4 bg-white border border-[#E5E4DF] hover:border-[#1E3A8A] transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase text-[#0F5132] font-semibold block">
                Active Folio Accounts
              </span>
              <div className="text-xl font-mono tabular-nums font-bold text-[#111827] mt-1">
                {kpiData?.totalUsers || 0}
              </div>
              <span className="text-[11px] text-[#6B7280]">Registered investor profiles</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </div>
      </div>

      {/* Double-Entry Mathematical Reconciliation Card */}
      <div className="p-5 bg-white border border-[#E5E4DF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E4DF] gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
            <h3 className="text-xs font-mono uppercase font-semibold text-[#111827]">
              Zero-Float Double-Entry Ledger Invariance Proof
            </h3>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-semibold ${reconData?.isBalanced ? 'bg-[#F0FDF4] text-[#0F5132] border border-[#0F5132]' : 'bg-[#FEF2F2] text-[#991B1B]'}`}>
            {reconData?.isBalanced ? 'Mathematically Balanced (0.00 Variance)' : 'Reconciliation Discrepancy'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono tabular-nums">
          <div>
            <span className="text-[10px] text-[#9CA3AF] block uppercase">Cumulative Debits</span>
            <span className="font-semibold text-[#111827]">{formatPaise(reconData?.totalDebitsPaise)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9CA3AF] block uppercase">Cumulative Credits</span>
            <span className="font-semibold text-[#111827]">{formatPaise(reconData?.totalCreditsPaise)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9CA3AF] block uppercase">Discrepancy / Drift</span>
            <span className="font-semibold text-[#0F5132]">{formatPaise(reconData?.variancePaise || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9CA3AF] block uppercase">Journal Legs</span>
            <span className="text-[#4B5563]">{reconData?.totalJournalLegs || 0} immutable entries</span>
          </div>
        </div>
      </div>
    </div>
  );
}

