// Shared pieces for the practice, speaking, mock, journey and progress pages.
// State keys are the same as the live site (xp, streak, last, days, dims, badges, acc, seen ...).
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { D, C } from './lib.js';
import { useS } from './ctx.jsx';

export const DAY = 864e5;
export const dayNow = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY);
export const pct = v => Math.round((v || 0) * 100);
export const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const tname = id => (D.TRACKS.find(t => t.id === id) || { name: 'All fields' }).name;
export const topicById = id => D.TOPICS.find(t => t.id === id);
export const def = () => ({ xp: 0, streak: 0, last: 0, track: '', acc: {}, seen: {}, dims: [], resume: '', jd: '', extra: [], removed: [], gaps: [], mock: 0, rapid: 0, incident: 0, badges: {}, lang: 'en-IN', solved: {}, puz: 0, claims: {}, spoken: 0, intro: {}, doneDays: {}, days: {}, goal: 50, dc: {}, goalHit: {}, m: { day: 0, d: {} } });
export const norm = S => ({ ...def(), ...S });
export const level = xp => Math.floor((xp || 0) / 100) + 1;
const TITLES = ['Beginner', 'Learner', 'Explorer', 'Practitioner', 'Skilled', 'Interview ready', 'Pro', 'Expert', 'Master', 'Legend'];
export const levelTitle = xp => TITLES[Math.min(TITLES.length - 1, Math.floor((level(xp) - 1) / 2))];
export const skillsFound = S => { const s = new Set(S.resume ? C.extractSkills(S.resume, D.SKILLS) : []); (S.extra || []).forEach(x => s.add(x)); (S.removed || []).forEach(x => s.delete(x)); return [...s]; };
export const myTracks = S => { const r = S.resume ? C.detectTrack(S.resume, D.SKILLS).map(x => x.track) : []; if (S.track && !r.includes(S.track)) r.unshift(S.track); return r.slice(0, 2); };
export const accOf = (S, name) => { const a = (S.acc || {})[name]; return a && a[1] ? a[0] / a[1] : undefined; };
export const accMap = S => { const o = {}; Object.keys(S.acc || {}).forEach(k => { o[k] = accOf(S, k); }); return o; };

/* ---------- toast and confetti (small DOM helpers, outside React) ---------- */
export function toast(m, id, cls) {
  try {
    let t = document.getElementById('ctoast'); if (!t) { t = document.createElement('div'); t.id = 'ctoast'; t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    let d = id ? t.querySelector('[data-id="' + id + '"]') : null;
    if (!d) { d = document.createElement('div'); if (id) d.dataset.id = id; t.appendChild(d); while (t.children.length > 3) t.firstChild.remove(); }
    d.className = 'ct ' + (cls || ''); d.textContent = m; clearTimeout(d._t); d._t = setTimeout(() => d.remove(), cls === 'buddy' ? 5200 : 2700);
  } catch (e) {}
}
export function confetti() {
  try {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const c = document.createElement('canvas'); c.id = 'cfx'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext('2d'), cols = ['#5eead4', '#818cf8', '#f472b6', '#fbbf24', '#4ade80'];
    const P = Array.from({ length: 110 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: cols[Math.random() * 5 | 0], r: Math.random() * 6 }));
    let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 110) requestAnimationFrame(loop); else c.remove(); })();
  } catch (e) {}
}

/* ---------- Soluuuu the buddy: short cheers ---------- */
const BUDDY = {
  goal: ['{n}, daily goal done! Go drink some chai, you earned it. ☕', 'Goal reached! Your future boss just felt a tingle. 😄', 'Daily goal complete! If effort were a biryani, you just ordered the large one. 🍛', 'Boom! Goal done. Interviewers beware. 🎯'],
  level: ['Level up! You are now Level {l}. 😄', 'Level {l}! I would give you a medal, but I only have emojis. 🏅'],
  badge: ['New badge: {b}! Put it on the fridge. 🧲', '{b} unlocked! Nicely done!'],
  great: ['That answer was sharp. Say it exactly like that in the interview! 👏', 'Strong answer! Clear, confident and no rambling.'],
  tough: ['Tough one? Read the model answer, say it again in your own words, and it sticks. 💪', 'Wrong answers are just free lessons. Try again. 🙂']
};
const lastSay = {};
export function buddy(kind, o) {
  const now = Date.now(); if (lastSay[kind] && now - lastSay[kind] < (kind === 'great' || kind === 'tough' ? 90000 : 4000)) return null; lastSay[kind] = now;
  const a = BUDDY[kind]; if (!a) return null;
  return '🤖 ' + a[Math.floor(Math.random() * a.length)].replace(/\{n\}/g, 'friend').replace(/\{l\}/g, (o && o.l) || '').replace(/\{b\}/g, (o && o.b) || '');
}

/* ---------- XP, badges, missions: these change a draft copy of the state ---------- */
export const BADGES = [
  { id: 'xp100', n: 'Getting started', ic: '🌱', t: d => d.xp >= 100 }, { id: 'xp500', n: 'On a roll', ic: '🔥', t: d => d.xp >= 500 }, { id: 'xp1500', n: 'Pro learner', ic: '🏆', t: d => d.xp >= 1500 },
  { id: 'str3', n: '3-day streak', ic: '📅', t: d => d.streak >= 3 }, { id: 'res', n: 'Resume ready', ic: '📄', t: d => !!d.resume }, { id: 'mock', n: 'First mock', ic: '🎤', t: d => d.mock > 0 },
  { id: 'proj', n: 'Project round', ic: '🛠️', t: d => Object.keys(d.claims).length > 0 }, { id: 'voice', n: 'Spoke 5 answers', ic: '🎙️', t: d => d.spoken >= 5 },
  { id: 'code', n: 'Code solver', ic: '💻', t: d => Object.keys(d.solved).some(k => !k.startsWith('draft_')) }, { id: 'rapid', n: 'Rapid fire 8+', ic: '⚡', t: d => d.rapid >= 8 }, { id: 'ready', n: 'Interview ready', ic: '⭐', t: d => d.mock >= 75 }, { id: 'str7', n: '7-day streak', ic: '🔥', t: d => d.streak >= 7 }, { id: 'goal', n: 'Daily goal hit', ic: '🎯', t: d => Object.keys(d.goalHit || {}).length > 0 }, { id: 'chal', n: 'Challenge done', ic: '🏁', t: d => Object.keys(d.dc || {}).length > 0 }, { id: 'lv5', n: 'Level 5', ic: '🚀', t: d => d.xp >= 400 }
];
export function checkBadges(d, ev) { BADGES.forEach(b => { if (!d.badges[b.id] && b.t(d)) { d.badges[b.id] = 1; ev.push({ buddy: 'badge', o: { b: b.ic + ' ' + b.n }, fallback: b.ic + ' Badge unlocked: ' + b.n }); } }); }
export function xpTake(d, key) { const t = dayNow(); const x = d.xpk && d.xpk.d === t ? d.xpk : (d.xpk = { d: t, k: {} }); const c = x.k[key] = (x.k[key] || 0) + 1; return c === 1 ? 1 : c === 2 ? .5 : c === 3 ? .25 : 0; }
export function gainXP(d, ev, n, key, mult) {
  n = Math.round(n); if (n <= 0) return 0; const t = dayNow();
  const f = mult !== undefined ? mult : xpTake(d, key || (location.hash.split('?')[0] || '#/home'));
  n = Math.round(n * f);
  if (n <= 0) { ev.push({ toast: 'XP for this was already counted today. Try a new question or activity.', id: 'xpcap' }); return 0; }
  const before = Math.floor(d.xp / 100); d.xp += n; d.days = d.days || {}; const g0 = d.days[t] || 0; d.days[t] = g0 + n; const goal = d.goal || 50;
  if (g0 < goal && d.days[t] >= goal) { d.goalHit = d.goalHit || {}; d.goalHit[t] = 1; ev.push({ buddy: 'goal', fallback: '🎯 Daily goal reached!', fx: 1 }); }
  ev.push({ xp: n });
  if (Math.floor(d.xp / 100) > before) { ev.push({ buddy: 'level', o: { l: Math.floor(d.xp / 100) + 1 }, fallback: 'Level up! You are level ' + (Math.floor(d.xp / 100) + 1), fx: 1 }); }
  checkBadges(d, ev); return n;
}
export function xpEver(d, ev, key, n) { d.xpEver = d.xpEver || {}; if (d.xpEver[key]) return 0; d.xpEver[key] = 1; return gainXP(d, ev, n, key, 1); }
export function mis(d, k, mult) { if (mult === 0) return; const t = dayNow(); if (d.m.day !== t) d.m = { day: t, d: {} }; d.m.d[k] = (d.m.d[k] || 0) + 1; }
export const record = (d, name, ok) => { const a = d.acc[name] || [0, 0]; d.acc[name] = [a[0] + (ok ? 1 : 0), a[1] + 1]; };
export const markSeen = (d, id) => { d.seen[id] = 1; };

let xpSum = 0, xpSumT = 0;
function flush(ev) {
  setTimeout(() => ev.forEach(e => {
    if (typeof e === 'string') toast(e);
    else if (e.xp) { xpSum = (xpSumT && Date.now() - xpSumT < 2600 ? xpSum : 0) + e.xp; xpSumT = Date.now(); toast('+' + xpSum + ' XP', 'xp'); }
    else if (e.toast) toast(e.toast, e.id);
    else if (e.buddy) { const m = buddy(e.buddy, e.o); toast(m || e.fallback || '', null, m ? 'buddy' : ''); if (e.fx) confetti(); }
    else if (e.fx) confetti();
  }), 0);
}

/* useAct() gives one function: act(draft => ...). The draft is a full copy of the state. Everything done inside is saved together. */
export function useAct() {
  const { S, set } = useS(); const ref = useRef(S); ref.current = S;
  return useCallback(fn => {
    const d = JSON.parse(JSON.stringify(norm(ref.current))), ev = []; const r = fn(d, ev); ref.current = d; set(d); flush(ev); return r;
  }, [set]);
}
/* keeps the streak right when a page opens, same rule as the live site */
export function useTouch() {
  const act = useAct(), { S } = useS();
  useEffect(() => { const t = dayNow(); if (S.last !== t) act(d => { d.streak = d.last === t - 1 ? (d.streak || 0) + 1 : 1; d.last = t; }); /* eslint-disable-next-line */ }, []);
}
export const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* ---------- small widgets ---------- */
export const scoreColor = o => o >= 70 ? 'var(--good)' : o >= 45 ? 'var(--warn)' : 'var(--bad)';
export const Ring = ({ v, label, color }) => <div className="ringc" style={{ '--p': pct(v), '--c': color || 'var(--acc)' }}><div><b>{pct(v)}</b><small>{label}</small></div></div>;
export const Meter = ({ t, v }) => <div className="meter"><span><b>{t}</b><b>{pct(v)}%</b></span><div className="bar"><i style={{ width: pct(v) + '%' }} /></div></div>;
export const Chips = ({ a, cls }) => a && a.length ? <div className="row chipsr">{a.map(x => <span key={x} className={'chip ' + (cls || '')}>{x}</span>)}</div> : null;
export const Tile = ({ ic, n, l }) => <div className="card tile"><b className="tn">{ic} {n}</b><div className="dim sm">{l}</div></div>;

/* ---------- speaking out loud (device voice) ---------- */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
export const canSpeak = !!(synth && typeof window !== 'undefined' && window.SpeechSynthesisUtterance);
const ROBOT = /espeak|pico|festival|mbrola|robot|compact|flite/i;
const bestVoice = () => { if (!canSpeak) return null; const vs = synth.getVoices().filter(v => /^en/i.test(v.lang) && !ROBOT.test(v.name)); const rank = v => (/en[-_]IN/i.test(v.lang) ? 16 : /^en[-_](GB|US|AU)/i.test(v.lang) ? 14 : 8) + (/natural|neural|online|enhanced|premium/i.test(v.name) ? 20 : 0) + (v.localService ? 0 : 10); return vs.sort((a, b) => rank(b) - rank(a))[0] || null; };
let speakTok = 0;
export function stopSpeak() { speakTok++; try { synth && synth.cancel(); } catch (e) {} }
export function say(text, o = {}) {
  if (!canSpeak) return false; stopSpeak(); const my = speakTok;
  const parts = (String(text).replace(/\s+/g, ' ').trim().match(/[^.!?;:\n]+[.!?;:]?/g) || []).map(s => s.trim()).filter(Boolean); if (!parts.length) return false;
  const v = bestVoice(); let i = 0;
  const next = () => { if (my !== speakTok || i >= parts.length) { o.onEnd && o.onEnd(); return; } const u = new SpeechSynthesisUtterance(parts[i++]); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN'; u.rate = o.rate || .95; u.onend = next; u.onerror = () => { o.onEnd && o.onEnd(); }; if (i === 1) u.onstart = () => o.onStart && o.onStart(); synth.speak(u); };
  next(); return true;
}

/* ---------- answer box: type, or speak with the mic ---------- */
const SRc = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const hasVoice = !!SRc;
export function AnswerBox({ value, setValue, rows = 5, cta = 'Check answer', ph, onCheck, lang }) {
  const [on, setOn] = useState(false), [live, setLive] = useState('');
  const R = useRef({ rec: null, on: false, base: '', skip: 0, lastLen: 0, secs: 0, t0: 0, spoke: false, v: value }); R.current.v = value;
  const join = (a, b) => (a && b && !/\s$/.test(a) ? a + ' ' : a) + b;
  const stop = useCallback(() => { const r = R.current; if (r.on && r.t0) r.secs += (Date.now() - r.t0) / 1000; r.on = false; r.t0 = 0; if (r.rec) { try { r.rec.stop(); } catch (e) {} } setOn(false); }, []);
  useEffect(() => () => { const r = R.current; r.on = false; if (r.rec) { try { r.rec.abort(); } catch (e) {} } }, []);
  const start = () => {
    const r = R.current; r.base = String(r.v || '').trim(); r.skip = 0; r.lastLen = 0;
    if (!window.isSecureContext && location.protocol !== 'file:') { setLive('Voice needs a secure (https) page.'); return; }
    const rec = new SRc(); r.rec = rec; rec.lang = lang || 'en-IN'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = e => {
      const fin = []; let interim = ''; r.lastLen = e.results.length;
      for (let i = r.skip; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) fin.push(x[0].transcript); else interim += x[0].transcript; }
      setValue(join(r.base, C.mergeFinals(fin))); setLive(interim ? '… ' + C.collapseRuns(interim) : ''); r.spoke = true;
    };
    rec.onerror = e => { if (e.error === 'no-speech') { if (r.on) setLive('I did not hear anything. Speak when ready.'); } else if (e.error !== 'aborted') { r.on = false; setOn(false); setLive(e.error === 'not-allowed' ? 'The microphone is blocked. Allow it in the browser, or type your answer.' : 'Voice input stopped. You can type instead.'); } };
    rec.onend = () => { setValue(C.collapseRuns(R.current.v || '')); if (r.on) { r.base = String(R.current.v || '').trim(); r.skip = 0; setTimeout(() => { if (r.on) { try { rec.start(); } catch (e) {} } }, 250); } else { setLive(''); setOn(false); } };
    try { rec.start(); r.on = true; r.t0 = Date.now(); setOn(true); } catch (e) { toast('Could not start the microphone. Reload and try again.'); }
  };
  const words = C.words(value || '');
  return <div className="ans">
    <textarea rows={rows} placeholder={ph || 'Speak with the mic, or type your answer here...'} aria-label="Your answer" value={value} onChange={e => { setValue(e.target.value); R.current.base = e.target.value.trim(); R.current.skip = R.current.lastLen; }} />
    <div className="row ans-bar">{SRc && <button type="button" className={'btn mic' + (on ? ' rec' : '')} onClick={() => on ? stop() : start()}>{on ? '⏹ Stop' : '🎤 Speak'}</button>}
      <span className="live dim sm" aria-live="polite">{live}</span><span className="dim sm">{words} words</span>
      <button type="button" className="btn ghost sm" onClick={() => { setValue(''); R.current.base = ''; R.current.skip = R.current.lastLen; R.current.secs = 0; setLive(''); }}>Clear</button>
      <button type="button" className="btn primary" onClick={() => { stop(); const v = C.collapseRuns(value || ''); setValue(v); onCheck && onCheck(v.trim(), { secs: R.current.secs, spoke: R.current.spoke }); }}>{cta}</button></div>
    {SRc ? <p className="dim sm">Tip: speak in short sentences. Your words appear in the box and you can edit them before checking.</p> : <p className="dim sm">Voice input needs Chrome or Edge. You can type your answer instead.</p>}
  </div>;
}

/* ---------- coach card and result card ---------- */
export function Coach({ txt, secs }) {
  const c = C.coach(txt, secs); if (!c.words) return null;
  return <details className="coach" open><summary>🗣️ Speaking coach · {c.score}/100{c.wpm ? ' · ' + c.wpm + ' words/min' : ''}</summary>{c.tips.map((t, i) => <div className="step" key={i}>{t}</div>)}</details>;
}
export function Result({ g }) {
  const o = pct(g.overall);
  return <><div className="res row" style={{ gap: 18 }}><Ring v={g.overall} label="score" color={scoreColor(o)} /><div className="meters"><Meter t="Knowledge" v={g.know} /><Meter t="Confidence" v={g.conf} /><Meter t="Reasoning" v={g.reason} /><Meter t="Clarity" v={g.clar} /></div></div>
    <p className="fbtxt">{C.feedback(g)}</p>
    {g.hit.length > 0 && <><p className="dim sm">You covered</p><Chips a={g.hit} cls="g" /></>}
    {g.miss.length > 0 && <><p className="dim sm">Ideas to add</p><Chips a={g.miss} cls="r" /></>}</>;
}

/* ---------- one interview question: hints, rescue, voice or typed answer, score, model answer ---------- */
const nz = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function QA({ q, kind, timer, coach, autospeak, lead, ph, onGraded, avatar = true, rows }) {
  const act = useAct(), { S } = useS();
  const [txt, setTxt] = useState(''), [hints, setHints] = useState([]), [hn, setHn] = useState(0), [out, setOut] = useState([]), [res, setRes] = useState(null), [left, setLeft] = useState(timer || 0), [talk, setTalk] = useState(false);
  const rewarded = useRef(false), resc = useRef(''), graded = useRef(false), tm = useRef(null), chk = useRef(null), txtRef = useRef('');
  txtRef.current = txt;
  const voiceOn = S.vg !== false;
  const hear = t => { if (!canSpeak) { toast('Voice is not available in this browser. Read the question on the screen.'); return; } say(t, { onStart: () => setTalk(true), onEnd: () => setTalk(false) }); };
  useEffect(() => { if (autospeak && voiceOn && canSpeak) { const id = setTimeout(() => { if (!graded.current) hear((lead ? lead + ' ' : '') + q.q); }, 450); return () => { clearTimeout(id); stopSpeak(); }; } return () => stopSpeak(); /* eslint-disable-next-line */ }, []);
  const check = (text, meta) => {
    clearInterval(tm.current); graded.current = true;
    const hasPh = /\[[^\]]{2,}\]/.test(text), first = !rewarded.current, g = C.grade(String(text || '').replace(/\[[^\]]*\]/g, ' '), q.keys);
    const copied = !!resc.current && nz(text).includes(nz(resc.current).slice(0, 50)), eligible = first && g.words >= 8 && !hasPh && !copied; if (eligible) rewarded.current = true;
    const why = g.words > 0 && !eligible ? (copied ? 'This is the rescue text. Rewrite it in your own words with your own example to earn XP.' : hasPh ? 'Your answer still has [brackets]. Replace them with your real details, then check again. Template text earns no XP.' : g.words < 8 ? 'Write at least 8 words to earn XP.' : 'XP is given once for each question. You can keep practising as many times as you like.') : '';
    const extra = act((d, ev) => {
      const xkey = 'qa:' + (q.id || q.q), f = eligible ? xpTake(d, xkey) : 0;
      if (g.words > 0 && eligible) { d.dims.push({ k: g.know, c: g.conf, r: g.reason, l: g.clar, o: g.overall }); d.dims = d.dims.slice(-60); if (meta.spoke) d.spoken++; if (q.id) markSeen(d, q.id); mis(d, 'answer', f); gainXP(d, ev, 5, xkey, f); checkBadges(d, ev); }
      if (g.overall >= .75) { ev.push({ fx: 1 }); if (g.words > 0) ev.push({ buddy: 'great' }); } else if (g.words > 0 && g.overall < .3) ev.push({ buddy: 'tough' });
      return onGraded ? onGraded(g, text, { d, ev, xp: n => gainXP(d, ev, n, xkey, f) }) : null;
    });
    setRes({ g, txt: text, meta, why, extra });
  };
  chk.current = check;
  useEffect(() => { if (!timer) return; tm.current = setInterval(() => { setLeft(l => { if (l <= 1) { clearInterval(tm.current); if (!graded.current) setTimeout(() => chk.current(C.collapseRuns(txtRef.current).trim(), { secs: 0, spoke: false }), 0); return 0; } return l - 1; }); }, 1000); return () => clearInterval(tm.current); /* eslint-disable-next-line */ }, []);
  const hs = C.hints(q);
  const modelOpen = q.steps && q.steps.length ? <details open><summary>✅ Correct approach, step by step</summary><ol className="steps">{q.steps.map((s, i) => <li key={i}>{s}</li>)}</ol><p className="dim sm">Say it in your own words and give a real example from your work.</p></details> : q.m ? <details open><summary>✅ Model answer</summary><p style={{ whiteSpace: 'pre-line' }}>{q.m}</p></details> : null;
  const modelText = q.steps && q.steps.length ? q.steps.map((s, i) => 'Step ' + (i + 1) + '. ' + s).join(' ') : (q.m || '');
  return <div className="card qa">
    {kind && <span className="tag">{kind}</span>}
    {avatar && <div className="avrow"><div className={'avatar' + (talk ? ' talk' : '')} aria-hidden="true">🧑‍💼</div><div className="row"><button className="btn sm ghost" onClick={() => hear(q.q)}>🔊 Hear question</button><button className="btn sm ghost" onClick={() => { act(d => { d.vg = d.vg === false; }); if (voiceOn) { stopSpeak(); setTalk(false); } }}>{voiceOn ? '🔈 Voice on' : '🔇 Voice off'}</button></div></div>}
    <h3 className="qtext">{q.q}</h3>
    {timer ? <div className="tm">⏱ {left}s</div> : null}
    <div className="row" style={{ marginTop: 8 }}>
      <button className="btn ghost sm" onClick={() => { if (hn < hs.length) { setHints(h => [...h, hs[hn]]); setHn(hn + 1); } else toast('No more hints. Try "I don\'t know" for a safe answer.'); }}>💡 Hint</button>
      <button className="btn ghost sm" onClick={() => setOut(o => [...o, { k: 'idk' }])}>🆘 I don't know</button>
      <button className="btn ghost sm" onClick={() => setOut(o => [...o, { k: 'exp' }])}>🧩 Help me explain</button>
      <a className="btn ghost sm" href={'mailto:padimachiadmin@gmail.com?subject=' + encodeURIComponent('Wrong answer report') + '&body=' + encodeURIComponent('Question: ' + q.q + '\n\nWhat is wrong:\n')}>🚩 Report a wrong answer</a></div>
    <div className="helpout">{hints.map((h, i) => <div className="hint" key={'h' + i}><b>Hint {i + 1}:</b> {h}</div>)}
      {out.map((o, i) => o.k === 'idk' ? <div className="hint" key={i}><b>Interview rescue:</b> {C.rescue(q)}<div className="row" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => { resc.current = C.rescue(q); setTxt(resc.current); toast('Added. Edit it in your own words.'); }}>Use as my answer</button></div></div>
        : <div className="hint" key={i}><b>Structure your answer:</b>{C.explainTemplate(q).map((x, k) => <div key={k}>{x}</div>)}</div>)}</div>
    <div style={{ marginTop: 12 }}><AnswerBox value={txt} setValue={setTxt} ph={ph} rows={rows} lang={S.lang} onCheck={check} /></div>
    {res && <div className="result">
      {res.why && <p className="dim sm">{res.why}</p>}
      <Result g={res.g} />{modelOpen}
      {canSpeak && modelText && <div className="row" style={{ margin: '8px 0' }}><button className="btn sm ghost" onClick={() => hear(modelText)}>🔊 Read the correct answer</button></div>}
      {res.g.words > 0 && (res.meta.spoke || coach) && <Coach txt={String(res.txt || '').replace(/\[[^\]]*\]/g, ' ')} secs={res.meta.spoke ? res.meta.secs : 0} />}
      {res.extra}
    </div>}
  </div>;
}

/* ---------- multiple choice engine: score, lives, timer ---------- */
export function Mcq({ items, label = 'Question', lives: L0 = 0, time = 0, auto, onAnswer, onDone }) {
  const [i, setI] = useState(0), [score, setScore] = useState(0), [lives, setLives] = useState(L0), [left, setLeft] = useState(time), [pick, setPick] = useState(null), [done, setDone] = useState(false);
  const cb = useRef({}); cb.current = { onAnswer, onDone }; const st = useRef({ i: 0, score: 0, lives: L0, done: false }); st.current = { i, score, lives, done };
  const end = useCallback(() => { if (st.current.done) return; st.current.done = true; setDone(true); cb.current.onDone && cb.current.onDone({ score: st.current.score, total: items.length, answered: st.current.i, lives: st.current.lives }); }, [items.length]);
  useEffect(() => { if (!time) return; const id = setInterval(() => setLeft(l => { if (l <= 1) { clearInterval(id); setTimeout(end, 0); return 0; } return l - 1; }), 1000); return () => clearInterval(id); }, [time, end]);
  useEffect(() => { if ((i >= items.length || (L0 && lives <= 0)) && !done) end(); }, [i, lives, items.length, L0, done, end]);
  useEffect(() => { if (pick !== null && auto) { const id = setTimeout(() => { setPick(null); setI(x => x + 1); }, 1100); return () => clearTimeout(id); } }, [pick, auto]);
  if (done || i >= items.length || (L0 && lives <= 0)) return null;
  const it = items[i], answer = k => { if (pick !== null || st.current.done) return; setPick(k); const ok = k === it.a; if (ok) setScore(s => s + 1); else if (L0) setLives(l => l - 1); cb.current.onAnswer && cb.current.onAnswer(ok, it); };
  return <div className="card">
    <div className="mhead row" style={{ justifyContent: 'space-between' }}><span>{label} {i + 1}/{items.length}</span>{L0 ? <span>❤️ {lives}</span> : null}{time ? <span className="tm">⏱ {left}s</span> : null}<span>Score {score}</span></div>
    <div className="bar"><i style={{ width: Math.round(i / items.length * 100) + '%' }} /></div>
    <h3 className="qtext" style={{ marginTop: 14 }}>{it.q}</h3>{it.code && <pre>{it.code}</pre>}
    <div>{it.o.map((x, k) => <button key={k} className={'opt' + (pick !== null ? (k === it.a ? ' ok' : k === pick ? ' no' : '') : '')} disabled={pick !== null} onClick={() => answer(k)}><b>{'ABCD'[k] || k + 1}</b> <span>{x}</span></button>)}</div>
    {pick !== null && <><p className="fbtxt"><b>{pick === it.a ? 'Correct!' : 'Not quite.'}</b> {it.why || ''}</p>{!auto && <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => { setPick(null); setI(x => x + 1); }}>{i + 1 >= items.length ? 'Finish' : 'Next'}</button></div>}</>}
  </div>;
}
export function FinishCard({ title, score, total, xp, again, extra, back = '#/play' }) {
  const p = total ? score / total : 0; useEffect(() => { if (p >= .8) confetti(); /* eslint-disable-next-line */ }, []);
  return <div className="card center"><h2 style={{ marginTop: 0 }}>{title}</h2><div style={{ display: 'grid', placeItems: 'center' }}><Ring v={p} label="correct" color={p >= .7 ? 'var(--good)' : p >= .4 ? 'var(--warn)' : 'var(--bad)'} /></div><p className="bigp">{score} / {total}</p>{extra}<p className="dim">+{xp} XP</p><div className="row" style={{ justifyContent: 'center' }}>{again && <button className="btn primary" onClick={again}>Play again</button>}<a className="btn" href={back}>Back</a></div></div>;
}
export const Page = ({ children }) => { useTouch(); return children; };
