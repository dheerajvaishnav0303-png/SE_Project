import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatPaise } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import Investor360Drawer from './Investor360Drawer';
import ManualLedgerModal from './ManualLedgerModal';
import { 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Unlock, 
  DollarSign 
} from 'lucide-react';

export default function AdminUsersAndKycPage() {
  const queryClient = useQueryClient();
  const [selectedUser360Id, setSelectedUser360Id] = useState(null);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);
  const [adjustingUser, setAdjustingUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await apiClient.get('/admin/users')).data?.data?.users || [],
  });

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
  };

  const kycMutation = useMutation({
    mutationFn: async ({ id, kycStatus, notes }) =>
      (await apiClient.patch(`/admin/users/${id}/kyc`, { kycStatus, notes })).data,
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Investor KYC status updated.' });
      refreshUsers();
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, payload }) =>
      (await apiClient.post(`/admin/users/${id}/moderate`, payload)).data,
    onSuccess: (res) => {
      setFeedback({ type: 'success', message: res.message });
      refreshUsers();
      setAdjustingUser(null);
    },
  });

  const handleExportCsv = async () => {
    try {
      const res = await apiClient.get('/admin/reports/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `investor-register-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to export investor register.' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesKyc = kycFilter === 'ALL' || u.kycStatus === kycFilter;
      return matchesSearch && matchesKyc;
    });
  }, [users, search, kycFilter]);

  return (
    <div>
      <EditorialHeader
        title="Investor 360° Dossier & Compliance Desk"
        subtitle="SEBI/PMLA regulatory investor identification, KYC moderation, and account safety controls."
      >
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3.5 py-1.5 bg-white border border-[#D1D5DB] text-[#111827] text-xs font-mono uppercase tracking-wider hover:bg-[#F3F4F6] flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
          <span>Export Master Register (CSV)</span>
        </button>
      </EditorialHeader>

      {feedback && (
        <div className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${feedback.type === 'success' ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]' : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#E5E4DF]">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-[#D1D5DB] font-sans"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PENDING', 'VERIFIED', 'UNVERIFIED', 'REJECTED'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKycFilter(k)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                kycFilter === k ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#4B5563] border-[#D1D5DB] hover:bg-[#F3F4F6]'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] text-[10px] uppercase font-semibold text-[#4B5563]">
              <th className="py-2.5 px-3">Investor</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3 text-center">KYC Status</th>
              <th className="py-2.5 px-3 text-center">Risk Profile</th>
              <th className="py-2.5 px-3 text-right">Wallet Balance</th>
              <th className="py-2.5 px-3 text-center">State</th>
              <th className="py-2.5 px-3 text-center">Desk Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E4DF] font-mono tabular-nums">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Loading investor accounts...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">Zero matching investor records found.</td></tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-[#FAF9F5]">
                  <td className="py-2.5 px-3">
                    <div className="font-sans font-medium text-[#111827]">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-[#9CA3AF]">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-[#4B5563]">{u.role}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold ${
                      u.kycStatus === 'VERIFIED' ? 'bg-[#F0FDF4] text-[#0F5132]' : u.kycStatus === 'PENDING' ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}>
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[11px] text-[#1E3A8A] font-semibold">
                    {u.riskProfile || 'UNSPECIFIED'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#111827]">
                    {formatPaise(u.walletBalancePaise)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase ${u.isFrozen ? 'bg-[#FEF2F2] text-[#991B1B] font-bold' : 'text-[#6B7280]'}`}>
                      {u.isFrozen ? 'FROZEN' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedUser360Id(u._id)}
                        className="px-2 py-0.5 border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-[10px] uppercase inline-flex items-center gap-1"
                        title="View Full 360° Financial Footprint"
                      >
                        <Eye className="w-3 h-3" />
                        <span>360°</span>
                      </button>
                      {u.kycStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => kycMutation.mutate({ id: u._id, kycStatus: 'VERIFIED', notes: 'Approved by KYC compliance officer' })}
                          className="px-2 py-0.5 bg-[#0F5132] text-white text-[10px] uppercase font-mono"
                          title="Approve KYC"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('Reason for account freeze / unfreeze:');
                          if (reason !== null) moderateMutation.mutate({ id: u._id, payload: { action: 'TOGGLE_FREEZE', reason } });
                        }}
                        className={`p-1 border text-[10px] ${u.isFrozen ? 'border-[#0F5132] text-[#0F5132]' : 'border-[#991B1B] text-[#991B1B]'}`}
                        title={u.isFrozen ? 'Reactivate Account' : 'Freeze Account'}
                      >
                        {u.isFrozen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustingUser(u)}
                        className="p-1 border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827]"
                        title="Manual Double-Entry Ledger Adjustment"
                      >
                        <DollarSign className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Investor360Drawer userId={selectedUser360Id} onClose={() => setSelectedUser360Id(null)} />
      
      <ManualLedgerModal
        user={adjustingUser}
        onClose={() => setAdjustingUser(null)}
        onSubmit={({ id, payload }) => moderateMutation.mutate({ id, payload })}
        isPending={moderateMutation.isPending}
      />
    </div>
  );
}
