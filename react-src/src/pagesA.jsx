import React, { useState, useEffect, useMemo, useRef } from 'react';
import { D, C, yearsOf } from './lib.js';
import { useS } from './ctx.jsx';
import './stylesA.css';
import G from './shimA.js';
import * as X from './dataA.js';

const LD = G.LADDER, J = G.JOBS, CD = G.COMPANIES;
const trackOf = id => D.TRACKS.find(t => t.id === id);
const tname = id => (trackOf(id) || {}).name || id || 'your field';
const myTracks = S => { const r = C.detectTrack(S.resume || '', D.SKILLS).map(x => x.track); if (S.track && !r.includes(S.track)) r.unshift(S.track); return r.slice(0, 2); };
const go = h => { location.hash = h; };
const Ul = ({ a }) => <ul className="plist">{a.map((x, i) => <li key={i}>{x}</li>)}</ul>;
const Cd = ({ h, children, cls }) => <div className={'card' + (cls ? ' ' + cls : '')}>{h && <h3>{h}</h3>}{children}</div>;
const fixHref = h => h.replace('#/career/resume', '#/resumepdf').replace(/^#\/resume$/, '#/resumepdf');

/* type-to-search dropdown (port of UI.searchSelect) */
function SS({ value, opts, onChange, any }) {
  const all = useMemo(() => (any ? [['', any]] : []).concat(opts), [opts, any]);
  const [open, setOpen] = useState(false), [q, setQ] = useState(''), [hi, setHi] = useState(0), box = useRef(), inp = useRef();
  const vis = all.filter(o => !q.trim() || o[1].toLowerCase().includes(q.trim().toLowerCase()));
  const cur = (all.find(o => String(o[0]) === String(value)) || all[0] || ['', ''])[1];
  useEffect(() => { if (!open) return; const f = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, [open]);
  const pick = o => { if (!o) return; onChange(o[0]); setOpen(false); };
  const toggle = () => { if (open) { setOpen(false); return; } setQ(''); setHi(Math.max(0, all.findIndex(o => String(o[0]) === String(value)))); setOpen(true); setTimeout(() => inp.current && inp.current.focus(), 0); };
  const key = e => { if (e.key === 'ArrowDown') { setHi(Math.min(vis.length - 1, hi + 1)); e.preventDefault(); } else if (e.key === 'ArrowUp') { setHi(Math.max(0, hi - 1)); e.preventDefault(); } else if (e.key === 'Enter') { pick(vis[hi]); e.preventDefault(); } else if (e.key === 'Escape') setOpen(false); };
  return <div className="ss" ref={box}><button type="button" className="ssb" aria-haspopup="listbox" aria-expanded={open} onClick={toggle}><span>{cur}</span><span>▾</span></button>
    {open && <div className="ssp"><input ref={inp} type="search" placeholder="Type to search" aria-label="Search options" autoComplete="off" value={q} onChange={e => { setQ(e.target.value); setHi(0); }} onKeyDown={key} />
      <div className="ssl" role="listbox">{vis.length ? vis.map((o, i) => <button type="button" role="option" key={o[0]} className={'sso' + (String(o[0]) === String(value) ? ' sel' : '') + (i === hi ? ' hi' : '')} onClick={() => pick(o)}>{o[1]}</button>) : <p className="dim sm" style={{ padding: 10 }}>No match. Try fewer letters.</p>}</div></div>}</div>;
}
const Sel = ({ value, opts, onChange, any, id }) => <select id={id} value={value} onChange={e => onChange(e.target.value)}>{any && <option value="">{any}</option>}{opts.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;

/* ================= Companies ================= */
const tierOfY = y => y === null || y === undefined ? 0 : y < 1 ? 0 : y < 3 ? 1 : y < 6 ? 2 : y < 10 ? 3 : 4;
const MAP = { pr: 'programming', it: 'itfund', sn: 'servicenow', fi: 'finance', sa: 'sales', en: 'eng', cy: 'cyber', dm: 'dmkt' };
const tid = c => MAP[c] || c;
let ROWS = null;
const rows = () => ROWS || (ROWS = CD ? CD.co.map((c, ix) => { const def = (CD.kinds[c[1]] || [0, []])[1].map(tid), extra = c[3].map(tid); return { ix, name: c[0], kind: c[1], cities: c[2], extra, note: c[4], def, tracks: new Set([...def, ...extra]) }; }) : []);
const isTech = id => { const t = trackOf(id); return !!t && t.group === 'IT'; };
function why(c, tr, t) {
  const bits = [], k = CD.kinds[c.kind][0], tn = (trackOf(tr) || {}).name;
  if (tr && c.tracks.has(tr)) bits.push(c.extra.includes(tr) ? 'known for ' + tn + ' work' : 'hires for ' + tn + ' roles');
  const f = X.FIT[c.kind][X.EX[t]];
  bits.push(f === 3 ? 'good fit for ' + X.FITLV[t].toLowerCase() : f === 2 ? 'possible for ' + X.FITLV[t].toLowerCase() : 'hard to enter at your level, plan referrals');
  if (c.kind === 'psu') bits.push('many roles come through exams');
  return k + ': ' + bits.join('; ') + '.';
}
function CoCard({ c, star, tr, x, role }) {
  const f = X.FIT[c.kind][X.EX[x]];
  return <div className="card co"><div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><b>{star ? '⭐ ' : ''}{c.name}</b><span className="tag">{CD.kinds[c.kind][0]}</span></div>
    <p className="dim sm">📍 {c.cities.join(', ')}</p><p className="sm">{why(c, tr, x)}</p><p className="dim sm">{c.note || ''}</p>
    <div className="row"><span className={'tag' + (f === 3 ? '' : ' alt')}>{X.FITTXT[f - 1]} for {X.FITLV[x].toLowerCase()}</span></div>
    <div className="row"><a className="btn sm" target="_blank" rel="noopener noreferrer" href={'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent((role + ' ' + c.name).trim())}>LinkedIn jobs</a><a className="btn sm ghost" target="_blank" rel="noopener noreferrer" href={'https://www.google.com/search?q=' + encodeURIComponent(c.name + ' careers ' + role)}>Careers page</a></div></div>;
}
function Companies({ arg }) {
  const { S, set } = useS(); const [hiring, setHiring] = useState(null);
  const yrs = yearsOf(S), q = { x: tierOfY(yrs), city: '', kind: '', tech: '', s: '', g: '', n: 15, ...(S.cq || {}) };
  const upd = o => set({ cq: { ...q, ...o } });
  useEffect(() => { let off = false; if (location.protocol === 'file:') return; fetch('data/hiring.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null).then(h => { if (!off && h && h.list && h.list.length) setHiring(h); }); return () => { off = true; }; }, []);
  if (!CD) return <><h1>Companies</h1><div className="card"><p className="dim">The company list could not load.</p></div></>;
  const tr = arg && arg !== 'all' ? arg : arg === 'all' ? '' : (S.track || myTracks(S)[0] || '');
  const all = rows(), cities = [...new Set(all.flatMap(c => c.cities))].filter(x => x !== 'Pan India').sort(), kinds = Object.keys(CD.kinds), key = (S.resume || '').toLowerCase();
  const list = useMemo(() => {
    const l = all.filter(c => (!q.city || c.cities.includes(q.city) || c.cities.includes('Pan India')) && (!q.kind || c.kind === q.kind) && (!q.s || c.name.toLowerCase().includes(q.s.toLowerCase())) && (!q.tech || [...c.tracks].some(x => q.tech === 'it' ? isTech(x) : !isTech(x))) && (!tr || c.tracks.has(tr)))
      .map(c => ({ ...c, score: (tr && c.extra.includes(tr) ? 6 : tr && c.tracks.has(tr) ? 4 : 0) + (tr && c.def.includes(tr) ? (c.def.length - c.def.indexOf(tr)) / c.def.length * 2.5 : 0) - c.ix / 2000 + X.FIT[c.kind][X.EX[q.x]] * 1.6 + (key && key.includes(c.name.toLowerCase()) ? -1 : 0) + (key && c.note ? Math.min(1, c.note.toLowerCase().split(/\W+/).filter(w => w.length > 4 && key.includes(w)).length * .25) : 0) }));
    return l.sort((a, b) => b.score - a.score || a.ix - b.ix);
  }, [q.city, q.kind, q.s, q.tech, q.x, tr, key]);
  const role = ((J.KW && J.KW[tr]) || [''])[0], nshow = q.n || 15, shown = list.slice(0, nshow);
  const empty = <div className="card"><p>No company matches these filters. Try another city or type.</p></div>;
  const grouped = q.g === 'kind' && !q.kind;
  const groups = grouped ? kinds.map(k => ({ k, l: list.filter(c => c.kind === k) })).filter(g => g.l.length).sort((a, b) => b.l[0].score - a.l[0].score) : [];
  const lab = (t, ch) => <label className="dim sm">{t}{ch}</label>;
  return <>
    <h1>🏢 Companies</h1>
    <p className="dim">{all.length}+ well-known employers in India, matched to your field and experience. This is a starting list, not a promise of openings. Always check the company's own careers page.</p>
    <div className="card"><div className="sg">
      {lab('Field', <SS value={tr} any="All fields" opts={D.TRACKS.map(t => [t.id, t.ic + ' ' + t.name])} onChange={v => { upd({ n: 15 }); go('#/companies/' + (v || 'all')); }} />)}
      {lab('My experience', <Sel id="ce" value={q.x} opts={[0, 1, 2, 3, 4].map(i => [i, X.FITLV[i]])} onChange={v => upd({ x: +v, n: 15 })} />)}
      {lab('Tech or non-tech', <Sel id="ct" value={q.tech} any="Both" opts={[['it', 'Tech / IT'], ['non', 'Non-tech']]} onChange={v => upd({ tech: v, n: 15 })} />)}
      {lab('City', <SS value={q.city} any="Any city" opts={cities.map(x => [x, x])} onChange={v => upd({ city: v, n: 15 })} />)}
      {lab('Type', <SS value={q.kind} any="All types" opts={kinds.map(k => [k, CD.kinds[k][0]])} onChange={v => upd({ kind: v, n: 15 })} />)}
      {lab('Show as', <Sel id="cg" value={q.g} opts={[['', 'One list'], ['kind', 'Grouped by company type']]} onChange={v => upd({ g: v, n: 15 })} />)}
      {lab('Search', <input id="cs" value={q.s} placeholder="Company name" onChange={e => upd({ s: e.target.value, n: 15 })} />)}
    </div>{S.resume ? <p className="dim sm">Your resume is used on this device to pick better matches. It is never uploaded.</p> : <p className="dim sm">Add your resume in <a href="#/resumepdf">Resume maker</a> for better matches.</p>}</div>
    <p className="dim">{list.length} match{list.length === 1 ? '' : 'es'}{tr ? ' for ' + tname(tr) : ''}. Top five are marked ⭐.</p>
    {hiring && <div className="card"><h3>🟢 Hiring now (live from company job pages)</h3><p className="dim sm">{hiring.list.length} companies have openings right now{hiring.list.filter(x => x.isNew).length ? ', ' + hiring.list.filter(x => x.isNew).length + ' new to our list in the last 2 weeks' : ''}. Updated automatically.</p>
      <div className="row">{hiring.list.slice(0, 12).map(x => <button key={x.c} className="chip" onClick={() => { set({ opSeed: x.c }); go('#/career'); }}>{x.isNew ? '🆕 ' : ''}{x.c} · {x.n}{x.new7 ? ' (' + x.new7 + ' new)' : ''}</button>)}</div><p className="dim sm">Tap a company to see its openings.</p></div>}
    <div className="card"><h3>At {X.FITLV[q.x].toLowerCase()}</h3><Ul a={X.LVTIP[q.x]} /></div>
    {grouped ? (groups.length ? groups.map(g => <div key={g.k}><h3 style={{ marginTop: 18 }}>{CD.kinds[g.k][0]} <span className="dim sm">{g.l.length} compan{g.l.length === 1 ? 'y' : 'ies'}</span></h3>
      <div className="grid">{g.l.slice(0, 4).map(c => <CoCard key={c.ix} c={c} tr={tr} x={q.x} role={role} />)}</div>
      {g.l.length > 4 && <div className="row" style={{ marginTop: 8 }}><button className="btn ghost sm" onClick={() => { upd({ kind: g.k, n: 15 }); window.scrollTo(0, 0); }}>See all {g.l.length}</button></div>}</div>) : empty)
      : <><div className="grid">{shown.length ? shown.map((c, i) => <CoCard key={c.ix} c={c} star={i < 5} tr={tr} x={q.x} role={role} />) : empty}</div>
        {list.length > nshow && <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => upd({ n: nshow + 15 })}>Show 15 more ({list.length - nshow} left)</button></div>}</>}
    <div className="card"><h3>How to use this list</h3><Ul a={['Start with the starred companies, then widen.', 'Open the careers page and set alerts. Ask someone inside for a referral using the Toolkit.', 'Pay, hiring and openings change often. This list shows kinds of employers, not current vacancies.', 'Never pay anyone for a job at these companies.']} />
      <div className="row"><a className="btn ghost" href="#/toolkit/mail">📧 Referral email draft</a><a className="btn ghost" href="#/career">Roles and openings</a></div></div>
  </>;
}

/* ================= Offer helper (stages 7 and 8) ================= */
const num = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
const inr = n => Math.round(n).toLocaleString('en-IN');
function CopyBtn({ text, label = 'Copy' }) {
  const [ok, setOk] = useState(false);
  const done = () => { setOk(true); setTimeout(() => setOk(false), 1500); };
  const fb = () => { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); };
  return <button className="btn copyb" onClick={() => { try { navigator.clipboard.writeText(text).then(done, fb); } catch (e) { fb(); } }}>{ok ? 'Copied ✓' : label}</button>;
}
const Tpl = ({ title, txt }) => <div className="card"><h3>{title}</h3><textarea rows={8} readOnly value={txt} /><div className="row" style={{ marginTop: 8 }}><CopyBtn text={txt} /></div></div>;
function Compare() {
  const [v, setV] = useState({ A: {}, B: {} });
  const ch = (k, f, val) => setV(o => ({ ...o, [k]: { ...o[k], [f]: val } }));
  const out = ['A', 'B'].map(k => { const o = v[k], fix = num(o.fix), vr = num(o.var), jb = num(o.jb), q = [0, 1, 2, 3, 4].map(i => num(o['q' + i]) || 3).reduce((a, b) => a + b, 0); return { k, fix, tot: fix + vr + jb, q }; });
  const [a, b] = out, pct = (x, y) => y ? Math.round((x - y) * 100 / y) : 0;
  return <><div className="grid">{['A', 'B'].map(k => <div className="card" key={k}><h3>Offer {k}</h3>
    <label className="sm dim">Fixed pay per year<input type="text" inputMode="numeric" placeholder="Amount in ₹" value={v[k].fix || ''} onChange={e => ch(k, 'fix', e.target.value)} /></label>
    <label className="sm dim">Expected variable per year<input type="text" inputMode="numeric" placeholder="Count only what is written" value={v[k].var || ''} onChange={e => ch(k, 'var', e.target.value)} /></label>
    <label className="sm dim">Joining bonus (one time)<input type="text" inputMode="numeric" placeholder="0 if none" value={v[k].jb || ''} onChange={e => ch(k, 'jb', e.target.value)} /></label>
    {['Growth', 'Learning', 'Team and manager', 'Stability', 'Location and hours'].map((q, i) => <label className="sm dim" key={i}>{q} (1 to 5)<input type="range" min="1" max="5" value={v[k]['q' + i] || 3} onChange={e => ch(k, 'q' + i, e.target.value)} /></label>)}</div>)}</div>
    <div className="card" role="status">{!a.fix && !b.fix ? <p className="dim sm">Fill in the pay of at least one offer to see the comparison.</p> : <><h3>Comparison</h3>
      <p className="sm">Offer A: fixed ₹{inr(a.fix)}, first year total ₹{inr(a.tot)}, non money score {a.q}/25.<br />Offer B: fixed ₹{inr(b.fix)}, first year total ₹{inr(b.tot)}, non money score {b.q}/25.</p>
      {a.fix && b.fix ? <p className="sm"><b>Fixed pay:</b> {a.fix === b.fix ? 'same' : a.fix > b.fix ? 'A is ' + pct(a.fix, b.fix) + '% higher' : 'B is ' + pct(b.fix, a.fix) + '% higher'}. <b>First year total:</b> {a.tot === b.tot ? 'same' : a.tot > b.tot ? 'A is ' + pct(a.tot, b.tot) + '% higher' : 'B is ' + pct(b.tot, a.tot) + '% higher'}. <b>Non money:</b> {a.q === b.q ? 'same' : a.q > b.q ? 'A is ahead' : 'B is ahead'}.</p> : null}
      <p className="dim sm">Variable pay is not guaranteed, so trust fixed pay more. A small pay gap with a much better role or manager is often worth taking. This tool is a thinking aid, not advice.</p></>}</div></>;
}
function Stage7({ tier }) {
  return <>
    <h2>Check the offer letter</h2><div className="grid"><Cd h="Check every line"><Ul a={X.CHECK} /></Cd><Cd h="Warning signs"><Ul a={X.FLAGS} /></Cd></div>
    <h2>Compare two offers</h2><p className="dim sm">Enter your own numbers. Nothing leaves your browser. Money is only one part, so rate the rest too.</p><Compare />
    <h2>Negotiate with confidence</h2><div className="grid">{X.NEGO.map((n, i) => <Cd key={i} cls={i === tier ? 'rec' : ''}><h3>{n[0]} {i === tier && <span className="tag">Your level</span>}</h3><Ul a={n[1]} /></Cd>)}</div>
    <Cd h="Phrases you can use"><Ul a={X.SAY} /></Cd><p className="dim sm">We do not give salary numbers because they change quickly. Check ranges for your role, city and level from several sources, and ask peers.</p>
    <h2>Resign and leave well</h2><div className="tl">{X.STEPS.map((o, i) => <div className="tli" key={i}><b>{o[0]}</b><p className="sm">{o[1]}</p></div>)}</div>
    <h2>Letters you can copy</h2><div className="grid"><Tpl title="Resignation letter" txt={X.T_RES} /><Tpl title="Request early release or buyout" txt={X.T_EARLY} /><Tpl title="Accept an offer" txt={X.T_ACCEPT} /><Tpl title="Decline an offer politely" txt={X.T_DECLINE} /></div>
    <p className="dim sm">Rules on notice, buyout and bonds depend on your contract and company. This is general guidance, not legal advice. If a clause worries you, ask HR to explain it in writing or consult a labour law professional.</p></>;
}
function Stage8({ tier }) {
  const { S, set } = useS(); const g = X.D90[Math.min(tier, 3)] || X.D90[2], done = S.n90 || {};
  const total = g.reduce((a, x) => a + x[1].length, 0), n = Object.values(done).filter(Boolean).length;
  return <><h2>Your 90 day plan <span className="tag">{n} of {total} done</span></h2>
    <div className="grid">{g.map((blk, bi) => <Cd key={bi} h={blk[0]}>{blk[1].map((t, ti) => { const id = bi + '_' + ti; return <label className="ck" key={id}><input type="checkbox" checked={!!done[id]} onChange={e => set({ n90: { ...done, [id]: e.target.checked } })} /> <span>{t}</span></label>; })}</Cd>)}</div>
    <h2>Pass probation</h2><Cd h="Simple habits"><Ul a={X.PROB} /></Cd><h2>Keep growing</h2><Cd h="Every year"><Ul a={X.CAREER} /></Cd></>;
}
const tierOfJ = y => y < 1 ? 0 : y < 3 ? 1 : y < 9 ? 2 : 3;
function Offer({ arg }) {
  const { S } = useS(); const y = yearsOf(S), tier = tierOfJ(y == null ? 0 : +y), tab = arg === 'after' ? 'after' : 'offer';
  return <><h1>🤝 Offer helper</h1><p className="dim">From offer letter to your first 90 days. General guidance for India. Not legal or financial advice.</p>
    <div className="tabs"><a className={'chip' + (tab === 'offer' ? ' on' : '')} href="#/offer">Offer and resigning</a><a className={'chip' + (tab === 'after' ? ' on' : '')} href="#/offer/after">After joining</a></div>
    {tab === 'offer' ? <Stage7 tier={tier} /> : <Stage8 tier={tier} />}
    <div className="row" style={{ marginTop: 14 }}><a className="btn" href="#/ctc">💵 CTC to in-hand</a><a className="btn" href="#/toolkit/mail">📧 Email drafts</a><a className="btn ghost" href="#/journey">🧭 Career journey</a></div></>;
}

/* ================= Journey ================= */
function Journey({ arg }) {
  const { S, set } = useS(); const st = Math.min(8, Math.max(1, parseInt(arg, 10) || S.jstage || 5));
  useEffect(() => { if (S.jstage !== st) set({ jstage: st }); }, [st]);
  const conf = !!S.conf && !!S.track, mt = myTracks(S).find(x => LD.tracks[x]) || 'servicenow', tr = conf && LD.tracks[S.track] ? S.track : mt;
  const yy = yearsOf(S), y = yy == null ? 0 : +yy, tier = y < 1 ? 0 : y < 3 ? 1 : y < 9 ? 2 : 3, fam = J.family(tr), lv = LD.levelFor(y), Lv = LD.tracks[tr].levels[lv], nxt = LD.tracks[tr].levels[lv + 1];
  const tps = (Lv.topics || []).map(id => (D.TOPICS || []).find(t => t.id === id)).filter(Boolean);
  const Hd = ({ t }) => <h2>{t}</h2>;
  const rp = conf ? '#/report' : '#/resumepdf';
  let body = null;
  if (st === 1) body = <>
    <Cd h="Where you stand now"><p>You look like a <b>{Lv.t}</b> ({LD.NAMES[lv]}). {Lv.co}</p><p className="sm"><b>Usual work:</b> {Lv.does}</p><p className="sm"><b>Also called:</b> {Lv.alt}</p></Cd>
    <Cd h="Skills expected at this level"><Ul a={Lv.skills} /></Cd>
    {nxt && <Cd h={'What moves you to ' + nxt.t}><p className="sm">{Lv.promote}</p></Cd>}
    <div className="row"><a className="btn primary" href={rp}>{conf ? 'Open my career report' : 'Upload my resume for a sharper result'}</a><a className="btn" href="#/resumepdf">Check my resume</a><a className="btn" href="#/ladder">All levels in my field</a></div>
    <p className="dim sm">Level and years are estimates from your resume. {conf ? '' : 'Without a resume this page uses the experience you picked on Home.'}</p></>;
  if (st === 2) {
    const O = [['🚀', 'Grow here', 'Best if your company has the next role and your manager backs you.', ['Ask your manager what the next level needs', 'Take one bigger responsibility for 3 months', 'Ask for a written promotion plan'], 'About 6 to 18 months', '#/ladder', 'See the next level', 'grow'], ['🏢', 'Move to a better company', 'Best when growth, pay or learning has stopped here.', ['Update your resume and profile', 'Apply to 5 to 10 roles a week', 'Prepare for interviews while you work'], 'Usually 2 to 4 months plus notice period', '#/journey/5', 'Where to apply', 'switchco'], ['🔀', 'Switch field', 'Best when you want a different kind of work and can start lower for a while.', ['Pick the target field and its entry skills', 'Build 2 small projects or samples', 'Explain what your old field adds'], 'Usually 4 to 12 months', '#/mentor', 'Plan my switch', 'switchfield'], ['📚', 'Build skills first', 'Best when your resume shows gaps for the roles you want.', ['Take the skills list for your next level', 'Study 4 to 5 hours a week', 'Apply once you can explain the basics'], 'Usually 1 to 3 months', '#/learn', 'Start learning', 'skills']];
    body = <><div className="grid">{O.map(x => <div className="card" key={x[1]}><h3>{x[0]} {x[1]}</h3><p className="sm">{x[2]}</p><Ul a={x[3]} /><p className="dim sm">Time: {x[4]}</p><a className={'btn' + (S.rgoal === x[7] ? ' primary' : '')} href={x[5]}>{x[6]}</a></div>)}</div>
      <p className="dim sm">{S.rgoal ? 'Highlighted: the goal you chose earlier.' : 'Not sure? Many people do the third and fourth at the same time.'} Timings are common ranges, not promises.</p></>;
  }
  if (st === 3) body = <>
    {nxt ? <><Cd h={'Skills for ' + nxt.t}><Ul a={nxt.skills} /></Cd><Cd h="How they judge you for it"><p className="sm">{nxt.does}</p></Cd></> : <Cd h="You are at the top level in this track"><p className="sm">Focus on leading people, design decisions and mentoring.</p></Cd>}
    {tps.length > 0 && <Cd h="Start learning here"><div className="row">{tps.map(t => <a key={t.id} className="btn" href={'#/topic/' + t.id}>{t.ic || ''} {t.name}</a>)}</div></Cd>}
    <div className="row"><a className="btn primary" href={rp}>{conf ? 'See my full skill gaps' : 'Upload my resume'}</a><a className="btn" href="#/learn">My learning path</a><a className="btn" href="#/practice">Practice</a></div>
    <p className="dim sm">Rule of thumb: you do not need every skill. Cover the top 3 to 4 and be able to show them in a project.</p></>;
  if (st === 4) body = <><Cd h="Prepare your profile"><Ul a={X.PROFILE} /></Cd><div className="row"><a className="btn primary" href="#/resumepdf">Improve my resume</a><a className="btn" href="#/mock">Self introduction help</a><a className="btn" href="#/speak">Speak it aloud</a></div></>;
  if (st === 5) {
    const rts = X.ROUTES.filter(r => (r[2].includes(tier === 3 ? 2 : tier) || r[2].includes(tier)) && (r[3] === 'all' || r[3] === fam) && (!/^ServiceNow/.test(r[0]) || ['servicenow', 'mw'].includes(tr)));
    body = <><h2>Where to apply</h2><p className="dim">Mix several routes. Referrals and company pages often work best. Links open the real websites. We cannot check if a site changes, so tell us if one stops working.</p>
      <div className="grid">{rts.map(r => <div className="card" key={r[0]}><h3>{r[0]}</h3><p className="sm">{r[4]}</p><p className="dim sm"><b>Tip:</b> {r[5]}</p>{r[1] && <a className="btn sm" target="_blank" rel="noopener noreferrer" href={r[1]}>Open {r[0]}</a>}</div>)}</div>
      <h2>A weekly plan that works</h2><div className="grid"><Cd h="Each week"><Ul a={['Apply to 5 to 10 roles that fit your level', 'Send 3 messages to people at target companies', 'Follow up on applications older than a week', 'Update your tracker']} /></Cd><Cd h="First 2 weeks"><Ul a={['Fix your resume and profile', 'Make a list of 20 target companies', 'Turn on alerts for your exact role names', 'Tell 3 trusted people you are looking']} /></Cd><Cd h="After 4 weeks"><Ul a={['Few replies: change your resume headline and keywords', 'Replies but no interviews: ask for resume feedback', 'Interviews but no offers: practise the weak round', 'Check the tracker for patterns']} /></Cd></div>
      <div className="row"><a className="btn primary" href="#/tracker">Open my application tracker</a></div>
      <h2>Search for your roles</h2><div className="card"><p className="dim sm">Search links for the roles that fit your level.</p><div className="row"><a className="btn primary" href="#/career">Roles and search links</a><a className="btn" href="#/companies">Companies that hire</a></div></div>
      <h2>When to apply</h2><div className="grid">{X.WHEN.map(w => <div className="card" key={w[0]}><h3>{w[0]}</h3><p className="sm">{w[1]}</p></div>)}</div><p className="dim sm">These are common patterns, not guarantees. Companies and fields are different.</p></>;
  }
  if (st === 6) {
    const rr = J.ROUNDS[fam] || J.ROUNDS.it, rounds = tier === 3 ? rr[2].concat([['Senior leadership or board conversation', 'Strategy, your plan for the first 100 days and how you work with the executive team.', 'Interview'], ['Reference and background checks', 'Senior hires are verified more deeply. Keep references and documents ready.', 'Speaking']]) : rr[tier] || [];
    const g = (G.IVGUIDE[fam] || G.IVGUIDE.it)[tier], f = (G.IVTRACK || {})[tr], gt = f && f[Math.min(tier, 2)];
    body = <><h2>How the process usually goes</h2><div className="tl">{X.PROC.map((p, i) => <div className="tli" key={i}><b>{i + 1}. {p[0]}</b> <span className="dim sm"> {p[1]} · {p[4]}</span><p className="sm">{p[2]}</p><p className="dim sm"><b>You:</b> {p[3]}</p></div>)}</div><p className="dim sm">Every company is different. Ask the recruiter for the list of rounds at the first call.</p>
      <h2>Rounds at your level: {LD.NAMES[lv]}</h2><div className="rounds">{rounds.map((r, i) => <div className="rnd" key={i}><b>{i + 1}. {r[0]}</b><span className="dim sm">{r[1]}</span></div>)}</div>
      <div className="row" style={{ marginTop: 10 }}><a className="btn primary" href="#/career">Roles and openings</a><a className="btn" href="#/interview">Practise questions</a>{fam === 'it' && tier > 0 && <a className="btn" href="#/lab">Coding lab</a>}<a className="btn" href="#/speak">Speaking lab</a></div>
      {g && <><h2>What they ask at your level</h2><div className="grid"><Cd h="Topics to expect"><Ul a={g.ask} /></Cd><Cd h="How they judge you"><p className="sm">{g.eval}</p></Cd><Cd h="Sample questions"><Ul a={g.qs} /></Cd><Cd h="Common slips"><Ul a={g.slip} /></Cd><Cd h="Your prep list"><Ul a={g.prep} /></Cd></div><div className="row" style={{ marginTop: 10 }}><a className="btn primary" href="#/interview">Practise questions</a><a className="btn" href="#/speak">Speak my answers</a></div></>}
      {gt && <><h2>Specific to {tname(tr)}</h2><div className="grid"><Cd h={'Topics for ' + tname(tr)}><Ul a={gt.topics} /></Cd><Cd h="Questions asked in this field"><Ul a={gt.qs} /></Cd></div><p className="dim sm">Answer each aloud in 1 to 2 minutes, with one real example from your work or project.</p></>}
      <h2>Interview formats</h2><div className="grid">{X.FORMATS.map(f => <Cd key={f[0]} h={f[0]}><p className="sm">{f[1]}</p></Cd>)}</div>
      <div className="grid" style={{ marginTop: 14 }}><Cd h="Before"><Ul a={X.BEFORE} /></Cd><Cd h="The day before"><Ul a={X.DAYBEFORE} /></Cd><Cd h="On the day"><Ul a={X.DAYOF} /></Cd><Cd h="After"><Ul a={X.AFTER} /></Cd></div>
      <Cd h="Good questions to ask them"><Ul a={X.ASK} /></Cd></>;
  }
  if (st === 7) body = <Stage7 tier={tier} />;
  if (st === 8) body = <><Stage8 tier={tier} /><div className="row"><a className="btn primary" href="#/ladder">Check the next level</a><a className="btn" href="#/report">My report</a></div></>;
  return <>
    <h1>🧭 Job search guide</h1><p className="dim">From knowing where you stand to growing after you join. Shown for <b>{tname(tr)}</b> at <b>{Lv.t}</b> level. {!conf && <a href="#/resumepdf">Add your resume</a>}{!conf && ' to personalise it.'}</p>
    <div className="jtabs">{X.STAGES.map((x, i) => <a key={i} href={'#/journey/' + (i + 1)} className={'jt' + (i + 1 === st ? ' on' : '')}><span className="jn">{i + 1}</span><span>{x[0]}</span></a>)}</div>
    <div className="card hero"><div><span className="tag">Stage {st} of 8</span><h2 style={{ margin: '.3em 0' }}>{X.STAGES[st - 1][1]} {X.STAGES[st - 1][0]}</h2><p className="dim">{X.STAGES[st - 1][2]}</p></div></div>
    {body}
    <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>{st > 1 ? <a className="btn" href={'#/journey/' + (st - 1)}>← {X.STAGES[st - 2][0]}</a> : <span />}{st < 8 ? <a className="btn primary" href={'#/journey/' + (st + 1)}>{X.STAGES[st][0]} →</a> : <span />}</div></>;
}

/* ================= Toolkit ================= */
const fill = (txt, v) => txt.replace(/\[Your name\]/g, v.name || '[Your name]').replace(/\[(Manager|HR name|Recruiter name|Recruiter or HR name|Name|Manager and HR name|Interviewer or recruiter name)\]/g, m => v.who || m).replace(/\[Company\]/g, v.co || '[Company]').replace(/\[Role\]/g, v.role || '[Role]').replace(/\[role\]/g, v.role || '[role]');
function MailDraft({ m, v }) {
  const [ed, setEd] = useState(null); const subj = ed ? ed.s : fill(m.subj, v), body = ed ? ed.b : fill(m.body, v);
  useEffect(() => { setEd(null); }, [v.name, v.who, v.co, v.role]);
  const href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
  return <details className="card faq" data-m={m.id}><summary><b>{m.t}</b> <span className="tag">{m.tier}</span></summary>
    <p className="dim sm"><b>When:</b> {m.when}</p>
    <label className="dim sm">Subject<input className="subj" value={subj} onChange={e => setEd({ s: e.target.value, b: body })} /></label>
    <label className="dim sm" style={{ marginTop: 8 }}>Message<textarea className="bodyt" rows={12} value={body} onChange={e => setEd({ s: subj, b: e.target.value })} /></label>
    <div className="row" style={{ marginTop: 8 }}><CopyBtn text={'Subject: ' + subj + '\n\n' + body} label="📋 Copy" /><a className="btn ghost" target="_blank" rel="noopener" href={href}>✉️ Open in mail</a></div>
    <p className="dim sm"><b>Tips</b></p><Ul a={m.tips} /></details>;
}
function Toolkit({ arg }) {
  const { S, set } = useS(); const tab = ['pro', 'mail', 'words'].includes(arg) ? arg : 'pro';
  const y = yearsOf(S), li = LD ? (y === null || y === undefined ? 0 : Math.min(3, y < 1 ? 0 : y < 3 ? 1 : y < 9 ? 2 : 3)) : 0;
  const q = S.mailv || {}, v = { name: q.name === undefined ? (S.name || '') : q.name, who: q.who || '', co: q.co || '', role: q.role || '' };
  const tabs = [['pro', 'Explain like a pro'], ['mail', 'Email drafts'], ['words', 'Say this, not that']];
  return <><h1>🧰 Career toolkit</h1><p className="dim">How to explain your work well, and emails you can copy, edit and send. Useful at any level, from first job to leadership.</p>
    <div className="tabs">{tabs.map(x => <button key={x[0]} className={'chip' + (x[0] === tab ? ' on' : '')} onClick={() => go('#/toolkit/' + x[0])}>{x[1]}</button>)}</div>
    {tab === 'pro' && <><div className="card"><h3>For your level: {X.LEVEL_PRO[li][0]}</h3><Ul a={X.LEVEL_PRO[li][1]} /><p className="dim sm">Change your experience in <a href="#/profile">Profile</a> to see tips for another level.</p></div>
      {X.FRAMES.map((f, i) => <details className="card faq" key={f[0]} open={i === 0}><summary><b>{f[0]}</b> <span className="dim sm">· {f[1]}</span></summary><Ul a={f[2]} /><pre className="mailpre">{f[3]}</pre></details>)}
      <div className="card"><h3>Practise it now</h3><p className="dim">Say your answer out loud and get feedback on structure, confidence and clarity.</p><div className="row"><a className="btn" href="#/interview">🎤 Practise answers</a><a className="btn ghost" href="#/speak">Speak and score</a></div></div></>}
    {tab === 'words' && <><div className="card"><table className="tbl"><thead><tr><th>Instead of</th><th>Say</th></tr></thead><tbody>{X.WORDS.map(w => <tr key={w[0]}><td>{w[0]}</td><td>{w[1]}</td></tr>)}</tbody></table></div>
      <div className="card"><h3>Voice and body language</h3><Ul a={['Speak a little slower than normal. Pause after the main point.', 'Look at the camera in online interviews, not at your own face.', 'Sit straight, keep a glass of water, and keep your phone on silent.', 'End with a question: "Does that answer what you were asking?"']} /></div></>}
    {tab === 'mail' && <><div className="card"><h3>Fill once, use in every draft</h3><div className="sg">{X.FIELDS.map(f => <label className="dim sm" key={f[1]}>{f[0]}<input value={v[f[1]]} placeholder={f[0]} onChange={e => set({ mailv: { ...v, [f[1]]: e.target.value } })} /></label>)}</div></div>
      {X.MAIL.map(m => <MailDraft key={m.id} m={m} v={v} />)}
      <p className="dim sm">Resignation letter and the full offer to joining steps are in <a href="#/journey/7">Job search guide</a> (stage 7) and the <a href="#/offer">Offer helper</a>. Drafts are general templates. Edit them to your situation and company policy.</p></>}
  </>;
}

/* ================= Mentor ================= */
const lakh = n => (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
const range = r => lakh(r[0]) + ' to ' + lakh(r[1]) + ' lakh';
const famM = t => (J.family ? J.family(t) : 'biz');
function Mentor({ arg }) {
  const { S, set } = useS(); const sv = S.mt || {}, sw = S.sw || {}, lad = S.lad || {}, tracks = D.TRACKS, ok = id => tracks.some(t => t.id === id);
  const m = Object.assign({ from: S.track && ok(S.track) ? S.track : 'support', to: 'servicenow', years: lad.years !== undefined && lad.years !== '' ? lad.years : 2, pay: '', hrs: 1, join: '', cos: '', city: '' }, sw.from && ok(sw.from) ? { from: sw.from } : {}, sw.to && ok(sw.to) ? { to: sw.to } : {}, sv);
  if (m.from === m.to) m.to = tracks.find(t => t.id !== m.from).id;
  const up = o => set({ mt: { ...m, ...o } });
  const years = Math.max(0, Math.min(40, +m.years || 0)), fN = tname(m.from), tN = tname(m.to), ff = famM(m.from), tf = famM(m.to), same = ff === tf, tier = years < 3 ? 0 : years < 6 ? 1 : 2, mv = X.MV[m.to] || [[2.5, 5], [5, 10], [10, 20]];
  const pay = parseFloat(m.pay) || 0, now = new Date(), cm = now.getMonth(), hrs = +m.hrs;
  const hf = hrs >= 3 ? 0.7 : hrs >= 2 ? 1 : hrs >= 1 ? 1.5 : 2.2, base = same ? 2 : (tf === 'it' && ff !== 'it' ? 4.5 : 3.5), learn = Math.max(1, Math.round(base * hf)), search = tier === 0 ? 2 : tier === 1 ? 3 : 4, total = learn + search;
  let offer, offerTxt;
  if (same && pay) { offer = [pay * 0.95, pay * 1.35]; offerTxt = 'Your fields are close, so many people join at about the same pay or a step up.'; }
  else if (pay) { offer = [Math.max(mv[0][0], pay * 0.75), Math.max(mv[0][1], pay * 1.0)]; offerTxt = 'In a new field the first offer is often near your current pay or the entry band, whichever fits the role. Skills you already have, plus a good project, move you to the top of that range. Many people catch up to the usual band in 12 to 18 months.'; }
  else { offer = tier === 0 ? mv[0] : tier === 1 ? [mv[0][0], (mv[0][1] + mv[1][0]) / 2] : [mv[0][0], mv[1][0]]; offerTxt = 'Add your current pay above to see a personal range. Switchers usually enter near the entry band and grow fast once they show results.'; }
  const targetM = m.join === '' ? null : +m.join; let startAt, joinAt;
  if (targetM !== null) { joinAt = targetM; let d = (targetM - cm + 12) % 12; if (d === 0) d = 12; startAt = Math.max(0, d - total); }
  else { let best = 0, bd = 99; for (let d = total; d < total + 12; d++) { const mm = (cm + d) % 12; if (X.HIRE[mm] >= 8) { best = mm; bd = d; break; } } joinAt = best; startAt = Math.max(0, bd - total); }
  const monthOff = o => { const d = new Date(now.getFullYear(), cm + o, 1); return X.MON[d.getMonth()] + ' ' + d.getFullYear(); };
  const steps = [['Now', startAt === 0 ? 'Start today' : 'Prepare quietly', 'Pick your field, set a daily time slot, open the study path.'], [monthOff(startAt), 'Learn the basics (' + learn + ' month' + (learn > 1 ? 's' : '') + ')', 'Finish topics, quizzes and a small project. ' + m.hrs + ' hour' + (m.hrs > 1 ? 's' : '') + ' a day is enough if you stay regular.'], [monthOff(startAt + learn - 1), 'Build proof', 'Resume, LinkedIn, 2 projects, 5 stories using STAR.'], [monthOff(startAt + learn), 'Apply and network (' + search + ' months)', 'Apply to 5 to 10 roles a day or week, ask for referrals, track in the Tracker.'], [monthOff(startAt + total), 'Offers and joining', 'Compare offers, negotiate, serve notice with grace.']];
  const peak = X.HIRE.map((h, i) => [h, i]).filter(x => x[0] >= 8).map(x => X.MFULL[x[1]]);
  const names = String(m.cos || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean).slice(0, 5);
  const kw = (J.KW && J.KW[m.to]) || [tN], kws = kw.slice(0, 3);
  const cities = CD ? [...new Set(CD.co.flatMap(c => c[2]))].filter(x => x !== 'Pan India').sort() : [];
  const tr = (J.TRANSFER && J.TRANSFER[m.from]) || [], ad = X.ADAPT[tf] || X.ADAPT.biz;
  const chans = X.CHAN.filter(c => c[3] === 'all' || (c[3] === 'it' ? tf === 'it' : tf !== 'it')).slice(0, 9);
  const tlist = tracks.map(t => [t.id, t.ic + ' ' + t.name]);
  const done = S.mtdone || {}, CK = [['learn', 'Choose my target field and daily study time'], ['resume', 'Update my resume and LinkedIn for the new field'], ['proj', 'Finish one small project'], ['intro', 'Practise my self introduction aloud'], ['alerts', 'Set job alerts on Naukri and LinkedIn'], ['ref', 'Message 5 people for advice or referral'], ['apply', 'Apply to my first 10 roles'], ['mock', 'Do 3 mock interviews'], ['neg', 'Prepare my salary talk and notice period plan']];
  const nd = CK.filter(c => done[c[0]]).length;
  const coCard = n => {
    const hit = CD ? CD.co.find(c => c[0].toLowerCase() === n.toLowerCase()) || CD.co.find(c => c[0].toLowerCase().includes(n.toLowerCase())) : null, kind = hit ? hit[1] : '', nm = hit ? hit[0] : n;
    return <div className="card" key={n}><b>{nm}</b>{hit && <> <span className="tag">{(CD.kinds[kind] || [kind])[0]}</span></>}{hit && <p className="dim sm">📍 {hit[2].slice(0, 5).join(', ')}</p>}<p className="sm">{X.BY[kind] || X.BY.def}</p>
      <div className="row"><a className="btn sm" target="_blank" rel="noopener" href={'https://www.google.com/search?q=' + encodeURIComponent(nm + ' careers ' + (kw[0] || ''))}>Search careers</a><a className="btn sm" target="_blank" rel="noopener" href={'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent((kw[0] || tN) + ' ' + nm)}>LinkedIn jobs</a></div></div>;
  };
  const lab = (t, ch) => <label className="dim sm">{t}{ch}</label>;
  return <>
    <a className="dim" href="#/career">← Jobs</a><h1>🧭 Career mentor</h1><p className="dim">Changing jobs or moving to a new field is a big and normal step. Tell me where you are and where you want to go. I will show the time it takes, ballpark pay, the best months, how to find jobs and what to do each month. Everything here is a general guide to help you plan.</p>
    <div className="card"><div className="sg" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
      {lab('I work or studied in', <SS value={m.from} opts={tlist} onChange={v => up({ from: v })} />)}
      {lab('I want to move to', <SS value={m.to} opts={tlist} onChange={v => up({ to: v })} />)}
      {lab('Years of experience', <input id="myr" type="number" min="0" max="40" step="0.5" inputMode="decimal" value={m.years} onChange={e => up({ years: e.target.value })} />)}
      {lab('Current pay, lakh per year (optional)', <input id="mpay" type="number" min="0" max="500" step="0.5" inputMode="decimal" placeholder="for example 4.5" value={m.pay} onChange={e => up({ pay: e.target.value })} />)}
      {lab('Study time each day', <Sel id="mhrs" value={m.hrs} opts={[[0.5, '30 minutes'], [1, '1 hour'], [2, '2 hours'], [3, '3 hours or more']]} onChange={v => up({ hrs: +v })} />)}
      {lab('I want to join a new job by', <Sel id="mjoin" value={m.join} any="As soon as I am ready" opts={X.MFULL.map((x, i) => [i, x])} onChange={v => up({ join: v })} />)}
      {lab('Preferred city', <SS value={m.city} any="Any city" opts={cities.map(c => [c, c])} onChange={v => up({ city: v })} />)}
      {lab('Companies I am trying (comma separated)', <input id="mcos" placeholder="for example TCS, Infosys, Zoho" value={m.cos} onChange={e => up({ cos: e.target.value })} />)}
    </div></div>
    <div className="card hero pop2"><div><span className="tag">{fN} → {tN}</span><h2 style={{ margin: '.3em 0' }}>About {total} months to your new job</h2><p>{same ? 'Your fields are close, so your path is shorter.' : 'Your skills carry over. Plan about ' + learn + ' months of learning and ' + search + ' months of searching.'} Starting {startAt === 0 ? 'today' : 'in ' + monthOff(startAt)}, you can aim to join around <b>{X.MFULL[joinAt]}</b> when companies hire the most.</p>
      <div className="row"><a className="btn primary" href={'#/learn/' + m.to}>📚 Start learning</a><a className="btn" href={'#/companies/' + m.to}>🏢 Companies</a><a className="btn" href="#/ladder">🪜 Career ladder</a></div></div></div>
    <h2>💰 Market value in {tN}</h2><div className="card"><div className="sg">{['Starting or switching', '3 to 6 years', '6+ years'].map((l, i) => <div key={l} className={'mv' + (i === tier ? ' me' : '')}><small className="dim">{l}</small><b>{range(mv[i])}</b>{i === tier && <small className="ok">You are here</small>}</div>)}</div>
      <p className="sm" style={{ marginTop: 10 }}><b>Your likely first offer{pay ? '' : ' range'}:</b> {range(offer)} a year. {offerTxt}</p><p className="dim sm">Ballpark yearly pay in India. It changes with city, company, skills and demand. Check AmbitionBox, Glassdoor and Naukri for the latest numbers, and ask recruiters for the range early.</p></div>
    <h2>📅 Best months and your timeline</h2><div className="card"><p className="sm">Busy hiring months: <b>{peak.join(', ')}</b>. Slower months are good for learning. Bars show hiring activity, 📚 learning, 📨 applying, 🎯 your target join month.</p>
      <div className="mstrip">{X.HIRE.map((h, i) => { const lm = [...Array(learn)].some((_, k) => (cm + startAt + k) % 12 === i), ap = [...Array(search)].some((_, k) => (cm + startAt + learn + k) % 12 === i); return <div key={i} className={'mcol' + (i === cm ? ' now' : '') + (i === joinAt ? ' join' : '')}><div className="mbar"><i style={{ height: h * 10 + '%' }} /></div><b>{X.MON[i]}</b><small>{lm ? '📚' : ap ? '📨' : ''}{i === joinAt ? '🎯' : ''}</small></div>; })}</div>
      <p className="dim sm">{X.WHY[joinAt]}.</p>
      <ol className="steps">{steps.map((x, i) => <li key={i}><b>{x[0]}: {x[1]}</b><br /><span className="dim sm">{x[2]}</span></li>)}</ol>
      <p className="dim sm">Good to know: join after your bonus or appraisal letter if you can, and begin applying about 2 months before you want to leave, since notice periods are 1 to 3 months.</p></div>
    <h2>⏰ When will openings come for you?</h2><div className="card"><ul className="mist"><li>{tier === 0 ? 'Entry and trainee roles are posted all year. Biggest batches come in July to September and January to March.' : tier === 1 ? 'Roles for 3 to 6 years are posted all year. Expect more in January to March and July to September, right after appraisals and new budgets.' : 'Senior roles are fewer and often filled by referral or consultants. Start 4 to 6 months early and keep your network warm.'}</li><li>Set alerts for: <b>{kws.join(', ')}</b>. Check each morning, early applicants get seen first.</li><li>Many roles never reach job boards. Message people on LinkedIn, share your project and ask for advice.</li><li>If you hear nothing in 2 weeks, follow up politely. The <a href="#/toolkit/mail">Toolkit</a> has the email.</li></ul></div>
    {names.length ? <><h2>🏢 Your target companies</h2><div className="grid">{names.map(coCard)}</div></> : <div className="card"><p className="dim">Add the companies you are trying above and I will show how each one hires and when to watch for openings.</p></div>}
    <h2>🔎 Ways to find your job</h2><div className="grid">{chans.map(c => <div className="card" key={c[0]}><b>{c[1] ? <a href={c[1]} target="_blank" rel="noopener">{c[0]}</a> : c[0]}</b><p className="dim sm">{c[2]}</p></div>)}</div>
    <div className="card"><p className="sm"><b>Stay safe:</b> a real employer never asks you to pay for a job, a test or a laptop. Check the official careers page before sharing documents.</p></div>
    <h2>🌱 What changes, and how to settle in quickly</h2><div className="card"><p className="sm">Moving from {X.LOOK[ff] || 'your'} work to {X.LOOK[tf] || 'new'} work, here is what to expect and how to make it easy.</p><ul className="mist">{ad.map(a => <li key={a[0]}><b>{a[0]}:</b> {a[1]}</li>)}</ul>{tr.length > 0 && <p className="sm"><b>Strengths you bring from {fN}:</b> {tr.slice(0, 3).map(x => x.charAt(0).toLowerCase() + x.slice(1)).join('; ')}.</p>}<p className="dim sm">Most people feel comfortable in the new role within the first 60 to 90 days.</p></div>
    <h2>✅ Your mentor checklist</h2><div className="card"><div className="bar"><i style={{ width: Math.round(nd / CK.length * 100) + '%' }} /></div><p className="dim sm">{nd} of {CK.length} done</p>{CK.map(c => <label className="ck" key={c[0]}><input type="checkbox" checked={!!done[c[0]]} onChange={e => set({ mtdone: { ...done, [c[0]]: e.target.checked ? 1 : 0 } })} /> {c[1]}</label>)}</div>
    <div className="row"><a className="btn primary" href="#/resumepdf">📄 Resume</a><a className="btn" href="#/toolkit/mail">🧰 Toolkit emails</a><a className="btn" href="#/tracker">📋 Tracker</a><a className="btn" href="#/speak">🗣️ Practise intro</a></div></>;
}

export default { companies: Companies, journey: Journey, toolkit: Toolkit, mentor: Mentor, offer: Offer };
