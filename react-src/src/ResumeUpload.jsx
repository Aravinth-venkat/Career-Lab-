import React, { useRef, useState } from 'react';
import './stylesD.css';

// Reads a resume file in the browser. Nothing is uploaded: the file is read, the text is handed to onText, and that is all.
// PDF: pdf.js 4.10.38 from cdnjs (loaded only when a PDF is chosen). DOCX: unzipped here with the browser's DecompressionStream,
// with mammoth (cdnjs) as a back-up. TXT and MD: read directly.
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js';
const MAX_BYTES = 8 * 1024 * 1024;

export class ReadError extends Error { constructor(m) { super(m); this.name = 'ReadError'; } }

async function loadPdfjs() {
  let m;
  try { const u = PDFJS; m = await import(/* webpackIgnore: true */ u); }
  catch (e) { throw new ReadError('PDF reading needs an internet connection the first time, and it could not load. Check your connection and try again, or open the PDF, copy the text and paste it instead.'); }
  if (!m.GlobalWorkerOptions.workerSrc) {
    // Browsers refuse to start a worker from another site, so fetch it and start it from a local blob.
    try { const t = await (await fetch(PDFJS_WORKER)).text(); m.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([t], { type: 'text/javascript' })); }
    catch (e) { m.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }
  }
  return m;
}
async function pdfText(file) {
  const pdfjs = await loadPdfjs(); let pdf;
  try { pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; }
  catch (e) {
    if (e && e.name === 'PasswordException') throw new ReadError('This PDF is locked with a password. Remove the password, or copy the text and paste it instead.');
    throw new ReadError('This PDF is damaged or not a real PDF, so it could not be opened. Try saving it again, or paste the text instead.');
  }
  const pages = [];
  for (let i = 1; i <= pdf.numPages && i <= 20; i++) {
    const c = await (await pdf.getPage(i)).getTextContent(); let y = null, line = '', out = [];
    c.items.forEach(x => {
      if (typeof x.str !== 'string') return;
      const ny = x.transform ? x.transform[5] : null;
      if (y !== null && ny !== null && Math.abs(ny - y) > 3 && line) { out.push(line); line = ''; }
      line += (line && x.str && !/\s$/.test(line) && !/^\s/.test(x.str) ? ' ' : '') + x.str; if (ny !== null) y = ny;
      if (x.hasEOL) { out.push(line); line = ''; }
    });
    if (line) out.push(line); pages.push(out.map(s => s.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n'));
  }
  return pages.join('\n\n');
}

const dec = new TextDecoder();
const unxml = s => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
async function docxNative(file) {
  if (typeof DecompressionStream === 'undefined') throw new Error('nostream');
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer); let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new ReadError('This does not look like a Word .docx file. If it is an old .doc file, open it in Word and Save As .docx, or paste the text.');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true), name = dec.decode(buf.subarray(p + 46, p + 46 + nl));
    if (name === 'word/document.xml') {
      const s = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = buf.subarray(s, s + cs); let xml;
      if (method === 0) xml = dec.decode(data); else if (method === 8) xml = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); else throw new ReadError('This Word file uses a format that cannot be read here. Paste the text instead.');
      return unxml(xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, ' ').replace(/<w:br\/>/g, '\n').replace(/<w:t[^>]*>/g, '').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n');
    }
    p += 46 + nl + xl + cl;
  }
  throw new ReadError('This Word file has no readable text part. Paste the text instead.');
}
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
async function docxText(file) {
  try { return await docxNative(file); }
  catch (e) {
    if (e instanceof ReadError) throw e;
    try { if (!window.mammoth) await loadScript(MAMMOTH); return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
    catch (x) { throw new ReadError('This browser cannot open .docx files and the back-up reader could not load. Paste the text instead.'); }
  }
}

// Returns the text of a File. Throws ReadError with a message that is safe to show to the person.
export async function readResumeFile(file) {
  const name = (file.name || '').toLowerCase();
  if (!file.size) throw new ReadError('That file is empty. Choose another file.');
  if (file.size > MAX_BYTES) throw new ReadError('That file is larger than 8 MB. Choose a smaller file, or paste the text.');
  let t;
  if (/\.docx$/.test(name)) t = await docxText(file);
  else if (/\.pdf$/.test(name) || file.type === 'application/pdf') t = await pdfText(file);
  else if (/\.doc$/.test(name)) throw new ReadError('Old .doc files cannot be read. Open it in Word, choose Save As .docx or PDF, then upload that. Or paste the text.');
  else if (/\.(txt|md|text)$/.test(name) || (file.type || '').startsWith('text/')) t = await file.text();
  else throw new ReadError('Please choose a PDF, Word (.docx) or text (.txt) file.');
  t = String(t || '').replace(/\u0000/g, '').replace(/\r/g, '').trim();
  if (t.length < 40) throw new ReadError(/\.pdf$/.test(name) ? 'No readable text was found in this PDF. It may be a scan or a picture. Open it, copy the text and paste it instead.' : 'Very little text was found in this file. Check that it is the right file, or paste the text.');
  return t;
}

export default function ResumeUpload({ onText, label = 'Upload your resume', compact = false }) {
  const inp = useRef(null); const [st, setSt] = useState({ k: 'idle' }); const [drag, setDrag] = useState(false);
  const run = async file => {
    if (!file) return; setSt({ k: 'busy', n: file.name });
    try { const t = await readResumeFile(file); setSt({ k: 'ok', n: file.name, w: t.split(/\s+/).length }); onText && onText(t, file); }
    catch (e) { setSt({ k: 'err', m: e instanceof ReadError ? e.message : 'Could not read that file. Paste the text instead.' }); }
  };
  return <div className={'rup' + (compact ? ' compact' : '') + (drag ? ' drag' : '')}
    onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); run(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
    <input ref={inp} type="file" hidden data-testid="resume-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { run(e.target.files && e.target.files[0]); e.target.value = ''; }} />
    <button type="button" className="btn primary" onClick={() => inp.current && inp.current.click()} disabled={st.k === 'busy'}>📁 {label}</button>
    <span className="dim sm">PDF, Word (.docx) or text. Read on this device. Never uploaded.</span>
    <div aria-live="polite" className="sm" style={{ width: '100%' }}>
      {st.k === 'busy' && <span className="dim">Reading {st.n}…</span>}
      {st.k === 'ok' && <span style={{ color: 'var(--good)' }}>✓ Read {st.n}: {st.w} words found.</span>}
      {st.k === 'err' && <span role="alert" style={{ color: 'var(--bad)' }}>⚠ {st.m}</span>}
    </div>
  </div>;
}
