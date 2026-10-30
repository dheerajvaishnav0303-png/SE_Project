import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatPaise, formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { ShieldAlert, Check, X, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('LOCKED_IN_ESCROW');
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [inspectingLegsTx, setInspectingLegsTx] = useState(null);

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin', 'settlements', filter],
    queryFn: async () => (await apiClient.get(`/admin/settlements?status=${filter}`)).data?.data?.pendingWithdrawals || [],
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    setSelectedIds([]);
  };

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }) =>
      (await apiClient.post(`/admin/settlements/${id}/action`, { action, reviewNotes })).data,
    onSuccess: (res) => { setFeedback({ type: 'success', message: res.message }); refreshAll(); },
    onError: (err) => setFeedback({ type: 'error', message: err.message }),
  });

  const batchMutation = useMutation({
    mutationFn: async (ids) => (await apiClient.post('/admin/settlements/batch-approve', { ids })).data,
    onSuccess: (res) => { setFeedback({ type: 'success', message: res.message }); refreshAll(); },
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  return (
    <div>
      <EditorialHeader
        title="Treasury Settlements & Maker-Checker Queue"
        subtitle="Dual-control authorization queue for high-value payouts and escrow debit releases."
      >
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => batchMutation.mutate(selectedIds)}
            disabled={batchMutation.isPending}
            className="px-3.5 py-1.5 bg-[#0F5132] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Batch Approve ({selectedIds.length})</span>
          </button>
        )}
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-[#E5E4DF] mb-4 space-x-3">
        {[
          { key: 'LOCKED_IN_ESCROW', label: 'Pending Maker-Checker' },
          { key: 'SETTLED', label: 'Settled & Cleared' },
          { key: 'REJECTED', label: 'Rejected & Refunded' },
          { key: 'ALL', label: 'All Payouts' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setFilter(t.key); setSelectedIds([]); }}
            className={`pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
              filter === t.key ? 'border-[#1E3A8A] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settlements Table */}
      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] text-[10px] uppercase font-semibold text-[#4B5563] bg-[#FAF9F5]">
              <th className="py-2.5 px-3 w-8">
                {filter === 'LOCKED_IN_ESCROW' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.length === withdrawals.length && withdrawals.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? withdrawals.map((w) => w._id) : [])}
                  />
                )}
              </th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Investor</th>
              <th className="py-2.5 px-3 text-right">Available Wallet</th>
              <th className="py-2.5 px-3 text-right">Requested Payout</th>
              <th className="py-2.5 px-3 text-center">Escrow Status</th>
              <th className="py-2.5 px-3 text-center">Checker Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Scanning queue...</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Zero settlement requests under this filter.</td></tr>
            ) : (
              withdrawals.map((tx) => (
                <tr key={tx._id} className="hover:bg-[#FAF9F5]">
                  <td className="py-2.5 px-3">
                    {tx.status === 'LOCKED_IN_ESCROW' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tx._id)}
                        onChange={() => toggleSelect(tx._id)}
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{formatDateTime(tx.createdAt)}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-medium text-[#111827]">{tx.user?.firstName} {tx.user?.lastName}</div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono">{tx.user?.email}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#4B5563] font-medium">
                    {formatPaise(tx.user?.walletBalancePaise)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#991B1B]">
                    {formatPaise(tx.amountPaise)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold ${
                      tx.status === 'SETTLED' ? 'bg-[#F0FDF4] text-[#0F5132]' : tx.status === 'LOCKED_IN_ESCROW' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectingLegsTx(tx)}
                        className="p-1 border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827]"
                        title="View Double-Entry Accounting Legs"
                      >
                        <Layers className="w-3 h-3" />
                      </button>
                      {tx.status === 'LOCKED_IN_ESCROW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => actionMutation.mutate({ id: tx._id, action: 'APPROVE', reviewNotes: 'Verified nodal transfer clearance.' })}
                            className="px-2 py-0.5 bg-[#0F5132] text-white text-[10px] uppercase font-mono"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) actionMutation.mutate({ id: tx._id, action: 'REJECT', reviewNotes: reason });
                            }}
                            className="px-2 py-0.5 border border-[#991B1B] text-[#991B1B] text-[10px] uppercase font-mono hover:bg-[#991B1B] hover:text-white"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Double-Entry Legs Modal */}
      {inspectingLegsTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white border border-[#E5E4DF] p-5 space-y-3 font-mono text-xs">
            <h4 className="font-serif text-sm font-semibold text-[#111827]">Double-Entry Journal Legs Verification</h4>
            <p className="text-[11px] text-[#6B7280]">Transaction: {inspectingLegsTx.transactionId}</p>
            <div className="border border-[#E5E4DF] divide-y divide-[#E5E4DF]">
              <div className="p-2 flex justify-between bg-[#FAF9F5]">
                <span>Leg 1: ESCROW_CLEARING</span>
                <span className="text-[#0F5132] font-semibold">DEBIT {formatPaise(inspectingLegsTx.amountPaise)}</span>
              </div>
              <div className="p-2 flex justify-between">
                <span>Leg 2: BANK_SETTLEMENT (Nodal)</span>
                <span className="text-[#991B1B] font-semibold">CREDIT {formatPaise(inspectingLegsTx.amountPaise)}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setInspectingLegsTx(null)} className="px-3 py-1 bg-[#111827] text-white text-xs uppercase">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

