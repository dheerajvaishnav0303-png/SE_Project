import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { transactionKeys, portfolioKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/authStore';
import { formatPaise, formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';
import ActionableEmptyState from '../../components/ui/ActionableEmptyState';
import DepositWithdrawDrawer from './DepositWithdrawDrawer';
import { PlusCircle, ArrowUpRight, CheckCircle2, Download, RotateCcw } from 'lucide-react';

export default function DoubleEntryLedgerPage() {
  const queryClient = useQueryClient();
  const { user, fetchMe } = useAuthStore();
  const [sheetMode, setSheetMode] = useState(null);
  const [amountRupees, setAmountRupees] = useState('10000');
  const [mfaToken, setMfaToken] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { data: ledgerEntries = [], isLoading } = useQuery({
    queryKey: transactionKeys.ledger(),
    queryFn: async () => (await apiClient.get('/transactions/ledger')).data?.data?.entries || [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'list'],
    queryFn: async () => (await apiClient.get('/transactions')).data?.data?.transactions || [],
  });

  const pendingWithdrawals = transactions.filter(
    (t) => t.type === 'WITHDRAWAL' && t.status === 'LOCKED_IN_ESCROW'
  );

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.ledger() });
    queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    queryClient.invalidateQueries({ queryKey: portfolioKeys.summary() });
    fetchMe();
  };

  const transactionMutation = useMutation({
    mutationFn: async () => {
      const amountPaise = Math.round(parseFloat(amountRupees) * 100);
      if (sheetMode === 'DEPOSIT') {
        return (await apiClient.post('/transactions/deposit', { amountPaise })).data;
      }
      const headers = mfaToken ? { 'X-MFA-Token': mfaToken } : {};
      return (await apiClient.post('/transactions/withdraw', { amountPaise }, { headers })).data;
    },
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      refreshAll();
      setSheetMode(null);
      setAmountRupees('10000');
      setMfaToken('');
    },
    onError: (err) => setFeedback({ type: 'error', message: err.response?.data?.detail || err.message }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => (await apiClient.post(`/transactions/${id}/cancel-pending`)).data,
    onSuccess: (res) => { setFeedback({ type: 'success', message: res.message }); refreshAll(); },
  });

  const handleExportCsv = async () => {
    try {
      const res = await apiClient.get('/transactions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ips-ledger-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to generate statement CSV export.' });
    }
  };

  return (
    <div>
      <EditorialHeader
        title="Double-Entry Immutable Ledger"
        subtitle="Cryptographically verified balanced journal statement. Under GAAP rules, balances are derived projections."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setSheetMode('DEPOSIT'); setFeedback(null); }}
            className="px-3.5 py-1.5 bg-[#0F5132] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>
          <button
            type="button"
            onClick={() => { setSheetMode('WITHDRAW'); setFeedback(null); }}
            className="px-3.5 py-1.5 border border-[#991B1B] text-[#991B1B] text-xs font-mono uppercase tracking-wider hover:bg-[#991B1B] hover:text-white flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 border border-[#D1D5DB] text-[#4B5563] text-xs font-mono uppercase tracking-wider hover:bg-[#F3F4F6] flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {pendingWithdrawals.length > 0 && (
        <div className="mb-6 border border-[#B45309] bg-[#FFFBEB] p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#B45309] block mb-2">
            Pending Escrow Settlements Awaiting Clearance
          </span>
          <div className="space-y-2">
            {pendingWithdrawals.map((pw) => (
              <div key={pw._id} className="flex flex-wrap items-center justify-between text-xs font-mono gap-2 bg-white p-2.5 border border-[#E5E4DF]">
                <div>
                  <span className="font-semibold text-[#111827]">{formatPaise(pw.amountPaise)}</span>
                  <span className="text-[#6B7280] ml-2">Ref: {pw.transactionId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(pw._id)}
                  disabled={cancelMutation.isPending}
                  className="px-2.5 py-1 text-[10px] uppercase border border-[#991B1B] text-[#991B1B] hover:bg-[#991B1B] hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Cancel & Refund</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
              <th className="py-3 px-4">Timestamp (IST)</th>
              <th className="py-3 px-4">Transaction Ref</th>
              <th className="py-3 px-4">Account Type</th>
              <th className="py-3 px-4 text-center">Leg</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Balance After</th>
              <th className="py-3 px-4">Narration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-[#9CA3AF]">Loading ledger records...</td></tr>
            ) : ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <ActionableEmptyState
                    title="Immutable Journal Clear"
                    description="Deposit funds or execute investments to generate double-entry balanced debit/credit legs."
                    actionLabel="+ Deposit Funds"
                    onAction={() => setSheetMode('DEPOSIT')}
                  />
                </td>
              </tr>
            ) : (
              ledgerEntries.map((e, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F5]">
                  <td className="py-2.5 px-4 text-[11px] text-[#4B5563]">{formatDateTime(e.recordedAt)}</td>
                  <td className="py-2.5 px-4 text-[10px] text-[#9CA3AF] truncate max-w-[120px]">{e.transactionId}</td>
                  <td className="py-2.5 px-4 text-xs font-sans font-medium text-[#111827]">{e.accountType}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold ${e.direction === 'CREDIT' ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FEF2F2] text-[#991B1B]'}`}>
                      {e.direction}
                    </span>
                  </td>
                  <td className={`py-2.5 px-4 text-right font-semibold ${e.direction === 'CREDIT' ? 'text-[#0F5132]' : 'text-[#991B1B]'}`}>
                    {e.direction === 'CREDIT' ? '+' : '-'}{formatPaise(e.amountPaise)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#4B5563]">{formatPaise(e.balanceAfterPaise)}</td>
                  <td className="py-2.5 px-4 text-xs font-sans text-[#4B5563]">{e.narration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DepositWithdrawDrawer
        mode={sheetMode}
        onClose={() => setSheetMode(null)}
        walletBalancePaise={user?.walletBalancePaise}
        twoFactorEnabled={user?.twoFactorEnabled}
        amountRupees={amountRupees}
        setAmountRupees={setAmountRupees}
        mfaToken={mfaToken}
        setMfaToken={setMfaToken}
        onSubmit={(e) => {
          e.preventDefault();
          transactionMutation.mutate();
        }}
        isPending={transactionMutation.isPending}
      />
    </div>
  );
}
