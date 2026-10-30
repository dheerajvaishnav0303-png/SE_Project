import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, ShieldCheck, Database, Calendar, Percent } from 'lucide-react';

const blueprints = [
  {
    id: 'xirr',
    num: '01',
    title: 'True Newton-Raphson XIRR & NIFTY Overlay',
    subtitle: 'Point-to-point absolute return is a lie when cashflows are staggered monthly.',
    tag: 'QUANT ENGINE',
    content: (
      <div className="space-y-4 font-mono text-xs">
        <div className="bg-[#FAF9F5] p-4 border border-[#E5E4DF]">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[#6B7280] text-[10px] uppercase">Portfolio Annualized XIRR</span>
            <span className="text-xl font-bold text-[#0F5132] tabular-nums">17.84%</span>
          </div>
          <div className="flex justify-between text-xs text-[#4B5563]">
            <span>Benchmark (NIFTY 50 TRI):</span>
            <span className="tabular-nums font-semibold">14.20%</span>
          </div>
          <div className="flex justify-between text-xs text-[#0F5132] pt-1">
            <span>Alpha Generated:</span>
            <span className="tabular-nums font-bold">+3.64%</span>
          </div>
        </div>
        <div className="text-[11px] text-[#4B5563] space-y-1 font-sans">
          <p>• Solves $f(r) = \sum \frac{C_t}{(1+r)^{t}} = 0$ using 100 iterations with 1e-7 convergence tolerance.</p>
          <p>• Corrects for SIP mandates placed during deep market pullbacks to credit true dollar-weighted alpha.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'glidepath',
    num: '02',
    title: 'Automated 24-Month Goal Crash Protection',
    subtitle: 'Equity compounding during accumulation; systematic sovereign de-risking near delivery.',
    tag: 'RISK CONTROL',
    content: (
      <div className="space-y-4 font-mono text-xs">
        <div className="border border-[#E5E4DF] bg-white p-3 space-y-3">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-[#111827]">College Corpus (Target: 2028)</span>
            <span className="text-[#0F5132] font-semibold">Glidepath Active (18m left)</span>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-[#6B7280] mb-1">
              <span>Accumulation Phase (Years 1-13)</span>
              <span>85% Equity / 15% Debt</span>
            </div>
            <div className="h-2 w-full flex border border-[#D1D5DB]">
              <div className="bg-[#0F5132] w-[85%]" />
              <div className="bg-[#1E3A8A] w-[15%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-[#6B7280] mb-1">
              <span>Terminal Safety Phase (Final 24 Months)</span>
              <span className="text-[#1E3A8A] font-bold">20% Equity / 80% G-Sec Liquid</span>
            </div>
            <div className="h-2 w-full flex border border-[#D1D5DB]">
              <div className="bg-[#0F5132] w-[20%]" />
              <div className="bg-[#1E3A8A] w-[80%]" />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-[#4B5563] font-sans">
          Prevents a sudden 30% black swan market drop from devastating your child's college tuition fee or house down-payment.
        </p>
      </div>
    ),
  },
  {
    id: 'fifo-tax',
    num: '03',
    title: 'FIFO Tax-Lot Segregation & Harvesting',
    subtitle: 'Track every buy lot to the exact day to capture ₹1.25L annual LTCG exemptions.',
    tag: 'TAX HARVESTING',
    content: (
      <div className="space-y-3 font-mono text-xs">
        <div className="border border-[#E5E4DF] bg-[#FAF9F5] p-3 text-[11px]">
          <div className="flex justify-between border-b border-[#E5E4DF] pb-1.5">
            <span>Lot #1: 420 days held</span>
            <span className="text-[#0F5132] font-semibold">LTCG (12.5% after ₹1.25L free)</span>
          </div>
          <div className="flex justify-between pt-1.5">
            <span>Lot #2: 140 days held</span>
            <span className="text-[#991B1B] font-semibold">STCG (20.0% flat tax)</span>
          </div>
        </div>
        <div className="bg-white p-3 border border-[#E5E4DF] text-[#0F5132] text-[11px] font-semibold flex items-center justify-between">
          <span>Identified Harvesting Opportunity:</span>
          <span>₹1,12,400 Tax-Free</span>
        </div>
      </div>
    ),
  },
  {
    id: 'double-entry',
    num: '04',
    title: 'Double-Entry ACID Minor-Unit Treasury',
    subtitle: 'Zero floating-point rounding errors. Every rupee is accounted for in minor paise.',
    tag: 'TREASURY INTEGRITY',
    content: (
      <div className="space-y-3 font-mono text-xs">
        <div className="bg-white border border-[#E5E4DF] p-3 text-[11px] space-y-1.5">
          <div className="flex justify-between text-[#111827]">
            <span>DEBIT: USER_INVESTMENT_LEDGER</span>
            <span className="tabular-nums font-semibold">+₹50,000.00</span>
          </div>
          <div className="flex justify-between text-[#4B5563]">
            <span>CREDIT: BANK_CLEARING_ACCOUNT</span>
            <span className="tabular-nums font-semibold">-₹50,000.00</span>
          </div>
          <div className="border-t border-[#E5E4DF] pt-1 flex justify-between text-[10px] text-[#0F5132]">
            <span>BALANCED ENTRY STATUS:</span>
            <span>NET ZERO DRIFT (OK)</span>
          </div>
        </div>
        <p className="text-[11px] text-[#4B5563] font-sans">
          Financial balances are stored as 64-bit integer paise with cryptographic sha-256 audit log indexing.
        </p>
      </div>
    ),
  },
];

export default function FeatureBlueprints() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="blueprints" className="border-b border-[#E5E4DF] bg-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#1E3A8A]" />
            <span>02 // ARCHITECTURAL SYSTEM BLUEPRINTS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#111827] tracking-tight">
            Designed like an institutional wealth engine, not a casino.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
            Every feature in IPS is grounded in financial mathematics and regulatory standards. Explore the core engines powering your wealth plan below.
          </p>
        </div>

        {/* Desktop Split View: Tab List on Left, Live Blueprint Visual on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#E5E4DF]">
          {/* Index Selector (5 Cols) */}
          <div className="lg:col-span-5 divide-y divide-[#E5E4DF] border-b lg:border-b-0 lg:border-r border-[#E5E4DF]">
            {blueprints.map((b, idx) => (
              <div
                key={b.id}
                onClick={() => setActiveTab(idx)}
                className={`p-5 cursor-pointer transition-colors ${
                  activeTab === idx ? 'bg-[#FAF9F5] border-l-4 border-l-[#111827]' : 'bg-white hover:bg-[#FAF9F5]/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF] mb-1">
                  <span>{b.num} // {b.tag}</span>
                  {activeTab === idx && <span className="text-[#111827] font-bold">ACTIVE</span>}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-medium text-[#111827]">
                  {b.title}
                </h3>
                <p className="text-xs text-[#4B5563] mt-1 font-sans line-clamp-2">
                  {b.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Inspection Frame (7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF9F5] p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-3 mb-6 font-mono text-xs">
                <span className="uppercase text-[#4B5563]">System Inspection: {blueprints[activeTab].title}</span>
                <span className="text-[#0F5132] font-semibold">● ENGINE READY</span>
              </div>
              <div className="bg-white p-6 border border-[#E5E4DF]">
                {blueprints[activeTab].content}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E4DF] flex justify-between items-center text-xs font-mono text-[#6B7280]">
              <span>Inspection View: 0{activeTab + 1} of 04</span>
              <a href="#simulator" className="text-[#1E3A8A] font-semibold hover:underline">
                Test in Live Simulator ↑
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

