import React, { useState } from 'react';
import { apiClient } from '../../api/apiClient';
import { QrCode } from 'lucide-react';

export default function TotpSecurityCard({ user, onRefreshUser, setFeedback }) {
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart2FA = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      setSetupData(res.data.data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      await apiClient.post('/auth/2fa/verify', { token: totpCode });
      setFeedback({ type: 'success', message: 'Two-factor authentication successfully enabled!' });
      setSetupData(null);
      setTotpCode('');
      await onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-[#E5E4DF] bg-white space-y-3 text-xs">
      <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[#4B5563]">
        <QrCode className="w-4 h-4 text-[#0F5132]" />
        <span>Time-Based 2FA (RFC 6238)</span>
      </div>

      <p className="text-[#4B5563]">
        Multi-factor authentication enforces TOTP verification on capital withdrawals and banking modifications.
      </p>

      <div className="py-1">
        <span className="font-medium text-[#111827]">Current Status: </span>
        <span
          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
            user?.twoFactorEnabled ? 'bg-[#F0FDF4] text-[#0F5132]' : 'bg-[#FFFBEB] text-[#B45309]'
          }`}
        >
          {user?.twoFactorEnabled ? 'ACTIVE & ENFORCED' : 'DISABLED'}
        </span>
      </div>

      {!user?.twoFactorEnabled && !setupData && (
        <button
          type="button"
          onClick={handleStart2FA}
          disabled={loading}
          className="py-2 px-4 bg-[#1E3A8A] text-white font-mono uppercase text-[11px]"
        >
          {loading ? 'Initializing...' : 'Configure Authenticator App'}
        </button>
      )}

      {setupData && (
        <form onSubmit={handleVerify2FA} className="space-y-3 pt-2 border-t border-[#E5E4DF]">
          <div className="flex flex-col items-center p-2 bg-[#FAF9F5] border border-[#E5E4DF]">
            <img src={setupData.qrCode} alt="TOTP QR" className="w-32 h-32 border border-[#E5E4DF]" />
            <span className="text-[10px] font-mono text-[#9CA3AF] mt-1 select-all">{setupData.secret}</span>
          </div>
          <div>
            <input
              type="text"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full px-3 py-1.5 border border-[#E5E4DF] text-center font-mono text-sm tracking-widest text-[#111827]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#0F5132] text-white font-mono uppercase text-[11px]"
          >
            {loading ? 'Verifying...' : 'Verify & Activate 2FA'}
          </button>
        </form>
      )}
    </div>
  );
}

