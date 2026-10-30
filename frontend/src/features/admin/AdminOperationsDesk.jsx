import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { adminKeys } from '../../lib/queryClient';
import { formatPaise, formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { MetricStrip } from '../../components/ui/MetricStrip';
import { ShieldAlert, Check, X, CheckCircle2, RefreshCw, Users } from 'lucide-react';

export default function AdminOperationsDesk() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [rejectingTx, setRejectingTx] = useState(null);
  const [rejectReason, setRejectReason] = useState('Compliance KYC mismatch');
  const [activeTab, setActiveTab] = useState('SETTLEMENTS');

  const { data: kpiData } = useQuery({
    queryKey: adminKeys.kpis(),
    queryFn: async () => (await apiClient.get('/admin/kpis')).data?.data,
  });

  const { data: settlementsData = [], isLoading } = useQuery({
    queryKey: adminKeys.settlements(),
    queryFn: async () => (await apiClient.get('/admin/settlements')).data?.data?.pendingWithdrawals || [],
  });

  const { data: usersData = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await apiClient.get('/admin/users')).data?.data?.users || [],
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.settlements() });
    queryClient.invalidateQueries({ queryKey: adminKeys.kpis() });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const mtmMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/run-mtm')).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      refreshAll();
    },
  });

  const settlementMutation = useMutation({
    mutationFn: async ({ id, action, reviewNotes }) =>
      (await apiClient.post(`/admin/settlements/${id}/action`, { action, reviewNotes })).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      refreshAll();
      setRejectingTx(null);
    },
  });

  const kycMutation = useMutation({
    mutationFn: async ({ id, kycStatus }) =>
      (await apiClient.patch(`/admin/users/${id}/kyc`, { kycStatus })).data,
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'User KYC status updated.' });
      refreshAll();
    },
  });

  const metrics = [
    { label: 'Platform Total AUM', value: formatPaise(kpiData?.totalAumPaise), isHighlight: true },
    { label: 'Active User Folios', value: String(kpiData?.totalUsers || 0) },
    { label: 'Recurring Mandates', value: String(kpiData?.activeSips || 0) },
    { label: 'Escrow Pending', value: String(settlementsData.length) },
  ];

  return (
    <div>
      <EditorialHeader
        title="Institutional Operations & Maker-Checker Desk"
        subtitle="Dual-control authorization queue for settlement releases, daily mark-to-market, and KYC compliance."
      >
        <button
          type="button"
          onClick={() => mtmMutation.mutate()}
          disabled={mtmMutation.isPending}
          className="px-3.5 py-1.5 bg-[#0F5132] text-white text-xs font-mono font-medium uppercase tracking-wider hover:bg-[#111827] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${mtmMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{mtmMutation.isPending ? 'Executing MTM...' : 'Run Daily MTM Revaluation'}</span>
        </button>
      </EditorialHeader>

      <MetricStrip metrics={metrics} />

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E5E4DF] mb-4 space-x-4">
        {[
          { key: 'SETTLEMENTS', label: `Maker-Checker Escrow (${settlementsData.length})` },
          { key: 'USERS', label: `Investor Verification (${usersData.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
              activeTab === t.key ? 'border-[#1E3A8A] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'SETTLEMENTS' && (
        <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead className="border-b border-[#E5E4DF] text-[10px] uppercase text-[#4B5563] bg-[#FAF9F5]">
              <tr>
                <th className="py-2.5 px-4">Initiated</th>
                <th className="py-2.5 px-4">Investor Account</th>
                <th className="py-2.5 px-4 text-right">Requested Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Checker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-[#9CA3AF]">Scanning queue...</td></tr>
              ) : settlementsData.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[#9CA3AF]">Zero pending withdrawal approvals.</td></tr>
              ) : (
                settlementsData.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[#FAF9F5]">
                    <td className="py-2.5 px-4 text-[#4B5563]">{formatDateTime(tx.createdAt)}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <div className="font-medium text-[#111827]">{tx.user?.firstName} {tx.user?.lastName}</div>
                      <div className="text-[10px] text-[#9CA3AF] font-mono">{tx.user?.email}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-[#991B1B]">{formatPaise(tx.amountPaise)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-1.5 py-0.5 bg-[#FFFBEB] text-[#B45309] text-[9px] uppercase border border-[#B45309]">
                        LOCKED_ESCROW
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => settlementMutation.mutate({ id: tx._id, action: 'APPROVE', reviewNotes: 'Verified nodal balance.' })}
                          className="px-2 py-0.5 bg-[#0F5132] text-white text-[10px] uppercase font-mono"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectingTx(tx); setRejectReason('Compliance review flagged'); }}
                          className="px-2 py-0.5 border border-[#991B1B] text-[#991B1B] text-[10px] uppercase font-mono hover:bg-[#991B1B] hover:text-white"
                        >
                          Reject...
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead className="border-b border-[#E5E4DF] text-[10px] uppercase text-[#4B5563] bg-[#FAF9F5]">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">KYC Status</th>
                <th className="py-2.5 px-4">Risk Profile</th>
                <th className="py-2.5 px-4 text-center">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF] font-mono">
              {usersData.map((u) => (
                <tr key={u._id} className="hover:bg-[#FAF9F5]">
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-[#111827]">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-4 text-[11px]">{u.role}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold ${u.kycStatus === 'VERIFIED' ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FFFBEB] text-[#B45309]'}`}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[11px]">{u.riskProfile || 'UNSPECIFIED'}</td>
                  <td className="py-2.5 px-4 text-center">
                    {u.kycStatus !== 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => kycMutation.mutate({ id: u._id, kycStatus: 'VERIFIED' })}
                        className="px-2 py-0.5 bg-[#0F5132] text-white text-[10px] uppercase font-mono"
                      >
                        Verify KYC
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white border border-[#E5E4DF] p-5 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-[#111827]">Reject Escrow Settlement</h4>
            <p className="text-xs text-[#6B7280]">State reason for audit trail:</p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#D1D5DB] text-xs font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRejectingTx(null)} className="px-2.5 py-1 text-xs font-mono uppercase border border-[#D1D5DB]">Cancel</button>
              <button
                type="button"
                onClick={() => settlementMutation.mutate({ id: rejectingTx._id, action: 'REJECT', reviewNotes: rejectReason })}
                className="px-2.5 py-1 text-xs font-mono uppercase bg-[#991B1B] text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
