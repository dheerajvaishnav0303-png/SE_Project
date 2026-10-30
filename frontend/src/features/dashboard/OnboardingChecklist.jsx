import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export default function OnboardingChecklist({ steps, onDismiss }) {
  return (
    <div className="mb-6 p-4 bg-[#FFFFFF] border border-[#E5E4DF] rounded-none">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E4DF]">
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#111827]">
          Investor Onboarding Checklist
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[10px] font-mono text-[#6B7280] hover:text-[#111827]"
        >
          [ Dismiss ]
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            to={step.path}
            className={`p-2.5 border transition-colors flex items-center justify-between ${
              step.done
                ? 'border-[#0F5132]/30 bg-[#F4F9F5]'
                : 'border-[#E5E4DF] bg-[#FAF9F5] hover:border-[#1E3A8A]'
            }`}
          >
            <div className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-[#0F5132]" />
              ) : (
                <Circle className="w-4 h-4 text-[#9CA3AF]" />
              )}
              <span className={`text-xs font-mono ${step.done ? 'text-[#0F5132] font-medium line-through' : 'text-[#111827]'}`}>
                {step.title}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-[#6B7280]" />
          </Link>
        ))}
      </div>
    </div>
  );
}

