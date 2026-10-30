import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

/**
 * Formats integer paise into standard Indian Rupee notation (e.g., ₹1,24,500.00)
 * @param {number|string} paise 
 * @returns {string} Formatted INR currency string
 */
export function formatPaise(paise) {
  if (paise === null || paise === undefined || isNaN(Number(paise))) {
    return '₹0.00';
  }

  const inRupees = new Decimal(paise).dividedBy(100).toNumber();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(inRupees);
}

/**
 * Compact Indian Lakhs / Crores notation for executive headers
 * @param {number|string} paise 
 * @returns {string} e.g. "₹4.82 Cr" or "₹18.40 L"
 */
export function formatCompactPaise(paise) {
  if (paise === null || paise === undefined || isNaN(Number(paise))) {
    return '₹0.00';
  }

  const rupees = Number(paise) / 100;
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  return formatPaise(paise);
}

/**
 * Formats rate decimals into signed percentages (e.g. 0.1842 -> "+18.42%")
 * @param {number} rate 
 * @param {boolean} [withSign=true] 
 * @returns {string}
 */
export function formatPercent(rate, withSign = true) {
  if (rate === null || rate === undefined || isNaN(Number(rate))) {
    return '0.00%';
  }

  const pct = Number(rate) * 100;
  const sign = withSign && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Formats units to exact 4 decimal places
 * @param {number|string} units 
 * @returns {string}
 */
export function formatUnits(units) {
  if (units === null || units === undefined) return '0.0000';
  return Number(units).toFixed(4);
}

/**
 * Formats ISO dates into dignified editorial strings (e.g. "29 Oct 2026")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats timestamp with exact hour and minute (e.g. "29 Oct 2026, 10:15 IST")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatDateTime(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`;
}

