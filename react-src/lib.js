// Shared logic for the React version. The money and PDF code is copied from the live site so both give the same numbers.
import D from '../../cl-src/js/content.js';
import C from '../../cl-src/js/core.js';
export { D, C };
const KEY = 'careerlab_v2';
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
export const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
export const yearsOf = s => { const l = s.lad || {}; if (l.years !== undefined && l.years !== '') return +l.years; const m = String(s.resume || '').match(/(\d{1,2})\+?\s*(?:years|yrs)/gi); if (!m) return s.resume ? 0 : null; return Math.min(40, Math.max(...m.map(x => parseInt(x)))); };
export const modeOf = s => { const y = yearsOf(s); return y === null || y === undefined ? 'new' : y < 1 ? 'fresher' : y < 3 ? 'exp' : 'senior'; };
export const R = n => '₹' + Math.round(n).toLocaleString('en-IN');
// Income tax for a year, FY 2025-26 rules. Includes 4% cess and the 87A rebate. Surcharge for very high pay is not included.
function slabTax(inc, sl) { let t = 0, prev = 0; for (const [lim, r] of sl) { if (inc > prev) t += (Math.min(inc, lim) - prev) * r; prev = lim; } return t; }
const NEW = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
const OLD = [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]];
function tax(gross, regime, ded) {
  let ti, t;
  if (regime === 'old') { ti = Math.max(0, gross - 50000 - Math.max(0, ded || 0)); t = slabTax(ti, OLD); if (ti <= 500000) t = 0; }
  else { ti = Math.max(0, gross - 75000); t = slabTax(ti, NEW); if (ti <= 1200000) t = 0; else t = Math.min(t, ti - 1200000); }
  return t * 1.04;
}
// o: {ctc, varPct, basicPct, pfCap, regime, ded, pt}
function calc(o) {
  const ctc = Math.max(0, +o.ctc || 0), vr = ctc * Math.min(100, Math.max(0, +o.varPct || 0)) / 100, fixed = ctc - vr;
  const basic = fixed * Math.min(90, Math.max(10, +o.basicPct || 40)) / 100, pfBase = o.pfCap ? Math.min(basic, 15000 * 12) : basic;
  const erPf = pfBase * .12, grat = basic * .0481, gross = Math.max(0, fixed - erPf - grat), erPfEmp = erPf;
  const pt = Math.max(0, +o.pt || 0) * 12, tx = tax(gross + vr, o.regime, o.ded);
  const takeYear = gross + vr - erPfEmp - pt - tx, taxFixedOnly = tax(gross, o.regime, o.ded);
  const monthly = (gross - erPfEmp - pt - taxFixedOnly) / 12;
  return { ctc, vr, fixed, basic, erPf, grat, gross, pt, tax: tx, takeYear, monthly, varNet: takeYear - monthly * 12, grossM: gross / 12, basicM: basic / 12 };
}

export { calc };
const W = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const SEC = /^(summary|profile|objective|career objective|professional summary|experience|work experience|professional experience|employment|employment history|work history|skills|technical skills|key skills|core skills|education|academic|academics|qualifications|projects|academic projects|certifications|certificates|achievements|awards|languages|interests|declaration|personal details)\s*:?$/i;
function clean(s) {
  return String(s == null ? '' : s).replace(/[‘’‛]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/₹/g, 'Rs.').replace(/…/g, '...').replace(/[   ]/g, ' ').replace(/[•●▪◦‣■·⁃]/g, '\u0001').replace(/[^\x01\x0A\x20-\x7E]/g, '');
}
// Turns raw pasted text into tidy lines. Headings become their own line, bullets use one style, blank runs shrink.
export function tidy(text) {
  const out = []; let blank = 0;
  String(text || '').replace(/\r/g, '').split('\n').forEach(l0 => {
    let l = l0.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
    if (!l) { if (!blank && out.length) out.push(''); blank = 1; return; } blank = 0;
    l = l.replace(/^[•●▪◦‣■·⁃*>\-–]\s*/, '- ');
    const h = l.replace(/[:\-_|]+$/g, '').trim(); if (SEC.test(h)) { if (out.length && out[out.length - 1] !== '') out.push(''); l = h.toUpperCase(); }
    out.push(l);
  });
  while (out.length && out[out.length - 1] === '') out.pop(); return out.join('\n');
}
function width(s, size) { let w = 0; for (const ch of s) { const c = ch.charCodeAt(0); w += c === 1 ? 350 : (c >= 32 && c < 127 ? W[c - 32] : 556); } return w * size / 1000; }
function wrap(s, size, max) { const words = s.split(' '), lines = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (width(t, size) > max && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
const esp = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\x01/g, '\\225');
// Returns the PDF as a string of single-byte characters.
export function pdfBuild(text, title) {
  const PW = 595, PH = 842, M = 50, MAXW = PW - 2 * M, pages = [[]]; let y = PH - M;
  const put = (s, size, bold, x) => { if (y < M + size) { pages.push([]); y = PH - M; } pages[pages.length - 1].push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y.toFixed(1)} Td (${esp(s)}) Tj ET`); };
  const rule = () => { pages[pages.length - 1].push(`0.6 w ${M} ${(y + 2).toFixed(1)} m ${PW - M} ${(y + 2).toFixed(1)} l S`); };
  const lines = clean(tidy(text)).split('\n'); let first = true;
  lines.forEach(l => {
    if (!l) { y -= 6; return; }
    if (first) { y -= 14; put(l, 18, true, M); y -= 8; first = false; return; }
    if (l === l.toUpperCase() && /[A-Z]/.test(l) && l.length < 40 && !/^- /.test(l)) { y -= 8; put(l, 11, true, M); y -= 3; rule(); y -= 9; return; }
    const bul = /^- /.test(l), body = bul ? l.slice(2) : l, ind = bul ? 14 : 0;
    wrap(body, 10, MAXW - ind).forEach((t, i) => { y -= 13.5; if (bul && i === 0) put('\x01', 10, false, M + 2); put(t, 10, false, M + ind); });
  });
  const objs = []; const add = s => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>'); add('PLACEHOLDER');
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'), f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const info = add(`<< /Title (${esp(clean(title || 'Resume'))}) /Producer (Padimachi) >>`), kids = [];
  pages.forEach(p => { const body = p.join('\n'), c = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`), pg = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`); kids.push(pg + ' 0 R'); });
  objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n', off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${x}\n%%EOF`;
  return out;
}

export const pdfEsc = esp;
export const helvW = s => { let w = 0; for (const ch of s) { const c = ch.charCodeAt(0); w += c === 1 ? 350 : (c >= 32 && c < 127 ? W[c - 32] : 556); } return w; };
