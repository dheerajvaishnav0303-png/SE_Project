import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { CommandPalette } from '../ui/CommandPalette';
import { formatCompactPaise } from '../../lib/formatters';
import { Search, LogOut, Shield, LayoutDashboard, PieChart, Target, Repeat, Calculator, Menu, X } from 'lucide-react';

export function EditorialShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/portfolio', label: 'Portfolio', icon: PieChart },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/sips', label: 'SIPs', icon: Repeat },
    { to: '/calculators', label: 'Calculators', icon: Calculator },
    { to: '/ledger', label: 'Ledger' },
    { to: '/settings', label: 'Settings' },
  ];

  const mobileTabs = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/portfolio', label: 'Holdings', icon: PieChart },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/sips', label: 'SIPs', icon: Repeat },
    { to: '/calculators', label: 'Workbench', icon: Calculator },
  ];

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role);
  const monogram = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'S'}`;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#111827] flex flex-col font-sans">
      <CommandPalette />

      {/* Admin Mode Floating Announcement Bar */}
      {isAdmin && (
        <div className="bg-[#1E3A8A] text-white text-[11px] font-mono py-1.5 px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ADMIN PREVIEW: Viewing as retail investor.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="px-2 py-0.5 bg-white text-[#1E3A8A] font-bold uppercase tracking-wider text-[10px] hover:bg-[#FAF9F5]"
          >
            Open Admin Console →
          </button>
        </div>
      )}

      {/* 1. Institutional Topmast Header */}
      <header className="border-b border-[#E5E4DF] bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#0F5132] inline-block shrink-0" title="Settlement Engine Active" />
              <NavLink to="/dashboard" className="text-lg sm:text-xl font-serif font-medium tracking-tight text-[#111827]">
                IPS <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#4B5563]">Wealth</span>
              </NavLink>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hidden md:flex px-2.5 py-1 bg-[#1E3A8A] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#111827] items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ips:open-search'))}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-[#4B5563] bg-[#FAF9F5] border border-[#E5E4DF] hover:border-[#D1CFC7]"
              >
                <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span className="text-[11px]">Search</span>
                <kbd className="text-[10px] font-mono border border-[#E5E4DF] px-1 bg-white">⌘K</kbd>
              </button>

              {user?.walletBalancePaise !== undefined && (
                <div className="text-right">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#9CA3AF] block leading-none">
                    Wallet
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#111827]">
                    {formatCompactPaise(user.walletBalancePaise)}
                  </span>
                </div>
              )}

              <div
                className="w-7 h-7 bg-[#F4F2EB] border border-[#E5E4DF] flex items-center justify-center text-xs font-mono font-semibold text-[#111827] select-none"
                title={`${user?.firstName} ${user?.lastName}`}
              >
                {monogram}
              </div>

              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex p-1.5 text-[#4B5563] hover:text-[#991B1B] hover:bg-[#FAF9F5]"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Sub-Navigation Tabs */}
          <nav className="hidden md:flex space-x-6 overflow-x-auto no-scrollbar -mb-px">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `py-2.5 text-xs font-medium tracking-wide border-b-2 whitespace-nowrap ${
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

        {/* Mobile Slide-Down Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E4DF] bg-white px-4 py-3 space-y-2 font-mono text-xs">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 px-3 border ${isActive ? 'bg-[#FAF9F5] border-[#1E3A8A] text-[#1E3A8A] font-bold' : 'border-transparent text-[#4B5563]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/admin/dashboard'); }}
                className="w-full text-left py-2 px-3 bg-[#1E3A8A] text-white uppercase text-[10px] tracking-wider"
              >
                Admin Operations Console →
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left py-2 px-3 text-[#991B1B] border border-[#FEE2E2] bg-[#FEF2F2] uppercase text-[10px] tracking-wider"
            >
              Sign Out from Device
            </button>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Fixed Bottom Editorial Tab Bar on Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E4DF] flex items-center justify-around h-14 pb-safe select-none">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] border-t-2 transition-colors ${
                isActive
                  ? 'border-[#1E3A8A] text-[#1E3A8A] bg-[#FAF9F5]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-mono tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Desktop Colophon Footer */}
      <footer className="hidden md:block border-t border-[#E5E4DF] bg-white py-6 mt-16 text-xs text-[#9CA3AF] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>IPS Wealth Engine | Daylight Broadsheet Standard | Zero-Float Double-Entry Ledger</div>
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
