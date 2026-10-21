import React, { useState, useEffect, useMemo, useRef } from 'react';
import './stylesD.css';
import { D, C, yearsOf } from './lib.js';
import { useS, useJobs } from './ctx.jsx';
import ResumeUpload from './ResumeUpload.jsx';
import { H, smart, kb, pk, wt, LADDER as LD, JOBS as J, STUDY, COMPANIES, trackOf } from './liveD.js';
import { STEPS, MENU, FAQ as GUIDE_FAQ } from './guideData.js';
import { IDEAS, NEW } from './ideasData.js';

/* ---------- small helpers ---------- */
const args = () => location.hash.replace(/^#\/?/, '').split('?')[0].split('/').slice(1).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
const tname = id => (trackOf(id) || { name: 'your field' }).name;
const Html = ({ h, as: T = 'div', ...p }) => <T {...p} dangerouslySetInnerHTML={{ __html: h }} />;
const A = ({ href, children, ...p }) => /^https?:/.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer" {...p}>{children}</a> : <a href={href} {...p}>{children}</a>;
const Hero = ({ tag, title, children, emoji }) => <section className="card hero"><div><span className="tag">{tag}</span><h2 style={{ margin: '12px 0 8px' }}>{title}</h2>{children}</div><div className="heroart" style={{ textAlign: 'center', fontSize: '4.5rem' }}>{emoji}</div></section>;
const EXP = [[0, 'Fresher or student'], [1, '1 to 3 years'], [3, '3 years or more']];
const skillsFound = S => { const s = new Set(S.resume ? C.extractSkills(S.resume, D.SKILLS) : []); (S.extra || []).forEach(x => s.add(x)); (S.removed || []).forEach(x => s.delete(x)); return [...s]; };
const myTracks = S => { const r = S.resume ? C.detectTrack(S.resume, D.SKILLS).map(x => x.track) : []; if (S.track && !r.includes(S.track)) r.unshift(S.track); return r.slice(0, 2); };
const accMap = S => { const o = {}; Object.keys(S.acc || {}).forEach(k => { const a = S.acc[k]; if (a && a[1]) o[k] = a[0] / a[1]; }); return o; };
const useToast = () => { const [m, setM] = useState(''); const t = useRef(); return [m, x => { setM(x); clearTimeout(t.current); t.current = setTimeout(() => setM(''), 2500); }]; };
const copyText = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch (e) { try { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (x) { return false; } } };
const CopyBtn = ({ get, label = 'Copy', cls = 'btn sm' }) => { const [ok, setOk] = useState(false); return <button type="button" className={cls} onClick={async () => { if (await copyText(get())) { setOk(true); setTimeout(() => setOk(false), 1600); } }}>{ok ? 'Copied ✓' : label}</button>; };
const Meter = ({ l, v }) => <div style={{ margin: '8px 0' }}><div className="row" style={{ justifyContent: 'space-between' }}><span className="sm">{l}</span><span className="sm dim">{Math.round(v * 100)}%</span></div><div className="bar"><i style={{ width: Math.round(v * 100) + '%' }} /></div></div>;
const NoResume = ({ emoji, title, text, onText }) => <Hero tag="Add your resume" title={title} emoji={emoji}><p className="dim">{text}</p><ResumeUpload onText={onText} /><p className="dim sm">Or <a href="#/resumepdf">paste the text</a> · <a href="#/start">choose a field instead</a></p></Hero>;
const saveResume = (set) => (t) => set({ resume: t, conf: 1 });

/* ---------- search results shared by Search ---------- */
const STOPW = new Set('i a an the to of for and or in on at is are am be want like need how what where can do my me you your with about please help learn study start know get some more any from into'.split(' '));
const toks = t => String(t || '').toLowerCase().replace(/[^a-z0-9+#. ]+/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOPW.has(w));
const hit = (hay, tk) => { if (!tk.length) return 0; hay = hay.toLowerCase(); let n = 0; tk.forEach(w => { if (hay.includes(w)) n++; }); return n >= Math.ceil(tk.length / 2) ? n / tk.length : 0; };
function siteSearch(text, jobs) {
  const g = smart.search(text), tk = toks(text); if (!tk.length) return g;
  const js = (jobs || []).map(j => ({ j, s: hit(j.t + ' ' + j.c, tk) })).filter(x => x.s >= 0.99 || (tk.length === 1 && x.s > 0)).sort((a, b) => b.s - a.s).slice(0, 5);
  if (js.length) g.push({ title: 'Job openings', items: js.map(x => ({ t: x.j.t, d: x.j.c + ' · ' + (x.j.l || 'India'), href: x.j.a || x.j.u || '#/career' })) });
  const cs = (COMPANIES.co || []).map(c => ({ c, s: hit(c[0] + ' ' + (c[4] || ''), tk) })).filter(x => x.s >= 0.99).slice(0, 5);
  if (cs.length) g.push({ title: 'Companies', items: cs.map(x => ({ t: x.c[0], d: x.c[4] || 'Employer in India', href: '#/companies' })) });
  return g;
}
const Groups = ({ g }) => g.map((x, i) => <div className="rg" key={i}><h3>{x.title}</h3>{x.items.map((it, k) => <A key={k} className="card d-hit" href={it.href}><b>{it.t}</b>{it.d && <span className="dim sm">{it.d}</span>}</A>)}</div>);
function Bot({ r, ask, jobs }) {
  return <div className="d-bub bot">
    {r.text && <Html className="bt" h={r.text} />}
    {r.steps && r.steps.length > 0 && <ol className="d-steps">{r.steps.map((s, i) => <li key={i}><div><b>{s.t}</b>{s.d && <p className="dim sm">{s.d}</p>}</div><A className={'btn sm' + (i === 0 ? ' primary' : '')} href={s.href}>{s.btn}</A></li>)}</ol>}
    {r.found && r.found.length > 0 && <Groups g={r.found} />}
    {r.chips && r.chips.length > 0 && <div className="row d-chips">{r.chips.map(c => <button key={c} type="button" className="chip" onClick={() => ask(c)}>{c}</button>)}</div>}
  </div>;
}

/* ========== search ========== */
const SAMPLES = ['I like to learn ServiceNow', 'Coding practice for Python', 'I am a mechanical engineer and want an IT job', 'What interview rounds should I expect?', 'Business rules'];
function Search() {
  const { S, set } = useS(); H.S = S; const jobs = useJobs(); const mode = S.sm;
  const q0 = args()[0] || ''; const [q, setQ] = useState(''), [msgs, setMsgs] = useState([]), [res, setRes] = useState(null), ctx = useRef({}), end = useRef();
  const run = text => {
    text = String(text || '').trim(); if (!text) return;
    if (mode === 'search') { setQ(text); setRes({ t: text, g: siteSearch(text, jobs) }); return; }
    // plain career questions (no field or goal in the words) go to the knowledge base first
    const plain = !smart.intentOf(text) && !smart.trackHits(text).length; let k = null;
    if (plain) { try { k = kb.answer(text, ctx.current.kb); } catch (e) {} }
    let r = k && k.text ? { text: k.text, steps: k.steps, chips: k.chips, found: k.found } : smart.answer(text, ctx.current); const base = { ...ctx.current, ...(r.ctx || {}) };
    if (k && k.text) base.kb = k.ctx;
    else if (!r.steps && !r.ask) { try { k = kb.answer(text, ctx.current.kb); } catch (e) {} if (k && k.text) { r = { text: k.text, steps: k.steps, chips: k.chips, found: k.found }; base.kb = k.ctx; } }
    if (r.found) r = { ...r, found: [...r.found] };
    ctx.current = base; setMsgs(m => [...m, { me: text }, { r }]); setQ('');
  };
  useEffect(() => { if (q0 && mode) run(q0); }, [q0, mode]);
  useEffect(() => { if (end.current && msgs.length) end.current.scrollIntoView({ block: 'nearest' }); }, [msgs]);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = () => { try { const r = new SR(); r.lang = S.lang || 'en-IN'; r.onresult = e => { run(e.results[0][0].transcript); }; r.onerror = () => alert('Could not hear you. Check microphone permission.'); r.start(); } catch (e) {} };
  if (!mode) return <><h1>🔍 Search</h1><p className="dim">How would you like search to work? You can change this any time.</p>
    <div className="grid"><button className="card d-pick" onClick={() => set({ sm: 'agent' })}><div style={{ fontSize: '2rem' }}>🧭</div><h3>Guide me</h3><p className="dim sm">Tell me what you want in your own words, like "I like to learn ServiceNow". I show where to start, step by step.</p></button>
      <button className="card d-pick" onClick={() => set({ sm: 'search' })}><div style={{ fontSize: '2rem' }}>🔎</div><h3>Normal search</h3><p className="dim sm">Type a word and get a list of matching topics, key terms, questions, jobs, companies and pages.</p></button></div></>;
  return <>
    <h1>🔍 Search</h1>
    <div className="tabs"><button className={'chip' + (mode === 'agent' ? ' on' : '')} onClick={() => { set({ sm: 'agent' }); setRes(null); }}>🧭 Guide me</button><button className={'chip' + (mode === 'search' ? ' on' : '')} onClick={() => { set({ sm: 'search' }); setMsgs([]); }}>🔎 Normal search</button></div>
    <form className="card d-sbox" autoComplete="off" onSubmit={e => { e.preventDefault(); run(q); }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}><input type="search" aria-label="Search" value={q} onChange={e => setQ(e.target.value)} placeholder={mode === 'agent' ? 'Tell me what you want, for example: I like to learn ServiceNow' : 'Search topics, terms, questions, jobs, companies'} />
        <button className="btn primary" type="submit">Go</button>{SR && <button className="btn" type="button" aria-label="Speak" onClick={mic}>🎤</button>}</div>
      <div className="row d-chips">{SAMPLES.map(s => <button type="button" key={s} className="chip" onClick={() => run(s)}>{s}</button>)}</div>
    </form>
    {mode === 'agent' && <div className="d-chat">{msgs.length === 0 && <p className="dim">Ask in your own words. For example: <i>I am a fresher and want to learn Python</i>.</p>}
      {msgs.map((m, i) => m.me ? <div key={i} className="d-bub me">{m.me}</div> : <Bot key={i} r={m.r} ask={run} jobs={jobs} />)}<div ref={end} /></div>}
    {mode === 'search' && res && (res.g.length ? <><Groups g={res.g} /><p className="dim sm">Want step by step help instead? Switch to <b>Guide me</b> above.</p></> : <div className="card"><p>No results for "{res.t}". Try another word, or switch to <b>Guide me</b> and describe what you want.</p></div>)}
  </>;
}

/* ========== start (experience + field) ========== */
function Start() {
  const { S, set } = useS(); const y = yearsOf(S); const gi = { IT: '💻 IT', 'Non-IT': '🏢 Non-IT', Design: '🎨 Design', Engineering: '🛠️ Engineering', Everyone: '🌟 Everyone' };
  const intro = { IT: 'Technical roles', 'Non-IT': 'Business, people, finance, sales and operations', Design: 'UI/UX, graphic and visual design', Engineering: 'CAD, civil, electrical, mechanical, quality and safety', Everyone: 'Useful for every career' };
  const expOn = x => y !== null && y !== undefined && (x === 0 ? y < 1 : x === 1 ? y >= 1 && y < 3 : y >= 3);
  const [done, setDone] = useState(false);
  const pickField = id => { set({ track: id }); setDone(true); setTimeout(() => { location.hash = '#/home'; }, 600); };
  return <>
    <div style={{ textAlign: 'center' }}><span className="tag">Step 1 of 2</span><h1 style={{ marginTop: 10 }}>How much experience do you have?</h1><p className="dim">This decides the menu, job titles and questions you see. You can change it any time in Profile.</p></div>
    <div className="row" style={{ justifyContent: 'center', margin: '16px 0' }}>{EXP.map(([v, l]) => <button key={v} className={'chip big' + (expOn(v) ? ' on' : '')} onClick={() => set({ lad: { ...(S.lad || {}), years: v } })}>{l}</button>)}</div>
    <div style={{ textAlign: 'center' }}><span className="tag">Step 2 of 2</span><h1 style={{ marginTop: 10 }}>What field are you preparing for?</h1><p className="dim">Pick one. You can change it any time. Your resume will add more topics automatically.</p></div>
    {done && <div className="note" role="status">Field set: {tname(S.track)}. Taking you home…</div>}
    {Object.keys(gi).map(g => { const ts = D.TRACKS.filter(t => t.group === g); return ts.length ? <div key={g}><h2>{gi[g]} <small className="dim">{intro[g]}</small></h2><div className="grid">{ts.map(t => <button key={t.id} className={'card d-pick' + (S.track === t.id ? ' sel' : '')} onClick={() => pickField(t.id)}><div style={{ fontSize: '1.8rem' }}>{t.ic}</div><h3>{t.name}</h3><p className="dim sm">{t.desc}</p></button>)}</div></div> : null; })}
  </>;
}

/* ========== guide ========== */
const MICERR = { 'not-allowed': 'Microphone is blocked. Tap the lock icon in the address bar, open Permissions, set Microphone to Allow, then reload. On Android also check Settings > Apps > Chrome > Permissions > Microphone.', 'service-not-allowed': 'Voice typing is turned off for this browser or device. Turn on Google voice typing in your phone settings, or type instead.', 'audio-capture': 'No microphone was found. Check that another app is not using it.', network: 'Voice needs an internet connection because the browser sends audio to its speech service.', 'no-speech': 'No speech was heard. Speak closer to the microphone.', 'language-not-supported': 'This voice language is not supported.' };
function Guide() {
  const { S, set } = useS(); const [chk, setChk] = useState(''), [pgm, setPgm] = useState(''); const y = yearsOf(S);
  const expOn = x => y !== null && y !== undefined && (x === 0 ? y < 1 : x === 1 ? y >= 1 && y < 3 : y >= 3);
  const mic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.isSecureContext) return setChk('⚠️ Voice needs a secure (https) page. Open the site with https://.');
    if (!SR) return setChk('⚠️ This browser has no voice-to-text. Use Chrome on Android or Chrome/Edge on a computer. You can still type your answers.');
    const r = new SR(); r.lang = S.lang || 'en-IN'; r.interimResults = true; let got = false;
    setChk('🎤 Listening for 6 seconds. Say something like "Hello, I am ready for my interview"...');
    r.onresult = e => { got = true; setChk('🎤 Heard: ' + [...e.results].map(x => x[0].transcript).join(' ')); };
    r.onerror = e => { got = true; setChk('⚠️ ' + (MICERR[e.error] || 'Voice input stopped (' + e.error + '). You can type instead.')); };
    r.onend = () => { if (!got) setChk('I did not hear anything. Check the volume and try again.'); };
    try { r.start(); setTimeout(() => { try { r.stop(); } catch (e) {} }, 6000); } catch (e) { setChk('⚠️ Could not start the microphone. Reload the page and try again.'); }
  };
  const down = () => { try { const o = JSON.parse(JSON.stringify(S)); delete o.resume; delete o.jd; delete o.cd; const u = URL.createObjectURL(new Blob([JSON.stringify({ padimachi: 1, saved: new Date().toISOString(), data: o })], { type: 'application/json' })), a = document.createElement('a'); a.href = u; a.download = 'padimachi-progress.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); setPgm('Saved. Keep the file safe. Your resume text is not in it.'); } catch (e) { setPgm('Could not save the file.'); } };
  const up = async f => { if (!f) return; try { const j = JSON.parse(await f.text()); if (!j || j.padimachi !== 1 || !j.data || typeof j.data !== 'object') throw 0; const d = { ...j.data }; delete d.resume; delete d.jd; delete d.cd; set(d); setPgm('Restored. Your resume text was kept as it was on this device.'); } catch (e) { setPgm('That is not a Padimachi progress file.'); } };
  return <>
    <section className="card hero"><div><span className="tag">Start here</span><h1 style={{ margin: '12px 0 8px' }}>How Padimachi works</h1><p className="dim">Eight small steps take you from learning to interviews to applying. Most people finish step 3 in their first five minutes.</p><div className="row"><a className="btn primary" href="#/start">Choose my field</a><a className="btn" href="#/search">🔍 Ask in your own words</a></div></div><div className="heroart" style={{ textAlign: 'center', fontSize: '4.5rem' }}>🧭</div></section>
    <div className="card"><h3>Quick setup</h3><div className="grid"><label>Your experience<select value={y === null || y === undefined ? '' : expOn(0) ? '0' : expOn(1) ? '1' : '3'} onChange={e => e.target.value !== '' && set({ lad: { ...(S.lad || {}), years: +e.target.value } })}><option value="">Not set</option>{EXP.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Your field<select value={S.track || ''} onChange={e => set({ track: e.target.value })}><option value="">Not set</option>{D.TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div></div>
    <div className="grid">{STEPS.map(s => <div className="card" key={s[0]}><div className="d-n">{s[0]}</div><div style={{ fontSize: '1.6rem' }}>{s[1]}</div><h3>{s[2]}</h3><p className="dim sm">{s[3]}</p><a className="btn sm" href={s[4]}>{s[5]} →</a></div>)}</div>
    <h2>Everything in the menu</h2><div className="grid">{MENU.map(m => <a className="card" key={m[3]} href={m[3]}><b>{m[0]} {m[1]}</b><p className="dim sm">{m[2]}</p></a>)}</div>
    <h2>Check my phone</h2><div className="card"><p className="dim">Test the two things people ask about most. Nothing is recorded or uploaded.</p><div className="row"><button className="btn" onClick={mic}>🎤 Test microphone</button><ResumeUpload label="Test file upload" compact onText={(t, f) => setChk('✅ File upload works. Read ' + f.name + ' (' + Math.round(f.size / 1024) + ' KB) and found ' + t.split(/\s+/).length + ' words. This was only a test, nothing was saved.')} /></div><div className="dim sm" style={{ marginTop: 10 }} aria-live="polite">{chk}</div></div>
    <h2>Questions</h2>{GUIDE_FAQ.map((f, i) => <details className="card d-faq" key={i}><summary>{f[0]}</summary><p>{f[1].replace('{FIELDS}', D.TRACKS.map(t => t.name).join(', '))}</p></details>)}
    <h2>Your progress</h2><div className="card"><p className="dim">Save your streak, scores and badges to a file, or restore them on a new phone. Your resume text is <b>not</b> included.</p><div className="row"><button className="btn" onClick={down}>⬇️ Download my progress</button><label className="btn ghost" style={{ cursor: 'pointer' }}>⬆️ Restore from a file<input type="file" accept=".json,application/json" hidden onChange={e => { up(e.target.files[0]); e.target.value = ''; }} /></label></div><p className="dim sm" aria-live="polite">{pgm}</p></div>
  </>;
}

/* ========== switch ========== */
const jobLinks = t => { const q = encodeURIComponent(t); return <div className="row"><a className="btn sm" target="_blank" rel="noopener noreferrer" href={'https://www.linkedin.com/jobs/search/?keywords=' + q + '&location=India'}>LinkedIn</a><a className="btn sm" target="_blank" rel="noopener noreferrer" href={'https://www.naukri.com/' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-jobs'}>Naukri</a><a className="btn sm" target="_blank" rel="noopener noreferrer" href={'https://in.indeed.com/jobs?q=' + q}>Indeed</a></div>; };
function Switch() {
  const { S, set } = useS(); const a = args(), sv = S.lad || {}, sw = S.sw || {}, ok = id => id && LD.tracks[id];
  const [from, setFrom] = useState(ok(a[0]) ? a[0] : sw.from || (ok(sv.track) ? sv.track : 'eng')), [to0, setTo] = useState(ok(a[1]) ? a[1] : sw.to);
  const to = ok(to0) && to0 !== from ? to0 : (from === 'servicenow' ? 'programming' : 'servicenow');
  const [years, setYears] = useState(a[2] !== undefined && !isNaN(+a[2]) ? +a[2] : sw.years !== undefined ? sw.years : 2);
  useEffect(() => { set({ sw: { from, to, years } }); }, [from, to, years]);
  const fL = LD.tracks[from].levels, tL = LD.tracks[to].levels, fLv = LD.levelFor(years), role = fL[fLv].t, lvTo = years < 3 ? 1 : 2, entry = tL[lvTo], entry2 = tL[1];
  const fN = tname(from), tN = tname(to), tr = J.TRANSFER[from] || [], low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const path = (D.PATHS || []).find(p => p.track === to) || { stages: [] }, pid = path.id;
  const all = [...new Set(path.stages.flatMap(s => s.topics))].map(id => D.TOPICS.find(t => t.id === id)).filter(Boolean);
  const third = Math.max(1, Math.ceil(all.length / 3)), ph = [all.slice(0, third), all.slice(third, third * 2), all.slice(third * 2)];
  const proj = J.PROJECTS[to] || ['Pick a small real problem from your old field and solve it using skills from ' + tN + '. Write a one page case study.', 'Build one portfolio piece for ' + tN + ' and publish it.', 'Write STAR stories linking your old work to ' + tN + '.'];
  const name = S.name || '[your name]', t1 = tr[0] || 'solving problems step by step', t2 = tr[1] || 'working with people', reason = J.INTRO_REASONS[J.family(to) === 'it' ? 'it' : 'default'];
  const intro0 = `Good morning. My name is ${name}. I have ${years} ${years === 1 ? 'year' : 'years'} of experience as a ${role} in ${fN}. In that role I gained strong experience in ${low(t1)} and ${low(t2)}. ${reason.charAt(0).toUpperCase() + reason.slice(1)}, so over the last few months I have studied ${all.slice(0, 3).map(t => t.name).join(', ') || tN}, practised hands-on, and built a small project. I am now looking for a ${entry.t} role in ${tN} where I can bring my ${fN} discipline together with my new skills. Thank you.`;
  const [intro, setIntro] = useState(intro0); const [touched, setTouched] = useState(false);
  useEffect(() => { if (!touched) setIntro(intro0); }, [intro0]);
  const fieldSel = (cur, fn, label, id) => <label>{label}<select id={id} value={cur} onChange={e => fn(e.target.value)}>{D.TRACKS.filter(t => LD.tracks[t.id]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>;
  const QA = [['Why are you changing from ' + fN + ' to ' + tN + '?', 'Be positive and specific: what attracted you, what you did about it (courses, projects) and what you will bring. Do not criticise your old field. Example: "I enjoyed the problem solving parts of my work in ' + fN + ' the most. I started learning ' + tN + ', built projects and enjoyed it even more, so I decided to move."'], ['Do you have experience in ' + tN + '?', 'Be honest, then show proof: "Not on the job yet, but I have completed [topics], built [project] and practised [tools]. I learn fast and I am ready to start at an entry level."'], ['Why should we hire you?', 'Link old and new: "I bring ' + low(t1) + ' from ' + fN + ' and I have built the basics of ' + tN + '. I will need less hand-holding than a fresher and I take ownership."'], ['What salary do you expect?', 'You may start at a lower level than your old role. Say: "I am flexible for the right learning opportunity, and I would like to be reviewed as my skills grow." Ask what the range is first.']];
  return <>
    <h1>🔀 Switch careers</h1><p className="dim">Moving from one field to another is normal, and many people do it. This plan shows what to learn, how to build proof, how to introduce yourself and what role to aim for first.</p>
    <p><a className="btn primary" href={'#/mentor/' + from + '/' + to}>🧭 Open the Career mentor: time, pay, best months, job search</a></p>
    <div className="card"><div className="grid">{fieldSel(from, setFrom, 'I work or studied in', 'sfrom')}{fieldSel(to, setTo, 'I want to move to', 'sto')}<label>Years in my current field<input type="number" id="syr" min="0" max="40" step="0.5" inputMode="decimal" value={years} onChange={e => setYears(Math.max(0, Math.min(40, +e.target.value || 0)))} /></label></div></div>
    <section className="card hero"><div><span className="tag">{fN} → {tN}</span><h2 style={{ margin: '.3em 0' }}>Aim first for: {entry.t}</h2><p className="dim sm">Also called: {entry.alt}</p><p>{years < 3 ? 'With ' + years + ' years you are close to a fresher in the new field, so companies hire switchers into entry roles and grow them fast if they show learning.' : years < 8 ? 'Your ' + years + ' years show maturity, but in a new field companies usually start you at an early level. Prove your skills and you can move up in the first one or two years.' : 'With ' + years + ' years you bring leadership and domain knowledge. Look for roles that value both, for example analyst, consultant or coordinator roles for ' + fN.toLowerCase() + ' clients, and move up faster as your ' + tN + ' skills grow.'}</p><p className="dim sm">If your hunt is slow, also try <b>{entry2.t}</b>.</p></div><div className="heroart" style={{ textAlign: 'center', fontSize: '4.5rem' }}>{(trackOf(to) || {}).ic || '🔀'}</div></section>
    <h2>What you already bring from {fN}</h2><div className="card"><ul className="d-list">{tr.map((x, i) => <li key={i}>{x}</li>)}</ul><p className="dim sm">Use these in your resume and interviews. Say how they help in {tN}, with a real example.</p></div>
    <h2>Your 90 day plan</h2><div className="grid">{[['Month 1: foundations', ph[0], 'Learn the basics. Finish the topics, quizzes and flashcards. Study a little every day.'], ['Month 2: hands-on', ph[1], 'Practise with real tools. Do the hands-on tasks in each topic and the coding lab if your field has one.'], ['Month 3: proof and interviews', ph[2], 'Build one project, rewrite your resume, practise your introduction and run mock interviews. Start applying.']].map(m => <div className="card" key={m[0]}><span className="tag">{m[0]}</span><p className="dim sm">{m[2]}</p><div className="row">{m[1].map(t => <a key={t.id} className="chip" href={'#/topic/' + t.id}>{t.ic} {t.name}</a>)}</div></div>)}</div>
    <div className="row"><a className="btn primary" href={'#/paths/' + to + '/' + (pid || '')}>🗺️ Open the {tN} study path</a><a className="btn" href={'#/ladder/' + to + '/' + (years < 3 ? 1 : 2)}>🪜 See the levels</a><a className="btn" href="#/code">💻 Coding lab</a></div>
    <h2>Build proof: three starter projects</h2><div className="card"><ol className="d-list">{proj.map((x, i) => <li key={i}>{x}</li>)}</ol><p className="dim sm">Interviewers hire switchers who show real work. Put a link or screenshot of each project on your resume.</p></div>
    <h2>Your self introduction</h2><div className="card"><p className="dim sm">Edit this to match your real story. Say it out loud until it sounds natural. Never claim experience you do not have.</p><textarea id="intro" rows={8} value={intro} onChange={e => { setIntro(e.target.value); setTouched(true); }} /><div className="row" style={{ marginTop: 8 }}><CopyBtn cls="btn" get={() => intro} /><a className="btn primary" href="#/speak">🗣️ Practise speaking it</a></div></div>
    <h2>Questions you will be asked, and how to answer</h2><div className="card">{QA.map((x, i) => <details className="d-qa" key={i}><summary>{x[0]}</summary><p>{x[1]}</p></details>)}</div>
    <h2>Your resume as a switcher</h2><div className="card"><ul className="d-list"><li>Write a headline like: <b>{role} moving to {entry.t}</b>, then two lines on what you offer.</li><li>Put a skills section for {tN} and your projects <b>above</b> your old experience.</li><li>Rewrite old bullets with the skills that carry over: {tr.slice(0, 2).map(low).join('; ')}. Use numbers.</li><li>Add certificates, course names and a link to your projects.</li><li>Drop old tools and details that do not help the new job. Keep it to one page.</li></ul><div className="row"><a className="btn" href="#/resumepdf">📄 Check my resume</a><a className="btn" href="#/career">💼 Jobs in {tN}</a></div></div>
    <h2>Roles to search for in {tN}</h2><div className="grid">{[entry, entry2].filter((x, i, ar) => ar.findIndex(z => z.t === x.t) === i).map(r => <div className="card" key={r.t}><span className="tag">Entry role</span><h3>{r.t}</h3>{jobLinks(r.t)}</div>)}</div>
    <h2>Where to find switcher-friendly jobs</h2><div className="card"><ul className="d-list"><li>Trainee, associate and graduate programmes at service companies often accept career switchers.</li><li>Small and mid-size companies and startups care more about proof than about your old title.</li><li>Referrals work best: message people in {tN} on LinkedIn, share your project and ask for advice, not for a job.</li><li>Apply to many roles with a resume tuned to each job description.</li></ul></div>
  </>;
}

/* ========== paths and path ========== */
const topicById = id => D.TOPICS.find(t => t.id === id);
const accOf = (S, t) => { const a = (S.acc || {})[t.name]; return a && a[1] ? a[0] / a[1] : undefined; };
const pathProg = (S, p) => { const ids = [...new Set(p.stages.flatMap(s => s.topics))], ts = ids.map(topicById).filter(Boolean); return { ts, done: ts.filter(t => (accOf(S, t) || 0) >= 0.6).length }; };
function Paths() {
  const { S } = useS(); const [trk, pid] = args(); const all = D.PATHS || [], ps = trk ? all.filter(p => p.track === trk) : all;
  const p = pid ? all.find(x => x.id === pid) : (trk && ps.length === 1 ? ps[0] : null);
  if (p) {
    const g = pathProg(S, p), tr = trackOf(p.track) || {}, links = (STUDY.links || {})[p.track] || [];
    return <>
      <a className="dim" href="#/paths">← All study paths</a><h1 style={{ marginTop: 8 }}>{tr.ic} {p.name}</h1><p className="dim">{p.desc}</p>
      <div className="card"><div className="bar"><i style={{ width: Math.round(g.done / (g.ts.length || 1) * 100) + '%' }} /></div><p className="dim sm">{g.done} of {g.ts.length} topics done. A topic counts as done when your quiz accuracy is 60% or more. Work through the stages in order.</p></div>
      {p.stages.map((s, i) => <div className="card" key={i}><span className="tag">{s.t}</span><p className="dim">{s.goal}</p><div className="grid">{s.topics.map(topicById).filter(Boolean).map(t => { const a = accOf(S, t); return <a key={t.id} className="card" href={'#/topic/' + t.id}><h3>{t.ic} {t.name}</h3><p className="dim sm">{a === undefined ? 'Not started' : a >= 0.6 ? '✅ ' + Math.round(a * 100) + '% accuracy' : '🔄 ' + Math.round(a * 100) + '% accuracy, keep practising'} · {t.facts.length} terms</p></a>; })}</div></div>)}
      {links.length > 0 && <><h2>Official study areas</h2><div className="grid">{links.map((x, i) => <a key={i} className="card" href={x.u} target="_blank" rel="noopener noreferrer"><span className="tag">Official</span><h3>{x.t}</h3><p className="dim sm">{x.d}</p></a>)}</div></>}
    </>;
  }
  const by = {}; ps.forEach(x => (by[x.track] = by[x.track] || []).push(x));
  return <>
    <h1>🗺️ Study paths</h1><p className="dim">Choose the role you want. Follow the stages in order and you will cover everything an interviewer expects.</p>
    <div className="row" style={{ marginBottom: 8 }}><a className={'chip' + (!trk ? ' on' : '')} href="#/paths">All fields</a>{Object.keys(all.reduce((o, x) => (o[x.track] = 1, o), {})).map(k => <a key={k} className={'chip' + (trk === k ? ' on' : '')} href={'#/paths/' + k}>{tname(k)}</a>)}</div>
    {!trk && by.servicenow && <section className="card hero"><div><span className="tag">ServiceNow</span><h2 style={{ margin: '10px 0 6px' }}>Are you learning Admin or Developer?</h2><p className="dim">Pick the role you want. Each path lists what to learn, in order, from basics to interview ready, with hands-on tasks you can do on a free developer instance.</p><div className="row">{by.servicenow.map(x => <a key={x.id} className="btn primary" href={'#/paths/servicenow/' + x.id}>{x.name}</a>)}{by.mw && <a className="btn" href="#/paths/mw">Moveworks</a>}</div></div><div className="heroart" style={{ textAlign: 'center', fontSize: '4.5rem' }}>🧩</div></section>}
    {Object.keys(by).map(k => <div key={k}><h2>{(trackOf(k) || {}).ic} {tname(k)}</h2><div className="grid">{by[k].map(x => { const g = pathProg(S, x); return <a key={x.id} className="card" href={'#/paths/' + x.track + '/' + x.id}><span className="tag">{x.stages.length} stages · {g.ts.length} topics</span><h3 style={{ marginTop: 8 }}>{x.name}</h3><p className="dim sm">{x.desc}</p><div className="bar"><i style={{ width: Math.round(g.done / (g.ts.length || 1) * 100) + '%' }} /></div><p className="dim sm">{g.done} of {g.ts.length} done</p></a>; })}</div></div>)}
  </>;
}
function PathPage() {
  const { S, set } = useS();
  if (!S.resume) return <><h1>🧭 Resume learning path</h1><NoResume emoji="🧭" title="Your resume decides what you learn" text="Add your resume and Padimachi picks the topics you claim, finds the ones you should know next, and builds a 7-day plan. Your text stays in this browser." onText={saveResume(set)} /></>;
  const found = skillsFound(S), trks = myTracks(S), path = C.skillLearnPath(found, D.TOPICS, accMap(S), trks[0]), plan = C.studyPlan(path.map(p => p.topic), 7), done = S.doneDays || {};
  const addable = D.SKILLS.map(s => s.n).filter(n => !found.includes(n)).sort();
  const rm = n => set(o => ({ extra: (o.extra || []).filter(x => x !== n), removed: (o.removed || []).includes(n) ? o.removed : [...(o.removed || []), n] }));
  const add = n => n && set(o => ({ removed: (o.removed || []).filter(x => x !== n), extra: (o.extra || []).includes(n) ? o.extra : [...(o.extra || []), n] }));
  const hrefOf = it => it.topic ? '#/topic/' + it.topic : it.k === 'intro' ? '#/speak' : it.k === 'mock' ? '#/mock' : '#/speak';
  return <>
    <h1>🧭 Your learning path</h1>
    <div className="card"><h3>Skills found on your resume</h3><p className="dim sm">Check this list. Remove anything you do not really know, and add what is missing. Interviewers ask about everything on a resume.</p>
      <div className="row">{found.map(s => <span key={s} className="chip on-soft">{s} <button className="d-x" aria-label={'Remove ' + s} onClick={() => rm(s)}>×</button></span>)}{!found.length && <span className="dim">No skills detected yet.</span>}</div>
      <div className="row" style={{ marginTop: 8 }}><select aria-label="Add a skill" value="" onChange={e => add(e.target.value)}><option value="">+ Add a skill I have...</option>{addable.map(n => <option key={n}>{n}</option>)}</select></div>
      <p className="dim sm" style={{ marginTop: 8 }}>Field detected: {trks.map(x => <b key={x}>{tname(x)} </b>)}{!trks.length && 'none yet'}</p></div>
    <h2>Topics for you</h2><div className="grid">{path.map(p => <div className="card" key={p.topic.id}><span className={'tag' + (p.kind === 'next' ? ' alt' : '')}>{p.kind === 'next' ? 'Level up' : 'From your resume'}</span><h3 style={{ marginTop: 8 }}>{p.topic.ic} {p.topic.name}</h3><p className="dim sm">{p.why}</p><a className="btn sm primary" href={'#/topic/' + p.topic.id}>Learn</a></div>)}{!path.length && <p className="dim">No matching topics yet. Add skills above.</p>}</div>
    <h2>7-day plan</h2><div className="grid">{plan.map(d => <div className="card" key={d.day}><h3>Day {d.day}</h3>{d.items.map((it, i) => { const key = d.day + '-' + i, on = !!done[key]; return <label key={key} className={'d-chk' + (on ? ' on' : '')}><input type="checkbox" checked={on} onChange={e => set(o => ({ doneDays: { ...(o.doneDays || {}), [key]: e.target.checked ? 1 : 0 }, xp: (o.xp || 0) + (e.target.checked && !(o.doneDays || {})[key] ? 5 : 0) }))} /><a href={hrefOf(it)}>{it.t}</a></label>; })}</div>)}</div>
  </>;
}

/* ========== project interview ========== */
function Project() {
  const { S, set } = useS(); const [round, setRound] = useState(null);
  if (!S.resume) return <><h1>🛠️ Project interview</h1><NoResume emoji="🛠️" title="Interviewers ask about what you wrote" text="Add your resume. Padimachi finds your projects and the tools you used, then asks about them with real-time scenarios and shows the correct approach for each." onText={saveResume(set)} /></>;
  const trks = myTracks(S), found = skillsFound(S);
  if (!round) {
    const lines = C.projectLines(S.resume), tps = C.topicsInText(S.resume, D.TOPICS.filter(t => !trks.length || trks.includes(t.track) || t.track === 'pm'));
    return <><h1>🛠️ Project interview</h1><div className="card"><h3>What we found in your resume</h3>
      {lines.length ? lines.slice(0, 5).map((l, i) => <div key={i} className="d-line">{l}</div>) : <p className="dim">No project or experience lines were detected. Write bullets that start with action verbs (built, led, managed...) and try again. You will still get scenario questions for your skills.</p>}
      {tps.length > 0 && <><p className="dim sm">Tools and topics we will test</p><div className="row">{tps.map(t => <span key={t.id} className="chip">{t.name}</span>)}</div></>}
      <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={() => setRound({ qs: C.buildProjectRound(S.resume, D.TOPICS, trks), i: 0, res: [] })}>Start (about {Math.min(8, lines.slice(0, 3).length * 2 + tps.length + 1)} questions)</button><a className="btn" href="#/resumepdf">Edit resume</a></div>
      <p className="dim sm">Be honest in your answers. If you only supported part of a project, say which part. Real interviewers dig into details, and it is better to practise that here.</p></div></>;
  }
  return <ProjectRound S={S} set={set} round={round} setRound={setRound} found={found} />;
}
function ProjectRound({ S, set, round, setRound, found }) {
  const [txt, setTxt] = useState(''), [g, setG] = useState(null); const { qs, i, res } = round, q = qs[i];
  if (i >= qs.length || !q) {
    const sc = r => r.g.overall, o = res.length ? res.reduce((a, r) => a + sc(r), 0) / res.length : 0, srt = res.slice().sort((a, b) => sc(b) - sc(a)), scores = {};
    res.forEach(r => { if (r.q.id && r.q.id.startsWith('sc:')) { const t = topicById(r.q.id.slice(3)); if (t) { const k = t.skill || t.name; scores[k] = Math.max(scores[k] || 0, r.g.overall); } } });
    const cc = C.claimsCheck(found.concat(Object.keys(scores).filter(x => !found.includes(x))), scores);
    const lk = n => { const t = D.TOPICS.find(x => x.skill === n || x.name === n); return t ? <a key={n} className="chip" href={'#/topic/' + t.id}>{n} →</a> : <span key={n} className="chip">{n}</span>; };
    const cl = t => String(t).length > 110 ? String(t).slice(0, 107) + '…' : t;
    return <><h1>Project interview report</h1>
      <section className="card hero"><div><span className="tag">{o >= .75 ? 'Interview ready' : o >= .5 ? 'Getting there' : 'Keep practising'}</span><p style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>{Math.round(o * 100)}% overall</p><p className="dim">{res.length} answers scored.</p></div><div className="score" style={{ '--p': Math.round(o * 100), justifySelf: 'center' }}><span>{Math.round(o * 100)}</span></div></section>
      {res.length > 1 && <div className="card"><h3>Your scorecard</h3><p>✅ <b>Strongest answer:</b> {cl(srt[0].q.q)} <span className="tag">{Math.round(sc(srt[0]) * 100)}%</span></p><p>⚠️ <b>Fix this first:</b> {cl(srt[srt.length - 1].q.q)} <span className="tag alt">{Math.round(sc(srt[srt.length - 1]) * 100)}%</span></p></div>}
      <h2>Claims check</h2><p className="dim">Skills on a resume are claims. This shows how well you could back each one up today.</p>
      <div className="grid"><div className="card"><h3>🟢 You can back these up</h3>{cc.solid.length ? <div className="row">{cc.solid.map(lk)}</div> : <p className="dim">None yet. Practise below.</p>}</div><div className="card"><h3>🟠 Revise before the interview</h3>{cc.shaky.length ? <><div className="row">{cc.shaky.map(lk)}</div><p className="dim sm">You listed these but the explanation was weak. Learn them or remove them from your resume.</p></> : <p className="dim">None. Good.</p>}</div><div className="card"><h3>⬜ Not tested yet</h3>{cc.untested.length ? <div className="row">{cc.untested.map(lk)}</div> : <p className="dim">All tested.</p>}</div></div>
      <div className="row"><button className="btn primary" onClick={() => setRound(null)}>Try again</button><a className="btn" href="#/path">My learning path</a></div></>;
  }
  const check = () => {
    const r = C.grade(txt, q.keys); setG(r);
    if (r.words >= 8) set(o => { const claims = { ...(o.claims || {}) }, acc = { ...(o.acc || {}) }; if (q.id && q.id.startsWith('sc:')) { const t = topicById(q.id.slice(3)); if (t) { claims[t.skill || t.name] = Math.round(r.overall * 100); const a = acc[t.name] || [0, 0]; acc[t.name] = [a[0] + (r.overall >= .5 ? 1 : 0), a[1] + 1]; } } return { claims, acc, xp: (o.xp || 0) + 5 }; });
  };
  const next = () => { setRound({ ...round, i: i + 1, res: [...res, { q, g: g || C.grade('', q.keys) }] }); setTxt(''); setG(null); };
  return <><h1>🛠️ Project interview</h1><p className="dim">Question {i + 1} of {qs.length}</p>
    <div className="card"><span className="tag">{q.kind}</span><h2 style={{ marginTop: 10 }}>{q.q}</h2><textarea style={{ minHeight: 140 }} placeholder="Type your answer…" value={txt} onChange={e => setTxt(e.target.value)} disabled={!!g} />
      <div className="row" style={{ marginTop: 12 }}>{!g && <button className="btn primary" disabled={txt.trim().length < 5} onClick={check}>Check my answer</button>}<button className="btn" onClick={next}>{g ? (i + 1 >= qs.length ? 'Finish' : 'Next question') : 'Skip'}</button></div></div>
    {g && <div className="card"><h3>Your feedback</h3><p className="dim sm">{C.feedback(g)}</p><Meter l="Knowledge" v={g.know} /><Meter l="Confidence" v={g.conf} /><Meter l="Reasoning" v={g.reason} /><Meter l="Clarity" v={g.clar} />
      {g.miss.length > 0 && <p className="sm"><b>Ideas to add:</b> {g.miss.slice(0, 5).join(', ')}</p>}<div className="note" style={{ whiteSpace: 'pre-line' }}><b>The correct approach:</b> {q.m}</div></div>}</>;
}

/* ========== code ========== */
function runTests(code, ch) {
  return new Promise(res => {
    const src = `self.onmessage=e=>{const {code,fn,tests}=e.data;try{const f=new Function(code+'\\n;return typeof '+fn+'==="function"?'+fn+':null')();if(!f){postMessage({err:'Function '+fn+' was not found'});return}const out=[];for(const [args,exp] of tests){let got,ok=false,err=null;try{got=f(...JSON.parse(JSON.stringify(args)));ok=JSON.stringify(got)===JSON.stringify(exp)}catch(x){err=String(x)}out.push({args,exp,got,ok,err})}postMessage({out})}catch(x){postMessage({err:String(x)})}}`;
    let w; try { w = new Worker(URL.createObjectURL(new Blob([src]))); } catch (e) { return res({ err: 'Your browser blocked the code sandbox. Try Chrome or Edge.' }); }
    const t = setTimeout(() => { w.terminate(); res({ err: 'Timed out. Is there an infinite loop?' }); }, 2000);
    w.onmessage = e => { clearTimeout(t); w.terminate(); res(e.data); }; w.onerror = e => { clearTimeout(t); w.terminate(); res({ err: e.message || 'Error in your code' }); };
    w.postMessage({ code, fn: ch.fn, tests: ch.tests });
  });
}
function Code() {
  const { S, set } = useS(); const id = args()[0], ch = D.CODE.find(c => c.id === id) || D.CODE[0], solved = S.solved || {};
  const [code, setCode] = useState(solved['draft_' + ch.id] || ch.starter), [out, setOut] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { setCode((S.solved || {})['draft_' + ch.id] || ch.starter); setOut(null); }, [ch.id]);
  const run = async () => {
    setBusy(true); setOut(null); const r = await runTests(code, ch); setBusy(false);
    const ok = r.out ? r.out.filter(x => x.ok).length : 0, all = r.out && ok === r.out.length;
    setOut(r); set(o => { const so = { ...(o.solved || {}), ['draft_' + ch.id]: code }; let xp = o.xp || 0; if (all && !so[ch.id]) { so[ch.id] = 1; xp += 40; } return { solved: so, xp }; });
  };
  const key = e => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target, s = t.selectionStart; setCode(code.slice(0, s) + '  ' + code.slice(t.selectionEnd)); requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2)); } };
  const ok = out && out.out ? out.out.filter(x => x.ok).length : 0;
  return <>
    <a className="dim" href="#/practice">← Practice</a><h1 style={{ marginTop: 8 }}>💻 Code lab</h1>
    <div className="tabs">{D.CODE.map(c => <a key={c.id} className={'chip' + (c.id === ch.id ? ' on' : '')} href={'#/code/' + c.id}>{solved[c.id] ? '✓ ' : ''}{c.title}</a>)}</div>
    <div className="card"><p>{ch.prompt}</p><textarea className="d-code" rows={10} spellCheck={false} aria-label="Code editor" value={code} onChange={e => setCode(e.target.value)} onKeyDown={key} />
      <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Running…' : '▶ Run tests'}</button><button className="btn ghost" onClick={() => setCode(ch.starter)}>Reset code</button></div>
      <div aria-live="polite">{out && out.err && <p role="alert" style={{ color: 'var(--bad)' }}>{out.err}</p>}
        {out && out.out && <>{out.out.map((x, i) => <div className="d-line" key={i}>{x.ok ? '✅' : '❌'} Test {i + 1}: <code>{ch.fn + '(' + x.args.map(a => JSON.stringify(a)).join(', ') + ')'}</code>{!x.ok && <><br /><span className="dim sm">expected {JSON.stringify(x.exp)}, got {x.err || JSON.stringify(x.got)}</span></>}</div>)}<p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{ok} / {out.out.length} passed</p>{ok === out.out.length && <p style={{ color: 'var(--good)' }}>🎉 All tests passed.</p>}</>}</div></div>
  </>;
}

/* ========== ideas ========== */
function Ideas() {
  const { S, set } = useS(); const votes = S.ideas || {}, mine = IDEAS.filter(i => votes[i[0]] > 0).length; const [msg, setMsg] = useState(''), [t, setT] = useState('');
  const vote = (id, v) => set(o => { const cur = (o.ideas || {})[id]; return { ideas: { ...(o.ideas || {}), [id]: cur === v ? 0 : v } }; });
  return <>
    <h1>💡 Ideas lab</h1><p className="dim">This is where Padimachi grows. Tell us which ideas would help you, and we build those first. One tap is enough. Votes stay on this device.</p>
    <div className="card"><h3>✨ New recently</h3><ul className="d-list">{NEW.map((n, i) => <li key={i}>{n[0]}</li>)}</ul></div>
    <h2>Would this help you?</h2><div className="grid">{IDEAS.map(i => <div className="card" key={i[0]}><b>{i[1]} {i[2]}</b><div><span className="tag" style={{ margin: '6px 0' }}>{i[4]}</span></div><p className="dim sm">{i[3]}</p><div className="row"><button className={'btn sm' + (votes[i[0]] > 0 ? ' primary' : ' ghost')} aria-pressed={votes[i[0]] > 0} onClick={() => vote(i[0], 1)}>👍 Useful</button><button className={'btn sm' + (votes[i[0]] < 0 ? '' : ' ghost')} aria-pressed={votes[i[0]] < 0} onClick={() => vote(i[0], -1)}>👎 Not for me</button></div></div>)}</div>
    <p className="dim sm">You marked {mine} idea{mine === 1 ? '' : 's'} as useful. Thank you!</p>
    <div className="card"><h3>Have your own idea?</h3><p className="dim">Tell us what would make your job search or learning easier.</p><textarea rows={3} style={{ minHeight: 90 }} placeholder="I wish Padimachi could..." value={t} onChange={e => setT(e.target.value)} />
      <div className="row" style={{ marginTop: 8 }}><a className="btn" href={'mailto:padimachiadmin@gmail.com?subject=' + encodeURIComponent('Padimachi idea') + '&body=' + encodeURIComponent(t)}>✉️ Send idea by email</a></div>{msg && <p className="dim sm">{msg}</p>}</div>
  </>;
}

/* ========== profile writer ========== */
const LIM = { headline: 220, about: 2600, nhead: 250, nsum: 1000, connect: 300 };
function Box({ title, text, limit, hint, id }) {
  const [v, setV] = useState(text), ref = useRef(); useEffect(() => setV(text), [text]);
  const over = limit && v.length > limit;
  return <div className="card" data-box={id}><div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><b>{title}</b><CopyBtn get={() => v} /></div>{hint && <p className="dim sm" style={{ margin: '.3em 0' }}>{hint}</p>}
    <textarea ref={ref} rows={Math.min(14, Math.max(2, Math.ceil(text.length / 48) + (text.split('\n').length - 1)))} style={{ minHeight: 0 }} spellCheck value={v} onChange={e => setV(e.target.value)} aria-label={title} /><div className="dim sm" style={over ? { color: 'var(--bad)' } : null}>{v.length}{limit ? ' / ' + limit + ' characters' : ' characters'}{over ? ' · too long, shorten it' : ''}</div></div>;
}
const gaps = t => (t.match(/\[[^\]]+\]/g) || []).length;
const CHECKS = [['LinkedIn', ['Clear profile photo: face, plain background, smiling', 'Banner with your role and skills', 'Headline with role, skills and a result', 'About section with a strong first 3 lines', 'Experience bullets with numbers', '15 or more relevant skills, top 3 pinned', 'Custom profile link', 'Featured section: a project, a certificate or a post', 'At least 2 recommendations', 'Open to Work set to Recruiters only if needed', 'Connect with 5 people every week and post once a week']], ['Naukri', ['Profile completeness at 100 percent', 'Resume headline updated', 'Profile summary with real keywords', 'Key skills and IT skills table filled', 'Notice period, current and expected CTC filled', 'Photo added', 'Latest resume uploaded as PDF', 'Phone and email correct and verified', 'Update the profile once a week, for example the headline or a skill', 'Reply to recruiters the same day']], ['Both profiles', ['Same name, role, dates and skills on both', 'No spelling mistakes: read each line aloud', 'Do not list a skill you cannot explain in 2 minutes', 'Never share Aadhaar, PAN or bank details in a profile', 'Never pay anyone for a job or a profile boost', 'Check your profile every month and after every new project']]];
function ProfileKit() {
  const { S, set } = useS(); H.S = S; const [tab, setTab] = useState('li');
  const r = pk.read(), sig = String((S.resume || '').length) + ':' + (S.resume || '').slice(0, 40), saved = ((S.pk || {}).sig === sig ? S.pk : {}), tr = saved.track || r.track, tn = tr ? ((trackOf(tr) || {}).name || '') : '';
  const sk = saved.skills !== undefined ? saved.skills.split(/[,\n]/).map(x => x.trim()).filter(Boolean) : r.skills;
  const f = { name: saved.name !== undefined ? saved.name : r.name, role: saved.role !== undefined ? saved.role : r.role, target: saved.target || '', years: saved.years !== undefined && saved.years !== '' ? +saved.years : r.years, city: saved.city !== undefined ? saved.city : r.city, company: saved.company !== undefined ? saved.company : r.company, email: r.email, notice: r.notice, proof: saved.proof || '', skills: sk, track: tr, fieldName: tn, fam: tr ? pk.fam(tr) : 'biz', industry: pk.INDUSTRY[tr] || 'Select the closest industry', bullets: r.bullets, proofs: r.proofs, tags: '', keys: r.found.map(x => x.key) };
  const o = pk.build(f); f.tags = o.tags; o.post = pk.proofLine(f, f.proof || (f.proofs[0] ? pk.improve(f.proofs[0]).replace(/\s*\[add.*$/, '') : ''));
  const nan = f.years === null || f.years === undefined || isNaN(f.years);
  const [d, setD] = useState({}); const dv = k => d[k] !== undefined ? d[k] : k === 'years' ? (nan ? '' : String(f.years)) : k === 'skills' ? f.skills.join(', ') : f[k] || '';
  useEffect(() => setD({}), [sig, JSON.stringify(S.pk || {})]);
  const [toast, tshow] = useToast();
  const upd = () => { set({ pk: { sig, name: dv('name').trim(), role: dv('role').trim(), target: dv('target').trim(), years: dv('years'), city: dv('city').trim(), company: dv('company').trim(), proof: dv('proof').trim(), skills: dv('skills'), track: (S.pk || {}).track } }); tshow('Text updated'); };
  const inp = (k, label, ph, extra) => <label className="dim sm">{label}<input value={dv(k)} placeholder={ph} onChange={e => setD({ ...d, [k]: e.target.value })} {...extra} /></label>;
  const tabs = [['li', 'LinkedIn'], ['nk', 'Naukri'], ['msg', 'Messages'], ['chk', 'Checklists']];
  const gapN = gaps(o.about + o.nsum + o.referral);
  return <>
    <h1>✍️ LinkedIn and Naukri profile writer</h1><p className="dim">Ready-to-copy text for your profiles, built from your resume. Tap Copy, paste it on the site and edit it into your own voice.</p>
    {!r.has && <div className="card"><b>No resume added yet.</b><p className="dim sm">You can still use this page. Fill Your details below, or add your resume so we can fill them for you.</p><ResumeUpload label="Add your resume" onText={t => set({ resume: t, conf: 1, pk: {} })} /></div>}
    <details className="card" open={!(f.name && f.role)}><summary><b>Written for: {f.name || 'your name'}</b> <span className="dim sm">· {f.role || 'your role'}{nan ? '' : ' · ' + f.years + ' yrs'}{f.city ? ' · ' + f.city : ''}. Tap to check or change.</span></summary>
      <p className="dim sm">Taken from your resume. Change anything that is wrong, then press Update text. Your details stay on this phone.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>{inp('name', 'Your name')}{inp('role', 'Current or main role', 'For example Support Engineer')}{inp('target', 'Role you want next', 'Same as above if blank')}{inp('years', 'Years of experience', '', { type: 'number', min: 0, max: 40, step: 0.5 })}{inp('city', 'City', 'For example Chennai')}{inp('company', 'Company (optional)')}</div>
      <label className="dim sm" style={{ marginTop: 8 }}>Your best result with a number (optional, must be true)<input value={dv('proof')} placeholder="For example cut ticket closing time by 30 percent" onChange={e => setD({ ...d, proof: e.target.value })} /></label>
      <label className="dim sm" style={{ marginTop: 8 }}>Skills (comma separated, most important first)<textarea rows={2} style={{ minHeight: 0 }} value={dv('skills')} onChange={e => setD({ ...d, skills: e.target.value })} /></label>
      <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={upd}>Update text</button><button className="btn" onClick={() => { set({ pk: {} }); tshow('Reset to your resume'); }}>Reset</button>{toast && <span role="status" className="dim sm">{toast}</span>}</div></details>
    <div className="tabs">{tabs.map(t => <button key={t[0]} className={'chip' + (tab === t[0] ? ' on' : '')} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
    {tab === 'li' && <>
      <div className="card"><h3>LinkedIn headline</h3><p className="dim sm">Pick one. The headline shows next to your name everywhere, so lead with your role and skills. Limit 220 characters.</p></div>
      {o.headlines.map((x, i) => <Box key={i} id={'h' + i} title={'Headline option ' + (i + 1)} text={x} limit={LIM.headline} />)}
      <Box id="about" title="About section (full)" text={o.about} limit={LIM.about} hint="Limit 2,600 characters. The first 3 lines show before See more, so the hook matters most." />
      <Box id="abouts" title="About section (short, for the first lines)" text={o.aboutShort} limit={300} />
      <div className="card"><h3>Experience bullets, rewritten</h3><p className="dim sm">{o.bullets.length ? 'From your resume. Each starts with a strong verb. Replace each [bracket] with a real number.' : 'Add your resume to see your own lines rewritten here.'}</p></div>
      {o.bullets.length > 0 && <><Box id="bul" title="All bullets (copy into one job)" text={o.bullets.map(b => '• ' + b.to).join('\n')} hint="Use 3 to 5 per job. Keep the best ones." /><div className="card"><b className="sm">Before and after</b>{o.bullets.slice(0, 4).map((b, i) => <p className="sm" key={i}><span className="dim">Before:</span> {b.from}<br /><b>After:</b> {b.to}</p>)}</div></>}
      <Box id="sk" title={'Skills to add (' + o.skills.length + ')'} text={o.skills.join('\n')} hint="Add all of these in Skills, then pin the top 3. LinkedIn allows up to 50." />
      {o.gap.length > 0 && <Box id="gap" title="Learn these next, then add them" text={o.gap.join('\n')} hint="Jobs in your field often mention these. Add one only after you can show an example." />}
      <Box id="url" title="Custom profile link ideas" text={o.urls.join('\n')} hint="Profile, Edit public profile and URL. Pick the first one that is free." />
      <Box id="ban" title="Banner text" text={o.banner} limit={80} hint="Make the banner image on Canva with this line and your field colours." />
      <Box id="tit" title="Open to Work: job titles to add" text={o.titles.join('\n')} hint="Choose Recruiters only if you do not want your company to see it. Add 5 titles, locations and Hybrid, Onsite or Remote." />
      <Box id="post" title="Ready post (edit and publish)" text={o.post} limit={3000} hint="Post once a week. Activity brings recruiters to your profile." />
      <Box id="pi" title="Five more post ideas" text={o.postIdeas.map((x, i) => (i + 1) + '. ' + x).join('\n')} />
      <Box id="tag" title="Hashtags" text={o.tags} hint="Use 3 to 5 under each post." /></>}
    {tab === 'nk' && <>
      <div className="card"><h3>Naukri profile</h3><p className="dim sm">Recruiters on Naukri search by words, so use the exact names of your skills and tools. Do not stuff keywords you cannot explain in an interview.</p></div>
      <Box id="nh" title="Resume headline" text={o.nhead} limit={LIM.nhead} hint="Limit 250 characters. Role, years, top skills and notice period." />
      <Box id="ns" title="Profile summary" text={o.nsum} limit={LIM.nsum} hint="Keep it to about 1,000 characters." />
      <Box id="nk" title="Key skills (add all)" text={o.nskills.join(', ')} hint="Add each as a tag. Put the most important first." />
      <Box id="ni" title="IT skills table" text={o.itskills.join('\n')} hint="Fill version, last used year and experience for each skill. Be honest." />
      <Box id="nr" title="Employment details (current job)" text={o.nrole} hint="Paste in the job description box of your current role." />
      <Box id="nd" title="Desired career profile" text={o.desired.join('\n')} hint="Fill these in Career profile." />
      <Box id="np" title="Reply when a recruiter calls or messages" text={o.nreply} hint="Fill the brackets before sending. Reply the same day." /></>}
    {tab === 'msg' && <>
      <div className="card"><h3>Messages you can copy</h3><p className="dim sm">Replace each [bracket]. Personal and short messages get more replies than long ones.</p></div>
      {o.connect.map((x, i) => <Box key={i} id={'cn' + i} title={'LinkedIn connection note ' + (i + 1)} text={x} limit={LIM.connect} hint="Limit 300 characters." />)}
      <Box id="rf" title="Ask for a referral" text={o.referral} /><Box id="rc" title="Message to a recruiter" text={o.recruiter} /><Box id="fu" title="Follow up after applying" text={o.followup} /><Box id="rm" title="Ask for a recommendation" text={o.recommend} />
      <Box id="p3" title="30 second introduction" text={o.pitch30} hint="For calls, networking and the start of an interview." /><Box id="tm" title="Tell me about yourself (about 1 minute)" text={o.tmay} />
      <Box id="wa" title="WhatsApp message to friends and ex-colleagues" text={o.whatsapp} /><Box id="su" title="Email subject lines for applications" text={o.subjects.join('\n')} /><Box id="cv" title="Short cover email" text={o.cover} /></>}
    {tab === 'chk' && CHECKS.map(a => <div className="card" key={a[0]}><h3>{a[0]}</h3><ul className="d-list">{a[1].map((x, i) => <li key={i}>{x}</li>)}</ul></div>)}
    <div className="card"><b className="sm">⚠️ Be honest</b><p className="dim sm">Only claim what you really did. Fill each <b>[bracket]</b> with a true fact. {gapN ? 'There are ' + gapN + ' brackets to fill in the main texts.' : ''} Nothing here is uploaded: it is written on your phone from your own details.</p></div>
  </>;
}

/* ========== watch ========== */
function WatchPlayer({ t }) {
  const { S, set } = useS(); const slides = useMemo(() => wt.watchSlides(t), [t.id]); const [i, setI] = useState(0), [playing, setPlaying] = useState(false);
  const speed = S.wrate || 1, tts = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined', voiceOn = S.vg !== false && tts;
  const tok = useRef(0), cur = useRef({ i: 0, playing: false }); cur.current = { i, playing };
  const stop = () => { tok.current++; try { tts && speechSynthesis.cancel(); } catch (e) {} };
  const finish = () => { setPlaying(false); if (!(S.watched || {})[t.id]) set(o => ({ watched: { ...(o.watched || {}), [t.id]: 1 }, xp: (o.xp || 0) + 10 })); };
  useEffect(() => { setI(0); setPlaying(false); stop(); }, [t.id]);
  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (!playing) { stop(); return; }
    stop(); const my = tok.current, s = slides[i]; let timer;
    const done = () => { if (my !== tok.current) return; if (i < slides.length - 1) timer = setTimeout(() => { if (my === tok.current) setI(i + 1); }, 700); else finish(); };
    if (voiceOn) { try { const u = new SpeechSynthesisUtterance(s.say); u.rate = .93 * speed; u.lang = S.lang || 'en-IN'; u.onend = done; u.onerror = done; speechSynthesis.speak(u); } catch (e) { timer = setTimeout(done, 2500); } }
    else timer = setTimeout(done, Math.min(20000, 2500 + s.say.split(/\s+/).length * 330 / speed));
    return () => { clearTimeout(timer); };
  }, [playing, i, speed, voiceOn]);
  const go = n => { stop(); setI(Math.max(0, Math.min(slides.length - 1, n))); };
  const s = slides[i], spds = [.85, 1, 1.2, 1.4];
  return <div className="card watch">
    <div className="wtop"><div className="wmeta"><b>▶ Watch: {t.name}</b><span className="dim sm">Slide {i + 1} of {slides.length}</span></div></div>
    <Html className="wstage" key={t.id + ':' + i} h={'<div class="wslide">' + s.h + '</div>'} aria-live="polite" />
    {s.last && <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}><a className="btn primary" href={'#/topic/' + t.id}>Take the quiz →</a></div>}
    <div className="wcap">{s.say}</div><div className="wbar"><i style={{ width: ((i + 1) / slides.length * 100) + '%' }} /></div>
    <div className="wctl"><button className="btn sm ghost" aria-label="Previous slide" onClick={() => go(i - 1)}>⏮</button>
      <button className="btn sm primary" onClick={() => { if (!playing && i === slides.length - 1) setI(0); setPlaying(!playing); }}>{playing ? '⏸ Pause' : '▶ Play'}</button>
      <button className="btn sm ghost" aria-label="Next slide" onClick={() => go(i + 1)}>⏭</button>
      <button className="btn sm ghost" title="Speed" onClick={() => set({ wrate: spds[(spds.indexOf(speed) + 1) % spds.length] })}>{speed}×</button>
      {tts && <button className="btn sm ghost" title="Voice" onClick={() => set({ vg: S.vg === false })}>{voiceOn ? '🔈 Voice on' : '🔇 Voice off'}</button>}</div>
    <p className="dim sm">Tap Play and the topic is taught in about 2 minutes{voiceOn ? ' with a spoken voice' : ''}. Use ⏮ ⏭ to move.</p></div>;
}
function Watch() {
  const { S } = useS(); const id = args()[0], t = id && D.TOPICS.find(x => x.id === id);
  const [trk, setTrk] = useState(S.track || ''), [q, setQ] = useState('');
  if (t) return <><a className="dim" href="#/watch">← All lessons</a><h1 style={{ margin: '8px 0' }}>{t.ic} {t.name}</h1><WatchPlayer t={t} /><Html className="d-pic" h={wt.pictureCard(t)} /><div className="row"><a className="btn" href={'#/topic/' + t.id}>Open the full topic</a></div></>;
  const list = D.TOPICS.filter(x => (!trk || x.track === trk) && (!q || x.name.toLowerCase().includes(q.toLowerCase())));
  const seen = S.watched || {};
  return <>
    <h1>▶ Watch</h1><p className="dim">Short animated lessons built from each topic, with a spoken voice if your browser has one. No video download, works offline once loaded.</p>
    <div className="tabs"><button className={'chip' + (!trk ? ' on' : '')} onClick={() => setTrk('')}>All</button>{D.TRACKS.map(x => <button key={x.id} className={'chip' + (trk === x.id ? ' on' : '')} onClick={() => setTrk(x.id)}>{x.ic} {x.name}</button>)}</div>
    <input placeholder="Search lessons" aria-label="Search lessons" value={q} onChange={e => setQ(e.target.value)} />
    <p className="dim sm">{list.length} lessons · {Object.keys(seen).length} watched</p>
    <div className="grid">{list.slice(0, 60).map(x => <a key={x.id} className="card" href={'#/watch/' + x.id}><h3>{x.ic} {x.name}</h3><p className="dim sm">{tname(x.track)} · {seen[x.id] ? '✅ watched' : '▶ about 2 minutes'}</p></a>)}</div>
    {list.length > 60 && <p className="dim sm">Showing 60. Search or pick a field to narrow the list.</p>}
  </>;
}

/* ========== faq ========== */
const FAQS = (window.FAQ || []);
function Faq() {
  const { S } = useS(); H.S = S; const [q, setQ] = useState(''), [open, setOpen] = useState(null);
  const tk = toks(q);
  const best = useMemo(() => { if (q.trim().length < 3) return null; try { const r = kb.faq(q); return r && r.text ? r : null; } catch (e) { return null; } }, [q]);
  const list = useMemo(() => !tk.length ? FAQS : FAQS.filter(f => { const hay = (f.k.join(' ') + ' ' + f.t + ' ' + f.a).toLowerCase(); return tk.every(w => hay.includes(w)); }), [q]);
  return <>
    <h1>❓ Help and FAQ</h1><p className="dim">Short, practical answers about resumes, interviews, offers, notice periods, job search and switching fields. {FAQS.length} answers. General guidance, not legal or financial advice.</p>
    <div className="card"><input type="search" aria-label="Search help" placeholder="Search, for example: notice period, salary, resume tips" value={q} onChange={e => setQ(e.target.value)} /></div>
    {best && <div className="card d-best"><span className="tag">Best answer</span><Html h={best.text} />{best.steps && best.steps.length > 0 && <div className="row" style={{ marginTop: 8 }}>{best.steps.map((s, i) => <A key={i} className="btn sm" href={s.href}>{s.btn}</A>)}</div>}</div>}
    <p className="dim sm">{list.length} of {FAQS.length} answers{tk.length ? ' match' : ''}</p>
    {list.map((f, i) => <details className="card d-faq" key={f.t} open={open === f.t} onToggle={e => { if (e.target.open) setOpen(f.t); else if (open === f.t) setOpen(null); }}><summary>{f.t}</summary><p>{f.a}</p>
      {f.s.length > 0 && <div className="row">{f.s.map((s, k) => <A key={k} className="btn sm" href={s.href} title={s.d}>{s.btn}</A>)}</div>}
      {f.c.length > 0 && <div className="row d-chips"><span className="dim sm">Also ask:</span>{f.c.map(c => <button key={c} type="button" className="chip" onClick={() => setQ(c)}>{c}</button>)}</div>}</details>)}
    {!list.length && <div className="card"><p>No answer for that yet. Try fewer words, or ask the <a href="#/kb">knowledge base</a> or <a href="#/search">search</a>.</p></div>}
  </>;
}

/* ========== kb ========== */
const KB_START = ['Resume tips', 'Tell me about yourself', 'Where to apply', 'Salary negotiation', 'Notice period', 'What is phishing?', 'What is ServiceNow?', 'Switch careers', 'What can you do?'];
function Kb() {
  const { S } = useS(); H.S = S; const [q, setQ] = useState(''), [msgs, setMsgs] = useState([]), ctx = useRef({}), end = useRef();
  const ask = text => {
    text = String(text || '').trim(); if (!text) return;
    let r = null; try { r = kb.answer(text, ctx.current); } catch (e) {}
    if (r) ctx.current = r.ctx || {};
    setMsgs(m => [...m, { me: text }, { r: r && r.text ? r : { text: kb.NOTFOUND, steps: [], chips: ['Resume tips', 'What can you do?'], found: siteSearch(text, null).slice(0, 2) } }]); setQ('');
  };
  useEffect(() => { if (end.current && msgs.length) end.current.scrollIntoView({ block: 'nearest' }); }, [msgs]);
  const topics = useMemo(() => D.TRACKS.map(t => ({ t, n: D.TOPICS.filter(x => x.track === t.id).length })).filter(x => x.n), []);
  return <>
    <h1>📖 Knowledge base</h1><p className="dim">Ask a career or learning question in your own words. Answers come from the lessons, interview questions and career guides on this site, and it says so when it does not know. Nothing you type is sent anywhere.</p>
    <form className="card d-sbox" onSubmit={e => { e.preventDefault(); ask(q); }}><div className="row" style={{ flexWrap: 'nowrap' }}><input type="search" aria-label="Ask a question" placeholder="Ask, for example: how do I answer why are you leaving" value={q} onChange={e => setQ(e.target.value)} /><button className="btn primary" type="submit">Ask</button></div>
      <div className="row d-chips">{KB_START.map(s => <button type="button" key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div></form>
    <div className="d-chat">{msgs.map((m, i) => m.me ? <div key={i} className="d-bub me">{m.me}</div> : <Bot key={i} r={m.r} ask={ask} />)}<div ref={end} /></div>
    {!msgs.length && <><h2>Browse by field</h2><div className="grid">{topics.map(({ t, n }) => <button key={t.id} className="card d-pick" onClick={() => ask('What is ' + t.name + '?')}><b>{t.ic} {t.name}</b><p className="dim sm">{n} topics · tap to ask about it</p></button>)}</div>
      <p className="dim sm">Prefer a list? Open <a href="#/faq">Help and FAQ</a>.</p></>}
  </>;
}

export { ResumeUpload };
export default { search: Search, guide: Guide, start: Start, switch: Switch, project: Project, code: Code, path: PathPage, paths: Paths, ideas: Ideas, profilekit: ProfileKit, watch: Watch, faq: Faq, kb: Kb };
