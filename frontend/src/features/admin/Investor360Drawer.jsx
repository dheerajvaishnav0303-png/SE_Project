import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { formatPaise, formatPercent, formatDateTime, formatUnits } from '../../lib/formatters';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';
import { ShieldCheck, UserCheck, Briefcase, Repeat, Target, Receipt, History } from 'lucide-react';

export default function Investor360Drawer({ userId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user360', userId],
    queryFn: async () => (await apiClient.get(`/admin/users/${userId}/360`)).data?.data,
    enabled: Boolean(userId),
  });

  const user = data?.user;
  const summary = data?.financialSummary;
  const holdings = data?.holdings || [];
  const sips = data?.sips || [];
  const goals = data?.goals || [];
  const entries = data?.ledgerEntries || [];

  return (
    <SlideOverSheet
      isOpen={Boolean(userId)}
      onClose={onClose}
      title={user ? `${user.firstName} ${user.lastName} — Dossier` : 'Investor 360°'}
      subtitle={`ID: ${userId} | ${user?.email || 'Loading...'}`}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-[#9CA3AF]">
          Compiling full investor 360° financial footprint...
        </div>
      ) : !user ? (
        <div className="py-12 text-center text-xs font-mono text-[#991B1B]">
          Investor record not found.
        </div>
      ) : (
        <div className="space-y-6 text-xs font-sans">
          {/* Identity & Compliance Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F5] p-3.5 border border-[#E5E4DF] font-mono tabular-nums">
            <div>
              <span className="text-[10px] text-[#9CA3AF] block uppercase">KYC Status</span>
              <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold inline-block mt-0.5 ${user.kycStatus === 'VERIFIED' ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FFFBEB] text-[#B45309]'}`}>
                {user.kycStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#9CA3AF] block uppercase">Risk Mandate</span>
              <span className="font-semibold text-[#1E3A8A]">{user.riskProfile || 'UNSPECIFIED'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#9CA3AF] block uppercase">2FA Auth</span>
              <span className="font-medium text-[#111827]">{user.twoFactorEnabled ? 'ENFORCED' : 'OFF'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#9CA3AF] block uppercase">Wallet Cash</span>
              <span className="font-bold text-[#0F5132]">{formatPaise(summary?.walletBalancePaise)}</span>
            </div>
          </div>

          {/* Holdings Breakdown */}
          <div>
            <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-[#E5E4DF] font-mono uppercase text-[#4B5563] text-[11px] font-semibold">
              <Briefcase className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Active Portfolio Holdings ({holdings.length})</span>
            </div>
            {holdings.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] font-mono py-2">No active securities held.</p>
            ) : (
              <div className="border border-[#E5E4DF] overflow-hidden">
                <table className="w-full text-left font-mono tabular-nums text-[11px]">
                  <thead className="bg-[#FAF9F5] border-b border-[#E5E4DF] text-[#6B7280] uppercase">
                    <tr>
                      <th className="py-1.5 px-2.5">Security</th>
                      <th className="py-1.5 px-2.5 text-right">Units</th>
                      <th className="py-1.5 px-2.5 text-right">Invested</th>
                      <th className="py-1.5 px-2.5 text-right">Current Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {holdings.map((h) => (
                      <tr key={h._id}>
                        <td className="py-1.5 px-2.5 font-sans font-medium text-[#111827]">{h.plan?.name}</td>
                        <td className="py-1.5 px-2.5 text-right">{formatUnits(h.units)}</td>
                        <td className="py-1.5 px-2.5 text-right text-[#4B5563]">{formatPaise(h.investedPaise)}</td>
                        <td className="py-1.5 px-2.5 text-right font-semibold text-[#111827]">{formatPaise(h.currentValuePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active SIPs & Goals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-[#E5E4DF] font-mono uppercase text-[#4B5563] text-[11px] font-semibold">
                <Repeat className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>SIP Mandates ({sips.length})</span>
              </div>
              {sips.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] font-mono">No active SIPs.</p>
              ) : (
                <div className="space-y-1.5">
                  {sips.map((s) => (
                    <div key={s._id} className="p-2 border border-[#E5E4DF] bg-white font-mono text-[11px]">
                      <div className="font-semibold text-[#111827]">{s.plan?.name}</div>
                      <div className="text-[#6B7280] flex justify-between mt-0.5">
                        <span>{formatPaise(s.amountPaise)}/mo</span>
                        <span>+{s.stepUpPercentage}% step-up</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-[#E5E4DF] font-mono uppercase text-[#4B5563] text-[11px] font-semibold">
                <Target className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Financial Goals ({goals.length})</span>
              </div>
              {goals.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] font-mono">No goals configured.</p>
              ) : (
                <div className="space-y-1.5">
                  {goals.map((g) => (
                    <div key={g._id} className="p-2 border border-[#E5E4DF] bg-white font-mono text-[11px]">
                      <div className="font-semibold text-[#111827]">{g.title}</div>
                      <div className="text-[#6B7280] flex justify-between mt-0.5">
                        <span>Target: {formatPaise(g.targetCorpusPaise)}</span>
                        <span>{g.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Double-Entry Ledger History */}
          <div>
            <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-[#E5E4DF] font-mono uppercase text-[#4B5563] text-[11px] font-semibold">
              <Receipt className="w-3.5 h-3.5 text-[#111827]" />
              <span>Recent Ledger Journal Entries</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-[#E5E4DF]">
              <table className="w-full text-left font-mono tabular-nums text-[10px]">
                <thead className="bg-[#FAF9F5] border-b border-[#E5E4DF] text-[#6B7280] uppercase sticky top-0">
                  <tr>
                    <th className="py-1 px-2">Date</th>
                    <th className="py-1 px-2">Account</th>
                    <th className="py-1 px-2 text-center">Leg</th>
                    <th className="py-1 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4DF]">
                  {entries.map((e, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-2 text-[#6B7280]">{formatDateTime(e.recordedAt)}</td>
                      <td className="py-1 px-2">{e.accountType}</td>
                      <td className="py-1 px-2 text-center font-bold">
                        <span className={e.direction === 'CREDIT' ? 'text-[#0F5132]' : 'text-[#991B1B]'}>{e.direction}</span>
                      </td>
                      <td className="py-1 px-2 text-right font-medium">{formatPaise(e.amountPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SlideOverSheet>
  );
}

