import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { portfolioKeys } from '../../lib/queryClient';
import { formatPaise, formatPercent, formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { MetricStrip } from '../../components/ui/MetricStrip';
import { StackedAllocationBar } from '../../components/ui/StackedAllocationBar';
import { PerformanceChart } from '../../components/charts/PerformanceChart';
import InfoTooltip from '../../components/ui/InfoTooltip';
import OnboardingChecklist from './OnboardingChecklist';
import { AlertTriangle, ArrowRight, Download } from 'lucide-react';

export default function ExecutiveLedgerPage() {
  const [dismissOnboarding, setDismissOnboarding] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: portfolioKeys.summary(),
    queryFn: async () => (await apiClient.get('/planner/summary')).data?.data,
  });

  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => (await apiClient.get('/auth/me')).data?.data?.user,
  });

  const handleDownloadCsv = async () => {
    try {
      const res = await apiClient.get('/transactions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ips-statement-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Unable to export transaction CSV statement.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-[#E5E4DF] animate-pulse w-1/4" />
        <div className="h-28 bg-[#E5E4DF] animate-pulse w-full" />
        <div className="h-80 bg-[#E5E4DF] animate-pulse w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#FEF2F2] border border-[#991B1B] text-[#991B1B] text-xs">
        Failed to load portfolio summary: {error.message}
      </div>
    );
  }

  const isNewUser = (data?.totalInvestedPaise || 0) === 0;
  const isKycComplete = userData?.kycStatus === 'VERIFIED';
  const isWalletFunded = (userData?.walletBalancePaise || 0) > 0;
  const isRiskProfiled = userData?.riskProfile && userData.riskProfile !== 'UNSPECIFIED';

  const onboardingSteps = [
    { id: 1, title: 'Profile Setup', done: !!userData?.firstName, path: '/settings' },
    { id: 2, title: 'KYC & Risk', done: isKycComplete || isRiskProfiled, path: '/security' },
    { id: 3, title: 'Fund Wallet', done: isWalletFunded, path: '/transactions' },
    { id: 4, title: 'First Investment', done: !isNewUser, path: '/marketplace' },
  ];

  const metrics = [
    {
      label: (
        <span className="inline-flex items-center">
          Total Net Worth
          <InfoTooltip termKey="TWR" title="Net Worth Telemetry" content="Consolidated mark-to-market portfolio value plus liquid wallet cash." />
        </span>
      ),
      value: formatPaise(data?.netWorthPaise),
      subtext: 'Cash + Market Value',
      isHighlight: true,
    },
    { label: 'Invested Capital', value: formatPaise(data?.totalInvestedPaise), subtext: 'Cost Basis' },
    { label: 'Current Valuation', value: formatPaise(data?.totalPortfolioValuePaise), subtext: 'Mark-to-Market' },
    {
      label: <span className="inline-flex items-center">True XIRR<InfoTooltip termKey="XIRR" /></span>,
      value: formatPercent(data?.xirr),
      subtext: `TWR: ${formatPercent(data?.twr)}`,
      isPositive: (data?.xirr || 0) >= 0,
      isNegative: (data?.xirr || 0) < 0,
    },
    {
      label: 'Unrealized Gain',
      value: formatPaise(data?.unrealizedPnlPaise),
      subtext: formatPercent(data?.totalInvestedPaise > 0 ? (data?.unrealizedPnlPaise || 0) / data?.totalInvestedPaise : 0),
      isPositive: (data?.unrealizedPnlPaise || 0) >= 0,
      isNegative: (data?.unrealizedPnlPaise || 0) < 0,
    },
  ];

  return (
    <div>
      <EditorialHeader
        title="Executive Wealth Ledger"
        subtitle="Consolidated multi-asset valuation statement and double-entry portfolio telemetry."
        date={`As of ${formatDateTime(new Date())}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/transactions" className="px-3 py-1.5 bg-[#0F5132] text-white text-xs font-mono font-medium uppercase hover:bg-[#111827]">
            + Add Money
          </Link>
          <Link to="/marketplace" className="px-3 py-1.5 bg-[#1E3A8A] text-white text-xs font-mono font-medium uppercase hover:bg-[#111827]">
            + Invest Now
          </Link>
          <Link to="/goals" className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#111827] text-xs font-mono font-medium uppercase hover:bg-[#F3F4F6]">
            + Create Goal
          </Link>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#4B5563] text-xs font-mono font-medium uppercase hover:text-[#111827] hover:bg-[#F3F4F6] inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Statement</span>
          </button>
        </div>
      </EditorialHeader>

      {isNewUser && !dismissOnboarding && (
        <OnboardingChecklist steps={onboardingSteps} onDismiss={() => setDismissOnboarding(true)} />
      )}

      <MetricStrip metrics={metrics} />
      <StackedAllocationBar allocation={data?.allocation} totalPaise={data?.netWorthPaise} />

      {data?.drift?.isDriftAlert && (
        <div className="mb-8 p-4 bg-[#FFFBEB] border border-[#B45309] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-semibold text-[#B45309] block uppercase tracking-wider">
              Asset Allocation Drift Detected
              <InfoTooltip termKey="DRIFT" />
            </span>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Equity has drifted by <strong className="text-[#111827] font-mono tabular-nums">{formatPercent(data?.drift?.equityDrift)}</strong> from target {data?.targetWeights?.equity * 100}%.
            </p>
          </div>
          <Link to="/sips" className="text-xs font-medium text-[#B45309] hover:underline flex items-center gap-1 shrink-0">
            Adjust SIPs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <PerformanceChart snapshots={data?.snapshots || []} height={320} />

      {data?.taxHarvestingSummary?.actionableLotsCount > 0 && (
        <div className="border border-[#E5E4DF] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#991B1B] font-semibold block mb-1">
              Fiscal Year-End Tax Optimization
              <InfoTooltip termKey="STCG" />
            </span>
            <h3 className="text-sm font-semibold text-[#111827]">
              {data.taxHarvestingSummary.actionableLotsCount} Lots eligible for Tax-Loss Harvesting
            </h3>
            <p className="text-xs text-[#4B5563] mt-0.5">
              Estimated achievable tax savings: <strong className="text-[#0F5132] font-mono tabular-nums">{formatPaise(data.taxHarvestingSummary.totalPotentialTaxSavingsPaise)}</strong>
            </p>
          </div>
          <Link
            to="/portfolio"
            className="px-3 py-1.5 border border-[#1E3A8A] text-[#1E3A8A] text-xs font-semibold uppercase hover:bg-[#1E3A8A] hover:text-white"
          >
            Inspect Lots in Portfolio
          </Link>
        </div>
      )}
    </div>
  );
}
