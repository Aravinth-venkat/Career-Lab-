// Coding lab: ports live lab.js. Challenge data and the ServiceNow simulator are imported from the live files.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useS } from './ctx.jsx';
import './stylesB.css';
import SN from '../../cl-src/js/lab-sn.js';
import P1 from '../../cl-src/js/lab-data-sn.js';
import P2 from '../../cl-src/js/lab-data-js.js';
import P3 from '../../cl-src/js/lab-data-py.js';

const LAB = { sn: [], js: [], web: [], py: [], java: [] };
[P1, P2, P3].forEach(p => Object.keys(LAB).forEach(k => LAB[k].push(...(p[k] || []))));
export { LAB };
const LABS = {
  sn: { name: 'ServiceNow script', ic: '🧩', desc: 'Write server-side scripts with GlideRecord and GlideAggregate, run them on practice data and see the output.' },
  js: { name: 'JavaScript', ic: '🟨', desc: 'Write functions and see which tests pass. Good for full stack and front end interviews.' },
  web: { name: 'Web page (HTML, CSS, JS)', ic: '🌐', desc: 'Build a small page and see it live. The checker looks at the real page you built.' },
  py: { name: 'Python', ic: '🐍', desc: 'Write Python functions and run them against tests in your browser.' },
  java: { name: 'Java', ic: '☕', desc: 'Write Java methods. Java cannot run in a browser, so your code is checked against a rubric and then you see a model solution.' }
};
const TITLES = { sn: 'Scripts - Background', js: 'solution.js', web: 'index.html', py: 'main.py', java: 'Main.java' };
const TIERS = { 1: 'Basics · fresher', 2: 'Working level · 1 to 3 years', 3: 'Advanced · 3+ years' };
const detectYears = text => { let b = null; String(text || '').replace(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/gi, (m, n) => { n = +n; if (n >= 0 && n <= 40 && (b === null || n > b)) b = n; return m; }); return b; };
const yearsOf = S => { const l = S.lad || {}; if (l.years !== undefined && l.years !== '') return +l.years; const f = detectYears(S.resume); return f === null ? 0 : f; };
const userTier = y => y < 1 ? 1 : y < 3 ? 2 : 3;
const bestOf = (S, id) => (S.solved || {})['lab:' + id] || 0;
const recommended = S => { const t = (S.resume || '').toLowerCase(), tr = S.track || ''; const r = []; if (/servicenow|service now|glide/.test(t) || tr === 'servicenow') r.push('sn'); if (/python|django|flask|pandas/.test(t)) r.push('py'); if (/\bjava\b|spring|hibernate/.test(t)) r.push('java'); if (/javascript|react|node|html|css|angular|full.?stack/.test(t)) r.push('js', 'web'); return r; };
const listOf = (lab, y, all) => LAB[lab].filter(c => all || c.tier <= userTier(y));

/* ---------- running code (same mechanisms as the live site) ---------- */
function workerRun(src, msg, ms) {
  return new Promise(res => {
    let w; try { w = new Worker(URL.createObjectURL(new Blob([src]))); } catch (e) { return res({ err: 'Your browser blocked the code sandbox. Try Chrome or Edge.' }); }
    const t = setTimeout(() => { w.terminate(); res({ err: 'Timed out. Is there an infinite loop?' }); }, ms || 3000);
    w.onmessage = e => { clearTimeout(t); w.terminate(); res(e.data); }; w.onerror = e => { clearTimeout(t); w.terminate(); res({ err: e.message || 'Error in your code' }); }; w.postMessage(msg);
  });
}
const snWorker = () => SN.source + '\nself.onmessage=e=>{const r=__run(e.data.code,e.data.seed,__mk);postMessage(r)}';
const jsWorker = `self.onmessage=e=>{const {code,fn,tests}=e.data;try{const f=new Function(code+'\\n;return typeof '+fn+'==="function"?'+fn+':null')();if(!f){postMessage({err:'Function '+fn+' was not found'});return}const out=[];for(const [args,exp] of tests){let got,ok=false,err=null;try{got=f(...JSON.parse(JSON.stringify(args)));ok=JSON.stringify(got)===JSON.stringify(exp)}catch(x){err=String(x)}out.push({args,exp,got,ok,err})}postMessage({out})}catch(x){postMessage({err:String(x)})}}`;
const PY_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const PY_HARNESS = "import json\ndef _run(code, fn, tests_json):\n    g = {}\n    try:\n        exec(code, g)\n    except BaseException as e:\n        return json.dumps({'err': type(e).__name__ + ': ' + str(e)})\n    f = g.get(fn)\n    if not callable(f):\n        return json.dumps({'err': 'Function ' + fn + ' was not found'})\n    out = []\n    for a, e in json.loads(tests_json):\n        try:\n            r = f(*json.loads(json.dumps(a)))\n            out.append({'ok': json.dumps(r, sort_keys=True) == json.dumps(e, sort_keys=True), 'got': r})\n        except BaseException as ex:\n            out.append({'ok': False, 'err': type(ex).__name__ + ': ' + str(ex)})\n    return json.dumps({'out': out}, default=str)\n";
const pySrc = "importScripts('" + PY_BASE + "pyodide.js');let py=null;const ready=(async()=>{py=await loadPyodide({indexURL:'" + PY_BASE + "'});py.runPython(" + JSON.stringify(PY_HARNESS) + ");postMessage({ready:1})})();self.onmessage=async e=>{try{await ready;const r=py.globals.get('_run')(e.data.code,e.data.fn,JSON.stringify(e.data.tests));postMessage({id:e.data.id,res:JSON.parse(r)})}catch(x){postMessage({id:e.data.id,res:{err:String(x)}})}};";
let pyW = null, pyId = 0;
function pyRun(code, c) {
  return new Promise(res => {
    const start = () => { try { pyW = new Worker(URL.createObjectURL(new Blob([pySrc]))); } catch (e) { return false; } return true; };
    if (!pyW && !start()) return res({ err: 'Your browser blocked the Python sandbox. Try Chrome or Edge.' });
    const id = ++pyId; let done = false;
    const fin = r => { if (done) return; done = true; clearTimeout(t); pyW && pyW.removeEventListener('message', on); res(r); };
    const on = e => { if (e.data && e.data.id === id) fin(e.data.res); };
    const t = setTimeout(() => { try { pyW.terminate(); } catch (e) {} pyW = null; fin({ err: 'Timed out. The first run downloads Python (about 10 MB) and needs internet. Try again, or check for an infinite loop.' }); }, 60000);
    pyW.addEventListener('message', on); pyW.onerror = () => { try { pyW.terminate(); } catch (e) {} pyW = null; fin({ err: 'Python could not load. Python practice needs internet the first time. Check your connection and try again.' }); };
    pyW.postMessage({ id, code, fn: c.fn, tests: c.tests });
  });
}
const stripJava = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const javaCheck = (code, c) => { const clean = stripJava(code); const open = (clean.match(/\{/g) || []).length, close = (clean.match(/\}/g) || []).length, par = (clean.match(/\(/g) || []).length - (clean.match(/\)/g) || []).length; const notes = []; if (open !== close) notes.push('Curly braces { } are not balanced.'); if (par !== 0) notes.push('Round brackets ( ) are not balanced.'); return { items: c.rubric.map(r => { let ok = false; try { ok = new RegExp(r.re, 's').test(clean); } catch (e) {} return { l: r.l, ok }; }), notes }; };

/* ---------- views ---------- */
function Toast({ msg }) { return msg ? <div className="lab-toast" role="status">{msg}</div> : null; }

function Home() {
  const { S, set } = useS(); const y = yearsOf(S), rec = recommended(S), T = userTier(y);
  return <>
    <a className="dim" href="#/practice">← Practice</a><h1>💻 Coding lab</h1>
    <p className="dim">Interviews for experienced roles often include a hands-on round. Practise it here: write the code, run it and see how much is correct. What you see depends on your experience.</p>
    <div className="card"><label>My experience<select id="lx" value={y >= 3 ? '3' : y >= 1 ? '1' : '0'} onChange={e => set(o => ({ lad: { track: o.track || '', ...(o.lad || {}), years: +e.target.value } }))}><option value="0">Fresher or student (0 to 1 year)</option><option value="1">1 to 3 years</option><option value="3">3 years or more</option></select></label>
      <p className="dim sm">{T === 1 ? 'Freshers are mostly asked basics and concepts, so you will see the basic level only. Harder rounds appear as your experience grows.' : T === 2 ? 'At 1 to 3 years, expect a hands-on round with common tasks. Basic and working level are shown.' : 'At 3+ years, expect real scenarios, edge cases and design choices. All levels are shown.'}</p></div>
    <div className="grid">{['sn', 'js', 'web', 'py', 'java'].sort((a, b) => rec.includes(b) - rec.includes(a)).map(k => { const a = listOf(k, y, false), done = a.filter(x => bestOf(S, x.id) >= 100).length; return <a key={k} className="card lab-tc" href={'#/lab/' + k}><div className="ic">{LABS[k].ic}</div><h3>{LABS[k].name}</h3><p className="dim sm">{LABS[k].desc}</p><p className="dim sm"><b>{done}/{a.length}</b> solved at your level {rec.includes(k) && <span className="tag">Matches your resume</span>}</p></a>; })}</div>
    <div className="card"><span className="tag">How checking works</span><p className="dim">Your code runs against tests or a practice database and you get a percentage score, the same way many interview platforms mark you. Add your resume and Padimachi shows the labs that match your skills first.</p></div>
  </>;
}

function List({ lab }) {
  const { S, set } = useS(); const y = yearsOf(S), all = !!S.labAll, items = listOf(lab, y, all), L = LABS[lab], tiers = [1, 2, 3].filter(t => items.some(c => c.tier === t));
  return <>
    <a className="dim" href="#/lab">← Coding lab</a><h1>{L.ic} {L.name}</h1><p className="dim">{L.desc}</p>
    {tiers.map(t => <div key={t}><h2>{TIERS[t]}</h2><div className="grid">{items.filter(c => c.tier === t).map(c => { const b = bestOf(S, c.id); return <a key={c.id} className="card lab-tc" href={'#/lab/' + lab + '/' + c.id}><span className={'tag' + (b >= 100 ? '' : ' alt')}>{b >= 100 ? '✓ Solved' : b ? 'Best ' + b + '%' : 'New'}</span><h3 style={{ marginTop: 8 }}>{c.title}</h3><p className="dim sm">{c.prompt.slice(0, 110)}{c.prompt.length > 110 ? '…' : ''}</p></a>; })}</div></div>)}
    {LAB[lab].length > items.length ? <div className="card"><p className="dim">{LAB[lab].length - items.length} harder questions are hidden for your experience level.</p><button className="btn sm" id="sh" onClick={() => set({ labAll: true })}>Show all levels</button></div> : all ? <div className="card"><button className="btn sm" id="sh" onClick={() => set({ labAll: false })}>Show only my level</button></div> : null}
  </>;
}

function ResultCard({ items, extra }) {
  const ok = items.filter(x => x.ok).length, p = items.length ? Math.round(ok / items.length * 100) : 0;
  const tone = p >= 90 ? ['Strong', 'An interviewer would be happy with this.'] : p >= 60 ? ['Good, polish it', 'The idea is right. Fix the missing checks and run again.'] : ['Needs practice', 'Read the failed checks, fix one at a time and run again. Use the hint if you are stuck.'];
  return <div className="card" id="res-card" data-pct={p}><span className={'tag' + (p >= 90 ? '' : ' alt')}>{tone[0]}</span><p className="lab-big">{p}% correct <small className="dim" style={{ fontSize: '.9rem', fontWeight: 500 }}>({ok} of {items.length} checks)</small></p><div className="bar"><i style={{ width: p + '%' }} /></div><p className="dim sm">{tone[1]}</p>
    {items.map((x, i) => <div className="lab-step" key={i}>{x.ok ? '✅' : '❌'} {x.l}{x.note ? <><br /><span className="dim sm">{x.note}</span></> : null}</div>)}{extra}</div>;
}

function Run({ lab, c }) {
  const { S, set } = useS(); const y = yearsOf(S), L = LABS[lab], draftKey = 'draft_lab:' + c.id;
  const [code, setCode] = useState(() => (S.solved || {})[draftKey] || c.starter);
  const [res, setRes] = useState(null), [term, setTerm] = useState(null), [busy, setBusy] = useState(false), [toast, setToast] = useState('');
  const attempts = useRef(0), codeRef = useRef(code), taRef = useRef(null), tm = useRef(), pv = useRef(), webRes = useRef(null);
  const best = bestOf(S, c.id); const bestRef = useRef(best); bestRef.current = best;
  const [pvDoc, setPvDoc] = useState(code), [chk, setChk] = useState(0);
  useEffect(() => { codeRef.current = code; }, [code]);
  const saveDraft = v => set(o => ({ solved: { ...(o.solved || {}), [draftKey]: v } }));
  const onEdit = v => { setCode(v); codeRef.current = v; clearTimeout(tm.current); tm.current = setTimeout(() => { saveDraft(v); if (lab === 'web') setPvDoc(v); }, lab === 'web' ? 450 : 300); };
  useEffect(() => () => clearTimeout(tm.current), []);
  const say = m => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const finish = p => {
    const prev = bestRef.current;
    set(o => { const sv = { ...(o.solved || {}) }; const pr = sv['lab:' + c.id] || 0; if (p > pr) sv['lab:' + c.id] = p; const n = { solved: sv }; if (p >= 100 && pr < 100) n.xp = (o.xp || 0) + 20 * c.tier; return n; });
    if (p >= 100 && prev < 100) say('Solved! +' + 20 * c.tier + ' XP'); else if (p >= 100) say('Solved again. Nice!');
  };
  const solBlock = <details className="lab-qa"><summary>Show the model solution</summary><pre>{c.solution}</pre></details>;
  const show = (items, extra) => { const ok = items.filter(x => x.ok).length, p = Math.round(ok / items.length * 100); setRes({ items, extra }); finish(p); setBusy(false); };
  const tryErr = m => { setRes({ err: m }); setBusy(false); };

  // web checker: real sandboxed iframe posts results back
  useEffect(() => { if (lab !== 'web') return; const on = e => { if (e.data && e.data.clab === c.id && Array.isArray(e.data.r)) show(c.checks.map((k, i) => ({ l: k.l, ok: !!e.data.r[i] })), bestRef.current >= 100 ? null : solBlock); }; window.addEventListener('message', on); return () => window.removeEventListener('message', on); }, [c.id]);
  const webDoc = useMemo(() => {
    if (lab !== 'web') return '';
    if (!chk) return pvDoc;
    const s = `<script>window.addEventListener('load',function(){setTimeout(function(){var C=${JSON.stringify(c.checks.map(k => k.js))};var r=C.map(function(s){try{return !!(0,eval)(s)}catch(e){return false}});parent.postMessage({clab:${JSON.stringify(c.id)},r:r},'*')},250)});<\/script>`;
    return /<\/body>/i.test(pvDoc) ? pvDoc.replace(/<\/body>/i, s + '</body>') : pvDoc + s;
  }, [pvDoc, chk]);

  const reset = () => { setCode(c.starter); codeRef.current = c.starter; saveDraft(c.starter); setPvDoc(c.starter); setChk(0); setRes(null); setTerm(null); };
  const run = async () => {
    const src = codeRef.current; clearTimeout(tm.current); saveDraft(src); attempts.current++; setBusy(true); setRes(null);
    if (lab === 'web') { setPvDoc(src); setChk(n => n + 1); return; }
    if (lab === 'sn') {
      const r = await workerRun(snWorker(), { code: src, seed: c.seed || SN.SEED }, 3000); if (r.err && !r.out) return tryErr(r.err);
      setTerm(r);
      const items = c.checks.map(k => { let ok = false; try { ok = !!k.f(r); } catch (e) {} return { l: k.l, ok }; });
      return show(items, (attempts.current >= 2 && items.some(x => !x.ok)) || bestRef.current >= 100 ? solBlock : null);
    }
    if (lab === 'js' || lab === 'py') {
      const r = lab === 'js' ? await workerRun(jsWorker, { code: src, fn: c.fn, tests: c.tests }, 2500) : await pyRun(src, c);
      if (r.err) return tryErr(r.err);
      const items = r.out.map((x, i) => ({ l: `${c.fn}(${c.tests[i][0].map(a => JSON.stringify(a)).join(', ')})`, ok: x.ok, note: x.ok ? '' : `expected ${JSON.stringify(c.tests[i][1])}, got ${x.err || JSON.stringify(x.got)}` }));
      return show(items, (attempts.current >= 2 && items.some(x => !x.ok)) || bestRef.current >= 100 ? solBlock : null);
    }
    const j = javaCheck(src, c); show(j.items, <>{j.notes.length > 0 && <p className="dim sm">⚠️ {j.notes.join(' ')}</p>}{solBlock}</>);
  };
  const next = (() => { const l = listOf(lab, y, !!S.labAll), i = l.findIndex(x => x.id === c.id); return l[i + 1] ? <a className="btn" href={'#/lab/' + lab + '/' + l[i + 1].id}>Next question →</a> : null; })();
  const frame = (title, bar) => <div className={'lab-ide ' + lab}><div className="idebar"><span className="dots"><i /><i /><i /></span><b>{title}</b>{bar}</div>
    <textarea className="code" id="ed" ref={taRef} rows={lab === 'web' ? 16 : 11} spellCheck="false" autoCapitalize="off" autoComplete="off" aria-label="Code editor" value={code} onChange={e => onEdit(e.target.value)} onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target, a = t.selectionStart, b = t.selectionEnd, v = t.value.slice(0, a) + '  ' + t.value.slice(b); onEdit(v); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; }); } }} /></div>;
  const btns = (label) => <div className="row" style={{ marginTop: 10 }}><button className="btn primary" id="run" onClick={run} disabled={busy && lab !== 'web'}>{busy && lab !== 'web' ? 'Running…' : label}</button><button className="btn ghost" id="rst" onClick={reset}>Reset</button></div>;
  return <>
    <Toast msg={toast} />
    <a className="dim" href={'#/lab/' + lab}>← {L.name}</a>
    <div className="lab-head"><div className="lab-badge">{L.ic}</div><div><h1 style={{ margin: 0 }}>{c.title}</h1><p className="dim"><span className="tag">{TIERS[c.tier]}</span> {best ? 'Best score ' + best + '%' : ''}</p></div></div>
    <div className="card"><p>{c.prompt}</p><details className="lab-qa"><summary>Need a hint?</summary><p>{c.hint}</p></details>
      {lab === 'sn' && <details className="lab-qa"><summary>See the practice data</summary>{Object.entries(c.seed || SN.SEED).map(([k, rows]) => { const cols = Object.keys(rows[0] || {}).filter(x => x !== 'sys_id'); return <details className="lab-qa" key={k}><summary>{k} ({rows.length} rows)</summary><div className="lab-tscroll"><table className="lab-dt"><thead><tr>{cols.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{cols.map(x => <td key={x}>{String(r[x] === undefined ? '' : r[x])}</td>)}</tr>)}</tbody></table></div></details>; })}</details>}</div>
    {lab === 'sn' && <div className="card"><p className="dim sm">Practice simulator: supports the common GlideRecord, GlideAggregate, GlideDateTime and gs calls. It is not a real instance.</p>{frame('Scripts - Background', <span className="dim sm">Run script in scope: Global</span>)}{btns('▶ Run script')}
      {term && <div className="lab-term" id="term"><div className="termbar">Script output</div>{term.out && term.out.length ? term.out.map((l, i) => <div key={i}>*** Script: {l}</div>) : <div className="dim">(no output: use gs.print to print results)</div>}{term.err && <div className="bad">Script error: {term.err}</div>}</div>}</div>}
    {lab === 'js' && <div className="card">{frame('solution.js')}{btns('▶ Run tests')}</div>}
    {lab === 'web' && <div className="card"><div className="lab-split">{frame('index.html')}<div className="lab-ide web"><div className="idebar"><span className="dots"><i /><i /><i /></span><b>Live preview</b></div><iframe id="pv" ref={pv} title="Live preview" sandbox="allow-scripts" className="lab-pv" srcDoc={webDoc} /></div></div>{btns('✔ Check my page')}</div>}
    {lab === 'py' && <div className="card"><p className="dim sm">Python runs in your browser. The first run downloads Python (about 10 MB) and needs internet.</p>{frame('main.py')}{btns('▶ Run tests')}</div>}
    {lab === 'java' && <div className="card"><p className="dim sm">Java cannot run in a browser. Your code is checked against what an interviewer looks for. Then you can read the model solution and compile it yourself on a computer.</p>{frame('Main.java')}{btns('✔ Check my code')}</div>}
    <div id="res">{busy && !res && lab !== 'web' && <p className="dim">Running…</p>}{res && res.err && <div className="card"><p style={{ color: 'var(--bad)' }}>{res.err}</p></div>}{res && res.items && <ResultCard items={res.items} extra={res.extra} />}</div>
    <div className="row" style={{ marginTop: 12 }}>{next}<a className="btn" href="#/interview">Practise interview answers</a></div>
  </>;
}

function Lab({ arg }) {
  const [a, b] = useMemo(() => (location.hash.replace(/^#\/?/, '').split('?')[0].split('/').slice(1)), [arg, typeof location !== 'undefined' ? location.hash : '']);
  const lab = arg || a, id = b;
  if (!LABS[lab]) return <Home />;
  const c = id && LAB[lab].find(x => x.id === id);
  return c ? <Run key={lab + c.id} lab={lab} c={c} /> : <List lab={lab} />;
}
export default { lab: Lab };
