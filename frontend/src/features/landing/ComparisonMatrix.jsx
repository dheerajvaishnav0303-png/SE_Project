import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const comparisonRows = [
  {
    criterion: 'Inflation Reality',
    pain: 'Inflation Illusion',
    broker: 'Shows nominal target numbers. Ignores purchasing power erosion entirely.',
    excel: 'Requires complex custom NPV formulas that break on cashflow timing changes.',
    ips: 'Auto-adjusts future goals using official 5.5% CPI and category-specific inflation indices.',
  },
  {
    criterion: 'Return Accuracy',
    pain: 'Cashflow Timing Distortion',
    broker: 'Quotes misleading point-to-point absolute gains that hide timing of SIP deposits.',
    excel: 'Manual XIRR cells frequently produce #NUM! errors on irregular dates.',
    ips: 'True Newton-Raphson XIRR benchmarked dynamically against NIFTY 50 TRI.',
  },
  {
    criterion: 'Tax Optimization',
    pain: 'Tax Drag & Leakage',
    broker: 'Blind redemptions trigger surprise 20% STCG taxes and missed harvesting windows.',
    excel: 'Tracking FIFO buy lots manually across years is virtually impossible.',
    ips: 'Automated FIFO tax-lot queues segregating STCG (<365d) and LTCG with harvest alerts.',
  },
  {
    criterion: 'Goal Safety',
    pain: 'Market Crash at Retirement',
    broker: 'Keeps 100% equity until day zero, risking a 30% crash right before college or retirement.',
    excel: 'Requires active manual rebalancing that emotional investors almost never execute.',
    ips: 'Automated 24-month Safety Glidepath systematically shifting equity into sovereign liquid debt.',
  },
  {
    criterion: 'Ledger Integrity',
    pain: 'Data Corruption & Drift',
    broker: 'Opaque proprietary black boxes with no auditable ledger traces.',
    excel: 'Accidental formula edits or overwritten cells corrupt historical accounting.',
    ips: 'Double-entry ACID transaction architecture writing balanced debits and credits in minor paise.',
  },
];

export default function ComparisonMatrix() {
  return (
    <section id="comparison" className="border-b border-[#E5E4DF] bg-[#FAF9F5] py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#991B1B]" />
            <span>01 // THE MARKET REALITY COMPARISON</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#111827] tracking-tight">
            Why consumer trading apps and spreadsheets fail serious planners.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
            Standard brokerage apps are engineered for daily trading dopamine. Financial spreadsheets are fragile and error-prone. IPS operates as an immutable double-entry institutional ledger.
          </p>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden md:block border border-[#E5E4DF] bg-white overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E4DF] bg-[#FAF9F5] font-mono text-[10px] uppercase tracking-wider text-[#4B5563]">
                <th className="py-3.5 px-4 w-1/4 border-r border-[#E5E4DF]">System Dimension</th>
                <th className="py-3.5 px-4 w-1/4 border-r border-[#E5E4DF] text-[#991B1B]">Retail Broker Apps</th>
                <th className="py-3.5 px-4 w-1/4 border-r border-[#E5E4DF] text-[#4B5563]">Manual Spreadsheets</th>
                <th className="py-3.5 px-4 w-1/4 bg-[#0F5132]/5 text-[#0F5132] font-bold">IPS Wealth Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F5]/70 transition-colors">
                  <td className="py-4 px-4 border-r border-[#E5E4DF] font-medium text-[#111827]">
                    <div>{row.criterion}</div>
                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{row.pain}</div>
                  </td>
                  <td className="py-4 px-4 border-r border-[#E5E4DF] text-[#6B7280] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-[#991B1B] shrink-0 mt-0.5" />
                      <span>{row.broker}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-[#E5E4DF] text-[#6B7280] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                      <span>{row.excel}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 bg-[#0F5132]/5 text-[#111827] leading-relaxed font-sans">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5132] shrink-0 mt-0.5" />
                      <span className="font-medium text-[#0F5132]">{row.ips}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Accordion / Cards (< 768px) */}
        <div className="md:hidden space-y-4 font-sans text-xs">
          {comparisonRows.map((row, idx) => (
            <div key={idx} className="border border-[#E5E4DF] bg-white p-4">
              <div className="font-semibold text-sm text-[#111827] mb-0.5">{row.criterion}</div>
              <div className="text-[10px] font-mono text-[#9CA3AF] mb-3">{row.pain}</div>

              <div className="space-y-2 border-t border-[#E5E4DF] pt-3 text-xs leading-relaxed">
                <div className="text-[#6B7280] pl-2 border-l-2 border-[#991B1B]">
                  <strong className="text-[#991B1B] block font-mono text-[10px] uppercase">Broker Apps:</strong>
                  {row.broker}
                </div>
                <div className="text-[#6B7280] pl-2 border-l-2 border-[#B45309]">
                  <strong className="text-[#B45309] block font-mono text-[10px] uppercase">Excel:</strong>
                  {row.excel}
                </div>
                <div className="text-[#111827] pl-2 border-l-2 border-[#0F5132] bg-[#FAF9F5] p-2">
                  <strong className="text-[#0F5132] block font-mono text-[10px] uppercase">IPS Ledger:</strong>
                  {row.ips}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
