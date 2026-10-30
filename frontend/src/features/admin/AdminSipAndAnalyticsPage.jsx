import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatPaise, formatDate } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { Play, Download, AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function AdminSipAndAnalyticsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  const { data: sips = [], isLoading } = useQuery({
    queryKey: ['admin', 'sips', filter],
    queryFn: async () => (await apiClient.get(`/admin/sips?filter=${filter}`)).data?.data?.sips || [],
  });

  const batchMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/sips/batch-execute')).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sips'] });
    },
    onError: (err) => setFeedback({ type: 'error', message: err.message }),
  });

  const downloadReport = async (path, filename) => {
    try {
      const res = await apiClient.get(path, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setFeedback({ type: 'error', message: `Failed to download ${filename}.` });
    }
  };

  return (
    <div>
      <EditorialHeader
        title="Platform SIP Book & Regulatory Reporting Desk"
        subtitle="Automated recurring mandate monitoring, dunning safeguards, and 1-click institutional CSV data exports."
      >
        <button
          type="button"
          onClick={() => batchMutation.mutate()}
          disabled={batchMutation.isPending}
          className="px-3.5 py-1.5 bg-[#0F5132] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
        >
          <Play className={`w-3.5 h-3.5 ${batchMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Trigger Scheduled SIP Batch Now</span>
        </button>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Institutional Export Suite */}
      <div className="mb-6 p-4 bg-white border border-[#E5E4DF]">
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#111827] block mb-3">
          Institutional Regulatory Reporting & Audit Exports (CSV)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => downloadReport('/admin/reports/users', 'investor-register')}
            className="p-2.5 border border-[#E5E4DF] hover:border-[#1E3A8A] bg-[#FAF9F5] flex items-center justify-between text-left"
          >
            <div>
              <span className="text-xs font-mono font-semibold text-[#111827] block">Investor Register</span>
              <span className="text-[10px] text-[#6B7280]">KYC & Balances</span>
            </div>
            <Download className="w-4 h-4 text-[#1E3A8A]" />
          </button>

          <button
            type="button"
            onClick={() => downloadReport('/admin/reports/ledger', 'master-ledger')}
            className="p-2.5 border border-[#E5E4DF] hover:border-[#1E3A8A] bg-[#FAF9F5] flex items-center justify-between text-left"
          >
            <div>
              <span className="text-xs font-mono font-semibold text-[#111827] block">Double-Entry Journal</span>
              <span className="text-[10px] text-[#6B7280]">All Debit / Credit Legs</span>
            </div>
            <Download className="w-4 h-4 text-[#1E3A8A]" />
          </button>

          <button
            type="button"
            onClick={() => downloadReport('/admin/reports/holdings', 'aum-holdings')}
            className="p-2.5 border border-[#E5E4DF] hover:border-[#1E3A8A] bg-[#FAF9F5] flex items-center justify-between text-left"
          >
            <div>
              <span className="text-xs font-mono font-semibold text-[#111827] block">AUM Holdings</span>
              <span className="text-[10px] text-[#6B7280]">Units & Mark-to-Market</span>
            </div>
            <Download className="w-4 h-4 text-[#1E3A8A]" />
          </button>

          <button
            type="button"
            onClick={() => downloadReport('/admin/reports/audit-logs', 'master-audit-trail')}
            className="p-2.5 border border-[#E5E4DF] hover:border-[#1E3A8A] bg-[#FAF9F5] flex items-center justify-between text-left"
          >
            <div>
              <span className="text-xs font-mono font-semibold text-[#111827] block">Audit Trail</span>
              <span className="text-[10px] text-[#6B7280]">Immutable Activity Logs</span>
            </div>
            <Download className="w-4 h-4 text-[#1E3A8A]" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#E5E4DF] mb-4 space-x-3">
        {[
          { key: 'ALL', label: 'All Scheduled Mandates' },
          { key: 'DUE_7_DAYS', label: 'Due in Next 7 Days' },
          { key: 'LOW_BALANCE', label: 'Insufficient Wallet Balance' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
              filter === t.key ? 'border-[#1E3A8A] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SIP Mandates Table */}
      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] uppercase font-semibold text-[#4B5563]">
              <th className="py-2.5 px-3">Investor</th>
              <th className="py-2.5 px-3">Target Scheme</th>
              <th className="py-2.5 px-3 text-right">Commitment</th>
              <th className="py-2.5 px-3 text-center">Next Debit</th>
              <th className="py-2.5 px-3 text-right">Wallet Available</th>
              <th className="py-2.5 px-3 text-center">Solvency Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-[#9CA3AF]">Scanning mandate schedules...</td></tr>
            ) : sips.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-[#9CA3AF]">Zero mandates found under this filter.</td></tr>
            ) : (
              sips.map((s) => (
                <tr key={s._id} className="hover:bg-[#FAF9F5]">
                  <td className="py-2.5 px-3">
                    <div className="font-sans font-medium text-[#111827]">{s.user?.firstName} {s.user?.lastName}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{s.user?.email}</div>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-[#111827]">{s.plan?.name}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#111827]">{formatPaise(s.amountPaise)}/mo</td>
                  <td className="py-2.5 px-3 text-center text-[#6B7280]">{formatDate(s.nextExecutionDate)}</td>
                  <td className="py-2.5 px-3 text-right text-[#4B5563]">{formatPaise(s.user?.walletBalancePaise)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold ${
                      !s.isLowBalance ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FEF2F2] text-[#991B1B] font-bold'
                    }`}>
                      {!s.isLowBalance ? 'FUNDED' : 'LOW BALANCE'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

