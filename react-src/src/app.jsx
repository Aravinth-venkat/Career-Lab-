import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { D, C, load, save, yearsOf, modeOf, R, calc, pdfBuild, tidy } from './lib.js';
import './styles.css';
import EXTRA from './extra.js';
import ResumeUpload from './ResumeUpload.jsx';
import { parse, layout, TEMPLATES, pdfFromPages, PAGE, CSSF } from './resumeTpl.js';
import { docxBytes } from './resumeDocx.js';
import { Style, Content } from './resumeEdit.jsx';

import { Provider, useS, useJobs, skillsOf, FRESH, SENIOR, URGENT, ago, stepsOf, lastIdx } from './ctx.jsx';
const useHash = () => { const get = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/'); const [h, setH] = useState(get); useEffect(() => { const f = () => { setH(get()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []); return h; };

const ALL = { home: ['Home', '🏠'], career: ['Jobs', '💼'], learn: ['Learn', '📚'], practice: ['Practice', '🎮'], interview: ['Interview', '🎤'], report: ['My career report', '📊'], tracker: ['My applications', '📌'], ctc: ['CTC to in-hand', '💵'], resumepdf: ['Resume maker', '📄'], pay: ['Pay compass', '💰'], reading: ['Reading', '📚'], profile: ['Profile', '👤'], companies: ['Companies', '🏢'], journey: ['Career journey', '🧭'], lab: ['Coding lab', '💻'], ladder: ['Career ladder', '🪜'], mentor: ['Career mentor', '🧑‍🏫'], mock: ['Mock interview', '🎙️'], mymap: ['My journey map', '🗺️'], play: ['Practice games', '🎮'], progress: ['Save progress', '💾'], toolkit: ['Career toolkit', '🧰'], speak: ['Speaking practice', '🗣️'], offer: ['Offer helper', '🤝'] };
const PRIME = { new: ['home', 'career', 'learn', 'interview', 'report'], fresher: ['home', 'career', 'learn', 'interview', 'resumepdf'], exp: ['home', 'career', 'report', 'interview', 'ctc', 'tracker'], senior: ['home', 'career', 'ctc', 'tracker', 'interview'] };
const TABK = { new: ['home', 'career', 'learn', 'interview', 'report'], fresher: ['home', 'career', 'learn', 'interview', 'resumepdf'], exp: ['home', 'career', 'report', 'interview', 'ctc'], senior: ['home', 'career', 'ctc', 'tracker', 'interview'] };
const GROUPS = [['Find work', ['career', 'companies', 'tracker', 'journey']], ['Prepare', ['learn', 'interview', 'mock', 'speak', 'play', 'lab', 'resumepdf', 'report']], ['Money and offers', ['ctc', 'pay', 'offer']], ['Grow', ['ladder', 'mentor', 'mymap', 'toolkit', 'reading']], ['You', ['progress', 'profile']]];
const MODEL = { new: '', fresher: 'Fresher view', exp: 'Experienced view', senior: 'Senior view' };
const NavLink = ({ k, cur }) => <a className={'nav' + (cur === k ? ' on' : '')} href={'#/' + k}><span>{ALL[k][1]}</span><span>{ALL[k][0]}</span></a>;

function Shell({ route, children }) {
  const { S, set } = useS(); const mode = modeOf(S), prime = PRIME[mode]; const [sheet, setSheet] = useState(false); useEffect(() => setSheet(false), [route]);
  return <div className="app">
    <aside className="side">
      <a className="brand" href="#/home"><span className="logo">P</span>Padimachi</a>
      {MODEL[mode] && <div className="mode">{MODEL[mode]} · <a href="#/profile">Change</a></div>}
      {prime.map(k => <NavLink key={k} k={k} cur={route} />)}
      <details className="more" open={!prime.includes(route)}><summary>More <span>+</span></summary>
        {GROUPS.map(([g, ks]) => { const f = ks.filter(k => !prime.includes(k)); return f.length ? <div key={g}><div className="nsub">{g}</div>{f.map(k => <NavLink key={k} k={k} cur={route} />)}</div> : null; })}
      </details>
      <div style={{ flex: 1 }} />
      <button className="btn sm ghost" onClick={() => set({ theme: S.theme === 'light' ? 'dark' : 'light' })}>{S.theme === 'light' ? '🌙 Dark' : '☀️ Light'}</button>
    </aside>
    <div>
      <div className="top"><a className="brand" href="#/home" style={{ padding: 0 }}><span className="logo">P</span>Padimachi</a><button className="btn sm ghost" onClick={() => set({ theme: S.theme === 'light' ? 'dark' : 'light' })}>{S.theme === 'light' ? '🌙' : '☀️'}</button></div>
      <main>{children}</main>
    </div>
    <nav className="tabbar">{TABK[mode].slice(0, 4).map(k => <a key={k} href={'#/' + k} className={route === k ? 'on' : ''}><span className="ic">{ALL[k][1]}</span>{k === 'career' ? 'Jobs' : k === 'report' ? 'Report' : k === 'resumepdf' ? 'Resume' : k === 'ctc' ? 'CTC' : k === 'tracker' ? 'Applied' : ALL[k][0]}</a>)}<a href="#/more" onClick={e => { e.preventDefault(); setSheet(x => !x); }} className={sheet || !TABK[mode].slice(0, 4).includes(route) && route !== 'home' ? 'on' : ''}><span className="ic">☰</span>More</a></nav>
    {sheet && <div className="sheetbg" onClick={() => setSheet(false)}><div className="sheet" onClick={e => e.stopPropagation()}><div className="row" style={{ justifyContent: 'space-between' }}><b>All pages</b><button className="btn sm ghost" onClick={() => setSheet(false)}>✕ Close</button></div>
      {GROUPS.map(([g, ks]) => <div key={g}><div className="nsub">{g}</div><div className="sheetgrid">{ks.map(k => <a key={k} href={'#/' + k} className={route === k ? 'on' : ''}><span>{ALL[k][1]}</span>{ALL[k][0]}</a>)}</div></div>)}
      <div className="nsub">Display</div><button className="btn sm" onClick={() => set({ theme: S.theme === 'light' ? 'dark' : 'light' })}>{S.theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}</button></div></div>}
  </div>;
}

/* ---------- Home ---------- */
const QA = { fresher: [['🌱 Fresher jobs', '#/career'], ['🎤 Practise', '#/interview'], ['📚 Learn', '#/learn']], exp: [['💼 Matched jobs', '#/career'], ['📊 My report', '#/report'], ['💵 Check CTC', '#/ctc']], senior: [['💼 Matched roles', '#/career'], ['💵 Compare offers', '#/ctc'], ['📌 My applications', '#/tracker']] };
const TITLE = { fresher: 'Start your career: openings for you', exp: 'Your next move: roles that fit your experience', senior: 'Your next level: roles, pay and offers' };
function Home() {
  const { S } = useS(); const jobs = useJobs(), mode = modeOf(S), has = !!S.resume, st = stepsOf(S), n = st.filter(x => x[0]).length, nx = lastIdx(st);
  const cos = jobs ? new Set(jobs.map(j => j.c)).size : 0;
  return <>
    <section className="card hero">
      <div>
        <span className="tag">{has ? 'Your career buddy' : 'Free · for freshers and IT job seekers'}</span>
        <h1 style={{ margin: '14px 0 10px' }}>{has ? TITLE[mode] || 'Welcome back' : 'Find jobs that fit your resume, and learn what you are missing.'}</h1>
        <p className="dim">{has ? 'Pick up where you left off.' : 'Upload your resume. See matched jobs from company career pages, your level and a study plan.'}</p>
        <div className="row" style={{ marginTop: 14 }}>{has ? (QA[mode] || QA.exp).map((x, i) => <a key={i} className={'btn' + (i === 0 ? ' primary' : '')} href={x[1]}>{x[0]}</a>) : <a className="btn primary big" href="#/resumepdf">📄 Add my resume</a>}</div>
        {!has && <ul className="dim sm" style={{ listStyle: 'none', padding: 0, margin: '14px 0 0' }}><li>✓ Jobs from company pages, checked every 3 hours</li><li>✓ No sign-up. Your resume stays on your phone</li></ul>}
      </div>
      <div className="heroart" style={{ textAlign: 'center', fontSize: '5rem' }}>🎯</div>
    </section>
    {jobs && <p className="dim sm" style={{ margin: '4px 4px 0' }}><b>{jobs.length.toLocaleString('en-IN')}</b> jobs open today from <b>{cos}</b> companies</p>}
    <section className="card"><div className="row" style={{ justifyContent: 'space-between' }}><b>Your path</b><span className="dim sm">{n} of 5 done</span></div><div className="bar" style={{ margin: '10px 0' }}><i style={{ width: n * 20 + '%' }} /></div>
      <ol className="path">{st.map((x, i) => <li key={i} className={x[0] ? 'done' : i === nx ? 'now' : ''}><a href={x[3]}><span className="pi">{x[0] ? '✓' : x[1]}</span>{x[2]}</a></li>)}</ol>
      {nx >= 0 ? <a className="btn primary" href={st[nx][3]}>Next: {st[nx][2]}</a> : <p>You finished the path. Keep practising and applying.</p>}</section>
    <div className="grid">
      <a className="card" href="#/learn"><h3>📚 Learn</h3><p className="dim sm">{D.TOPICS.length} topics with lessons, quizzes and real scenarios.</p></a>
      <a className="card" href="#/interview"><h3>🎤 Interview practice</h3><p className="dim sm">{D.OPEN.length} questions with feedback on your answer.</p></a>
      <a className="card" href="#/ctc"><h3>💵 CTC to in-hand</h3><p className="dim sm">Monthly salary, notice period and offer comparison.</p></a>
    </div>
  </>;
}

/* ---------- Jobs ---------- */
function Jobs() {
  const { S, set } = useS(); const jobs = useJobs(), mode = modeOf(S); const sk = useMemo(() => skillsOf(S), [S.resume]), skO = useMemo(() => D.SKILLS.filter(x => sk.includes(x.n)), [sk]);
  const [q, setQ] = useState(''), [city, setCity] = useState(''), [f, setF] = useState(mode === 'fresher' ? 'fresh' : ''), [n, setN] = useState(6);
  useEffect(() => { if (!S.sj) set({ sj: 1 }); }, []);
  const list = useMemo(() => {
    if (!jobs) return []; const t = q.toLowerCase().trim();
    let a = jobs.filter(j => (!t || (j.t + ' ' + j.c).toLowerCase().includes(t)) && (!city || (j.l || '').includes(city)) && (f !== 'fresh' || (FRESH.test(j.t + ' ' + (j.d || '')) && !SENIOR.test(j.t))) && (f !== 'urgent' || URGENT.test(j.t + ' ' + (j.d || ''))) && (f !== 'week' || Date.now() - (j.p || j.s) < 7 * 864e5));
    a = a.map(j => { const tx = (j.t + ' ' + (j.d || '')).toLowerCase(), hit = skO.filter(s => s.al.some(a => tx.includes(a))).map(s => s.n); return { ...j, hit, pct: sk.length && hit.length ? Math.min(96, 40 + hit.length * 14) : 0 }; });
    return a.sort((x, y) => y.pct - x.pct || (y.p || y.s) - (x.p || x.s));
  }, [jobs, q, city, f, sk, skO]);
  const cities = useMemo(() => { const m = {}; (jobs || []).forEach(j => { const c = (j.l || '').split(',')[0].trim(); if (c) m[c] = (m[c] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]); }, [jobs]);
  const save_ = j => set(o => { const a = Array.isArray(o.apps) ? o.apps : []; return a.some(x => x.id === 'j:' + j.id) ? {} : { apps: [{ id: 'j:' + j.id, co: j.c, role: j.t, link: j.a || j.u, st: 'wish', ap: 0, ts: Date.now(), iv: [] }, ...a] }; });
  const saved = id => (S.apps || []).some(x => x.id === 'j:' + id);
  return <>
    <h1>💼 Job openings</h1>
    <p className="dim">Every job links to the company's own page. Re-checked every 3 hours, closed jobs removed. <a href="https://t.me/padimachi_jobs" target="_blank" rel="noreferrer">Get new jobs on Telegram</a></p>
    <div className="card"><div className="row"><input style={{ flex: 1, minWidth: 200 }} placeholder="Search a role or company" value={q} onChange={e => { setQ(e.target.value); setN(6); }} />
      <select style={{ width: 'auto' }} value={city} onChange={e => { setCity(e.target.value); setN(6); }}><option value="">All cities</option>{cities.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="row" style={{ marginTop: 12 }}>{[['', 'All'], ...(mode === 'exp' || mode === 'senior' ? [] : [['fresh', '🌱 Fresher friendly']]), ['urgent', '⚡ Urgent'], ['week', '🆕 This week']].map(([k, l]) => <button key={k} className={'chip' + (f === k ? ' on' : '')} onClick={() => { setF(k); setN(6); }}>{l}</button>)}</div></div>
    {!S.resume && <div className="note">Add your resume to see match percentages. <a href="#/resumepdf">Add resume</a></div>}
    {!jobs ? <div className="card">Loading jobs…</div> : <p className="dim sm">{list.length.toLocaleString('en-IN')} openings</p>}
    {list.slice(0, n).map(j => <article className="card job" key={j.id}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><h3>{j.t}</h3>{j.pct > 0 && <span className="pct">{j.pct}% match</span>}</div>
      <p className="meta"><b>{j.c}</b> · 📍 {j.l || 'India'} · {ago(j.p || j.s)}{j.sa ? ' · ₹' + j.sa[0] + '–' + j.sa[1] + ' LPA' : ''}</p>
      {j.hit.length > 0 && <p className="sm">✅ <b>Why it fits:</b> your resume shows {j.hit.slice(0, 3).join(', ')}.</p>}
      <div className="row"><a className="btn sm primary" href={j.a || j.u} target="_blank" rel="noopener noreferrer" onClick={() => set({ pa: { id: j.id, co: j.c, role: j.t, link: j.a || j.u, t: Date.now() } })}>Apply on company page ↗</a><button className="btn sm" onClick={() => save_(j)}>{saved(j.id) ? '✓ Saved' : '☆ Save'}</button></div>
    </article>)}
    {list.length > n && <div className="row"><button className="btn" onClick={() => setN(n + 10)}>Show more</button></div>}
  </>;
}
function DidApply() {
  const { S, set } = useS(); const [show, setShow] = useState(false);
  useEffect(() => { const f = () => { if (!document.hidden && S.pa && Date.now() - S.pa.t > 4000) setShow(true); }; document.addEventListener('visibilitychange', f); window.addEventListener('focus', f); return () => { document.removeEventListener('visibilitychange', f); window.removeEventListener('focus', f); }; }, [S.pa]);
  if (!show || !S.pa) return null; const p = S.pa;
  const yes = () => { set(o => { const a = (o.apps || []).slice(), i = a.findIndex(x => x.id === 'j:' + p.id); if (i >= 0) a[i] = { ...a[i], st: 'applied', ap: Date.now() }; else a.unshift({ id: 'j:' + p.id, co: p.co, role: p.role, link: p.link, st: 'applied', ap: Date.now(), ts: Date.now(), iv: [] }); return { apps: a, pa: null }; }); setShow(false); };
  return <div className="card pop"><b>Did you apply?</b><p className="sm dim">{p.role} at {p.co}</p><div className="row"><button className="btn primary sm" onClick={yes}>Yes, I applied</button><button className="btn sm" onClick={() => { set({ pa: null }); setShow(false); }}>Not yet</button></div></div>;
}

/* ---------- Learn ---------- */
function Learn({ arg }) {
  const { S } = useS(); const cur = arg !== undefined ? (arg === 'all' ? '' : arg) : (S.track || ''); const [all, setAll] = useState(false), [q, setQ] = useState('');
  const list = D.TOPICS.filter(t => (!cur || t.track === cur) && (!q || t.name.toLowerCase().includes(q.toLowerCase())));
  const shown = all || q ? list : list.slice(0, 12);
  return <>
    <h1>📚 Learn</h1><p className="dim">{D.TOPICS.length} topics · lessons, key terms, quizzes and real scenarios.</p>
    <div className="tabs"><a className={'chip' + (!cur ? ' on' : '')} href="#/learn/all">All</a>{D.TRACKS.map(t => <a key={t.id} className={'chip' + (cur === t.id ? ' on' : '')} href={'#/learn/' + t.id}>{t.ic} {t.name}</a>)}</div>
    <input placeholder="Search topics" value={q} onChange={e => setQ(e.target.value)} />
    <h2>{cur ? (D.TRACKS.find(t => t.id === cur) || {}).name : 'All topics'} <span className="dim sm">({list.length})</span></h2>
    <div className="grid">{shown.map(t => <a key={t.id} className="card" href={'#/topic/' + t.id}><h3>{t.ic} {t.name}</h3><p className="dim sm">{(D.TRACKS.find(x => x.id === t.track) || {}).name} · {t.facts.length} terms</p></a>)}</div>
    {list.length > shown.length && <div className="row"><button className="btn" onClick={() => setAll(true)}>Show all {list.length} topics</button></div>}
  </>;
}
function Quiz({ qs }) {
  const [i, setI] = useState(0), [pick, setPick] = useState(null), [score, setScore] = useState(0);
  if (!qs || !qs.length) return <div className="card">No quiz for this topic yet.</div>;
  if (i >= qs.length) return <div className="card"><h3>Score: {score} / {qs.length}</h3><button className="btn" onClick={() => { setI(0); setPick(null); setScore(0); }}>Try again</button></div>;
  const q = qs[i];
  return <div className="card"><p className="dim sm">Question {i + 1} of {qs.length}</p><h3>{q.q}</h3>
    {q.o.map((o, k) => <button key={k} className={'opt' + (pick !== null ? (k === q.a ? ' ok' : k === pick ? ' no' : '') : '')} disabled={pick !== null} onClick={() => { setPick(k); if (k === q.a) setScore(s => s + 1); }}>{o}</button>)}
    {pick !== null && <><p><b>{pick === q.a ? 'Correct.' : 'Not quite.'}</b> {q.why}</p><button className="btn primary" onClick={() => { setI(i + 1); setPick(null); }}>{i + 1 >= qs.length ? 'Finish' : 'Next'}</button></>}</div>;
}
function Topic({ id }) {
  const t = D.TOPICS.find(x => x.id === id); const [tab, setTab] = useState('learn'), [rev, setRev] = useState(false);
  if (!t) return <p>Topic not found. <a href="#/learn">Back to Learn</a></p>;
  return <>
    <a className="dim" href={'#/learn/' + t.track}>← Back</a><h1 style={{ marginTop: 8 }}>{t.ic} {t.name}</h1>
    <div className="tabs">{[['learn', 'Learn'], ['terms', 'Key terms'], ['quiz', 'Quiz'], ['scen', 'Scenario']].map(([k, l]) => <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'learn' && <><div className="card"><span className="tag">The idea</span><p>{t.story}</p></div><div className="card"><span className="tag">Lesson</span><p>{t.lesson}</p><p className="dim"><b>Example:</b> {t.ex}</p></div>{t.tip && <div className="note"><b>Interview tip:</b> {t.tip}</div>}</>}
    {tab === 'terms' && <div className="grid">{t.facts.map(f => <div className="card" key={f.id}><b>{f.t}</b><p className="dim sm">{f.d}</p></div>)}</div>}
    {tab === 'quiz' && <Quiz qs={t.qs} />}
    {tab === 'scen' && <div className="card"><span className="tag alt">Real-time scenario</span><p style={{ fontSize: '1.1rem' }}>{(t.scen || [])[0]}</p>{!rev ? <button className="btn primary" onClick={() => setRev(true)}>Show the correct approach</button> : <ol>{(t.scen || []).slice(1).map((s, i) => <li key={i}>{s}</li>)}</ol>}</div>}
  </>;
}

/* ---------- Interview ---------- */
function Interview() {
  const { S, set } = useS(); const pool = useMemo(() => D.OPEN.filter(q => q.q && q.keys && q.m && (!q.track || !S.track || q.track === S.track || q.cat !== 'Technical')), [S.track]);
  const [i, setI] = useState(() => Math.floor(Math.random() * pool.length)), [txt, setTxt] = useState(''), [g, setG] = useState(null); const q = pool[i % pool.length];
  const check = () => { const r = C.grade(txt, q.keys); setG(r); if (r.words >= 8) set(o => ({ dims: [...(o.dims || []), { o: r.overall }].slice(-60), xp: (o.xp || 0) + 5 })); };
  const Bar = ({ l, v }) => <div style={{ margin: '8px 0' }}><div className="row" style={{ justifyContent: 'space-between' }}><span className="sm">{l}</span><span className="sm dim">{Math.round(v * 100)}%</span></div><div className="bar"><i style={{ width: v * 100 + '%' }} /></div></div>;
  return <><h1>🎤 Interview practice</h1><p className="dim">Answer in your own words. You get feedback on knowledge, clarity and reasoning.</p>
    <div className="card"><span className="tag">{q.cat}</span><h2 style={{ marginTop: 10 }}>{q.q}</h2><textarea style={{ minHeight: 140 }} placeholder="Type your answer…" value={txt} onChange={e => setTxt(e.target.value)} />
      <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={check} disabled={txt.trim().length < 5}>Check my answer</button><button className="btn" onClick={() => { setI(Math.floor(Math.random() * pool.length)); setTxt(''); setG(null); }}>Another question</button></div></div>
    {g && <div className="card"><h3>Your feedback</h3><Bar l="Knowledge" v={g.know} /><Bar l="Confidence" v={g.conf} /><Bar l="Reasoning" v={g.reason} /><Bar l="Clarity" v={g.clar} />
      {g.miss.length > 0 && <p className="sm"><b>Ideas to add:</b> {g.miss.slice(0, 5).join(', ')}</p>}<div className="note"><b>A strong answer:</b> {q.m}</div></div>}</>;
}

/* ---------- Resume and report ---------- */
function Preview({ pages, w }) {
  return <div className="rpages">{pages.map((p, i) => <svg key={i} viewBox={`0 0 ${PAGE.w} ${PAGE.h}`} className="rpage" style={{ maxWidth: w }}><rect width={PAGE.w} height={PAGE.h} fill="#fff" />{p.map((o, k) => o.t === 'rect' ? <rect key={k} x={o.x} y={o.y} width={o.w} height={o.h} fill={rgb(o.col)} /> : o.t === 'line' ? <line key={k} x1={o.x1} x2={o.x2} y1={o.y} y2={o.y} stroke={rgb(o.col)} strokeWidth={o.w} /> : <text key={k} x={o.x} y={o.y} fontSize={o.size} fill={rgb(o.col)} fontFamily={CSSF[o.f]} fontWeight={o.f === 'F2' || o.f === 'F4' ? 700 : 400} xmlSpace="preserve">{o.s.replace(/\x01/g, '\u2022')}</text>)}</svg>)}</div>;
}
import { ACC } from './resumeTpl.js';
const accentOf = k => ACC[k] || ACC.modern;
const rgb = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;
function ResumePdf() {
  const { S, set } = useS(); const [txt, setTxt] = useState(S.resume || ''), [tpl, setTpl] = useState(() => { try { return localStorage.getItem('pm_tpl') || 'modern'; } catch (e) { return 'modern'; } }), [edit, setEdit] = useState(!S.resume);
  const words = txt.trim().split(/\s+/).length, ok = words >= 20;
  const a = useMemo(() => { try { return words > 10 ? C.analyzeResume(txt, D.SKILLS) : null; } catch (e) { return null; } }, [txt]);
  const [doc, setDoc] = useState(null), [opt, setOpt] = useState(() => { try { return JSON.parse(localStorage.getItem('pm_ropt')) || {}; } catch (e) { return {}; } });
  useEffect(() => { setDoc(ok ? parse(txt, C.extractSkills(txt, D.SKILLS)) : null); }, [txt]);
  useEffect(() => { try { localStorage.setItem('pm_ropt', JSON.stringify(opt)); } catch (e) { } }, [opt]);
  const pages = useMemo(() => doc ? layout(doc, tpl, opt) : null, [doc, tpl, opt]);
  const pick = k => { setTpl(k); try { localStorage.setItem('pm_tpl', k); } catch (e) { } };
  const dlw = () => { const u = docxBytes(doc, tpl, { ...opt, accent: opt.accent || accentOf(tpl) }), l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([u], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })); l.download = (doc.name || 'resume').replace(/\s+/g, '-') + '-resume.docx'; l.click(); };
  const dl = () => { const s = pdfFromPages(pages, doc.name + ' resume'), u = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) u[k] = s.charCodeAt(k) & 255; const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })); l.download = (doc.name || 'resume').replace(/\s+/g, '-') + '-resume.pdf'; l.click(); };
  return <><h1>📄 Resume maker</h1><p className="dim">Add your resume once. Pick a template, check the preview, download a clean PDF. Nothing is uploaded.</p>
    <div className="card"><b>1. Add your resume</b> <span className="dim sm">PDF, Word or text. Read on your device only.</span><ResumeUpload onText={t => { setTxt(t); setEdit(false); }} />
      <div className="row" style={{ marginTop: 10 }}><button className="btn sm" onClick={() => setEdit(!edit)}>{edit ? 'Hide text' : '✏️ Edit text'}</button><button className="btn sm primary" disabled={!ok} onClick={() => set({ resume: txt, conf: 1 })}>{S.resume === txt && ok ? '✓ Saved' : 'Save my resume'}</button></div>
      {edit && <textarea style={{ marginTop: 10 }} placeholder="Or paste your resume text here" value={txt} onChange={e => setTxt(e.target.value)} />}</div>
    {doc && <><div className="card"><b>2. Choose a template</b><div className="tplgrid">{TEMPLATES.map(([k, n, d]) => <button key={k} className={'tpl' + (tpl === k ? ' on' : '')} onClick={() => pick(k)}><span className="tn">{n}</span><span className="dim sm">{d}</span></button>)}</div>
      <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={dl}>⬇️ Download PDF ({pages.length} page{pages.length > 1 ? 's' : ''})</button><button className="btn primary" onClick={dlw}>⬇️ Download Word (.docx)</button></div>
      <p className="dim sm">The Word file is one column with the same colours and fonts. Sidebar, Timeline and Compact look like their Modern, Classic cousins in Word; use the PDF for the exact design.</p>
      <p className="dim sm">Found: {doc.sections.map(s => s.title).join(', ') || 'no sections'}. If a section is missing, put its heading on its own line (for example EXPERIENCE) and the preview updates.</p></div>
      <Style o={opt} setO={setOpt} /><Content doc={doc} setDoc={setDoc} /><Preview pages={pages} w={620} /></>}
    {a && <div className="card"><div className="row" style={{ gap: 20 }}><div className="score" style={{ '--p': a.score }}><span>{a.score}</span></div><div><h3>Resume score</h3><p className="dim sm">Out of 100. Fix the points below to raise it.</p></div></div>
      <h2>Fixes</h2><ul>{a.tips.slice(0, 8).map((t, k) => <li key={k}>{t}</li>)}</ul></div>}</>;
}
function Report() {
  const { S } = useS(); const a = useMemo(() => S.resume ? C.analyzeResume(S.resume, D.SKILLS) : null, [S.resume]); const sk = skillsOf(S), y = yearsOf(S), mode = modeOf(S);
  if (!a) return <><h1>📊 Career report</h1><div className="card"><p>Add your resume to get your level, skills and a plan.</p><a className="btn primary" href="#/resumepdf">Add my resume</a></div></>;
  const tr = (C.detectTrack(S.resume, D.SKILLS)[0] || {}).track, tn = (D.TRACKS.find(t => t.id === tr) || {}).name || 'Your field', miss = D.SKILLS.filter(s => s.track === tr && !sk.includes(s.n)).slice(0, 6);
  return <><h1>📊 Your career report</h1><p className="dim">{tn} · about {y} year{y === 1 ? '' : 's'} · {MODEL[mode] || 'Getting started'}</p>
    <div className="card row" style={{ gap: 20 }}><div className="score" style={{ '--p': a.score }}><span>{a.score}</span></div><div><h3>Resume score</h3><p className="dim sm">{sk.length} skills found.</p><a className="btn sm" href="#/resumepdf">Improve my resume</a></div></div>
    <h2>Skills you have</h2><div className="row">{sk.slice(0, 20).map(s => <span key={s} className="chip on">{s}</span>)}{!sk.length && <span className="dim">None found yet.</span>}</div>
    <h2>Skills to add next</h2><div className="row">{miss.map(s => <a key={s.n} className="chip" href="#/learn">➕ {s.n}</a>)}</div>
    <h2>Fix first</h2><div className="card"><ul>{a.tips.slice(0, 5).map((t, k) => <li key={k}>{t}</li>)}</ul></div>
    <div className="row"><a className="btn primary" href="#/career">See matched jobs</a><a className="btn" href="#/interview">Practise interview</a></div></>;
}

/* ---------- Tools ---------- */
function Ctc() {
  const [a, setA] = useState({ ctc: 8, v: 0, b: 40 }), [b, setB] = useState({ ctc: 0, v: 0, b: 40 }), [reg, setReg] = useState('new'), [nd, setNd] = useState(60), [ns, setNs] = useState(30);
  const mk = o => calc({ ctc: o.ctc * 1e5, varPct: o.v, basicPct: o.b, pfCap: false, regime: reg, ded: 150000, pt: 200 }), A = mk(a), B = mk(b), two = b.ctc > 0;
  const F = ({ t, o, s }) => <div className="card"><h3>{t}</h3><label>Yearly CTC (lakh ₹)<input type="number" step="0.1" value={o.ctc} onChange={e => s({ ...o, ctc: +e.target.value })} /></label><label style={{ marginTop: 10 }}>Variable pay, % of CTC<input type="number" value={o.v} onChange={e => s({ ...o, v: +e.target.value })} /></label><label style={{ marginTop: 10 }}>Basic, % of fixed<input type="number" value={o.b} onChange={e => s({ ...o, b: +e.target.value })} /></label></div>;
  const Out = ({ t, c }) => <div className="card"><h3>{t}</h3><p style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{R(c.monthly)} <span className="dim sm">a month</span></p><ul className="sm dim"><li>Fixed monthly gross: {R(c.grossM)}</li><li>Employer PF and gratuity: {R(c.erPf + c.grat)} a year</li><li>Income tax a year: {R(c.tax)}</li><li>Total reaching you in a year: {R(c.takeYear)}</li></ul></div>;
  const left = Math.max(0, nd - Math.min(nd, ns));
  return <><h1>💵 CTC to in-hand salary</h1><p className="dim">Type the yearly CTC from your offer letter. An estimate, not tax advice (FY 2025-26 rules).</p>
    <div className="grid"><F t="Offer 1" o={a} s={setA} /><F t="Offer 2 (optional)" o={b} s={setB} /></div>
    <div className="card"><label>Tax regime<select value={reg} onChange={e => setReg(e.target.value)}><option value="new">New regime</option><option value="old">Old regime</option></select></label></div>
    <div className="grid"><Out t="Offer 1" c={A} />{two && <Out t="Offer 2" c={B} />}</div>
    {two && <div className="note"><b>{B.monthly > A.monthly ? 'Offer 2 gives ' + R(B.monthly - A.monthly) + ' more every month' : 'Offer 1 gives ' + R(A.monthly - B.monthly) + ' more every month'}.</b> Compare the monthly figure, not the CTC.</div>}
    <h2>Notice period</h2><div className="card"><div className="row"><label>Notice days<input type="number" value={nd} onChange={e => setNd(+e.target.value)} /></label><label>Days you will serve<input type="number" value={ns} onChange={e => setNs(+e.target.value)} /></label></div>
      <p>Days to buy out: <b>{left}</b> · on basic: <b>{R(A.basicM / 30 * left)}</b> · on gross: <b>{R(A.grossM / 30 * left)}</b></p></div></>;
}
function Pay() {
  const d = window.__SAL__ || { fields: {} }, f = d.fields || {}, ks = Object.keys(f).sort((x, y) => f[y].n - f[x].n), max = Math.max(1, ...ks.map(k => f[k].hi));
  return <><h1>💰 Pay compass</h1><p className="dim">Pay ranges that companies wrote in their own job posts (lakh ₹ a year). Only fields with enough posts are shown.</p>
    {!ks.length ? <div className="card">Not enough published pay yet.</div> : <div className="card">{ks.map(k => <div key={k} style={{ margin: '14px 0' }}><div className="row" style={{ justifyContent: 'space-between' }}><b>{k}</b><span className="sm dim">₹{f[k].lo}–{f[k].hi} L · {f[k].n} posts</span></div><div className="bar"><i style={{ width: f[k].hi / max * 100 + '%' }} /></div></div>)}</div>}</>;
}
function Reading() {
  const { S } = useS(); const [t, setT] = useState(S.track || 'servicenow'), B = (window.__BOOKS__ || { tracks: {} }).tracks;
  const list = (B[t] || []).concat(t === 'soft' ? [] : (B.soft || []).slice(0, 2));
  return <><h1>📚 Reading</h1><p className="dim">Books and free official guides for your field.</p><div className="tabs">{D.TRACKS.filter(x => B[x.id]).map(x => <button key={x.id} className={'chip' + (t === x.id ? ' on' : '')} onClick={() => setT(x.id)}>{x.name}</button>)}</div>
    {list.map((x, i) => <div className="card" key={i}><div className="row" style={{ justifyContent: 'space-between' }}><b>{x.t}</b><span className={'tag' + (x.k === 'book' ? ' alt' : '')}>{x.k === 'free' ? 'Free' : 'Book'}</span></div><p className="dim sm">{x.a}</p><p className="sm">{x.why}</p><a className="btn sm" target="_blank" rel="noreferrer" href={x.k === 'free' ? x.u : 'https://openlibrary.org/search?q=' + encodeURIComponent(x.t + ' ' + x.a)}>{x.k === 'free' ? 'Open ↗' : 'Find this book ↗'}</a></div>)}</>;
}
function Tracker() {
  const { S, set } = useS(); const a = S.apps || [], ST = [['wish', 'Saved'], ['applied', 'Applied'], ['screen', 'Screening'], ['iv', 'Interview'], ['offer', 'Offer'], ['joined', 'Joined'], ['rej', 'Rejected'], ['drop', 'Dropped']];
  const upd = (id, st) => set(o => ({ apps: (o.apps || []).map(x => x.id === id ? { ...x, st, ap: st === 'applied' && !x.ap ? Date.now() : x.ap } : x) }));
  return <><h1>📌 My applications</h1>{!a.length && <div className="card"><p>Nothing here yet. Save a job from the Jobs page, or tap Apply and say "Yes, I applied".</p><a className="btn primary" href="#/career">Find jobs</a></div>}
    {a.map(x => <div className="card" key={x.id}><div className="row" style={{ justifyContent: 'space-between' }}><div><b>{x.role}</b><p className="dim sm">{x.co}</p></div><select style={{ width: 'auto' }} value={x.st} onChange={e => upd(x.id, e.target.value)}>{ST.map(s => <option key={s[0]} value={s[0]}>{s[1]}</option>)}</select></div>{x.link && <a className="sm" href={x.link} target="_blank" rel="noreferrer">Open job ↗</a>}</div>)}</>;
}
function Profile() {
  const { S, set } = useS(); const y = yearsOf(S);
  return <><h1>👤 Profile</h1><div className="card"><label>Your experience<select value={y === null || y === undefined ? '' : y < 1 ? '0' : y < 3 ? '1' : '3'} onChange={e => set({ lad: { ...(S.lad || {}), years: +e.target.value } })}><option value="">Not set</option><option value="0">Fresher or student</option><option value="1">1 to 3 years</option><option value="3">3 years or more</option></select></label>
    <p className="dim sm">This decides which menu, titles and jobs you see.</p></div>
    <div className="card"><label>Your field<select value={S.track || ''} onChange={e => set({ track: e.target.value })}><option value="">Not set</option>{D.TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
    <div className="card"><p className="dim sm">Your resume and progress stay in this browser only.</p><button className="btn" onClick={() => { if (confirm('Delete all progress and your resume from this browser?')) { localStorage.removeItem('careerlab_v2'); location.hash = '#/home'; location.reload(); } }}>🗑️ Delete my data</button></div></>;
}

function Router() {
  const [r, a] = useHash(); let v;
  switch (r) { case 'home': v = <Home />; break; case 'career': case 'openings': v = <Jobs />; break; case 'learn': v = <Learn arg={a} />; break; case 'topic': v = <Topic id={a} />; break; case 'interview': case 'practice': v = <Interview />; break; case 'resumepdf': case 'resume': v = <ResumePdf />; break; case 'report': v = <Report />; break; case 'ctc': v = <Ctc />; break; case 'pay': v = <Pay />; break; case 'reading': v = <Reading />; break; case 'tracker': v = <Tracker />; break; case 'profile': v = <Profile />; break; default: { const X = EXTRA[r]; v = X ? <X arg={a} /> : <Home />; } }
  return <Shell route={r === 'topic' ? 'learn' : r}>{v}<DidApply /></Shell>;
}
createRoot(document.getElementById('root')).render(<Provider><Router /></Provider>);
