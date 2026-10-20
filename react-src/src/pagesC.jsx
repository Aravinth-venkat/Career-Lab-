// Pages C: career ladder, journey map, progress and backup, practice games, mock interview, speaking lab.
// Data and scoring come from the live files. The screens are rebuilt in React.
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './stylesC.css';
import './ladderShim.js';
import LD from '../../cl-src/js/ladder.js';
import STUDY from '../../cl-src/js/study.js';
import '../../cl-src/js/interview2.js';
import { D, C, yearsOf } from './lib.js';
import { useS } from './ctx.jsx';
import { dailyPair } from './dailyC.js';
import {
  dayNow, checkBadges, pct, avg, tname, topicById, norm, level, levelTitle, skillsFound, myTracks, accOf, accMap, toast, confetti, BADGES, gainXP, xpEver, mis, record, markSeen,
  useAct, seeded, Ring, Meter, Chips, Tile, scoreColor, QA, AnswerBox, Coach, Mcq, FinishCard, Page, hasVoice, canSpeak, say, stopSpeak
} from './coreC.jsx';

const dstr = d => new Date(d * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const Bullets = ({ a, ok }) => <ul className={'mist' + (ok ? ' ok' : '')}>{a.map((h, i) => <li key={i}>{h}</li>)}</ul>;

/* =============================== LADDER =============================== */
const rangeOf = i => ['0 to 6 months', 'up to 1 year', '1 to 3 years', '3 to 6 years', '6 to 9 years', '9 to 13 years', '13+ years'][i];
function Ladder({ arg }) {
  const act = useAct(), { S } = useS(), N = norm(S);
  const have = D.TRACKS.filter(t => LD.tracks[t.id]), saved = N.lad || {}, mt = myTracks(N);
  const track = arg && LD.tracks[arg] ? arg : saved.track && LD.tracks[saved.track] ? saved.track : (mt.find(x => LD.tracks[x]) || (LD.tracks[N.track] ? N.track : 'servicenow'));
  const found = LD.detectYears(N.resume);
  const years = saved.years !== undefined && saved.years !== '' ? +saved.years : (found !== null ? found : 1);
  const [yt, setYt] = useState(String(years)); useEffect(() => setYt(String(years)), [years]);
  const lv = LD.levelFor(years), lad = LD.tracks[track].levels, cur = lad[lv], nxt = lad[lv + 1] || null, tr = D.TRACKS.find(t => t.id === track) || {};
  const setLad = (t, y) => act(d => { d.lad = { track: t, years: y }; });
  const goalKeys = nxt ? nxt.skills.map((_, i) => 'lad:' + track + ':' + (lv + 1) + ':' + i) : [];
  const ticks = goalKeys.filter(k => N.doneDays[k]).length;
  const topics = nxt ? nxt.topics.map(topicById).filter(Boolean) : [];
  const tAcc = topics.map(t => accOf(N, t.name)).filter(x => x !== undefined);
  const ready = nxt ? (goalKeys.length ? ticks / goalKeys.length : 0) * .5 + (tAcc.length ? avg(tAcc) : 0) * .5 : 1;
  const tick = (k, on) => act((d, ev) => { const was = d.doneDays[k]; d.doneDays[k] = on ? 1 : 0; if (on && !was) xpEver(d, ev, 'chk:' + k, 3); });
  return <>
    <h1>🪜 Career levels</h1>
    <p className="dim">See where you stand in a company, what the next position needs, and how to move up in your own company or a new one. Titles differ between companies, so use this as a guide.</p>
    <div className="card"><div className="grid">
      <label>My field<select value={track} onChange={e => setLad(e.target.value, years)}>{have.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Years of work experience<input type="number" min="0" max="40" step="0.5" inputMode="decimal" value={yt} onChange={e => { setYt(e.target.value); if (e.target.value !== '' && !isNaN(+e.target.value)) setLad(track, Math.max(0, Math.min(40, +e.target.value))); }} /></label></div>
      <p className="dim sm">Student or just starting? Enter 0. Internships count as 0.{found !== null ? <> Your resume says about <b>{found}</b> years.</> : ''}</p>
      {found !== null && found !== years && <button className="btn sm" onClick={() => setLad(track, found)}>Use years from my resume</button>}</div>
    <div className="card hero"><div><span className="tag">You are here · {LD.NAMES[lv]}</span><h2 style={{ margin: '.3em 0' }}>{cur.t}</h2><p className="dim sm">Also called: {cur.alt}</p><p>{cur.co}</p>
      {nxt ? <p><b>Next position:</b> {nxt.t}</p> : <p><b>You are at the top of the usual ladder.</b> Growth now means wider impact.</p>}</div><div className="heroart" style={{ fontSize: '4.5rem', textAlign: 'center' }}>{tr.ic || '🪜'}</div></div>
    <h2>The company ladder in {tr.name || 'your field'}</h2><p className="dim sm">Tap a level to read what that person does and what the company expects.</p>
    <div className="ladder">{lad.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => <details key={i} className={'rung ' + (i === lv ? 'here' : i === lv + 1 ? 'next' : i < lv ? 'done' : '')} open={i === lv || i === lv + 1}>
      <summary><span className="lvno">{i + 1}</span><span className="rt"><b>{l.t}</b><small>{LD.YEARS[i]}</small></span>{i === lv ? <span className="tag">You are here</span> : i === lv + 1 ? <span className="tag alt">Next goal</span> : null}</summary>
      <p>{l.co}</p><p className="dim sm"><b>Daily work:</b> {l.does}</p><p className="dim sm"><b>Other titles:</b> {l.alt}</p></details>)}</div>
    <h2>Your work at this level</h2>
    <div className="card"><p>{cur.does}</p><span className="tag">Skills expected</span><div className="row chipsr" style={{ marginTop: 8 }}>{cur.skills.map(s => <span key={s} className="chip">{s}</span>)}</div><p className="dim sm" style={{ marginTop: 10 }}><b>What gets people promoted from here:</b> {cur.promote}</p></div>
    {nxt && <><h2>Get ready for {nxt.t}</h2>
      <div className="card"><p>{nxt.co}</p><p className="dim sm"><b>Daily work there:</b> {nxt.does}</p><span className="tag alt">Tick what you can already do well</span>
        <div className="labs">{nxt.skills.map((s, i) => <label key={i} className={'chk' + (N.doneDays[goalKeys[i]] ? ' on' : '')}><input type="checkbox" checked={!!N.doneDays[goalKeys[i]]} onChange={e => tick(goalKeys[i], e.target.checked)} /><span>{s}</span></label>)}</div>
        <Meter t={'Readiness for ' + nxt.t} v={ready} /><p className="dim sm">Readiness is half your ticks and half your quiz accuracy on the topics below.</p></div>
      <h3>Study these to reach it</h3>
      <div className="grid">{topics.map(t => <a key={t.id} className="card tcard" href={'#/topic/' + t.id}><h3>{t.ic} {t.name}</h3><p className="dim sm">{accOf(N, t.name) === undefined ? 'Not started' : pct(accOf(N, t.name)) + '% quiz accuracy'} · {t.facts.length} terms</p></a>)}</div></>}
    <h2>How to improve</h2>
    <div className="card"><Bullets a={LD.HINTS[lv]} ok /><div className="row"><a className="btn primary" href={'#/learn/' + track}>🗺️ Study paths</a><a className="btn" href="#/mock">🎤 Mock interview</a><a className="btn" href="#/play">🎮 Practice games</a></div></div>
    <h2>Your resume for this level</h2>
    <div className="card"><span className="tag">At your level</span><Bullets a={LD.RESUME[lv]} ok />
      {nxt ? <><span className="tag alt">To apply one level up</span><p>{LD.NEXT_TIPS[lv + 1]}</p></> : <p>{LD.NEXT_TIPS[6]}</p>}<div className="row"><a className="btn" href="#/resumepdf">📄 Check my resume</a></div></div>
    <h2>Moving to a new company or a higher position</h2>
    <div className="card"><Bullets a={LD.SWITCH[0]} ok />
      {nxt && <p className="dim sm">Example: with about {rangeOf(lv)} of experience you can still apply for <b>{nxt.t}</b> if you can show most of these skills with real work: {nxt.skills.slice(0, 3).join(', ')}. Companies hire on proof of skill, not only on years.</p>}
      <span className="tag">How levels differ by company type</span>{LD.COMPANY.map(c => <details className="qa" key={c[0]}><summary>{c[0]}</summary><p>{c[1]}</p></details>)}</div>
  </>;
}

/* =============================== JOURNEY MAP + IDEAS LAB =============================== */
const IDEAS = [
  ['mockpanel', '🎙️', 'Voice mock interview with a panel', 'Several interviewers ask follow-up questions and you answer by voice.', 'Idea'],
  ['company', '🏢', 'Company wise interview questions', 'Typical questions by company type: service, product, bank, startup.', 'Idea'],
  ['salarycalc', '🧮', 'Salary and hike planner', 'Compare offers, in-hand pay and a fair hike range.', 'Idea'],
  ['resumebuilder', '📝', 'Resume builder with templates', 'Fill a form and download a clean, ATS friendly resume.', 'Idea'],
  ['nudge', '🔔', 'Daily reminder by email or WhatsApp', 'A short nudge with one question a day. You can stop it any time.', 'Idea'],
  ['languages', '🌐', 'Lessons in Tamil and Hindi', 'Explanations in your language, with English interview answers.', 'Building'],
  ['app', '📱', 'Android app', 'The same Padimachi on your phone, with offline learning.', 'Coming soon'],
  ['friends', '👫', 'Study with friends', 'Friend streaks and shared goals.', 'Idea'],
  ['alerts', '📬', 'Job alerts for your field', 'A weekly email or WhatsApp note with new openings that match your resume.', 'Idea'],
  ['certs', '🎓', 'Certification practice', 'Practice tests for common certificates in your field.', 'Idea'],
  ['linkedin', '🔗', 'Review my LinkedIn text', 'Paste your headline and About and get feedback on what to fix.', 'Idea'],
  ['profilescore', '📈', 'Profile score before and after', 'See how strong your LinkedIn and Naukri text is and how it improves.', 'Idea'],
  ['dailylearn', '🗞️', 'Fresh learning content every day', 'New terms and tips added automatically and checked by us before they go live.', 'Idea'],
  ['postjob', '📣', 'Companies post their own jobs', 'Verified companies add openings that show next to the automatic ones.', 'Idea'],
  ['peer', '🧑‍🤝‍🧑', 'Mock interview with real people', 'Practise with another learner and give each other feedback.', 'Idea']
];
const NEWS = ['LinkedIn and Naukri writer: headline, About, skills, messages and checklists written from your resume', 'Job openings from company job pages, matched to your resume, refreshed automatically every few hours', 'Quick picks: fresher friendly, urgent, walk-in and this week, plus skills in demand and a Hiring now company list', 'Word of the day and daily tip that follow your resume and field', '27 new topics with deep dives, scenarios and questions in Data, QA, Cloud, Healthcare, Teaching and Digital Marketing', 'Companies for your level and city (600+), and a Career mentor for changing job or field', 'Career Toolkit: 15 ready email drafts and a guide to explaining your work like a pro', 'My journey map with your career path and last 30 days', 'Download and restore your progress (your resume is never included unless you choose)'];
function IdeasLab() {
  const act = useAct(), { S } = useS(), votes = S.ideas || {}, mine = IDEAS.filter(i => votes[i[0]] > 0).length, [tx, setTx] = useState('');
  const vote = (id, v) => act(d => { d.ideas = d.ideas || {}; d.ideas[id] = d.ideas[id] === v ? 0 : v; toast(d.ideas[id] > 0 ? 'Thanks! Noted as useful.' : d.ideas[id] < 0 ? 'Thanks for telling us.' : 'Vote removed.'); });
  return <>
    <p className="dim">This is where Padimachi grows. Tell us which ideas would help you, and we build those first. One tap is enough. Your votes stay in this browser.</p>
    <div className="card"><h3>✨ New recently</h3><ul className="plist">{NEWS.map(n => <li key={n}>{n}</li>)}</ul></div>
    <h2>Would this help you?</h2>
    <div className="grid">{IDEAS.map(i => <div className="card idea" key={i[0]}><b>{i[1]} {i[2]}</b><div><span className="tag">{i[4]}</span></div><p className="dim sm">{i[3]}</p>
      <div className="row"><button className={'btn sm' + (votes[i[0]] > 0 ? '' : ' ghost')} onClick={() => vote(i[0], 1)}>👍 Useful</button><button className={'btn sm' + (votes[i[0]] < 0 ? '' : ' ghost')} onClick={() => vote(i[0], -1)}>👎 Not for me</button></div></div>)}</div>
    <p className="dim sm">You marked {mine} idea{mine === 1 ? '' : 's'} as useful. Thank you!</p>
    <div className="card"><h3>Have your own idea?</h3><p className="dim">Tell us what would make your job search or learning easier.</p><textarea style={{ minHeight: 90 }} placeholder="I wish Padimachi could..." value={tx} onChange={e => setTx(e.target.value)} />
      <div className="row" style={{ marginTop: 10 }}><a className="btn" target="_blank" rel="noopener" href={'mailto:padimachiadmin@gmail.com?subject=' + encodeURIComponent('Padimachi idea') + '&body=' + encodeURIComponent(tx)}>✉️ Send idea by email</a></div></div></>;
}
function Ideas() { return <><h1>💡 Ideas lab</h1><IdeasLab /></>; }

function MyMap() {
  const { S } = useS(), N = norm(S), today = dayNow();
  const tr = N.track || myTracks(N)[0] || '', T = D.TRACKS.find(t => t.id === tr), y = yearsOf(N), L = LD.tracks[tr], idx = L ? LD.levelFor(y === null || y === undefined ? 0 : y) : -1;
  const days = Object.keys(N.days || {}).map(Number).filter(n => n > 0).sort((a, b) => a - b), start = days[0] || today, span = today - start + 1;
  const topicsStarted = D.TOPICS.filter(t => accOf(N, t.name) !== undefined).length, answers = (N.dims || []).length, badges = BADGES.filter(b => N.badges[b.id]).length;
  const NN = 30, vals = []; for (let i = NN - 1; i >= 0; i--) vals.push((N.days || {})[today - i] || 0);
  const mx = Math.max(10, ...vals), goal = N.goal || 50, bw = 700 / NN, gy = Math.max(10, 130 - Math.round(goal / mx * 110));
  return <>
    <h1>🗺️ My journey</h1><p className="dim">From where you started to where you stand today, and what is next.</p>
    <div className="card hero one"><p>{days.length ? <>You started on <b>{dstr(start)}</b>. That is {span} day{span === 1 ? '' : 's'} ago, and you were active on {days.length} of them.</> : 'Your journey starts today. Earn your first XP to put a mark on the map.'}</p></div>
    <div className="tiles"><Tile ic="🔥" n={N.streak || 0} l="day streak" /><Tile ic="⭐" n={N.xp || 0} l="XP earned" /><Tile ic="📚" n={topicsStarted} l="topics started" /><Tile ic="🎤" n={answers} l="answers scored" /><Tile ic="🏅" n={badges + '/' + BADGES.length} l="badges" /><Tile ic="🎯" n={Object.keys(N.goalHit || {}).length} l="daily goals hit" /></div>
    <h2>Last 30 days</h2>
    <div className="card"><svg viewBox="0 0 700 150" width="100%" role="img" aria-label="XP earned each day for the last 30 days">
      <line x1="0" x2="700" y1={gy} y2={gy} stroke="var(--warn)" strokeDasharray="5 5" opacity=".7" /><text x="4" y={gy - 4} fill="var(--dim)" fontSize="11">daily goal {goal}</text>
      {vals.map((v, i) => { const h = Math.round(v / mx * 110); return <rect key={i} x={i * bw + 2} y={130 - h} width={bw - 4} height={Math.max(2, h)} rx="3" fill={v >= goal ? 'var(--good)' : v > 0 ? 'var(--acc)' : 'var(--line)'}><title>{dstr(today - (NN - 1 - i))}: {v} XP</title></rect>; })}
      <text x="2" y="146" fill="var(--dim)" fontSize="11">30 days ago</text><text x="698" y="146" fill="var(--dim)" fontSize="11" textAnchor="end">today</text></svg>
      <p className="dim sm">Green bars: you reached the daily goal. A little every day beats a lot once a month.</p></div>
    {L ? <><h2>Your path in {T ? T.name : 'your field'}</h2><p className="dim">Titles differ by company. The pin shows where your experience puts you today.</p>
      <div className="road">{L.levels.map((lv, i) => { const st = i < idx ? 'done' : i === idx ? 'here' : i === idx + 1 ? 'next' : ''; return <div key={i} className={'rstep ' + st}><span className="rdot">{i < idx ? '✓' : i === idx ? '📍' : i + 1}</span>
        <div className="rbody"><b>{lv.t}</b>{i === idx && <> <span className="tag">You are here</span></>}{i === idx + 1 && <> <span className="tag">Next</span></>}<div className="dim sm">{lv.does}</div>
          {i === idx + 1 && <><div className="sm"><b>Build these:</b> {lv.skills.join(', ')}.</div><div className="row">{(lv.topics || []).slice(0, 3).map(id => { const t = topicById(id); return t ? <a key={id} className="btn sm ghost" href={'#/topic/' + id}>📚 {t.name}</a> : null; })}</div><div className="dim sm">To move up: {L.levels[idx].promote || ''}</div></>}</div></div>; })}</div>
      <div className="row"><a className="btn" href={'#/ladder/' + tr}>Full ladder details</a></div></>
      : <div className="card"><h3>Choose your field to see your path</h3><p className="dim">Pick your field and experience in your profile and your career ladder appears here.</p><a className="btn" href="#/profile">Choose field</a></div>}
    <div className="card"><h3>Not sure where you stand?</h3><p className="dim">Add your resume for a personal level check.</p><div className="row"><a className="btn ghost" href="#/resumepdf">📄 Resume check</a><a className="btn ghost" href="#/toolkit">🧰 Toolkit</a><a className="btn ghost" href="#/ideas">💡 Ideas lab</a></div></div>
    <h2>💡 Ideas lab</h2><IdeasLab />
  </>;
}

/* =============================== PROGRESS AND BACKUP =============================== */
const KIND = 'padimachi-progress';
function Backup() {
  const { S, set } = useS(), act = useAct(), [withRes, setWithRes] = useState(!!S.resume), fileRef = useRef(null);
  useEffect(() => { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} }, []);
  const pack = () => { const s = JSON.parse(JSON.stringify(S)); if (!withRes) { s.resume = ''; s.jd = ''; s.extra = []; s.removed = []; } delete s.bk; return JSON.stringify({ kind: KIND, v: 1, saved: Date.now(), state: s }); };
  const mark = () => act(d => { d.bk = Date.now(); });
  async function save(share) {
    const txt = pack(), name = 'padimachi-progress-' + new Date().toISOString().slice(0, 10) + '.json', blob = new Blob([txt], { type: 'application/json' });
    if (share && navigator.canShare) { try { const f = new File([blob], name, { type: 'application/json' }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Padimachi progress' }); mark(); toast('Progress saved'); return; } } catch (e) { if (e && e.name === 'AbortError') return; } }
    if (share) toast('Sharing is not available here. The file is saved to your downloads instead.');
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); mark(); toast('Progress file saved to your downloads');
  }
  function restore(file) {
    const r = new FileReader(); r.onerror = () => toast('Could not read that file');
    r.onload = () => {
      try {
        const o = JSON.parse(r.result); if (!o || o.kind !== KIND || !o.state || typeof o.state !== 'object') throw 0;
        const next = { ...o.state }; if (!next.resume && S.resume) next.resume = S.resume; next.bk = Date.now();
        try { localStorage.setItem('careerlab_v2', JSON.stringify(next)); } catch (e) {}
        const cleared = {}; Object.keys(S).forEach(k => { cleared[k] = undefined; }); set({ ...cleared, ...next });
        toast('Progress restored'); setTimeout(() => location.reload(), 700);
      } catch (e) { toast('That is not a Padimachi progress file'); }
    };
    r.readAsText(file);
  }
  const last = S.bk ? Math.floor((Date.now() - S.bk) / 864e5) : null;
  return <div className="card" id="prog"><h3>💾 Save my progress</h3>
    <p className="dim sm">Your level ({level(S.xp)}), XP, streak and saved jobs live only in this browser. If you clear browser history or site data, they are erased. Save a file now and restore it any time.</p>
    <p className="dim sm">{last === null ? 'Not saved yet.' : last === 0 ? 'Last saved today.' : 'Last saved ' + last + ' day' + (last > 1 ? 's' : '') + ' ago.'}</p>
    <label className="chk" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={withRes} onChange={e => setWithRes(e.target.checked)} /> Include my resume text (stays in the file on your device)</label>
    <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => save(false)}>Save to my phone</button><button className="btn" onClick={() => save(true)}>Send to Drive or WhatsApp</button>
      <button className="btn ghost" onClick={() => fileRef.current && fileRef.current.click()}>Restore from file</button><input ref={fileRef} type="file" accept=".json,application/json" hidden data-testid="restore" onChange={e => { if (e.target.files[0]) restore(e.target.files[0]); e.target.value = ''; }} /></div></div>;
}
function Progress() {
  const { S } = useS(), N = norm(S), last = N.dims.slice(-10), Dm = k => avg(last.map(d => d[k]));
  const rs = N.resume ? C.analyzeResume(N.resume, D.SKILLS).score / 100 : 0;
  const learn = (() => { const v = D.TOPICS.map(t => accOf(N, t.name)).filter(x => x !== undefined); return v.length ? avg(v) : 0; })();
  const claims = Object.values(N.claims).map(x => x / 100), jd = N.resume && N.jd ? C.jdMatch(skillsFound(N), C.extractSkills(N.jd, D.SKILLS), {}).pct / 100 : 0;
  const R = [['Knowledge', learn], ['Technical answers', Dm('k')], ['Scenario handling', avg(claims)], ['Communication', avg(last.map(d => (d.c + d.l) / 2))], ['Resume strength', rs], ['JD coverage', jd]];
  const focus = R.filter(r => r[1] > 0 || last.length).sort((a, b) => a[1] - b[1])[0];
  const started = D.TOPICS.filter(t => accOf(N, t.name) !== undefined).sort((a, b) => accOf(N, a.name) - accOf(N, b.name)).slice(0, 4);
  return <>
    <h1>💾 My progress</h1>
    <div className="card hero"><div><p className="bigp">Level {level(N.xp)} · {levelTitle(N.xp)}</p><p className="dim">{N.xp} XP · 🔥 {N.streak}-day streak</p><div className="bar"><i style={{ width: N.xp % 100 + '%' }} /></div><p className="dim sm">{100 - N.xp % 100} XP to the next level.</p></div>
      <div className="rings"><Ring v={learn} label="learning" /><Ring v={avg(last.map(d => d.o))} label="interview" color="var(--acc2)" /><Ring v={rs} label="resume" color="var(--warn)" /></div></div>
    <div className="grid"><div className="card"><h3>Career readiness</h3>{R.map(r => <Meter key={r[0]} t={r[0]} v={r[1]} />)}{focus && last.length ? <p className="fbtxt">🔥 Focus next on <b>{focus[0]}</b>.</p> : <p className="dim sm">Answer a few questions to unlock your focus advice.</p>}</div>
      <div className="card"><h3>Weakest topics so far</h3>{started.length ? started.map(t => <a key={t.id} className="weak" href={'#/topic/' + t.id}>{t.ic} {t.name} <b>{pct(accOf(N, t.name))}%</b></a>) : <p className="dim">Take a quiz to see this.</p>}<h3 style={{ marginTop: 14 }}>Speaking</h3><p className="dim sm">{N.spoken} spoken answers so far.</p></div></div>
    <h2>Badges</h2><div className="tiles">{BADGES.map(b => <div key={b.id} className={'badge' + (N.badges[b.id] ? ' on' : '')}><b>{b.ic}</b><span className="sm">{b.n}</span></div>)}</div>
    <h2>Keep your progress safe</h2><Backup />
    <div className="row"><a className="btn" href="#/mymap">🗺️ My journey map</a><a className="btn" href="#/profile">👤 Open my profile</a></div>
  </>;
}

/* =============================== PRACTICE GAMES =============================== */
const GAMES = [['quick', '🎯', 'Quick quiz', '10 fresh questions, never repeated until you have seen them all'], ['rapid', '⚡', 'Rapid fire', '60 seconds. How many can you get right?'], ['flash', '🃏', 'Flashcards', 'Flip, say it out loud, mark what you know'], ['order', '🔢', 'Order the steps', 'Put a real-time scenario in the right order'], ['match', '🧩', 'Match it', 'Match terms to meanings'], ['incident', '🚨', 'Fix the incident', 'IT service scenarios. Three lives'], ['bug', '🐞', 'Spot the bug', 'Find what is wrong in the script']];
function Today() {
  const act = useAct(), { S } = useS(), N = norm(S), today = dayNow(), g = N.goal || 50, x = (N.days || {})[today] || 0, done = x >= g, dc = (N.dc || {})[today];
  const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const pair = useMemo(() => { try { return dailyPair(today, N); } catch (e) { return null; } /* eslint-disable-next-line */ }, [S.resume, S.track]);
  return <>
    <div className="grid">
      <div className="card"><h3>🎯 Daily goal</h3><div className="row" style={{ gap: 18 }}><Ring v={Math.min(1, x / g)} label="of goal" color={done ? 'var(--good)' : undefined} /><div><p className="bigp">{Math.min(x, g)}<small className="dim"> / {g} XP</small></p><p className="dim sm">{done ? 'Goal reached. Come back tomorrow to keep your streak.' : (g - x) + ' XP to go. One quiz or two spoken answers will do it.'}</p></div></div>
        <div className="week">{[6, 5, 4, 3, 2, 1, 0].map(k => { const d = today - k, v = (N.days || {})[d] || 0, dt = new Date(d * 864e5 + 12 * 36e5); return <div key={k} className={'wd' + (v > 0 ? ' on' : '') + (k === 0 ? ' now' : '')} title={v + ' XP'}><i>{v > 0 ? '🔥' : ''}</i><span>{names[dt.getUTCDay()]}</span></div>; })}</div>
        <p className="dim sm">🔥 {N.streak}-day streak · {levelTitle(N.xp)} · Level {level(N.xp)}</p>
        <div className="row"><span className="dim sm">My daily goal:</span>{[20, 50, 100, 150].map(v => <button key={v} className={'chip' + (g === v ? ' on' : '')} onClick={() => act(d => { d.goal = v; })}>{v} XP</button>)}</div></div>
      <div className="card"><span className="tag">Daily challenge</span><h3>{dc ? '✅ Completed today' : "Today's 5-minute challenge"}</h3><p className="dim">{dc ? 'Nice work. A new challenge arrives tomorrow.' : '5 questions and 1 real-time scenario picked for today. Finish it for +60 XP.'}</p><div className="row"><a className="btn primary" href="#/challenge">{dc ? 'Play again for practice' : 'Start challenge'} →</a></div></div></div>
    {pair && <div className="grid"><div className="card"><span className="tag">Word of the day</span><h3>{pair.word.t}</h3><p>{pair.word.d}.</p><p className="dim sm">{pair.word.why}</p></div>
      <div className="card"><span className="tag alt">{pair.tip.k}</span><p style={{ fontSize: '1.05rem', margin: '.5em 0' }}>{pair.tip.text}</p>{!pair.has && <p className="dim sm">Add your resume and these tips become about you.</p>}</div></div>}
  </>;
}
function PlayHub() {
  const act = useAct(), { S } = useS(), N = norm(S), links = (STUDY.links || {})[N.track] || [];
  return <>
    <h1>🎮 Practice games</h1><p className="dim">Short games that earn XP. A few minutes a day keeps your streak alive.</p>
    <Today />
    <div className="card"><label>Practising<select value={N.track || ''} onChange={e => act(d => { d.track = e.target.value; })}><option value="">All fields</option>{D.TRACKS.map(t => <option key={t.id} value={t.id}>{t.ic} {t.name}</option>)}</select></label></div>
    <div className="grid" style={{ marginTop: 14 }}>{GAMES.map(g => <a key={g[0]} className="card tcard" href={'#/play/' + g[0]}><div className="ic">{g[1]}</div><h3>{g[2]}</h3><p className="dim sm">{g[3]}</p></a>)}
      <a className="card tcard" href="#/challenge"><div className="ic">🏁</div><h3>Daily challenge</h3><p className="dim sm">One new challenge every day</p></a>
      <a className="card tcard" href="#/speak"><div className="ic">🗣️</div><h3>Speaking lab</h3><p className="dim sm">Read aloud, self-introduction, free answers with coaching</p></a>
      <a className="card tcard" href="#/lab"><div className="ic">💻</div><h3>Code lab</h3><p className="dim sm">Write code and run tests</p></a>
      <a className="card tcard" href="#/mock"><div className="ic">🎙️</div><h3>Mock interview</h3><p className="dim sm">A timed round with a score</p></a></div>
    {links.length > 0 && <><h2>Free places to learn {N.track ? 'in ' + tname(N.track) : ''}</h2><div className="grid">{links.map(l => <a key={l.u} className="card tcard" href={l.u} target="_blank" rel="noreferrer"><b>{l.t}</b><p className="dim sm">{l.d}</p></a>)}</div></>}
  </>;
}
const poolFacts = N => D.FACTS.filter(f => !N.track || f.track === N.track);
function QuizGame({ kind }) {
  const act = useAct(), { S } = useS(), N = norm(S); const [round, setRound] = useState(0), [fin, setFin] = useState(null);
  const { items, fresh } = useMemo(() => {
    const seen = Object.keys(N.seen), tr = N.track || undefined; let it;
    if (kind === 'quick') it = C.genQuestions(D.FACTS, { count: 10, track: tr, seen }); else if (kind === 'rapid') it = C.genQuestions(D.FACTS, { count: 30, track: tr, seen });
    else if (kind === 'incident') it = D.SCENARIOS.map(s => ({ q: s.d, o: s.o, a: s.a, why: s.why })); else it = D.BUGS.map(b => ({ q: 'What is wrong with this script?', code: b.code, o: b.o, a: b.a, why: b.why }));
    return { items: it, fresh: it.filter(q => q.id && !N.seen[q.id]).length };
    // eslint-disable-next-line
  }, [kind, round]);
  const restart = () => { setFin(null); setRound(r => r + 1); };
  if (!items.length) return <div className="card"><p>No questions for this field yet. Choose another field on the Practice page.</p></div>;
  if (fin) return <FinishCard {...fin} again={restart} />;
  const label = { quick: 'Quiz', rapid: 'Rapid', incident: 'Scenario', bug: 'Bug' }[kind];
  const onAnswer = (ok, it) => { if (kind === 'quick' || kind === 'rapid') act(d => { markSeen(d, it.id); const tp = topicById(it.topic); if (tp) record(d, tp.name, ok); }); };
  const onDone = r => {
    let xp, title, extra, total = r.total;
    act((d, ev) => {
      if (kind === 'quick') { xp = r.score * 6; title = 'Quiz complete'; extra = <p className="dim sm">{fresh} new questions this round.</p>; mis(d, 'game'); mis(d, 'quiz'); }
      else if (kind === 'rapid') { xp = r.score * 4; title = 'Time is up!'; total = r.answered || r.total; d.rapid = Math.max(d.rapid, r.score); mis(d, 'game'); }
      else if (kind === 'incident') { xp = r.score * 15; title = r.lives > 0 ? 'All incidents handled!' : 'Out of lives'; d.incident = Math.max(d.incident, r.score); mis(d, 'game'); }
      else { xp = r.score * 10; title = 'Bug hunt complete'; mis(d, 'game'); }
      gainXP(d, ev, xp);
    });
    setFin({ title, score: r.score, total, xp, extra });
  };
  return <Mcq key={kind + round} items={items} label={label} time={kind === 'rapid' ? 60 : 0} auto={kind === 'rapid'} lives={kind === 'incident' ? 3 : 0} onAnswer={onAnswer} onDone={onDone} />;
}
function OrderGame() {
  const act = useAct(), { S } = useS(), N = norm(S), [seed, setSeed] = useState(0);
  const g = useMemo(() => { let pool = D.TOPICS.filter(t => t.scen && (!N.track || t.track === N.track)); if (!pool.length) pool = D.TOPICS.filter(t => t.scen); const t = pool[Math.random() * pool.length | 0], steps = C.steps(t.scen[1]).slice(0, 6); return { t, steps, shuf: C.shuffle(steps) }; /* eslint-disable-next-line */ }, [seed]);
  const [pick, setPick] = useState([]), [out, setOut] = useState(null);
  const reset = () => { setSeed(s => s + 1); setPick([]); setOut(null); };
  const check = () => { let ok = 0; g.steps.forEach((s, i) => { if (pick[i] === s) ok++; }); const p = ok / g.steps.length; act((d, ev) => { d.puz++; gainXP(d, ev, Math.round(p * 20)); mis(d, 'game'); }); setOut({ ok, p }); if (p >= .8) confetti(); };
  return <div className="card"><span className="tag">Order the steps · {g.t.name}</span><h3>{g.t.scen[0]}</h3><p className="dim">Tap the steps in the order you would do them.</p>
    <div>{g.shuf.map((s, i) => <button key={i} className="opt" disabled={pick.includes(s) || !!out} onClick={() => setPick(p => [...p, s])}><span>{s}</span></button>)}</div>
    <div className="step dim">{pick.length ? pick.map((s, i) => <div key={i}>{i + 1}. {s}</div>) : 'Your order will appear here'}</div>
    {!out ? <div className="row" style={{ marginTop: 10 }}><button className="btn ghost" onClick={() => setPick([])}>Reset</button><button className="btn primary" disabled={pick.length < g.steps.length} onClick={check}>Check</button></div>
      : <div className="center"><div style={{ display: 'grid', placeItems: 'center' }}><Ring v={out.p} label="correct" color={out.p >= .8 ? 'var(--good)' : 'var(--warn)'} /></div><p className="bigp">{out.ok} of {g.steps.length} in the right place</p><div className="step"><b>Correct order</b>{g.steps.map((s, i) => <div key={i}>{i + 1}. {s}</div>)}</div><div className="row" style={{ justifyContent: 'center' }}><button className="btn primary" onClick={reset}>Next puzzle</button></div></div>}</div>;
}
function MatchGame() {
  const act = useAct(), { S } = useS(), N = norm(S), [seed, setSeed] = useState(0);
  const g = useMemo(() => { let pool = poolFacts(N); if (pool.length < 5) pool = D.FACTS; const M = C.shuffle(pool.filter((f, i, a) => a.findIndex(x => x.d === f.d) === i)).slice(0, 5); return { M, defs: C.shuffle(M.map(f => f.d)) }; /* eslint-disable-next-line */ }, [seed]);
  const [ans, setAns] = useState({}), [out, setOut] = useState(null);
  const next = () => { setSeed(s => s + 1); setAns({}); setOut(null); };
  const check = () => { let ok = 0; const wrong = []; g.M.forEach((f, i) => { if (ans[i] === f.d) ok++; else wrong.push(f); }); const p = ok / g.M.length; act((d, ev) => { d.puz++; gainXP(d, ev, p * 20); mis(d, 'game'); }); setOut({ ok, p, wrong }); if (p >= .75) confetti(); };
  return <div className="card"><span className="tag">Match it</span><h3>Match each term to its meaning</h3>
    {g.M.map((f, i) => <div className="step" key={i}><b>{f.t}</b><select value={ans[i] || ''} disabled={!!out} onChange={e => setAns(a => ({ ...a, [i]: e.target.value }))}><option value="">Choose...</option>{g.defs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>)}
    {!out ? <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={check}>Check</button></div>
      : <div className="center"><div style={{ display: 'grid', placeItems: 'center' }}><Ring v={out.p} label="correct" color={out.p >= .75 ? 'var(--good)' : 'var(--warn)'} /></div><p className="bigp">{out.ok} of {g.M.length} matched</p>{out.wrong.length > 0 && <div className="step"><b>Correct answers for the ones you missed</b>{out.wrong.map(w => <div key={w.t}>{w.t}: {w.d}</div>)}</div>}<div className="row" style={{ justifyContent: 'center' }}><button className="btn primary" onClick={next}>Next puzzle</button></div></div>}</div>;
}
function FlashGame({ topic }) {
  const act = useAct(), { S } = useS(), N = norm(S), t = topic && topicById(topic);
  const [round, setRound] = useState(0), [deck, setDeck] = useState(() => C.shuffle(t ? t.facts : poolFacts(N)).slice(0, 12)), [known, setKnown] = useState(0), [flip, setFlip] = useState(false), [tot] = useState(deck.length), [fin, setFin] = useState(null);
  const again = () => { setDeck(C.shuffle(t ? t.facts : poolFacts(N)).slice(0, 12)); setKnown(0); setFlip(false); setFin(null); setRound(r => r + 1); };
  const advance = (k, nd) => { setFlip(false); if (!nd.length) { act((d, ev) => { gainXP(d, ev, k * 3); mis(d, 'game'); }); setFin({ title: 'Flashcards done', score: k, total: tot, xp: k * 3 }); } setDeck(nd); };
  if (fin) return <FinishCard {...fin} again={again} back={t ? '#/topic/' + t.id : '#/play'} />;
  if (!deck.length) return <div className="card"><p>No cards for this field yet.</p><a className="btn" href="#/play">Back</a></div>;
  const f = deck[0];
  return <div className="card"><div className="mhead row" style={{ justifyContent: 'space-between' }}><span>{t ? t.name : 'Flashcards'} · {deck.length} left</span><span>Known {known}</span></div><div className="bar"><i style={{ width: Math.round((tot - deck.length) / tot * 100) + '%' }} /></div>
    <button className={'flip' + (flip ? ' on' : '')} aria-label="Flip card" onClick={() => setFlip(x => !x)}>{flip ? <span><small className="dim">Meaning</small><b>{f.d}.</b></span> : <span><small className="dim">Tap to flip. First say it out loud.</small><b>{f.t}</b></span>}</button>
    <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}><button className="btn" onClick={() => advance(known, [...deck.slice(1), deck[0]])}>Again</button><button className="btn primary" onClick={() => { setKnown(known + 1); advance(known + 1, deck.slice(1)); }}>I knew it</button></div></div>;
}
function Play({ arg }) {
  const kind = arg, sub = location.hash.replace(/^#\/?/, '').split('/')[2];
  if (!GAMES.some(g => g[0] === kind)) return <PlayHub />;
  return <><a className="dim" href="#/play">← Practice games</a><div style={{ marginTop: 10 }}>
    {kind === "order" ? <OrderGame key={kind} /> : kind === "match" ? <MatchGame key={kind} /> : kind === "flash" ? <FlashGame key={kind + sub} topic={sub} /> : <QuizGame key={kind} kind={kind} />}</div></>;
}

/* =============================== DAILY CHALLENGE =============================== */
function Challenge() {
  const act = useAct(), { S } = useS(), N = norm(S), today = dayNow(), tr = N.track || '';
  const { qs, sq } = useMemo(() => {
    const hash = [...(tr || 'all')].reduce((a, c) => a + c.charCodeAt(0), 0), rnd = seeded(today * 31 + hash);
    const qs = C.genQuestions(D.FACTS, { count: 5, track: tr || undefined, seen: [] }, rnd), pool = D.TOPICS.filter(t => t.scen && (!tr || t.track === tr)), tp = pool[Math.floor(rnd() * pool.length)];
    return { qs, sq: tp ? C.scenQ(tp) : null }; /* eslint-disable-next-line */
  }, [tr, today]);
  const [part, setPart] = useState(1), [score, setScore] = useState(0), [fin, setFin] = useState(null);
  const finish = (sc, so) => { let xp; act((d, ev) => { const first = !(d.dc || {})[today]; d.dc = d.dc || {}; d.dc[today] = 1; xp = first ? 60 : 15; gainXP(d, ev, xp); mis(d, 'game'); mis(d, 'quiz'); }); setFin({ title: 'Challenge complete', score: sc, total: qs.length, xp, extra: sq ? <p className="dim sm">Scenario score {Math.round(so * 100)}/100</p> : null, back: '#/play' }); };
  return <><a className="dim" href="#/play">← Practice games</a><h1>🏁 Daily challenge</h1>
    <p className="dim">{tr ? tname(tr) + ' · ' : ''}Same challenge all day. Part 1 is 5 quick questions. Part 2 is a real-time scenario you answer in your own words or by voice.</p>
    {fin ? <FinishCard {...fin} /> : part === 1 ? <Mcq items={qs} label="Challenge" onAnswer={(ok, it) => act(d => { markSeen(d, it.id); const t = topicById(it.topic); if (t) record(d, t.name, ok); })} onDone={r => { setScore(r.score); if (!sq) finish(r.score, 0); else setPart(2); }} />
      : <><span className="tag">Part 2 of 2</span><QA q={sq} kind={sq.kind} coach autospeak lead="Last part. A real-time situation." ph="Say or type the steps you would take..." onGraded={g => <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => finish(score, g.overall)}>Finish challenge</button></div>} /></>}</>;
}

/* =============================== MOCK AND PROJECT INTERVIEW =============================== */
function Round({ qs0, title, timer, follow, onGraded, onDone }) {
  const [qs, setQs] = useState(qs0), [i, setI] = useState(0), res = useRef([]), used = useRef([]), follows = useRef(0);
  useEffect(() => { if (i >= qs.length) onDone(res.current); /* eslint-disable-next-line */ }, [i]);
  useEffect(() => { window.scrollTo(0, 0); }, [i]);
  if (i >= qs.length) return null;
  const q = qs[i];
  return <div><span className="tag">{title}</span><h1>Question {i + 1} of {qs.length}</h1><div className="bar" style={{ marginBottom: 16 }}><i style={{ width: Math.round(i / qs.length * 100) + '%' }} /></div>
    <QA key={i + ':' + q.q} q={q} kind={q.kind} timer={timer || 150} coach autospeak lead={i === 0 ? (title.indexOf('Project') >= 0 ? 'Hi, I am Venkat. Let us talk about your projects.' : 'Hi, I am Venkat, your interviewer today.') : (q.follow ? 'Follow-up.' : 'Next question.')}
      onGraded={(g, txt, ctx) => {
        res.current.push({ g, q }); onGraded && onGraded(q, g, ctx.d);
        let f = null;
        if (follow !== false && follows.current < 2) { f = C.followUp(txt, g, used.current); if (!f && g.words > 20 && !/\d/.test(txt) && !used.current.includes('result')) f = { kind: 'Follow-up', follow: true, topic: 'result', q: 'Can you put a number or a clear result on that? For example time saved, cost reduced, or customers helped.', keys: ['result', 'percent', 'reduced', 'improved', 'saved', 'increase', 'customers', 'time'], m: 'Give one measurable result (a number) and what changed because of your work. If you do not have exact numbers, give an honest estimate and say it is an estimate.' }; }
        if (f) { used.current.push(f.topic); follows.current++; }
        return <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={() => { if (f) setQs(a => { const b = a.slice(); b.splice(i + 1, 0, f); return b; }); setI(i + 1); }}>{f ? 'Next: follow-up question' : i + 1 >= qs.length ? 'See my report' : 'Next question'}</button></div>;
      }} /></div>;
}
const dimsOf = res => { const k = avg(res.map(r => r.g.know)), c = avg(res.map(r => r.g.conf)), r = avg(res.map(r => r.g.reason)), l = avg(res.map(r => r.g.clar)); return { dims: { Knowledge: k, Confidence: c, Reasoning: r, Clarity: l }, o: k * .4 + r * .2 + c * .2 + l * .2 }; };
function Report({ res, kind, extra, retry }) {
  const act = useAct(), { S } = useS(), { dims, o } = useMemo(() => dimsOf(res), [res]), prevBest = useRef(S.mock || 0).current;
  const keys = Object.keys(dims).sort((a, b) => dims[b] - dims[a]);
  useEffect(() => { act((d, ev) => { if (kind === 'mock') d.mock = Math.max(d.mock, pct(o)); gainXP(d, ev, o * 80); checkBadges(d, ev); }); if (o >= .75) confetti(); /* eslint-disable-next-line */ }, []);
  const tips = { Knowledge: 'Revise the Learn topics for the skills on your resume, then retry.', Confidence: "Use direct statements like 'I built...'. A confident answer with a gap can be corrected; a vague one cannot.", Reasoning: 'Explain why. Use because, first, then and for example.', Clarity: 'Aim for 4 to 6 sentences: context, what you did, and the result.' };
  const real = n => D.TOPICS.some(t => t.name === n) || D.SKILLS.some(s => s.n === n);
  const weak = res.filter(r => r.g.know < .5 && r.q.topic && real(r.q.topic)).map(r => r.q.topic).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const sc = r => r.g.overall != null ? r.g.overall : (r.g.know + r.g.reason + r.g.conf + r.g.clar) / 4, srt = res.slice().sort((a, b) => sc(b) - sc(a)), bs = srt[0], ws = srt[srt.length - 1], cl = t => String(t).length > 110 ? String(t).slice(0, 107) + '…' : t;
  return <>
    <h1>📋 Interview report</h1>
    <div className="card hero"><div><span className="tag">{o >= .75 ? 'Interview ready' : o >= .5 ? 'Getting there' : 'Keep practising'}</span><p className="bigp">{pct(o)}% overall</p><p className="dim">{res.length} answers scored. Strongest: <b>{keys[0]}</b>. Work on: <b>{keys[3]}</b>.</p></div><Ring v={o} label="overall" color={scoreColor(pct(o))} /></div>
    <div className="grid"><div className="card"><h3>Breakdown</h3>{Object.keys(dims).map(n => <Meter key={n} t={n} v={dims[n]} />)}</div>
      <div className="card"><h3>What to do next</h3><p>{tips[keys[3]]}</p>{weak.length > 0 && <><p className="dim sm">Revise before your next try</p><Chips a={weak} cls="r" /></>}<div className="row"><a className="btn primary" href="#/learn">My learning path</a><button className="btn" onClick={retry}>Try again</button></div></div></div>
    {res.length >= 2 && <div className="card"><h3>Your scorecard</h3><p>✅ <b>Strongest answer:</b> {cl(bs.q.q)} <span className="tag">{pct(sc(bs))}%</span></p><p>⚠️ <b>Fix this first:</b> {cl(ws.q.q)} <span className="tag alt">{pct(sc(ws))}%</span></p>
      {kind === 'mock' && prevBest > 0 && <p className="dim sm">{pct(o) > prevBest ? '📈 New personal best. Last best was ' + prevBest + '%.' : 'Your best so far is ' + Math.max(prevBest, pct(o)) + '%. This round: ' + pct(o) + '%.'}</p>}
      <div className="row"><button className="btn primary" onClick={retry}>Retry and beat {pct(o)}%</button></div></div>}
    {extra}
  </>;
}
function Mock() {
  const { S } = useS(), N = norm(S), [run, setRun] = useState(null), [rep, setRep] = useState(null), [key, setKey] = useState(0);
  const found = skillsFound(N), trks = myTracks(N), jdS = N.jd ? C.extractSkills(N.jd, D.SKILLS) : [], gaps = jdS.filter(s => !found.includes(s));
  const y = yearsOf(N), band = y === null || y === undefined || y < 1 ? 0 : y < 3 ? 1 : 2, iv = ((window.IVTRACK || {})[N.track || trks[0]] || [])[band];
  const start = () => {
    const pool = D.SKILLS.filter(s => !trks.length || trks.includes(s.track) || found.includes(s.n));
    const qs = C.buildMock({ resume: N.resume, found: found.filter(n => pool.some(s => s.n === n)), gaps, skills: pool, scenarios: D.SCENARIOS, scenarioKeys: D.SCENARIOS.map(s => s.k) });
    const tps = D.TOPICS.filter(t => t.scen && (!trks.length || trks.includes(t.track))), sc = C.scenQ(C.shuffle(tps)[0] || D.TOPICS.find(t => t.scen));
    const si = qs.findIndex(q => q.kind === 'Scenario'); if (si >= 0 && sc) qs[si] = sc;
    const bi = qs.findIndex(q => q.kind === 'Behaviour'), beh = C.genOpen(D.OPEN, { cat: 'Behavioural', seen: Object.keys(N.seen), count: 1 })[0]; if (bi >= 0 && beh) qs[bi] = Object.assign({ kind: 'Behavioural' }, beh);
    setKey(k => k + 1); setRep(null); setRun(qs);
  };
  if (rep) return <Report res={rep} kind="mock" retry={() => { setRep(null); setRun(null); }} />;
  if (run) return <Round key={key} qs0={run} title="Mock interview" onDone={r => setRep(r)} />;
  return <>
    <h1>🎙️ Mock interview</h1>
    <div className="card"><h3>Your plan</h3><p className="dim">{N.resume ? 'Questions are built from your resume' : 'No resume saved, so you get a ' + tname(N.track) + ' interview'}{N.jd ? ' and your job description' : ''}. About 8 questions, 2 minutes each. Answer by voice or typing, and a short follow-up may come based on what you say.</p>
      {found.length > 0 && <><p className="dim sm">Skills found on your resume</p><Chips a={found.slice(0, 10)} cls="g" /></>}{gaps.length > 0 && <><p className="dim sm">Gaps from the job description</p><Chips a={gaps} cls="r" /></>}
      <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={start}>Start interview</button><a className="btn" href="#/resumepdf">{N.resume ? 'Update resume' : 'Add resume'}</a></div>
      <p className="dim sm">Scores are an automatic estimate from your answer text, not a psychological test. Each answer has a 2 minute timer.</p></div>
    {N.mock > 0 && <div className="note">Your best mock score so far: <b>{N.mock}%</b></div>}
    {iv && <><h2>What they ask in {tname(N.track || trks[0])} at your level</h2><div className="grid"><div className="card"><h3>Topics to expect</h3><Bullets a={iv.topics} /></div><div className="card"><h3>Sample questions</h3><Bullets a={iv.qs} /></div></div><p className="dim sm">Practise each one aloud in 1 to 2 minutes, with a real example from your work.</p></>}
  </>;
}
function Project() {
  const act = useAct(), { S } = useS(), N = norm(S), [run, setRun] = useState(null), [rep, setRep] = useState(null), scores = useRef({});
  if (!N.resume) return <><h1>🛠️ Project interview</h1><div className="card hero one"><div><h2 style={{ marginTop: 0 }}>Interviewers ask about what you wrote</h2><p className="dim">Add your resume. Padimachi finds your projects and the tools you used, then asks about them with real-time scenarios and shows the correct approach for each.</p><a className="btn primary" href="#/resumepdf">Add my resume</a></div></div></>;
  const lines = C.projectLines(N.resume), trks = myTracks(N), tps = C.topicsInText(N.resume, D.TOPICS.filter(t => !trks.length || trks.includes(t.track) || t.track === 'pm')), found = skillsFound(N);
  if (rep) {
    const cc = C.claimsCheck(found.concat(Object.keys(scores.current).filter(x => !found.includes(x))), scores.current);
    const link = n => { const t = D.TOPICS.find(x => x.skill === n || x.name === n); return t ? <a key={n} className="chip" href={'#/topic/' + t.id}>{n} →</a> : <span key={n} className="chip">{n}</span>; };
    return <Report res={rep} kind="project" retry={() => { setRep(null); setRun(null); scores.current = {}; }} extra={<><h2>Claims check</h2><p className="dim">Skills on a resume are claims. This shows how well you could back each one up today.</p>
      <div className="grid"><div className="card"><h3>🟢 You can back these up</h3>{cc.solid.length ? <div className="row chipsr">{cc.solid.map(link)}</div> : <p className="dim">None yet. Practise below.</p>}</div>
        <div className="card"><h3>🟠 Revise before the interview</h3>{cc.shaky.length ? <><div className="row chipsr">{cc.shaky.map(link)}</div><p className="dim sm">You listed these but the explanation was weak. Learn them or remove them from your resume.</p></> : <p className="dim">None. Good.</p>}</div>
        <div className="card"><h3>⬜ Not tested yet</h3>{cc.untested.length ? <div className="row chipsr">{cc.untested.map(link)}</div> : <p className="dim">All tested.</p>}</div></div></>} />;
  }
  if (run) return <Round qs0={run} title="Project interview" timer={180} onGraded={(q, g, d) => { if (q.id && q.id.startsWith('sc:')) { const t = topicById(q.id.slice(3)); if (t) { const k = t.skill || t.name; scores.current[k] = Math.max(scores.current[k] || 0, g.overall); d.claims[k] = pct(g.overall); record(d, t.name, g.overall >= .5); } } }} onDone={r => setRep(r)} />;
  return <><h1>🛠️ Project interview</h1><div className="card"><h3>What we found in your resume</h3>{lines.length ? lines.slice(0, 5).map((l, i) => <div className="step" key={i}>{l}</div>) : <p className="dim">No project or experience lines were detected. Write bullets that start with action verbs (built, led, managed...) and try again. You will still get scenario questions for your skills.</p>}
    {tps.length > 0 && <><p className="dim sm">Tools and topics we will test</p><Chips a={tps.map(t => t.name)} cls="y" /></>}
    <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => setRun(C.buildProjectRound(N.resume, D.TOPICS, trks))}>Start (about {Math.min(8, lines.slice(0, 3).length * 2 + tps.length + 1)} questions)</button><a className="btn" href="#/resumepdf">Edit resume</a></div>
    <p className="dim sm">Be honest in your answers. If you only supported part of a project, say which part.</p></div></>;
}

/* =============================== SPEAKING LAB =============================== */
const READ = [['Easy', 'Good morning. My name is Priya and I have three years of experience.'], ['Easy', 'I enjoy solving problems and working with a team.'], ['Easy', 'Thank you for giving me this opportunity to interview.'], ['Medium', 'In my last project I reduced the response time by thirty percent.'], ['Medium', 'First I gathered the requirements, then I designed and tested the solution.'], ['Medium', 'When the deadline was at risk, I prioritised the critical tasks and informed the stakeholders.'], ['Medium', 'I would like to explain my approach step by step.'], ['Hard', 'The customer was dissatisfied because the delivery was delayed, so I coordinated with the supplier and resolved it within a day.'], ['Hard', 'Through regular communication and careful planning, our team consistently exceeded its quarterly targets.'], ['Hard', 'I am particularly interested in this position because it combines technical depth with responsibility for outcomes.']];
const PHRASES = [['Starting an answer', ['"Let me explain it step by step."', '"In my experience, ..."', '"The way I approach this is ..."']], ['Buying thinking time', ['"That is a good question. Let me think for a moment."', '"Let me structure my answer."']], ['When you are not sure', ['"I have not worked on that directly, but my understanding is ..."', '"I do not remember the exact detail, but I would find out by ..."']], ['Showing ownership', ['"I was responsible for ..." (not "we did")', '"I decided to ... because ..."']], ['Finishing strongly', ['"As a result, ..." and then a number', '"Would you like me to go deeper on any part?"']], ['Common mistakes to avoid', ['Say "I have 3 years of experience", not "I am having 3 years experience".', 'Say "discuss the plan", not "discuss about the plan".', 'Say "My name is ...", not "Myself ...".']]];
function ReadAloud() {
  const act = useAct(), [i, setI] = useState(() => Math.floor(Math.random() * READ.length)), [txt, setTxt] = useState(''), [out, setOut] = useState(null);
  const [lv, s] = READ[i % READ.length];
  const check = (t, meta) => {
    const r = C.readAloud(s, t), c = C.coach(t, meta.spoke ? meta.secs : 0); act((d, ev) => { gainXP(d, ev, r.pct / 10, 'speak:read'); mis(d, 'answer'); }); setOut({ r, c }); if (r.pct >= 90) confetti();
  };
  const missed = out ? new Set(out.r.missed.map(x => x.toLowerCase())) : null;
  return <div className="card"><span className="tag">{lv}</span><p className="read">{s}</p><p className="dim sm">Read it clearly at a steady pace. Then tap Compare.</p>
    {canSpeak && <button className="btn sm ghost" onClick={() => say(s)}>🔊 Hear it first</button>}
    <div style={{ marginTop: 10 }}><AnswerBox value={txt} setValue={setTxt} rows={2} cta="Compare" ph="Your spoken words appear here..." onCheck={check} /></div>
    {out && <div style={{ marginTop: 12 }}><div className="res row" style={{ gap: 18 }}><Ring v={out.r.pct / 100} label="match" color={scoreColor(out.r.pct)} /><div className="meters"><p className="read sm">{s.split(/\s+/).map((w, k) => <span key={k} className={missed.has(w.toLowerCase().replace(/[^a-z0-9']/g, '')) ? 'miss' : 'ok'}>{w} </span>)}</p><p className="dim sm">{out.r.pct >= 90 ? 'Excellent clarity.' : out.r.pct >= 70 ? 'Good. Slow down on the red words.' : 'Try again slowly, one phrase at a time.'}</p></div></div>
      {out.c.fillers && Object.keys(out.c.fillers).length > 0 && <p className="dim sm">Filler words noticed: {Object.keys(out.c.fillers).join(', ')}</p>}
      <p className="dim sm">The score depends on the browser's speech recognition, so treat it as a guide, not a judge.</p></div>}
    <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={() => { stopSpeak(); setI(i + 1); setTxt(''); setOut(null); }}>Next sentence →</button></div></div>;
}
function Intro() {
  const act = useAct(), { S } = useS(), N = norm(S), p = N.intro || {}, found = skillsFound(N).slice(0, 3).join(', ');
  const [f, setF] = useState({ name: p.name || '', role: p.role || '', years: p.years || '', skills: p.skills || found, achievement: p.achievement || '', goal: p.goal || '' }), [text, setText] = useState(null), [spoken, setSpoken] = useState(''), [res, setRes] = useState(null);
  const u = k => e => setF(o => ({ ...o, [k]: e.target.value }));
  const make = () => { act(d => { d.intro = { ...f }; }); setText(C.introText({ name: f.name.trim(), role: f.role.trim(), years: f.years.trim(), skills: f.skills.split(',').map(x => x.trim()).filter(Boolean), achievement: f.achievement.trim(), goal: f.goal.trim() })); setRes(null); };
  const check = (t, meta) => { const r = C.readAloud(text, t), c = C.coach(t, meta.spoke ? meta.secs : 0); act((d, ev) => { gainXP(d, ev, 15, 'speak:intro'); mis(d, 'answer'); }); setRes({ r, c, t, meta }); };
  return <><div className="card"><h3>Build your self-introduction</h3><p className="dim">Present, past, future. About 45 to 60 seconds.</p>
    <div className="grid"><label>Name<input value={f.name} onChange={u('name')} /></label><label>Role<input placeholder="for example: HR executive" value={f.role} onChange={u('role')} /></label><label>Experience<input placeholder="for example: 3 years" value={f.years} onChange={u('years')} /></label><label>Main skills (comma separated)<input value={f.skills} onChange={u('skills')} /></label></div>
    <label style={{ marginTop: 10 }}>One achievement with a number<input placeholder="for example: reduced hiring time by 20%" value={f.achievement} onChange={u('achievement')} /></label>
    <label style={{ marginTop: 10 }}>What you want next<input placeholder="for example: a senior role in recruitment" value={f.goal} onChange={u('goal')} /></label>
    <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={make}>Write my introduction</button></div></div>
    {text !== null && <div className="card"><h3>Your introduction</h3><textarea rows={6} value={text} onChange={e => setText(e.target.value)} /><p className="dim sm">Replace anything in [brackets]. Make it sound like you.</p>
      <div className="row"><button className="btn sm ghost" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(text).then(() => toast('Copied'), () => toast('Select the text and copy it')); }}>Copy</button>{canSpeak && <button className="btn sm ghost" onClick={() => say(text)}>🔊 Hear it</button>}</div>
      <h3 style={{ marginTop: 14 }}>Now say it aloud</h3><AnswerBox value={spoken} setValue={setSpoken} rows={4} cta="Check my delivery" onCheck={check} />
      {res && <div style={{ marginTop: 12 }}><div className="res row" style={{ gap: 18 }}><Ring v={res.c.score / 100} label="delivery" color={scoreColor(res.c.score)} /><div className="meters"><p>{res.r.pct}% of your written words were spoken{res.r.missed.length ? '. Missed: ' + res.r.missed.slice(0, 8).join(', ') : ''}.</p></div></div><Coach txt={res.t} secs={res.meta.spoke ? res.meta.secs : 0} /></div>}</div>}</>;
}
function FreeAnswer() {
  const act = useAct(), { S } = useS(), N = norm(S), [n, setN] = useState(0);
  const y = yearsOf(N), q = useMemo(() => C.genOpen(D.OPEN, { track: N.track || undefined, seen: Object.keys(N.seen), count: 1, senior: y >= 6 })[0], [n]); /* eslint-disable-line */
  if (!q) return <div className="card"><p>No questions found. Try another field.</p></div>;
  return <><QA key={n + q.id} q={q} kind={q.cat} coach ph="Say or type your answer..." onGraded={(g, t, ctx) => { ctx.xp(g.overall * 20); }} /><div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => { stopSpeak(); setN(n + 1); }}>Another question →</button></div></>;
}
function Speak({ arg }) {
  const tabs = [['read', 'Read aloud'], ['intro', 'Self-introduction'], ['free', 'Free answer'], ['phrases', 'Useful phrases']], mode = tabs.some(x => x[0] === arg) ? arg : 'read';
  return <><h1>🗣️ Speaking lab</h1><p className="dim">Practise out loud. The coach counts filler words, repeated words, pace, and common grammar slips. {hasVoice ? '' : <b>Voice needs Chrome or Edge; you can still type.</b>}</p>
    <div className="tabs">{tabs.map(t => <a key={t[0]} className={'chip' + (t[0] === mode ? ' on' : '')} href={'#/speak/' + t[0]}>{t[1]}</a>)}</div>
    {mode === 'read' && <ReadAloud />}{mode === 'intro' && <Intro />}{mode === 'free' && <FreeAnswer />}
    {mode === 'phrases' && <div className="grid">{PHRASES.map(p => <div className="card" key={p[0]}><h3>{p[0]}</h3>{p[1].map(x => <div className="step" key={x}>{x}</div>)}</div>)}</div>}</>;
}

const W = Comp => function Wrapped(props) { return <Page><Comp {...props} /></Page>; };
export default { ladder: W(Ladder), mymap: W(MyMap), ideas: W(Ideas), progress: W(Progress), play: W(Play), challenge: W(Challenge), mock: W(Mock), project: W(Project), speak: W(Speak) };
