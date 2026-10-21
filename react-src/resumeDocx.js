// Builds a real .docx (Word) file by hand: a minimal zip with stored (uncompressed) entries.
import { san } from './resumeTpl.js';
const enc = new TextEncoder();
const CT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const parts = [], cen = []; let off = 0; const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  files.forEach(([name, text]) => { const nb = enc.encode(name), d = enc.encode(text), c = crc(d);
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0)]);
    parts.push(lh, nb, d);
    cen.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
    off += lh.length + nb.length + d.length; });
  const cs = cen.reduce((a, b) => a + b.length, 0), n = files.length;
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(n), ...u16(n), ...u32(cs), ...u32(off), 0, 0]);
  const all = [...parts, ...cen, end], out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; all.forEach(b => { out.set(b, p); p += b.length; }); return out;
}
const X = s => san(s).replace(/\x01/g, '•').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hex = c => c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
export function docxBytes(doc, key, o) {
  const serif = o.font === 'serif' || (o.font !== 'sans' && ['classic', 'executive'].includes(key)), FONT = serif ? 'Times New Roman' : 'Arial';
  const acc = hex(o.accent), ink = '1A1D24', sub = '666B78', sc = o.scale || 1, W = 10466;
  const run = (t, p = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${p.b ? '<w:b/>' : ''}<w:color w:val="${p.c || ink}"/><w:sz w:val="${Math.round((p.sz || 10) * sc * 2)}"/></w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
  const tab = '<w:r><w:tab/></w:r>';
  const para = (runs, p = {}) => `<w:p><w:pPr>${p.keep ? '<w:keepNext/>' : ''}${p.bdr ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${p.bdr}"/></w:pBdr>` : ''}${p.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${p.fill}"/>` : ''}${p.tabs ? `<w:tabs>${p.tabs}</w:tabs>` : ''}<w:spacing w:before="${p.before || 0}" w:after="${p.after == null ? 40 : p.after}"/>${p.ind ? `<w:ind w:left="${p.ind}" w:hanging="${p.hang || 0}" w:right="${p.fill ? 200 : 0}"/>` : p.fill ? '<w:ind w:left="200" w:right="200"/>' : ''}${p.jc ? `<w:jc w:val="${p.jc}"/>` : ''}</w:pPr>${runs}</w:p>`;
  const bl = t => para(run('•', { c: acc }) + tab + run(t), { ind: 360, hang: 240, after: 30, tabs: '<w:tab w:val="left" w:pos="360"/>' });
  const body = [], band = key === 'banner' || key === 'bold', fillc = band ? acc : null, wc = band ? 'FFFFFF' : null;
  const contact = doc.contact.map(san).join('   |   '), sub2 = doc.title && doc.title !== doc.name ? doc.title : '';
  if (key === 'classic' || key === 'executive') { body.push(para(run(doc.name.toUpperCase(), { b: 1, sz: 20, c: key === 'executive' ? acc : ink }), { jc: 'center', after: 20 })); if (sub2) body.push(para(run(sub2, { sz: 11, c: sub }), { jc: 'center', after: 20 })); body.push(para(run(contact, { sz: 9, c: sub }), { jc: 'center', after: 120 })); }
  else if (band) { body.push(para(run(doc.name, { b: 1, sz: 22, c: wc }), { fill: fillc, after: 0, before: 0 })); if (sub2) body.push(para(run(sub2, { sz: 11, c: 'E8E6FF' }), { fill: fillc, after: 0 })); body.push(para(run(contact, { sz: 9, c: 'E8E6FF' }), { fill: fillc, after: 160 })); }
  else { body.push(para(run(doc.name, { b: 1, sz: 22, c: ink }), { after: 0 })); if (sub2) body.push(para(run(sub2, { b: 1, sz: 11.5, c: acc }), { after: 20 })); body.push(para(run(contact, { sz: 9, c: sub }), { after: 120, bdr: acc })); }
  doc.sections.filter(s => !s.hidden).forEach(s => {
    body.push(para(run(s.title.toUpperCase(), { b: 1, sz: 11, c: acc }), { before: 200, after: 80, bdr: acc, keep: 1 }));
    if (s.kind === 'experience') s.entries.forEach(e => { body.push(para(run(e.role, { b: 1, sz: 10.5 }) + (e.dates ? tab + run(e.dates, { sz: 9.5, c: sub }) : ''), { tabs: `<w:tab w:val="right" w:pos="${W}"/>`, after: 0, keep: 1 })); if (e.company) body.push(para(run(e.company, { c: acc }), { after: 20, keep: 1 })); e.pts.forEach(p => body.push(bl(p))); body.push(para('', { after: 40 })); });
    else if (s.kind === 'projects') s.projects.forEach(p => { body.push(para(run(p.title, { b: 1, sz: 10.5 }), { after: 0, keep: 1 })); const m = p.meta.map(x => x[0] + ': ' + x[1]).join('   |   '); if (m) body.push(para(run(m, { sz: 9, c: sub }), { after: 20 })); if (p.desc) body.push(para(run(p.desc), { after: 40 })); p.pts.forEach(q => body.push(bl(q))); body.push(para('', { after: 40 })); });
    else if (s.kind === 'summary') s.lines.forEach((l, i) => body.push(i === 0 || /:$/.test(l) ? para(run(l), { after: 40 }) : bl(l)));
    else if (s.kind === 'skills') s.lines.forEach(l => body.push(para(run(l), { after: 40 })));
    else s.lines.forEach(l => body.push(bl(l)));
  });
  const sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="400" w:footer="400" w:gutter="0"/></w:sectPr>';
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join('')}${sect}</w:body></w:document>`;
  return zip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', document]
  ]);
}
