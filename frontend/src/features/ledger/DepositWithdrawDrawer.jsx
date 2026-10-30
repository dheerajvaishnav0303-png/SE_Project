import React from 'react';
import { formatPaise } from '../../lib/formatters';
import { SlideOverSheet } from '../../components/ui/SlideOverSheet';

export default function DepositWithdrawDrawer({
  mode,
  onClose,
  walletBalancePaise,
  twoFactorEnabled,
  amountRupees,
  setAmountRupees,
  mfaToken,
  setMfaToken,
  onSubmit,
  isPending,
}) {
  if (!mode) return null;

  return (
    <SlideOverSheet
      isOpen={!!mode}
      onClose={onClose}
      title={mode === 'DEPOSIT' ? 'Deposit Fiat Capital' : 'Initiate Withdrawal Payout'}
      subtitle={`Current Wallet Balance: ${formatPaise(walletBalancePaise)}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase text-[#4B5563] mb-1">Amount (₹)</label>
          <input
            type="number"
            min="100"
            step="100"
            required
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E4DF] text-sm font-mono tabular-nums text-[#111827] bg-white"
          />
          {mode === 'DEPOSIT' && (
            <div className="flex gap-1.5 mt-2">
              {[1000, 5000, 10000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountRupees(amt.toString())}
                  className="px-2 py-0.5 text-[10px] font-mono bg-[#FAF9F5] border border-[#E5E4DF] hover:bg-[#E5E7EB]"
                >
                  +₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
        {mode === 'WITHDRAW' && twoFactorEnabled && (
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#B45309] mb-1">TOTP Step-Up Code</label>
            <input
              type="text"
              placeholder="6-digit TOTP"
              maxLength={6}
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              className="w-full px-3 py-2 border border-[#B45309] text-xs font-mono text-[#111827] bg-white"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={`w-full mt-4 py-2.5 text-white text-xs font-mono uppercase tracking-wider ${
            mode === 'DEPOSIT' ? 'bg-[#0F5132] hover:bg-[#111827]' : 'bg-[#991B1B] hover:bg-[#111827]'
          }`}
        >
          {isPending ? 'Processing...' : mode === 'DEPOSIT' ? 'Confirm Deposit' : 'Request Payout'}
        </button>
      </form>
    </SlideOverSheet>
  );
}

