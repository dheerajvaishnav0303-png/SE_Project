import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { CommandPalette } from '../../components/ui/CommandPalette';
import { formatCompactPaise } from '../../lib/formatters';
import { Shield, ArrowLeftRight, LogOut, Search } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNav = [
    { to: '/admin/dashboard', label: 'Treasury & Command' },
    { to: '/admin/users', label: 'Investor 360° & KYC' },
    { to: '/admin/settlements', label: 'Maker-Checker Settlements' },
    { to: '/admin/plans', label: 'Catalog & NAVs' },
    { to: '/admin/analytics', label: 'SIP Book & Reports' },
    { to: '/admin/audit-logs', label: 'Master Audit Trail' },
    { to: '/admin/system', label: 'System & Broadcast' },
  ];

  const monogram = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#111827] flex flex-col font-sans">
      <CommandPalette />

      {/* Institutional Top Command Bar */}
      <header className="border-b border-[#E5E4DF] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Console Branding */}
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#1E3A8A] inline-block" title="Institutional Maker-Checker Console" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-serif font-semibold tracking-tight text-[#111827]">
                  IPS Operations
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[#1E3A8A] text-white">
                  Compliance & Treasury Desk
                </span>
              </div>
            </div>

            {/* Quick Action & View Switcher */}
            <div className="flex items-center gap-3">
              {/* Instant View Switcher Button */}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#111827] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Switch to everyday retail investor interface"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>Switch to Investor View</span>
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ips:open-search'))}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-[#4B5563] bg-[#FAF9F5] border border-[#E5E4DF] hover:border-[#D1CFC7] transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-sans">Search</span>
                <kbd className="text-[10px] font-mono border border-[#E5E4DF] px-1 bg-white">⌘K</kbd>
              </button>

              {user?.walletBalancePaise !== undefined && (
                <div className="text-right hidden sm:block">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#9CA3AF] block leading-none">
                    Admin Wallet
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#111827]">
                    {formatCompactPaise(user.walletBalancePaise)}
                  </span>
                </div>
              )}

              <div
                className="w-7 h-7 bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-mono font-semibold select-none"
                title={`${user?.firstName} ${user?.lastName} (${user?.role})`}
              >
                {monogram}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-[#4B5563] hover:text-[#991B1B] hover:bg-[#FAF9F5] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Institutional Admin Sub-Navigation */}
          <nav className="flex space-x-6 overflow-x-auto no-scrollbar -mb-px">
            {adminNav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `py-2.5 text-xs font-mono uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-[#1E3A8A] text-[#111827] font-semibold'
                      : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1CFC7]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Admin Content Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Admin Colophon */}
      <footer className="border-t border-[#E5E4DF] bg-white py-4 text-xs text-[#9CA3AF] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>IPS Compliance & Operations Suite • Dual-Control Maker-Checker Standard</div>
          <div>Audit Trail: Immutable Append-Only</div>
        </div>
      </footer>
    </div>
  );
}

