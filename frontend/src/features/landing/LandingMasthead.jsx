import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowUpRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function LandingMasthead() {
  const { user, isAuthenticated, demoLogin } = useAuthStore();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleDemoInvestor = async () => {
    try {
      setLoadingDemo(true);
      const loggedUser = await demoLogin('investor');
      if (loggedUser) {
        navigate('/dashboard');
      }
    } catch {
      navigate('/login');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-[#E5E4DF] font-sans">
      {/* 1. Live Index Micro-Ticker Ribbon */}
      <div className="border-b border-[#E5E4DF] bg-white py-1.5 px-4 text-[10px] font-mono tracking-wider text-[#4B5563] overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#0F5132]" />
              <strong className="text-[#111827]">MARKETS OPEN</strong>
            </span>
            <span>NIFTY 50: <span className="tabular-nums text-[#0F5132] font-semibold">24,840.15 (+0.64%)</span></span>
            <span>10Y G-SEC: <span className="tabular-nums text-[#111827] font-semibold">6.82%</span></span>
            <span>24K GOLD (10G): <span className="tabular-nums text-[#111827] font-semibold">₹76,420</span></span>
            <span>CPI INFLATION: <span className="tabular-nums text-[#991B1B] font-semibold">5.40%</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[9px] uppercase tracking-widest text-[#9CA3AF]">
            <span>Double-Entry ACID Verified</span>
            <span>•</span>
            <span>SEBI Compliant</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Masthead Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Monogram Brand */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-[#0F5132]" />
          <Link to="/" className="text-base sm:text-lg font-serif font-semibold tracking-tight text-[#111827]">
            IPS <span className="text-[11px] font-mono uppercase tracking-widest text-[#4B5563]">// WEALTH LEDGER</span>
          </Link>
        </div>

        {/* Editorial Section Jump Links (Desktop) */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-mono uppercase tracking-wider text-[#4B5563]">
          <a href="#simulator" className="hover:text-[#111827] transition-colors">01. Simulator</a>
          <a href="#comparison" className="hover:text-[#111827] transition-colors">02. The Problem</a>
          <a href="#blueprints" className="hover:text-[#111827] transition-colors">03. Blueprints</a>
          <a href="#tax-xirr" className="hover:text-[#111827] transition-colors">04. Tax & XIRR</a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Link
              to={['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? '/admin/dashboard' : '/dashboard'}
              className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#111827] text-white hover:bg-[#1E3A8A] flex items-center gap-1.5"
            >
              <span>Ledger ({user?.firstName})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDemoInvestor}
                disabled={loadingDemo}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#0F5132] text-[#0F5132] hover:bg-[#0F5132] hover:text-white transition-colors"
                title="Log in directly as seeded demo investor"
              >
                {loadingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>1-Click Demo</span>
              </button>

              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#D1D5DB] text-[#111827] hover:bg-[#F3F1EC] transition-colors"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#111827] text-white hover:bg-[#0F5132] transition-colors"
              >
                Open Ledger
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

