import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/apiClient';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import TotpSecurityCard from './TotpSecurityCard';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SecurityAndKycPage() {
  const { user, fetchMe } = useAuthStore();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Risk Assessment state
  const [horizon, setHorizon] = useState('LONG');
  const [reaction, setReaction] = useState('HOLD');
  const [pan, setPan] = useState('');

  const calculateRisk = () => {
    if (reaction === 'BUY' && horizon === 'LONG') return 'AGGRESSIVE';
    if (reaction === 'PANIC' || horizon === 'SHORT') return 'CONSERVATIVE';
    return 'MODERATE';
  };

  const handleUpdateRisk = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const riskProfile = calculateRisk();
      await apiClient.patch('/customer/profile', { riskProfile });
      setFeedback({ type: 'success', message: `Risk profile updated to ${riskProfile}.` });
      await fetchMe();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (!pan || pan.length !== 10) {
      setFeedback({ type: 'error', message: 'Please provide a valid 10-character PAN identifier.' });
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch('/customer/profile', { pan, kycSubmitted: true });
      setFeedback({ type: 'success', message: 'KYC documents submitted. Status marked as PENDING.' });
      await fetchMe();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EditorialHeader
        title="Security & Account Verification"
        subtitle="Hardware/TOTP multi-factor authentication, KYC compliance level, and institutional risk parameters."
      />

      {feedback && (
        <div
          className={`mb-4 p-3 border text-xs flex items-center gap-2 font-mono ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#0F5132] text-[#0F5132]'
              : 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional KYC Card */}
        <div className="p-5 border border-[#E5E4DF] bg-white space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[#4B5563]">
            <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
            <span>PMLA / SEBI Regulatory Tier</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E4DF]">
            <span className="text-[#6B7280]">Verification Tier</span>
            <span
              className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                user?.kycStatus === 'VERIFIED'
                  ? 'bg-[#F0FDF4] text-[#0F5132]'
                  : user?.kycStatus === 'PENDING'
                  ? 'bg-[#FFFBEB] text-[#B45309]'
                  : 'bg-[#FEF2F2] text-[#991B1B]'
              }`}
            >
              {user?.kycStatus || 'UNVERIFIED'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E5E4DF]">
            <span className="text-[#6B7280]">Risk Categorization</span>
            <span className="font-bold text-[#1E3A8A] uppercase">{user?.riskProfile || 'UNASSIGNED'}</span>
          </div>

          {/* Direct KYC Submission Form */}
          {user?.kycStatus !== 'VERIFIED' && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-semibold text-[#111827] block">Identity Document (PAN)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 border border-[#E5E4DF] font-mono text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={handleSubmitKyc}
                  disabled={loading}
                  className="px-3 py-1.5 bg-[#0F5132] text-white text-[11px] font-mono uppercase hover:bg-[#111827]"
                >
                  Submit KYC
                </button>
              </div>
            </div>
          )}

          {/* Risk Profiler Questionnaire */}
          <div className="pt-3 border-t border-[#E5E4DF] space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#111827] block">
              Suitability & Risk Tolerance Quiz
            </span>
            <div>
              <span className="text-[10px] text-[#6B7280] block">Investment Time Horizon:</span>
              <div className="flex gap-1.5 mt-1">
                {[
                  ['SHORT', '< 3y'],
                  ['MED', '3-7y'],
                  ['LONG', '> 7y'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHorizon(v)}
                    className={`px-2 py-0.5 text-[10px] font-mono border ${
                      horizon === v ? 'bg-[#111827] text-white' : 'bg-[#FAF9F5]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] block">Reaction to -20% Market Downturn:</span>
              <div className="flex gap-1.5 mt-1">
                {[
                  ['PANIC', 'Panic Sell'],
                  ['HOLD', 'Hold Steady'],
                  ['BUY', 'Buy More'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setReaction(v)}
                    className={`px-2 py-0.5 text-[10px] font-mono border ${
                      reaction === v ? 'bg-[#111827] text-white' : 'bg-[#FAF9F5]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleUpdateRisk}
              disabled={loading}
              className="mt-2 w-full py-1.5 bg-[#1E3A8A] text-white text-[11px] font-mono uppercase hover:bg-[#111827]"
            >
              Recalibrate Risk Profile ({calculateRisk()})
            </button>
          </div>
        </div>

        {/* TOTP 2FA Card */}
        <TotpSecurityCard user={user} onRefreshUser={fetchMe} setFeedback={setFeedback} />
      </div>
    </div>
  );
}
