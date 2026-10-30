import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Briefcase, 
  Compass, 
  Target, 
  Repeat, 
  Receipt, 
  ShieldCheck, 
  Settings,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const openHandler = () => setOpen(true);
    document.addEventListener('keydown', down);
    window.addEventListener('ips:open-search', openHandler);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('ips:open-search', openHandler);
    };
  }, []);

  const runCommand = (action) => {
    setOpen(false);
    action();
  };

  if (!open) return null;

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#111827]/40 backdrop-blur-[1px]"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-xl bg-white border border-[#E5E4DF] shadow-none overflow-hidden rounded-none">
        <Command label="Command Palette" className="w-full">
          <div className="flex items-center px-4 border-b border-[#E5E4DF] bg-[#FAF9F5]">
            <Search className="w-4 h-4 text-[#9CA3AF] mr-2 shrink-0" />
            <Command.Input
              placeholder="Search views, Jump to portfolio, Launch tools..."
              className="w-full py-3 bg-transparent text-sm text-[#111827] focus:outline-none placeholder:text-[#9CA3AF] font-sans"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-2 px-2 py-1 text-[10px] font-mono uppercase bg-white border border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors flex items-center gap-1 shrink-0"
              title="Close Search Palette"
            >
              <X className="w-3 h-3" />
              <span>Exit (ESC)</span>
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 divide-y divide-[#E5E4DF]">
            <Command.Empty className="py-6 text-center text-xs text-[#9CA3AF] font-mono">
              No results found matching query.
            </Command.Empty>

            <Command.Group heading="Views & Portfolios" className="py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-[#1E3A8A]" />
                <span>Executive Wealth Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/portfolio'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-[#1E3A8A]" />
                <span>Holdings & Tax-Lot X-Ray</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/marketplace'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#1E3A8A]" />
                <span>Curated Investment Plans Catalog</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/goals'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Target className="w-4 h-4 text-[#1E3A8A]" />
                <span>Goal Glidepath & Monte Carlo Studio</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/sips'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Repeat className="w-4 h-4 text-[#1E3A8A]" />
                <span>Step-Up SIP Mandate Manager</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Double-Entry Financial Accounting" className="py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] px-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/ledger'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-[#0F5132]" />
                <span>Double-Entry Immutable Ledger Journal</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center gap-3 px-3 py-2 text-xs text-[#111827] hover:bg-[#F4F2EB] cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#4B5563]" />
                <span>Account Security & Multi-Factor TOTP</span>
              </Command.Item>
              {isAdmin && (
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/admin/dashboard'))}
                  className="flex items-center gap-3 px-3 py-2 text-xs text-[#1E3A8A] font-semibold hover:bg-[#F4F2EB] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Institutional Operations Console</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 border-t border-[#E5E4DF] bg-[#FAF9F5] text-[10px] font-mono text-[#6B7280]">
            <span>Press ESC or click outside to dismiss</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2 py-0.5 bg-white border border-[#D1D5DB] text-[#991B1B] hover:bg-[#FEF2F2] flex items-center gap-1 uppercase font-semibold"
            >
              <X className="w-3 h-3" />
              <span>Close Search</span>
            </button>
          </div>
        </Command>
      </div>
    </div>
  );
}
