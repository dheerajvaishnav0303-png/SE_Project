import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowRight, ShieldCheck, TrendingUp, Layers, Check, Loader2 } from 'lucide-react';

function formatInr(val) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export default function LandingHeroWithSimulator() {
  const [monthlySip, setMonthlySip] = useState(25000);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [years, setYears] = useState(15);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const navigate = useNavigate();
  const { demoLogin } = useAuthStore();

  const handleInstantDemo = async () => {
    try {
      setLoadingDemo(true);
      await demoLogin('investor');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    } finally {
      setLoadingDemo(false);
    }
  };

  const sim = useMemo(() => {
    const months = years * 12;
    const r = 0.12 / 12; // 12% nominal annual return
    const inflation = 0.055; // 5.5% annual CPI inflation

    let flatCorpus = 0;
    let flatInvested = 0;
    for (let m = 0; m < months; m++) {
      flatCorpus = (flatCorpus + monthlySip) * (1 + r);
      flatInvested += monthlySip;
    }

    let stepUpCorpus = 0;
    let stepUpInvested = 0;
    let currentP = monthlySip;
    for (let m = 0; m < months; m++) {
      if (m > 0 && m % 12 === 0) currentP = currentP * (1 + stepUpPct / 100);
      stepUpCorpus = (stepUpCorpus + currentP) * (1 + r);
      stepUpInvested += currentP;
    }

    const realPower = stepUpCorpus / Math.pow(1 + inflation, years);
    const extraWealth = Math.max(0, stepUpCorpus - flatCorpus);
    const gains = Math.max(0, stepUpCorpus - stepUpInvested);

    return { flatCorpus, stepUpCorpus, stepUpInvested, realPower, extraWealth, gains };
  }, [monthlySip, stepUpPct, years]);

  const gainsPct = Math.round((sim.gains / sim.stepUpCorpus) * 100) || 50;
  const principalPct = 100 - gainsPct;

  return (
    <section id="simulator" className="border-b border-[#E5E4DF] bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Narrative (7 Columns) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 lg:border-r border-[#E5E4DF] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest bg-white border border-[#E5E4DF] text-[#4B5563] mb-6">
              <span className="w-1.5 h-1.5 bg-[#0F5132]" />
              <span>ISSUE NO. 01 — INSTITUTIONAL RETAIL WEALTH PLANNING</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-serif font-normal text-[#111827] leading-[1.08] tracking-tight">
              Stop trading in the dark. Plan wealth on an honest ledger.
            </h1>

            <p className="mt-6 text-sm sm:text-base text-[#4B5563] font-sans leading-relaxed max-w-xl">
              Replace casino-style broker notifications and fragile spreadsheets. IPS calculates true Newton-Raphson XIRR, automates 10% annual Step-Up SIPs, tracks FIFO STCG/LTCG tax lots, and shifts to liquid debt before market crashes hit your goal dates.
            </p>

            {/* Action Strip */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-6 py-3.5 bg-[#111827] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#0F5132] transition-colors flex items-center justify-center gap-2 rounded-none"
              >
                <span>Launch Your Wealth Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleInstantDemo}
                disabled={loadingDemo}
                className="px-5 py-3.5 bg-white border border-[#D1D5DB] text-[#111827] text-xs font-mono uppercase tracking-wider hover:bg-[#F3F1EC] transition-colors flex items-center justify-center gap-2 rounded-none"
              >
                {loadingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-[#0F5132]" />}
                <span>Explore Instant Live Demo</span>
              </button>
            </div>
          </div>

          {/* Micro-Trust Hairline Strip */}
          <div className="mt-12 pt-6 border-t border-[#E5E4DF] grid grid-cols-3 gap-4 text-xs font-mono text-[#6B7280]">
            <div>
              <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider">Accounting</div>
              <div className="font-semibold text-[#111827] mt-0.5">ACID Balanced</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider">Tax Tracking</div>
              <div className="font-semibold text-[#111827] mt-0.5">FIFO Lots</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#9CA3AF] tracking-wider">De-Risking</div>
              <div className="font-semibold text-[#111827] mt-0.5">24m Glidepath</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Sandbox (5 Columns) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 border-[#E5E4DF]">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-3 mb-6">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0F5132]" />
                Live Wealth & Inflation Sandbox
              </span>
              <span className="text-[10px] font-mono text-[#9CA3AF]">12% CAGR Assumed</span>
            </div>

            {/* Slider 1: Monthly SIP */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6B7280] uppercase text-[10px]">Monthly SIP Mandate</span>
                <span className="font-semibold text-[#111827] tabular-nums">₹{monthlySip.toLocaleString('en-IN')}/mo</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full accent-[#111827] cursor-pointer"
              />
            </div>

            {/* Slider 2: Annual Step-Up */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6B7280] uppercase text-[10px]">Annual Step-Up Increment</span>
                <span className="font-semibold text-[#0F5132] tabular-nums">+{stepUpPct}% / year</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setStepUpPct(pct)}
                    className={`py-1 text-xs font-mono border transition-colors ${
                      stepUpPct === pct ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#4B5563] border-[#D1D5DB] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    {pct === 0 ? 'Flat (0%)' : `+${pct}% Step`}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Time Horizon */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6B7280] uppercase text-[10px]">Compounding Horizon</span>
                <span className="font-semibold text-[#111827] tabular-nums">{years} Years</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[#111827] cursor-pointer"
              />
            </div>

            {/* Live Computed Metrics */}
            <div className="border border-[#E5E4DF] bg-[#FAF9F5] p-4 space-y-3 font-mono">
              <div className="flex justify-between items-baseline border-b border-[#E5E4DF] pb-2">
                <span className="text-xs text-[#4B5563]">Step-Up Target Corpus:</span>
                <span className="text-lg font-bold text-[#0F5132] tabular-nums">
                  {formatInr(sim.stepUpCorpus)}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Vs. Standard Flat SIP:</span>
                <span className="text-[#4B5563] line-through tabular-nums">{formatInr(sim.flatCorpus)}</span>
              </div>

              {stepUpPct > 0 && (
                <div className="flex justify-between text-xs text-[#0F5132] font-semibold">
                  <span>Extra Wealth from Step-Up:</span>
                  <span className="tabular-nums">+{formatInr(sim.extraWealth)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-[#991B1B] pt-1 border-t border-[#E5E4DF]">
                <span>Today's Real Purchasing Power (5.5% CPI):</span>
                <span className="tabular-nums font-semibold">{formatInr(sim.realPower)}</span>
              </div>

              {/* Stacked Breakdown Bar */}
              <div className="pt-2">
                <div className="h-2.5 w-full flex overflow-hidden border border-[#D1D5DB]">
                  <div style={{ width: `${principalPct}%` }} className="bg-[#4B5563]" title="Principal Invested" />
                  <div style={{ width: `${gainsPct}%` }} className="bg-[#0F5132]" title="Compounding Returns" />
                </div>
                <div className="flex justify-between text-[10px] text-[#6B7280] mt-1">
                  <span>Principal: {formatInr(sim.stepUpInvested)} ({principalPct}%)</span>
                  <span>Gains: {formatInr(sim.gains)} ({gainsPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full mt-6 py-3 bg-[#111827] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#1E3A8A] transition-colors rounded-none"
          >
            Lock In This Plan & Create Account →
          </button>
        </div>
      </div>
    </section>
  );
}
