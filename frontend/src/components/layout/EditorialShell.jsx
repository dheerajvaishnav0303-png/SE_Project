import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { CommandPalette } from '../ui/CommandPalette';
import { formatCompactPaise } from '../../lib/formatters';
import { Search, LogOut, Shield } from 'lucide-react';

export function EditorialShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/goals', label: 'Goals' },
    { to: '/sips', label: 'SIPs' },
    { to: '/calculators', label: 'Calculators' },
    { to: '/ledger', label: 'Ledger' },
    { to: '/settings', label: 'Settings' },
  ];

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role);
  const monogram = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'S'}`;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#111827] flex flex-col font-sans">
      <CommandPalette />

      {/* Admin Mode Floating Announcement Bar */}
      {isAdmin && (
        <div className="bg-[#1E3A8A] text-white text-[11px] font-mono py-1.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>ADMINISTRATOR PREVIEW: You are currently viewing the platform from a retail investor perspective.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="px-2 py-0.5 bg-white text-[#1E3A8A] font-bold uppercase tracking-wider text-[10px] hover:bg-[#FAF9F5] transition-colors"
          >
            Open Admin Operations Console →
          </button>
        </div>
      )}

      {/* 1. Institutional Topmast Header */}
      <header className="border-b border-[#E5E4DF] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#0F5132] inline-block" title="Institutional Settlement Engine Active" />
              <NavLink to="/dashboard" className="text-xl font-serif font-medium tracking-tight text-[#111827]">
                IPS <span className="text-xs font-mono uppercase tracking-widest text-[#4B5563]">Wealth v2.0</span>
              </NavLink>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Prominent Admin Switcher Badge */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-3 py-1 bg-[#1E3A8A] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] flex items-center gap-1.5 transition-colors"
                  title="Switch to Admin Operations Console"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Switch to Admin Console</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ips:open-search'))}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-[#4B5563] bg-[#FAF9F5] border border-[#E5E4DF] hover:border-[#D1CFC7] transition-colors rounded-none"
              >
                <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-sans">Search</span>
                <kbd className="text-[10px] font-mono border border-[#E5E4DF] px-1 bg-white">⌘K</kbd>
              </button>

              {user?.walletBalancePaise !== undefined && (
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#9CA3AF] block leading-none">
                    Wallet
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#111827]">
                    {formatCompactPaise(user.walletBalancePaise)}
                  </span>
                </div>
              )}

              {/* Sharp Typographic Monogram */}
              <div
                className="w-7 h-7 bg-[#F4F2EB] border border-[#E5E4DF] flex items-center justify-center text-xs font-mono font-semibold text-[#111827] rounded-none select-none"
                title={`${user?.firstName} ${user?.lastName} (${user?.role})`}
              >
                {monogram}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-[#4B5563] hover:text-[#991B1B] hover:bg-[#FAF9F5] transition-colors rounded-none"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Navigation Broadsheet Tabs */}
          <nav className="flex space-x-6 overflow-x-auto no-scrollbar -mb-px">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `py-2.5 text-xs font-medium tracking-wide transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-[#1E3A8A] text-[#111827] font-semibold'
                      : 'border-transparent text-[#4B5563] hover:text-[#111827] hover:border-[#D1CFC7]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="py-2.5 text-xs font-mono uppercase tracking-wider text-[#1E3A8A] font-bold border-b-2 border-transparent hover:border-[#1E3A8A] flex items-center gap-1.5 whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>Admin Console</span>
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Main Editorial Page Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Authoritative Broadsheet Colophon Footer */}
      <footer className="border-t border-[#E5E4DF] bg-white py-6 mt-16 text-xs text-[#9CA3AF] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            IPS Wealth Engine | Daylight Broadsheet Standard | Zero-Float Double-Entry Ledger
          </div>
          <div className="flex items-center gap-4">
            <span>SEBI & PMLA Compliant</span>
            <span>AMFI Registered</span>
            <span>AES-256-GCM FLE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
