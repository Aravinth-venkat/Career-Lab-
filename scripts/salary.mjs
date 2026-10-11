// Pay ranges that companies publish in their own job posts (structured fields, or an Indian rupee range written in the text).
// Only rupee amounts are kept, as lakh per year (LPA). Nothing is guessed: a job without a published range has none.
import { normCity } from './insights.mjs';
import { fieldOf, FIELDS } from './seo-pages.mjs';
const r1 = n => Math.round(n * 10) / 10;
export const toLpa = (amt, interval) => { const a = +amt; if (!isFinite(a) || a <= 0) return null; const i = String(interval || 'year').toLowerCase(); const yr = /month/.test(i) ? a * 12 : /hour|day|week/.test(i) ? null : a; return yr === null ? null : r1(yr / 1e5); };
export const plausible = (lo, hi) => lo != null && hi != null && lo >= 1 && hi <= 400 && hi >= lo && hi / lo <= 4;
const pair = (lo, hi) => plausible(lo, hi) ? [lo, hi] : null;
export const fromGreenhouse = x => { for (const r of (x && x.pay_input_ranges) || []) if (r && r.currency_type === 'INR') { const p = pair(toLpa(r.min_cents / 100, 'year'), toLpa(r.max_cents / 100, 'year')); if (p) return p; } return null; };
export const fromLever = x => { const s = x && x.salaryRange; return s && s.currency === 'INR' ? pair(toLpa(s.min, s.interval), toLpa(s.max, s.interval)) : null; };
export const fromAshby = x => { for (const c of (x && x.compensation && x.compensation.summaryComponents) || []) if (c && c.currencyCode === 'INR' && /salary/i.test(c.compensationType || 'salary')) { const p = pair(toLpa(c.minValue, c.interval), toLpa(c.maxValue, c.interval)); if (p) return p; } return null; };
const UNIT = /^(lpa|lakhs?|lacs?|l|cr|crores?)$/i, num = s => +String(s).replace(/,/g, '');
const val = (n, u) => { if (!isFinite(n)) return null; if (u && /^cr/i.test(u)) return n * 100; if (u && UNIT.test(u)) return n; return n >= 100000 ? n / 1e5 : null; };
export function fromText(text) {
  const t = String(text || '');
  let m = /(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?|l\b|cr\b|crores?)?\s*(?:-|–|—|to)\s*(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(lpa|lakhs?|lacs?|l\b|cr\b|crores?)?/i.exec(t);
  if (m) { const u2 = m[4] || m[2], p = pair(val(num(m[1]), m[2] || u2), val(num(m[3]), u2)); if (p) return p; }
  m = /\b(\d{1,3}(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d{1,3}(?:\.\d+)?)\s*(lpa|lakhs?|lacs?)\b/i.exec(t);
  if (m) { const p = pair(+m[1], +m[2]); if (p) return p; }
  return null;
}
const median = a => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const round5 = n => Math.round(n * 2) / 2;
export function buildSalary(jobs, now = Date.now()) {
  const open = jobs.filter(j => !j.x && Array.isArray(j.sa) && j.sa.length === 2);
  const sum = list => list.length >= 3 ? { n: list.length, lo: round5(median(list.map(j => j.sa[0]))), hi: round5(median(list.map(j => j.sa[1]))) } : null;
  const fields = {}, combos = {};
  for (const [id] of FIELDS) { const l = open.filter(j => fieldOf(j.t) === id), s = sum(l); if (s) fields[id] = s; for (const c of new Set(l.map(j => normCity(j.l)).filter(Boolean))) { const sc = sum(l.filter(j => normCity(j.l) === c)); if (sc) combos[id + '|' + c] = sc; } }
  return { updated: now, withPay: open.length, fields, combos };
}
