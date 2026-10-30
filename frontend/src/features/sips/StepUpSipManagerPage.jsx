import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { sipKeys, portfolioKeys, investmentKeys } from '../../lib/queryClient';
import { formatPaise, formatDate } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import ActionableEmptyState from '../../components/ui/ActionableEmptyState';
import ModifySipModal from './ModifySipModal';
import { CheckCircle2, AlertTriangle, ArrowUpRight, SkipForward, Zap, Edit3, XCircle } from 'lucide-react';

export default function StepUpSipManagerPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [editingSip, setEditingSip] = useState(null);

  const { data: sips = [], isLoading } = useQuery({
    queryKey: sipKeys.list(),
    queryFn: async () => (await apiClient.get('/sips')).data?.data?.sips || [],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: sipKeys.list() });
    queryClient.invalidateQueries({ queryKey: portfolioKeys.summary() });
    queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() });
  };

  const actionMutation = useMutation({
    mutationFn: async ({ url, method = 'post', body = {} }) => {
      const res = await apiClient[method](url, body);
      return res.data;
    },
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      invalidateAll();
      setEditingSip(null);
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message });
    },
  });

  const handleSkipMonth = (id) => actionMutation.mutate({ url: `/sips/${id}/skip-month`, method: 'post' });

  const handleExecuteNow = (id) => {
    if (confirm('Execute this SIP installment immediately from your available wallet balance?')) {
      actionMutation.mutate({ url: `/sips/${id}/execute-now`, method: 'post' });
    }
  };

  const handleCancel = (id) => {
    if (confirm('Are you sure you want to cancel this recurring SIP mandate?')) {
      actionMutation.mutate({ url: `/sips/${id}/status`, method: 'patch', body: { status: 'CANCELLED' } });
    }
  };

  return (
    <div>
      <EditorialHeader
        title="Step-Up SIP Mandate Manager"
        subtitle="Automated recurring debits with annual percentage escalations and dunning retry safeguards."
      >
        <Link
          to="/marketplace"
          className="px-3.5 py-1.5 bg-[#1E3A8A] text-white text-xs font-mono font-medium uppercase tracking-wider hover:bg-[#111827] transition-colors flex items-center gap-1.5"
        >
          <span>+ Start New Mandate</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
              <th className="py-3 px-4">Scheme / Plan</th>
              <th className="py-3 px-4 text-right">Installment</th>
              <th className="py-3 px-4 text-center">Step-Up Rate</th>
              <th className="py-3 px-4 text-center">Next Debit</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Mandate Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] text-xs">
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-[#9CA3AF] font-mono">Loading mandates...</td></tr>
            ) : sips.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <ActionableEmptyState
                    title="No Recurring SIP Mandates"
                    description="Automate wealth creation through disciplined monthly rupee-cost averaging with annual step-up."
                    actionLabel="Explore SIP Mutual Funds"
                    onAction={() => window.location.assign('/marketplace')}
                  />
                </td>
              </tr>
            ) : (
              sips.map((sip) => (
                <tr key={sip._id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#111827]">{sip.plan?.name}</div>
                    <div className="text-[10px] font-mono text-[#9CA3AF]">
                      Linked Goal: {sip.linkedGoal?.title || 'Unassigned Wealth Pool'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">
                    {formatPaise(sip.amountPaise)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-[#0F5132] font-medium">
                    +{sip.stepUpPercentage}% / yr
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-[#4B5563]">
                    {formatDate(sip.nextExecutionDate)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-semibold ${
                      sip.status === 'ACTIVE' ? 'bg-[#F0FDF4] text-[#0F5132]' : sip.status === 'PAUSED' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}>
                      {sip.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExecuteNow(sip._id)}
                        disabled={sip.status !== 'ACTIVE'}
                        className="px-2 py-1 text-[10px] font-mono uppercase border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-colors disabled:opacity-40 inline-flex items-center gap-1"
                        title="Execute Debit Right Now"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Pay Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkipMonth(sip._id)}
                        disabled={sip.status !== 'ACTIVE'}
                        className="px-2 py-1 text-[10px] font-mono uppercase border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors disabled:opacity-40 inline-flex items-center gap-1"
                        title="Skip Next Month Installment"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Skip Month</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSip(sip)}
                        className="p-1 border border-[#D1D5DB] text-[#4B5563] hover:text-[#1E3A8A] hover:bg-[#F3F4F6]"
                        title="Edit Mandate"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {sip.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleCancel(sip._id)}
                          className="p-1 border border-[#D1D5DB] text-[#9CA3AF] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                          title="Cancel Mandate"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModifySipModal
        sip={editingSip}
        onClose={() => setEditingSip(null)}
        onSave={(data) => actionMutation.mutate({ url: `/sips/${editingSip._id}/modify`, method: 'patch', body: data })}
        isPending={actionMutation.isPending}
      />
    </div>
  );
}
