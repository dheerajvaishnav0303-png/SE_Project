import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatDateTime } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';
import { Download, Search, ShieldAlert, Code2, Eye } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [inspectingLog, setInspectingLog] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'auditLogs', category, severity, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (severity) params.set('severity', severity);
      if (search) params.set('search', search);
      return (await apiClient.get(`/admin/audit-logs?${params.toString()}`)).data?.data;
    },
  });

  const logs = data?.logs || [];

  const handleExportCsv = async () => {
    try {
      const res = await apiClient.get('/admin/reports/audit-logs', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-trail-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export audit trail.');
    }
  };

  return (
    <div>
      <EditorialHeader
        title="Immutable Master Audit Trail & Activity Tracker"
        subtitle="Cryptographically verified append-only compliance journal tracking every administrative and ledger mutation."
      >
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3.5 py-1.5 bg-white border border-[#D1D5DB] text-[#111827] text-xs font-mono uppercase tracking-wider hover:bg-[#F3F4F6] flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </EditorialHeader>

      {/* Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E4DF]">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action or actor email..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-[#D1D5DB] font-sans"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-1 text-[10px] font-mono uppercase border border-[#D1D5DB] bg-white"
          >
            <option value="">All Categories</option>
            <option value="AUTH_SECURITY">AUTH_SECURITY</option>
            <option value="LEDGER_MUTATION">LEDGER_MUTATION</option>
            <option value="KYC_COMPLIANCE">KYC_COMPLIANCE</option>
            <option value="CATALOG_CHANGE">CATALOG_CHANGE</option>
            <option value="USER_MODERATION">USER_MODERATION</option>
            <option value="TREASURY_SETTLEMENT">TREASURY_SETTLEMENT</option>
            <option value="SYSTEM_CRON">SYSTEM_CRON</option>
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-2.5 py-1 text-[10px] font-mono uppercase border border-[#D1D5DB] bg-white"
          >
            <option value="">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] uppercase font-semibold text-[#4B5563]">
              <th className="py-2.5 px-3">Timestamp (IST)</th>
              <th className="py-2.5 px-3">Actor</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Target Entity</th>
              <th className="py-2.5 px-3 text-center">Severity</th>
              <th className="py-2.5 px-3 text-center">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Scanning immutable journal...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Zero audit entries matching filter criteria.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l._id} className="hover:bg-[#FAF9F5]">
                  <td className="py-2 px-3 text-[#6B7280]">{formatDateTime(l.createdAt)}</td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-[#111827]">{l.actor?.email}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{l.actor?.role} • {l.actor?.ipAddress}</div>
                  </td>
                  <td className="py-2 px-3 text-[11px] text-[#4B5563]">{l.category}</td>
                  <td className="py-2 px-3 font-semibold text-[#111827]">{l.action}</td>
                  <td className="py-2 px-3 text-[11px]">
                    <span className="text-[#6B7280]">{l.targetEntity?.entityType}: </span>
                    <span className="text-[#111827]">{l.targetEntity?.label || l.targetEntity?.entityId}</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold ${
                      l.severity === 'CRITICAL' ? 'bg-[#FEF2F2] text-[#991B1B]' : l.severity === 'WARNING' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#F0FDF4] text-[#0F5132]'
                    }`}>
                      {l.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setInspectingLog(l)}
                      className="px-2 py-0.5 border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-[10px] uppercase inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Diff</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payload Diff Drawer */}
      <SlideOverSheet
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        title={inspectingLog ? `Audit Event: ${inspectingLog.action}` : 'Payload Diff'}
        subtitle={`ID: ${inspectingLog?._id} | Recorded: ${formatDateTime(inspectingLog?.createdAt)}`}
      >
        {inspectingLog && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-[#FAF9F5] border border-[#E5E4DF] space-y-1">
              <div><strong className="text-[#4B5563]">Actor:</strong> {inspectingLog.actor?.email} ({inspectingLog.actor?.role})</div>
              <div><strong className="text-[#4B5563]">IP Address:</strong> {inspectingLog.actor?.ipAddress}</div>
              <div><strong className="text-[#4B5563]">Category:</strong> {inspectingLog.category}</div>
              {inspectingLog.diffPayload?.reason && (
                <div><strong className="text-[#991B1B]">Reason:</strong> {inspectingLog.diffPayload.reason}</div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#4B5563] block mb-1">State Payload Diff (JSON)</span>
              <pre className="p-3 bg-[#111827] text-[#FAF9F5] overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(inspectingLog.diffPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SlideOverSheet>
    </div>
  );
}

