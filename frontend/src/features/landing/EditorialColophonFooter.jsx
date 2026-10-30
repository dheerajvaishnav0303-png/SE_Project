import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

export default function EditorialColophonFooter() {
  const { demoLogin } = useAuthStore();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);

  const handleDemo = async (role) => {
    try {
      setLoadingRole(role);
      await demoLogin(role);
      navigate(role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch {
      navigate('/login');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <footer id="tax-xirr" className="border-t border-[#E5E4DF] bg-[#FAF9F5] py-14 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Status Strip */}
        <div className="border border-[#E5E4DF] bg-white p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#0F5132] animate-pulse" />
            <span className="font-semibold text-[#111827]">
              SYSTEM OPERATIONAL // ZERO-FLOAT ACID LEDGER ACTIVE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDemo('investor')}
              disabled={Boolean(loadingRole)}
              className="px-3 py-1.5 border border-[#111827] text-[#111827] uppercase text-[10px] tracking-wider hover:bg-[#111827] hover:text-white transition-colors"
            >
              {loadingRole === 'investor' ? 'Logging in...' : '1-Click Demo Investor'}
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              disabled={Boolean(loadingRole)}
              className="px-3 py-1.5 border border-[#1E3A8A] text-[#1E3A8A] uppercase text-[10px] tracking-wider hover:bg-[#1E3A8A] hover:text-white transition-colors"
            >
              {loadingRole === 'admin' ? 'Logging in...' : '1-Click Demo Admin Console'}
            </button>
          </div>
        </div>

        {/* 4-Column Broadsheet Footer Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs font-mono">
          <div>
            <div className="font-serif text-base font-semibold text-[#111827] mb-3">
              IPS // Wealth Ledger
            </div>
            <p className="text-[#6B7280] font-sans leading-relaxed text-xs">
              Institutional-grade wealth planning engine replacing speculative noise with verifiable mathematical compounding.
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider mb-3">
              System Modules
            </div>
            <ul className="space-y-1.5 text-[#4B5563]">
              <li><Link to="/marketplace" className="hover:text-[#111827]">Direct Mutual Fund Catalog</Link></li>
              <li><Link to="/sips" className="hover:text-[#111827]">10% Step-Up SIP Mandates</Link></li>
              <li><Link to="/goals" className="hover:text-[#111827]">24-Month Safety Glidepaths</Link></li>
              <li><Link to="/calculators" className="hover:text-[#111827]">Newton-Raphson XIRR Engine</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider mb-3">
              Institutional Security
            </div>
            <ul className="space-y-1.5 text-[#4B5563]">
              <li>AES-256-GCM Field Encryption</li>
              <li>Zero Floating Point (Paise Units)</li>
              <li>Double-Entry Ledger Integrity</li>
              <li>Strict HttpOnly Cookie Auth</li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider mb-3">
              Direct Access
            </div>
            <div className="space-y-2">
              <Link
                to="/register"
                className="block text-center py-2 bg-[#111827] text-white uppercase text-[10px] tracking-wider hover:bg-[#0F5132]"
              >
                Open Institutional Account →
              </Link>
              <Link
                to="/login"
                className="block text-center py-2 border border-[#D1D5DB] text-[#4B5563] uppercase text-[10px] tracking-wider hover:bg-white"
              >
                Sign In to Existing Ledger
              </Link>
            </div>
          </div>
        </div>

        {/* Regulatory Colophon Line */}
        <div className="border-t border-[#E5E4DF] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-[#9CA3AF]">
          <div>
            © 2026 IPS Wealth Management Engine. Built under the Daylight Broadsheet Standard.
          </div>
          <div className="flex items-center gap-4">
            <span>SEBI Regulations 2024</span>
            <span>AMFI Code of Conduct</span>
            <span>Zero Dark Patterns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

