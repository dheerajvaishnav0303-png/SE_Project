import React, { useState, useRef, useEffect } from 'react';

const GLOSSARY = {
  XIRR: {
    term: 'XIRR (Extended Internal Rate of Return)',
    definition:
      'Annualized compounded return accounting for the exact dates and amounts of every deposit, SIP installment, and withdrawal. Unlike simple CAGR, it reflects your real investor dollar return.',
  },
  TWR: {
    term: 'TWR (Time-Weighted Return)',
    definition:
      'The pure compound growth rate of your underlying investments, independent of when you added or withdrew capital. Used to evaluate pure strategy performance.',
  },
  STCG: {
    term: 'STCG (Short-Term Capital Gains)',
    definition:
      'Profits on equity held under 12 months (taxed at 20% under Finance Act 2024) or debt held under 36 months taxed at applicable slab rate.',
  },
  LTCG: {
    term: 'LTCG (Long-Term Capital Gains)',
    definition:
      'Profits on equity holdings older than 12 months, taxed at 12.5% for gains exceeding ₹1.25 Lakhs per financial year.',
  },
  SHARPE: {
    term: 'Sharpe Ratio',
    definition:
      'Measures excess portfolio return per unit of volatility relative to the risk-free rate. A ratio > 1.0 indicates attractive risk-adjusted performance.',
  },
  DRIFT: {
    term: 'Allocation Drift',
    definition:
      'The percentage variance between your actual equity/debt weights and your target mandate caused by market movements. A drift > 5% warrants rebalancing.',
  },
  P10_P50_P90: {
    term: 'Monte Carlo Confidence Range',
    definition:
      'P10 represents conservative stress-tested capital (90% probability of achieving), P50 is the median outcome, and P90 is the top-decile bull market trajectory.',
  },
};

export default function InfoTooltip({ termKey, title, children, content }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const entry = termKey && GLOSSARY[termKey] ? GLOSSARY[termKey] : null;
  const header = title || entry?.term || 'Financial Terminology';
  const explanation = content || entry?.definition || 'Explanation of this financial metric.';

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center ml-1" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={`Explain ${header}`}
        className="inline-flex items-center justify-center w-3.5 h-3.5 text-[10px] font-mono font-medium text-[#6B7280] hover:text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-none focus:outline-none transition-colors cursor-help"
      >
        ?
      </button>

      {isOpen && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-72 p-2.5 bg-[#FFFFFF] border border-[#E5E4DF] shadow-md text-left pointer-events-none rounded-none"
        >
          <span className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#111827] border-b border-[#E5E4DF] pb-1 mb-1.5">
            {header}
          </span>
          <span className="block text-[12px] text-[#4B5563] leading-relaxed font-sans normal-case">
            {explanation}
          </span>
          {children && <span className="block mt-1.5 pt-1 border-t border-[#F3F4F6]">{children}</span>}
        </span>
      )}
    </span>
  );
}

