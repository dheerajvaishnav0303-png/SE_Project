import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/apiClient';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    totpCode: '',
  });
  const [error, setError] = useState(null);
  const [errorHint, setErrorHint] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setErrorHint(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await apiClient.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        const user = await fetchMe();
        if (['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role)) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        const res = await apiClient.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          totpCode: formData.totpCode || undefined,
        });

        if (res.data?.status === '2FA_REQUIRED') {
          setRequires2FA(true);
          setLoading(false);
          return;
        }

        const user = await fetchMe();
        if (['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role)) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed.');
      setErrorHint(err.response?.data?.hint || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="w-2.5 h-2.5 bg-[#0F5132] inline-block mb-3" />
          <h1 className="text-3xl font-serif font-normal text-[#111827] tracking-tight">
            IPS Wealth Management
          </h1>
          <p className="mt-1 text-xs font-mono uppercase tracking-widest text-[#4B5563]">
            Institutional Daylight Advisory
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E5E4DF] shadow-none rounded-none">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-[#E5E4DF] mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setRequires2FA(false); }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide border-b-2 ${
                !isRegister ? 'border-[#1E3A8A] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setRequires2FA(false); }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide border-b-2 ${
                isRegister ? 'border-[#1E3A8A] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'
              }`}
            >
              Open Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#991B1B] text-[#991B1B] text-xs space-y-1">
              <div className="font-semibold">{error}</div>
              {errorHint && <div className="text-[11px] text-[#4B5563] font-sans">{errorHint}</div>}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#E5E4DF] text-xs text-[#111827] focus:outline-none focus:border-[#1E3A8A] rounded-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#E5E4DF] text-xs text-[#111827] focus:outline-none focus:border-[#1E3A8A] rounded-none bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="investor@ips-wealth.com"
                className="w-full px-3 py-2 border border-[#E5E4DF] text-xs text-[#111827] focus:outline-none focus:border-[#1E3A8A] rounded-none bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-[#E5E4DF] text-xs text-[#111827] focus:outline-none focus:border-[#1E3A8A] rounded-none bg-white font-mono"
              />
            </div>

            {requires2FA && (
              <div className="pt-2 border-t border-[#E5E4DF]">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B45309] mb-1">
                  6-Digit TOTP 2FA Code
                </label>
                <input
                  type="text"
                  name="totpCode"
                  maxLength={6}
                  required
                  autoFocus
                  value={formData.totpCode}
                  onChange={handleChange}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-[#B45309] text-base text-center tracking-widest text-[#111827] focus:outline-none rounded-none bg-white font-mono tabular-nums"
                />
                <p className="text-[10px] text-[#4B5563] mt-1">
                  Enter authentication code from your Google Authenticator or 1Password app.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111827] transition-colors rounded-none disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegister ? 'Confirm Registration' : requires2FA ? 'Authorize TOTP' : 'Authenticate'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E5E4DF] space-y-2">
            <span className="text-[10px] text-[#9CA3AF] font-mono block text-center uppercase tracking-wider">
              Quick Institutional Sandbox Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'investor@ips-wealth.com', password: 'Investor123!', firstName: '', lastName: '', totpCode: '' });
                }}
                className="py-1 px-2 text-[10px] font-mono border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-colors"
              >
                Fill Investor Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'admin@ips-wealth.com', password: 'Admin123!', firstName: '', lastName: '', totpCode: '' });
                }}
                className="py-1 px-2 text-[10px] font-mono border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-colors"
              >
                Fill Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

