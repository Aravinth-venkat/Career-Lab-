// Resume parser + template layouts. One layout engine feeds both the on-screen SVG preview and the PDF file.
import { pdfEsc, helvW } from './lib.js';
const PW = 595, PH = 842;
const FW = { F1: 1, F2: 1.07, F3: 0.93, F4: 0.97 };
export const san = s => String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[•●▪‣·]/g, '\x01').replace(/[^\x01\x20-\x7e]/g, '');
export const tw = (s, size, f = 'F1') => helvW(s) * size / 1000 * FW[f];
function wrapT(s, size, f, max) { const words = s.split(' '), out = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (tw(t, size, f) > max && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }

/* ---------- parse ---------- */
const MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s*\\d{4}';
const DR = new RegExp('(' + MON + '|\\b\\d{4})\\s*(?:-|–|—|to)\\s*(Till date|Till now|Present|Current|Now|Date|' + MON + '|\\d{4})', 'i');
const HEADS = { summary: /^(professional\s+)?(summary|profile|objective|about me|career objective)(\s+of\s+skills\s+and\s+experience)?$|^summary of .*/i, experience: /^(work\s+|professional\s+)?(experience|employment( history)?)$/i, projects: /^(project details|projects?|key projects)$/i, skills: /^(technical\s+|key\s+|core\s+)?skills( summary)?$|^technologies$/i, certs: /^(certifications?|certificates|licenses?|courses|training)$/i, education: /^(education|academics?|qualifications?)$/i, other: /^(achievements?|awards?|languages|interests|hobbies|declaration|personal details|references)$/i };
const kindOf = l => { const t = l.replace(/:$/, '').trim(); if (!t || t.length > 45) return null; for (const k in HEADS) if (HEADS[k].test(t)) return k; if (t === t.toUpperCase() && /[A-Z]{3}/.test(t) && t.split(/\s+/).length <= 4 && !/\d/.test(t)) return 'other'; return null; };
export function parse(text, skills) {
  const raw = String(text || '').replace(/\r/g, '').replace(/(Client|Role|Duration|Description|Responsibilities|Environment|Technologies)\s*:/g, '\n$1:').replace(/(Project\s*#?\s*\d+)/gi, '\n$1').replace(/(Mobile|Phone|Email|E-mail|LinkedIn)\s*:/gi, '\n$1:');
  const lines = raw.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim());
  let head = [], i = 0; for (; i < lines.length; i++) { if (kindOf(lines[i]) && lines[i]) break; if (lines[i]) head.push(lines[i]); if (head.length > 8) break; }
  const hs = head.join(' '), em = hs.match(/[\w.+-]+@[\w-]+\.(?:com|in|org|net|co\.in|io|edu|ai)(?![a-z])/i), ph = hs.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/), li = hs.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w\-/]+/i);
  const name = (head[0] || 'Your Name').replace(/\b(Mobile|Phone|Email|E-mail|LinkedIn)\b.*$/i, '').replace(/[^\p{L}\s.'-]/gu, '').trim() || 'Your Name';
  const contact = [ph && ph[0].trim(), em && em[0], li && li[0]].filter(Boolean);
  const loc = head.slice(1).find(l => /^[A-Za-z .,]+,\s*[A-Za-z .]+$/.test(l) && l.length < 40); if (loc) contact.push(loc);
  const secs = []; let cur = null;
  for (; i < lines.length; i++) { const l = lines[i]; if (!l) continue; const k = kindOf(l); if (k) { cur = { kind: k, title: l.replace(/:$/, '').replace(/^summary of skills and experience$/i, 'Summary'), lines: [] }; secs.push(cur); } else if (cur) cur.lines.push(l.replace(/^[-*•●▪>]\s*/, '')); }
  const doc = { name, contact, title: '', sections: [] };
  secs.forEach(s => {
    if (s.kind === 'experience') { const en = []; s.lines.forEach(l => { const m = l.match(DR); if (m) { const before = l.slice(0, m.index).trim(), after = l.slice(m.index + m[0].length).trim(); en.push({ role: before, dates: m[0].replace(/\s*-\s*/, ' - '), company: after, pts: [] }); } else if (en.length) en[en.length - 1].pts.push(l); else en.push({ role: l, dates: '', company: '', pts: [] }); }); doc.sections.push({ kind: 'experience', title: 'Experience', entries: en }); if (en[0]) doc.title = en[0].role; }
    else if (s.kind === 'projects') { const ps = []; let p = null, mode = ''; s.lines.forEach(l => { if (/^project\s*#?\s*\d+/i.test(l)) { p = { title: l.replace(/\s*:$/, ''), meta: [], desc: '', pts: [] }; ps.push(p); mode = ''; return; } if (!p) { p = { title: 'Projects', meta: [], desc: '', pts: [] }; ps.push(p); } let m; if ((m = l.match(/^(Client|Role|Duration|Environment|Technologies)\s*:\s*(.*)$/i))) { p.meta.push([m[1], m[2]]); mode = ''; } else if ((m = l.match(/^Description\s*:\s*(.*)$/i))) { p.desc = m[1]; mode = 'd'; } else if (/^Responsibilities\s*:?$/i.test(l)) mode = 'r'; else if (mode === 'd' && !p.pts.length) p.desc += (p.desc ? ' ' : '') + l; else p.pts.push(l); }); doc.sections.push({ kind: 'projects', title: 'Projects', projects: ps }); }
    else doc.sections.push({ kind: s.kind, title: s.kind === 'summary' ? 'Summary' : s.kind === 'skills' ? 'Skills' : s.kind === 'certs' ? 'Certifications' : s.kind === 'education' ? 'Education' : s.title.replace(/\b\w/g, c => c.toUpperCase()).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), lines: s.lines });
  });
  if (!doc.sections.some(s => s.kind === 'skills') && skills && skills.length) doc.sections.push({ kind: 'skills', title: 'Key skills', lines: [skills.slice(0, 18).join(', ')], derived: true });
  const order = ['summary', 'skills', 'experience', 'projects', 'certs', 'education', 'other']; doc.sections.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return doc;
}

/* ---------- layout engine ---------- */
class Flow {
  constructor(pages, o) { Object.assign(this, { pages, x0: 40, x1: PW - 40, top: 40, bottom: PH - 40, bg: null, deco: null }, o); this.pg = -1; this.add(); }
  add() { this.pages.push([]); this.pg = this.pages.length - 1; if (this.deco) this.deco(this.pages[this.pg], this.pg); this.y = this.top; }
  ensure(h) { if (this.y + h > this.bottom) this.add(); }
  op(o) { this.pages[this.pg].push(o); }
  text(s, x, size, f, col, dy) { this.op({ t: 'text', s: san(s), x, y: this.y + (dy == null ? size : dy), size, f, col }); }
  rect(x, y, w, h, col) { this.op({ t: 'rect', x, y, w, h, col }); }
  line(x1, x2, y, col, w = 0.6) { this.op({ t: 'line', x1, x2, y, col, w }); }
}
const ST = {
  classic: { f: 'F3', fb: 'F4', size: 10.5, lead: 1.32, accent: [0.1, 0.1, 0.1], head: 'rule', ink: [0.1, 0.1, 0.1], sub: [0.3, 0.3, 0.3] },
  modern: { f: 'F1', fb: 'F2', size: 10, lead: 1.35, accent: [0.05, 0.45, 0.55], head: 'bar', ink: [0.1, 0.12, 0.16], sub: [0.4, 0.43, 0.5] },
  minimal: { f: 'F1', fb: 'F2', size: 10, lead: 1.45, accent: [0.35, 0.35, 0.38], head: 'plain', ink: [0.12, 0.12, 0.14], sub: [0.45, 0.45, 0.5] },
  compact: { f: 'F1', fb: 'F2', size: 9, lead: 1.25, accent: [0.15, 0.2, 0.45], head: 'rule', ink: [0.1, 0.1, 0.12], sub: [0.38, 0.4, 0.46] },
  sidebar: { f: 'F1', fb: 'F2', size: 9.8, lead: 1.35, accent: [0.13, 0.2, 0.42], head: 'bar', ink: [0.1, 0.12, 0.16], sub: [0.4, 0.43, 0.5] },
  executive: { f: 'F3', fb: 'F4', size: 10.5, lead: 1.32, accent: [0.1, 0.2, 0.4], head: 'rulec', ink: [0.1, 0.1, 0.14], sub: [0.35, 0.35, 0.42] },
  timeline: { f: 'F1', fb: 'F2', size: 9.8, lead: 1.35, accent: [0.8, 0.3, 0.2], head: 'bar', ink: [0.1, 0.1, 0.14], sub: [0.4, 0.4, 0.46], tl: true },
  bold: { f: 'F1', fb: 'F2', size: 10, lead: 1.35, accent: [0.1, 0.12, 0.2], head: 'block', ink: [0.1, 0.1, 0.14], sub: [0.4, 0.4, 0.46] },
  banner: { f: 'F1', fb: 'F2', size: 10, lead: 1.35, accent: [0.38, 0.27, 0.78], head: 'plain', ink: [0.1, 0.1, 0.16], sub: [0.4, 0.4, 0.5] }
};
export const TEMPLATES = [['classic', 'Classic', 'Plain serif. Safest for hiring software and campus forms.'], ['modern', 'Modern', 'Teal headings with a clean sans-serif look.'], ['sidebar', 'Sidebar', 'Dark side panel for contact, skills and certificates.'], ['banner', 'Banner', 'Coloured header band, then a single column.'], ['compact', 'Compact', 'Smaller text to fit more on one page.'], ['minimal', 'Minimal', 'Light and airy, lots of white space.'], ['executive', 'Executive', 'Serif with navy rules. Good for senior roles.'], ['timeline', 'Timeline', 'Dates in a left column, easy to scan.'], ['bold', 'Bold', 'Strong filled section bars.']];
const mu = (c, k) => c.map(v => Math.min(1, v + (1 - v) * k));

function headingR(f, st, title, x0, x1) {
  const sz = st.size + 1.5; f.ensure(sz + 24); f.y += st.head === 'plain' ? 12 : 10;
  const t = san(title).toUpperCase();
  if (st.head === 'rule') { f.text(t, x0, sz, st.fb, st.ink); f.y += sz + 3; f.line(x0, x1, f.y, st.ink, 0.8); f.y += 7; }
  else if (st.head === 'bar') { f.rect(x0, f.y + 1, 3, sz, st.accent); f.text(t, x0 + 9, sz, st.fb, st.accent); f.y += sz + 4; f.line(x0, x1, f.y, mu(st.accent, 0.75), 0.6); f.y += 7; }
  else if (st.head === 'rulec') { f.text(t, x0, sz, st.fb, st.accent); f.y += sz + 3; f.line(x0, x1, f.y, st.accent, 1.2); f.line(x0, x1, f.y + 2.5, st.accent, 0.4); f.y += 9; }
  else if (st.head === 'block') { f.rect(x0, f.y - 1, x1 - x0, sz + 7, st.accent); f.text(t, x0 + 7, sz, st.fb, [1, 1, 1], sz + 3); f.y += sz + 12; }
  else { f.text(t, x0, sz - 1, st.fb, st.accent); f.y += sz + 1; f.y += 4; }
}
function para(f, st, s, o = {}) { const x0 = o.x0 ?? f.x0, x1 = o.x1 ?? f.x1, size = o.size || st.size, fo = o.f || st.f, ind = o.ind || 0, lh = size * st.lead; wrapT(san(s), size, fo, x1 - x0 - ind).forEach(l => { f.ensure(lh); f.text(l, x0 + ind, size, fo, o.col || st.ink, lh * 0.78); f.y += lh; }); }
function bullet(f, st, s, o = {}) { const x0 = o.x0 ?? f.x0, x1 = o.x1 ?? f.x1, size = o.size || st.size, lh = size * st.lead; wrapT(san(s), size, st.f, x1 - x0 - 12).forEach((l, i) => { f.ensure(lh); if (!i) f.text('\x01', x0 + 2, size, st.f, st.accent, lh * 0.78); f.text(l, x0 + 12, size, st.f, st.ink, lh * 0.78); f.y += lh; }); f.y += 1.2; }
function sectionBody(f, st, s, o = {}) {
  const x0 = o.x0 ?? f.x0, x1 = o.x1 ?? f.x1, z = { x0, x1 };
  if (s.kind === 'experience' && st.tl) s.entries.forEach(e => { const lh = (st.size + 0.6) * st.lead, X0 = x0 + 104, zz = { x0: X0, x1 }; f.ensure(lh * 2.5); f.text(e.dates, x0, st.size - 0.5, st.f, st.accent, lh * 0.78); f.text(e.role, X0, st.size + 0.6, st.fb, st.ink, lh * 0.78); f.y += lh; if (e.company) { f.text(e.company, X0, st.size, st.f, st.sub, lh * 0.78); f.y += lh; } e.pts.forEach(p => bullet(f, st, p, zz)); f.y += 4; });
  else if (s.kind === 'experience') s.entries.forEach(e => {
    const sz = st.size + 0.6, lh = sz * st.lead; f.ensure(lh * 2.5); const dw = tw(e.dates, st.size - 0.5, st.f);
    f.text(e.role, x0, sz, st.fb, st.ink, lh * 0.78); if (e.dates) f.text(e.dates, x1 - dw, st.size - 0.5, st.f, st.sub, lh * 0.78); f.y += lh;
    if (e.company) { f.text(e.company, x0, st.size, st.f, st.accent, lh * 0.78); f.y += lh; }
    e.pts.forEach(p => bullet(f, st, p, z)); f.y += 4;
  });
  else if (s.kind === 'projects') s.projects.forEach(p => {
    const sz = st.size + 0.4, lh = sz * st.lead; f.ensure(lh * 3); f.text(p.title, x0, sz, st.fb, st.ink, lh * 0.78); f.y += lh;
    const meta = p.meta.map(m => m[0] + ': ' + m[1]).join('   |   '); if (meta) para(f, st, meta, { ...z, col: st.sub, size: st.size - 0.5 });
    if (p.desc) para(f, st, p.desc, z); p.pts.forEach(q => bullet(f, st, q, z)); f.y += 4;
  });
  else if (s.kind === 'summary') s.lines.forEach((l, i) => { if (i === 0 || /:$/.test(l)) para(f, st, l, z); else bullet(f, st, l, z); });
  else if (s.kind === 'skills') s.lines.forEach(l => para(f, st, l, z));
  else s.lines.forEach(l => bullet(f, st, l, z));
}
export function layout(doc0, key, o = {}) {
  const st = { ...(ST[key] || ST.modern) }, pages = []; if (o.accent) st.accent = o.accent; if (o.font === 'serif') { st.f = 'F3'; st.fb = 'F4'; } else if (o.font === 'sans') { st.f = 'F1'; st.fb = 'F2'; } if (o.scale) st.size *= o.scale; const fb = st.fb; const doc = { ...doc0, sections: doc0.sections.filter(s => !s.hidden) };
  const sub = doc.title && doc.title !== doc.name ? doc.title : '';
  if (key === 'sidebar') {
    const SW = 190, deco = (p) => p.push({ t: 'rect', x: 0, y: 0, w: SW, h: PH, col: st.accent });
    const f = new Flow(pages, { x0: SW + 24, x1: PW - 32, top: 36, bottom: PH - 36, deco }); const lw = 'F2';
    const sbs = doc.sections.filter(s => ['skills', 'certs', 'education', 'other'].includes(s.kind)), main = doc.sections.filter(s => !sbs.includes(s));
    // name block (main column top)
    f.text(doc.name, f.x0, 24, fb, st.ink, 24); f.y += 30; if (sub) { f.text(sub, f.x0, 12, st.f, st.accent, 12); f.y += 16; }
    f.y += 4; main.forEach(s => { headingR(f, st, s.title, f.x0, f.x1); sectionBody(f, st, s); });
    // sidebar text on page 1 only
    let y = 40; const side = (s, size, ff, col) => { wrapT(san(s), size, ff, SW - 44).forEach(l => { pages[0].push({ t: 'text', s: l, x: 22, y: y + size, size, f: ff, col }); y += size * 1.4; }); };
    const white = [1, 1, 1], soft = [0.82, 0.87, 1];
    side('CONTACT', 9.5, lw, soft); y += 2; doc.contact.forEach(c => { side(c, 9, 'F1', white); y += 3; }); y += 12;
    sbs.forEach(s => { side(s.title.toUpperCase(), 9.5, lw, soft); pages[0].push({ t: 'line', x1: 22, x2: SW - 22, y: y + 1, col: soft, w: 0.5 }); y += 8; s.lines.forEach(l => { (s.kind === 'skills' ? l.split(/\s*[,;|]\s*/) : [l]).forEach(x => { if (x) { side((s.kind === 'skills' ? '\x01 ' : '') + x, 9, 'F1', white); y += 2; } }); }); y += 14; });
    return pages;
  }
  const f = new Flow(pages, key === 'compact' ? { x0: 32, x1: PW - 32, top: 28, bottom: PH - 28 } : key === 'minimal' ? { x0: 56, x1: PW - 56, top: 52, bottom: PH - 48 } : { x0: 44, x1: PW - 44, top: 40, bottom: PH - 40 });
  const cl = doc.contact.map(san).join('    |    ');
  if (key === 'classic' || key === 'executive') { const nw = tw(doc.name.toUpperCase(), 22, fb); f.text(doc.name.toUpperCase(), (PW - nw) / 2, 22, fb, key === 'executive' ? st.accent : st.ink, 22); f.y += 28; if (sub) { const w = tw(sub, 11.5, st.f); f.text(sub, (PW - w) / 2, 11.5, st.f, st.sub, 11.5); f.y += 15; } const w = tw(cl, 9.5, st.f); f.text(cl, (PW - w) / 2, 9.5, st.f, st.sub, 9.5); f.y += 16; }
  else if (key === 'banner' || key === 'bold') { const h = sub ? 104 : 88; f.y = 0; f.rect(0, 0, PW, h, st.accent); f.text(doc.name, f.x0, 26, fb, [1, 1, 1], 46); if (sub) f.text(sub, f.x0, 12, st.f, [0.92, 0.9, 1], 66); f.text(cl, f.x0, 9.5, st.f, [0.92, 0.9, 1], sub ? 88 : 68); f.y = h + 4; }
  else if (key === 'compact') { f.text(doc.name, f.x0, 20, fb, st.ink, 20); const w = tw(cl, 8.5, st.f); f.text(cl, f.x1 - w, 8.5, st.f, st.sub, 20); f.y += 24; if (sub) { f.text(sub, f.x0, 10.5, st.f, st.accent, 10.5); f.y += 13; } }
  else if (key === 'minimal') { f.text(doc.name, f.x0, 28, st.f, st.ink, 28); f.y += 34; if (sub) { f.text(sub, f.x0, 12, st.f, st.accent, 12); f.y += 17; } f.text(cl, f.x0, 9, st.f, st.sub, 9); f.y += 18; }
  else { f.text(doc.name, f.x0, 26, fb, st.ink, 26); f.y += 31; if (sub) { f.text(sub, f.x0, 12.5, fb, st.accent, 12.5); f.y += 17; } f.text(cl, f.x0, 9.5, st.f, st.sub, 9.5); f.y += 14; f.line(f.x0, f.x1, f.y + 2, st.accent, 1.6); f.y += 4; }
  doc.sections.forEach(s => { headingR(f, st, s.title, f.x0, f.x1); sectionBody(f, st, s); });
  return pages;
}

/* ---------- output ---------- */
const FN = { F1: 'Helvetica', F2: 'Helvetica-Bold', F3: 'Times-Roman', F4: 'Times-Bold' };
export const CSSF = { F1: 'Helvetica, Arial, sans-serif', F2: 'Helvetica, Arial, sans-serif', F3: '"Times New Roman", Times, serif', F4: '"Times New Roman", Times, serif' };
const rg = c => c.map(v => v.toFixed(3)).join(' ');
export function pdfFromPages(pages, title) {
  const objs = []; const add = s => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>'); add('X'); const fonts = {}; Object.keys(FN).forEach(k => { fonts[k] = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${FN[k]} /Encoding /WinAnsiEncoding >>`); });
  const info = add(`<< /Title (${pdfEsc(san(title || 'Resume'))}) /Producer (Padimachi) >>`), kids = [];
  pages.forEach(p => {
    const body = p.map(o => o.t === 'rect' ? `${rg(o.col)} rg ${o.x.toFixed(1)} ${(PH - o.y - o.h).toFixed(1)} ${o.w.toFixed(1)} ${o.h.toFixed(1)} re f` : o.t === 'line' ? `${rg(o.col)} RG ${o.w} w ${o.x1.toFixed(1)} ${(PH - o.y).toFixed(1)} m ${o.x2.toFixed(1)} ${(PH - o.y).toFixed(1)} l S` : `BT ${rg(o.col)} rg /${o.f} ${o.size} Tf ${o.x.toFixed(1)} ${(PH - o.y).toFixed(1)} Td (${pdfEsc(o.s)}) Tj ET`).join('\n');
    const c = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`), pg = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << ${Object.keys(fonts).map(k => `/${k} ${fonts[k]} 0 R`).join(' ')} >> >> /Contents ${c} 0 R >>`); kids.push(pg + ' 0 R');
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n', off = []; objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${x}\n%%EOF`; return out;
}
export const PAGE = { w: PW, h: PH };

export const ACC = Object.fromEntries(Object.keys(ST).map(k => [k, ST[k].accent]));
