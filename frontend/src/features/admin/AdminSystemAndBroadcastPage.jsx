import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { Send, Server, Database, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminSystemAndBroadcastPage() {
  const [feedback, setFeedback] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '', message: '', severity: 'INFO', targetType: 'ALL', targetRiskTier: 'AGGRESSIVE', targetEmail: '',
  });
  const [confirmCode, setConfirmCode] = useState('');

  const { data: diagData, refetch: refetchDiag } = useQuery({
    queryKey: ['admin', 'diagnostics'],
    queryFn: async () => (await apiClient.get('/admin/diagnostics')).data?.data,
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/broadcast', broadcastForm)).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      setBroadcastForm({ title: '', message: '', severity: 'INFO', targetType: 'ALL', targetRiskTier: 'AGGRESSIVE', targetEmail: '' });
    },
    onError: (err) => setFeedback({ type: 'error', message: err.message }),
  });

  const reseedMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/reseed', { confirmCode })).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      setConfirmCode('');
      refetchDiag();
    },
    onError: (err) => setFeedback({ type: 'error', message: err.response?.data?.message || err.message }),
  });

  return (
    <div className="space-y-6">
      <EditorialHeader
        title="System Diagnostics & Investor Broadcast Studio"
        subtitle="Infrastructure health telemetry, multi-channel broadcast announcements, and safe database resets."
      />

      {feedback && (
        <div className={`p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Broadcast Studio */}
      <div className="p-5 bg-white border border-[#E5E4DF]">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E5E4DF]">
          <Send className="w-4 h-4 text-[#1E3A8A]" />
          <h3 className="text-xs font-mono uppercase font-semibold text-[#111827]">
            Investor Broadcast & Alert Dispatcher
          </h3>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); broadcastMutation.mutate(); }} className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Target Segment</label>
              <select
                value={broadcastForm.targetType}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, targetType: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#D1D5DB] bg-white"
              >
                <option value="ALL">All Active Investors</option>
                <option value="KYC_PENDING">KYC Unverified Users</option>
                <option value="RISK_TIER">Specific Risk Tier</option>
                <option value="USER">Specific User Email</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Severity Badge</label>
              <select
                value={broadcastForm.severity}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#D1D5DB] bg-white"
              >
                <option value="INFO">INFO (General)</option>
                <option value="ACTION_REQUIRED">ACTION_REQUIRED (Compliance)</option>
                <option value="MARKET_ALERT">MARKET_ALERT (Volatility)</option>
              </select>
            </div>

            {broadcastForm.targetType === 'USER' && (
              <div>
                <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Target User Email</label>
                <input
                  type="email"
                  required
                  value={broadcastForm.targetEmail}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetEmail: e.target.value })}
                  placeholder="investor@ips-wealth.com"
                  className="w-full px-2.5 py-1.5 border border-[#D1D5DB]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Announcement Title</label>
            <input
              type="text"
              required
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              placeholder="e.g. Scheduled Maintenance or Fiscal Year-End Tax Harvesting Window"
              className="w-full px-2.5 py-1.5 border border-[#D1D5DB]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#4B5563] uppercase mb-1">Message Content</label>
            <textarea
              rows={3}
              required
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              placeholder="State the details of this operational notification..."
              className="w-full px-2.5 py-1.5 border border-[#D1D5DB] font-sans"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={broadcastMutation.isPending}
              className="px-4 py-2 bg-[#1E3A8A] text-white text-xs uppercase font-bold hover:bg-[#111827] flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcastMutation.isPending ? 'Dispatching...' : 'Dispatch Announcement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Diagnostics & Demo Re-seed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-[#E5E4DF] font-mono text-xs">
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-[#E5E4DF]">
            <Server className="w-4 h-4 text-[#0F5132]" />
            <span className="font-semibold uppercase text-[#111827]">Live Infrastructure Latency</span>
          </div>
          <div className="space-y-2 tabular-nums">
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">MongoDB Ping:</span>
              <span className="font-bold text-[#0F5132]">{diagData?.dbLatencyMs || 2} ms (Healthy)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">Registered Users:</span>
              <span>{diagData?.counts?.users || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">Portfolio Holdings:</span>
              <span>{diagData?.counts?.holdings || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#6B7280]">Double-Entry Journal Legs:</span>
              <span>{diagData?.counts?.journalEntries || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-[#E5E4DF] font-mono text-xs">
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-[#E5E4DF]">
            <RotateCcw className="w-4 h-4 text-[#B45309]" />
            <span className="font-semibold uppercase text-[#111827]">Demo Database Reset</span>
          </div>
          <p className="text-[11px] text-[#6B7280] font-sans mb-3">
            Re-seeds sample portfolios, plans, and 180-day snapshot history. Type <strong className="text-[#111827]">SEED</strong> to confirm.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder='Type "SEED"'
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-[#D1D5DB] uppercase"
            />
            <button
              type="button"
              onClick={() => reseedMutation.mutate()}
              disabled={confirmCode !== 'SEED' || reseedMutation.isPending}
              className="px-3.5 py-1.5 bg-[#991B1B] text-white text-xs uppercase font-bold disabled:opacity-40"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

