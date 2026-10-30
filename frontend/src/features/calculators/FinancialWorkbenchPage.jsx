import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPaise } from '../../lib/formatters';
import { EditorialHeader } from '../../components/ui/EditorialHeader';
import InfoTooltip from '../../components/ui/InfoTooltip';
import { ArrowRight } from 'lucide-react';
import { InflationTab, FireTab } from './InflationAndFireTabs';

export default function FinancialWorkbenchPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STEP_UP');

  const [initialMonthly, setInitialMonthly] = useState(25000);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [tenureYears, setTenureYears] = useState(15);
  const [expectedReturn, setExpectedReturn] = useState(12);

  const computeSchedule = () => {
    let currentMonthly = initialMonthly;
    let totalInvested = 0;
    let accumulated = 0;
    const monthlyRate = expectedReturn / 100 / 12;
    const rows = [];

    for (let yr = 1; yr <= tenureYears; yr++) {
      let annualInvest = 0;
      for (let m = 1; m <= 12; m++) {
        accumulated = (accumulated + currentMonthly) * (1 + monthlyRate);
        annualInvest += currentMonthly;
        totalInvested += currentMonthly;
      }
      rows.push({
        year: yr,
        monthly: Math.round(currentMonthly),
        annualInvest: Math.round(annualInvest),
        totalInvested: Math.round(totalInvested),
        wealth: Math.round(accumulated),
      });
      currentMonthly *= (1 + stepUpPct / 100);
    }
    return rows;
  };

  const schedule = computeSchedule();
  const terminalWealth = schedule[schedule.length - 1]?.wealth || 0;
  const totalInvested = schedule[schedule.length - 1]?.totalInvested || 0;

  return (
    <div>
      <EditorialHeader
        title="5-in-1 Financial Quantitative Workbench"
        subtitle="Analytical compounding simulations, purchasing-power inflation models, and safe withdrawal planning."
      />

      <div className="flex border-b border-[#E5E4DF] mb-6 space-x-4">
        {[
          { key: 'STEP_UP', label: 'Step-Up SIP Amortization' },
          { key: 'INFLATION', label: 'Purchasing-Power Decay' },
          { key: 'FIRE', label: 'FIRE Freedom Corpus' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[#1E3A8A] text-[#111827]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'STEP_UP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border border-[#E5E4DF] bg-white text-xs">
            <div>
              <label className="text-[10px] font-mono uppercase text-[#4B5563] block mb-1">
                Monthly SIP (₹)
              </label>
              <input
                type="number"
                value={initialMonthly}
                onChange={(e) => setInitialMonthly(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#E5E4DF] font-mono tabular-nums text-sm font-semibold bg-white"
              />
              <div className="flex gap-1 mt-1.5">
                {[5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialMonthly(amt)}
                    className="px-1.5 py-0.5 text-[9px] font-mono bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#E5E7EB]"
                  >
                    ₹{amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-[#4B5563] block mb-1">
                Annual Step-Up (%)
              </label>
              <input
                type="number"
                value={stepUpPct}
                onChange={(e) => setStepUpPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#E5E4DF] font-mono tabular-nums text-sm font-semibold bg-white"
              />
              <div className="flex gap-1 mt-1.5">
                {[5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setStepUpPct(pct)}
                    className="px-1.5 py-0.5 text-[9px] font-mono bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#E5E7EB]"
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-[#4B5563] block mb-1">
                Horizon (Years)
              </label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#E5E4DF] font-mono tabular-nums text-sm font-semibold bg-white"
              />
              <div className="flex gap-1 mt-1.5">
                {[5, 10, 15, 20].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTenureYears(yr)}
                    className="px-1.5 py-0.5 text-[9px] font-mono bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#E5E7EB]"
                  >
                    {yr}y
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-[#4B5563] block mb-1">
                Expected Return (%)
              </label>
              <input
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#E5E4DF] font-mono tabular-nums text-sm font-semibold bg-white"
              />
              <div className="flex gap-1 mt-1.5">
                {[10, 12, 15].map((ret) => (
                  <button
                    key={ret}
                    type="button"
                    onClick={() => setExpectedReturn(ret)}
                    className="px-1.5 py-0.5 text-[9px] font-mono bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#E5E7EB]"
                  >
                    {ret}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#FAF9F5] border border-[#E5E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono tabular-nums">
            <div>
              <span className="text-[10px] text-[#9CA3AF] uppercase block">Terminal Projected Wealth</span>
              <span className="text-2xl font-bold text-[#0F5132]">{formatPaise(terminalWealth * 100)}</span>
              <span className="text-xs text-[#4B5563] ml-2">
                (Total Invested: {formatPaise(totalInvested * 100)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/marketplace?monthly=${initialMonthly}&stepUp=${stepUpPct}`)}
              className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111827] transition-colors flex items-center gap-2"
            >
              <span>Convert Calculation to Active SIP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-[#E5E4DF] bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead className="bg-[#FAF9F5] border-b border-[#E5E4DF] text-[10px] uppercase text-[#4B5563]">
                <tr>
                  <th className="py-2.5 px-4">Year</th>
                  <th className="py-2.5 px-4 text-right">Monthly Installment</th>
                  <th className="py-2.5 px-4 text-right">Annual Investment</th>
                  <th className="py-2.5 px-4 text-right">Cumulative Invested</th>
                  <th className="py-2.5 px-4 text-right">End-of-Year Wealth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF]">
                {schedule.map((row) => (
                  <tr key={row.year} className="hover:bg-[#FAF9F5]">
                    <td className="py-2.5 px-4 font-sans font-medium text-[#111827]">Year {row.year}</td>
                    <td className="py-2.5 px-4 text-right text-[#4B5563]">{formatPaise(row.monthly * 100)}</td>
                    <td className="py-2.5 px-4 text-right text-[#4B5563]">{formatPaise(row.annualInvest * 100)}</td>
                    <td className="py-2.5 px-4 text-right text-[#111827] font-medium">{formatPaise(row.totalInvested * 100)}</td>
                    <td className="py-2.5 px-4 text-right text-[#0F5132] font-semibold">{formatPaise(row.wealth * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'INFLATION' && <InflationTab />}

      {activeTab === 'FIRE' && <FireTab />}
    </div>
  );
}
