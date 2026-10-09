/* Career Lab UI kit: state, helpers, voice answer box, question cards, quiz engine. */
(function (root) {
'use strict';
const D = root.DATA, C = root.Core, A = root.Art;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'careerlab_v2', today = Math.floor(Date.now() / 864e5);
const def = () => ({ xp: 0, streak: 0, last: 0, track: '', acc: {}, seen: {}, dims: [], resume: '', jd: '', extra: [], removed: [], gaps: [], mock: 0, rapid: 0, incident: 0, badges: {}, lang: 'en-IN', theme: 'dark', solved: {}, puz: 0, claims: {}, spoken: 0, intro: {}, doneDays: {}, m: { day: 0, d: {} } });
const UI = { $, $$, esc, D, C, A, today, cleanups: [] };
UI.S = def();
try { const old = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('careerlab_v1') || '{}'); UI.S = Object.assign(def(), old); } catch (e) {}
const S = () => UI.S;
UI.save = () => { try { localStorage.setItem(KEY, JSON.stringify(UI.S)); } catch (e) {} };
UI.setState = o => { UI.S = Object.assign(def(), o); UI.save(); };
UI.reset = () => { UI.S = def(); UI.S.last = today; UI.S.streak = 1; UI.save(); };
if (S().last !== today) { S().streak = S().last === today - 1 ? S().streak + 1 : 1; S().last = today; UI.save(); }
document.documentElement.dataset.theme = S().theme;
UI.onLeave = f => UI.cleanups.push(f);
UI.runCleanups = () => { UI.cleanups.forEach(f => { try { f(); } catch (e) {} }); UI.cleanups = []; };
const pct = UI.pct = v => Math.round((v || 0) * 100), avg = UI.avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

/* ----- derived data ----- */
UI.tracks = () => D.TRACKS;
UI.trackOf = id => D.TRACKS.find(t => t.id === id);
UI.skillsFound = text => { const s = new Set(C.extractSkills(text || S().resume, D.SKILLS)); (S().extra || []).forEach(x => s.add(x)); (S().removed || []).forEach(x => s.delete(x)); return [...s]; };
UI.myTracks = () => { const r = C.detectTrack(S().resume, D.SKILLS).map(x => x.track); if (S().track && !r.includes(S().track)) r.unshift(S().track); return r.slice(0, 2); };
UI.topicsFor = tr => D.TOPICS.filter(t => !tr || t.track === tr);

/* ----- feedback ----- */
UI.toast = m => { const t = $('#toast'), d = document.createElement('div'); d.textContent = m; t.appendChild(d); setTimeout(() => d.remove(), 2700); };
UI.confetti = () => {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = $('#fx'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#5eead4', '#818cf8', '#f472b6', '#fbbf24', '#4ade80'];
  const P = Array.from({ length: 130 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: cols[Math.random() * 5 | 0], r: Math.random() * 6 }));
  let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 120) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height); })();
};
UI.BADGES = [
  { id: 'xp100', n: 'Getting started', ic: '🌱', t: () => S().xp >= 100 }, { id: 'xp500', n: 'On a roll', ic: '🔥', t: () => S().xp >= 500 }, { id: 'xp1500', n: 'Pro learner', ic: '🏆', t: () => S().xp >= 1500 },
  { id: 'str3', n: '3-day streak', ic: '📅', t: () => S().streak >= 3 }, { id: 'res', n: 'Resume ready', ic: '📄', t: () => !!S().resume }, { id: 'mock', n: 'First mock', ic: '🎤', t: () => S().mock > 0 },
  { id: 'proj', n: 'Project round', ic: '🛠️', t: () => Object.keys(S().claims).length > 0 }, { id: 'voice', n: 'Spoke 5 answers', ic: '🎙️', t: () => S().spoken >= 5 },
  { id: 'code', n: 'Code solver', ic: '💻', t: () => Object.keys(S().solved).some(k => !k.startsWith('draft_')) }, { id: 'rapid', n: 'Rapid fire 8+', ic: '⚡', t: () => S().rapid >= 8 }, { id: 'ready', n: 'Interview ready', ic: '⭐', t: () => S().mock >= 75 }
];
UI.checkBadges = () => UI.BADGES.forEach(b => { if (!S().badges[b.id] && b.t()) { S().badges[b.id] = 1; UI.toast(b.ic + ' Badge unlocked: ' + b.n); } });
UI.addXP = n => { n = Math.round(n); if (n <= 0) return; const before = Math.floor(S().xp / 100); S().xp += n; UI.toast('+' + n + ' XP'); if (Math.floor(S().xp / 100) > before) { UI.toast('Level up! You are level ' + (Math.floor(S().xp / 100) + 1)); UI.confetti(); } UI.checkBadges(); UI.save(); UI.top && UI.top(); };
UI.mis = (k, n = 1) => { if (S().m.day !== today) S().m = { day: today, d: {} }; S().m.d[k] = (S().m.d[k] || 0) + n; UI.save(); };
UI.record = (name, ok) => { const a = S().acc[name] || [0, 0]; S().acc[name] = [a[0] + (ok ? 1 : 0), a[1] + 1]; UI.save(); };
UI.acc = name => { const a = S().acc[name]; return a && a[1] ? a[0] / a[1] : undefined; };
UI.accMap = () => { const o = {}; Object.keys(S().acc).forEach(k => { o[k] = UI.acc(k); }); return o; };
UI.markSeen = id => { S().seen[id] = 1; };
UI.seenIds = () => Object.keys(S().seen);

/* ----- widgets ----- */
UI.ring = (v, label, color) => `<div class="ring" data-p="${pct(v)}" style="${color ? '--c:' + color : ''}"><div><b>${pct(v)}</b><small>${esc(label)}</small></div></div>`;
UI.animate = root_ => { requestAnimationFrame(() => requestAnimationFrame(() => { $$('.ring[data-p]', root_).forEach(r => r.style.setProperty('--p', r.dataset.p)); $$('.bar i[data-w]', root_).forEach(b => b.style.width = b.dataset.w + '%'); })); };
UI.meter = (t, v) => `<div class="meter"><span><b>${esc(t)}</b><b>${pct(v)}%</b></span><div class="bar"><i data-w="${pct(v)}" style="width:0"></i></div></div>`;
UI.chips = (a, cls) => a && a.length ? `<div class="chips">${a.map(x => `<span class="chip ${cls || ''}">${esc(x)}</span>`).join('')}</div>` : '';
UI.mount = (el, html) => { el.innerHTML = html; UI.animate(el); return el; };
UI.scoreColor = o => o >= 70 ? 'var(--good)' : o >= 45 ? 'var(--warn)' : 'var(--bad)';

/* ----- voice + typed answer box (fixed: rebuilds transcript, never appends duplicates) ----- */
const SR = root.SpeechRecognition || root.webkitSpeechRecognition;
UI.hasVoice = !!SR;
UI.answerBox = (host, o = {}) => {
  host.innerHTML = `<div class="ans"><textarea rows="${o.rows || 5}" placeholder="${esc(o.ph || 'Speak with the mic, or type your answer here...')}" aria-label="Your answer"></textarea>
  <div class="ans-bar">${SR ? '<button type="button" class="btn mic">🎤 Speak</button>' : ''}<span class="live" aria-live="polite"></span><span class="dim sm wc">0 words</span><button type="button" class="btn ghost sm clr">Clear</button><button type="button" class="btn primary chk">${esc(o.cta || 'Check answer')}</button></div>
  ${SR ? '<p class="dim sm vnote">Tip: speak in short sentences. Your words appear in the box and you can edit them before checking.</p>' : '<p class="dim sm">Voice input needs Chrome or Edge. You can type your answer instead.</p>'}</div>`;
  const ta = $('textarea', host), live = $('.live', host), mic = $('.mic', host);
  let rec = null, on = false, base = '', skip = 0, lastLen = 0, secs = 0, t0 = 0, spoke = false;
  const count = () => $('.wc', host).textContent = C.words(ta.value) + ' words';
  const ui = () => { if (mic) { mic.classList.toggle('rec', on); mic.innerHTML = on ? '⏹ Stop ' + A.wave() : '🎤 Speak'; } };
  const join = (a, b) => (a && b && !/\s$/.test(a) ? a + ' ' : a) + b;
  function start() {
    base = ta.value.trim(); skip = 0; lastLen = 0;
    rec = new SR(); rec.lang = S().lang; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = e => {
      const fin = [], parts = []; let interim = '';
      lastLen = e.results.length;
      for (let i = skip; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin.push(r[0].transcript); else interim += r[0].transcript; }
      ta.value = join(base, C.mergeFinals(fin)); // rebuilt every time from this session's results
      live.textContent = interim ? '… ' + C.collapseRuns(interim) : ''; spoke = true; count();
    };
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { UI.toast('Microphone permission was denied'); on = false; ui(); } else if (e.error === 'no-speech' && on) { live.textContent = 'I did not hear anything. Speak when ready.'; } };
    rec.onend = () => { ta.value = C.collapseRuns(ta.value); count(); if (on) { base = ta.value.trim(); skip = 0; setTimeout(() => { if (on) { try { rec.start(); } catch (e) {} } }, 250); } else { live.textContent = ''; ui(); } };
    try { rec.start(); on = true; t0 = Date.now(); ui(); } catch (e) { UI.toast('Could not start the microphone'); }
  }
  const stop = () => { if (on && t0) secs += (Date.now() - t0) / 1000; on = false; t0 = 0; if (rec) { try { rec.stop(); } catch (e) {} } ui(); };
  if (mic) mic.onclick = () => on ? stop() : start();
  ta.addEventListener('input', () => { base = ta.value.trim(); skip = lastLen; count(); });
  $('.clr', host).onclick = () => { ta.value = ''; base = ''; skip = lastLen; secs = 0; live.textContent = ''; count(); ta.focus(); };
  const check = () => { stop(); ta.value = C.collapseRuns(ta.value); count(); o.onCheck && o.onCheck(ta.value.trim(), { secs, spoke }); };
  $('.chk', host).onclick = check;
  UI.onLeave(stop);
  return { check, stop, get value() { return ta.value; }, set(v) { ta.value = v; base = v; count(); }, get secs() { return secs; } };
};

UI.resultHTML = g => {
  const o = pct(g.overall);
  return `<div class="res"><div class="ring" data-p="${o}" style="--c:${UI.scoreColor(o)}"><div><b>${o}</b><small>score</small></div></div>
  <div class="meters">${UI.meter('Knowledge', g.know)}${UI.meter('Confidence', g.conf)}${UI.meter('Reasoning', g.reason)}${UI.meter('Clarity', g.clar)}</div></div>
  <p class="fbtxt">${esc(C.feedback(g))}</p>${g.hit.length ? '<p class="dim sm">You covered</p>' + UI.chips(g.hit, 'g') : ''}${g.miss.length ? '<p class="dim sm">Ideas to add</p>' + UI.chips(g.miss, 'r') : ''}`;
};
UI.coachHTML = (txt, secs) => {
  const c = C.coach(txt, secs); if (!c.words) return '';
  return `<details class="coach" open><summary>🗣️ Speaking coach · ${c.score}/100${c.wpm ? ' · ' + c.wpm + ' words/min' : ''}</summary>${c.tips.map(t => `<div class="step">${esc(t)}</div>`).join('')}</details>`;
};

/* A question with hints, rescue, explain helper, voice/typed answer, scoring, correct answer, speaking coach */
UI.qaCard = (q, o = {}) => {
  const el = document.createElement('div'); el.className = 'card pop qa';
  el.innerHTML = `${o.kind ? `<span class="tag">${esc(o.kind)}</span>` : ''}<h3 class="qtext">${esc(q.q)}</h3>${o.timer ? '<div class="tm"></div>' : ''}
  <div class="row"><button class="btn ghost sm" data-h="hint">💡 Hint</button><button class="btn ghost sm" data-h="idk">🆘 I don't know</button><button class="btn ghost sm" data-h="exp">🧩 Help me explain</button></div><div class="helpout"></div><div class="abox" style="margin-top:12px"></div><div class="result"></div>`;
  let hn = 0, tm = null, graded = false; const out = $('.helpout', el), res = $('.result', el);
  const modelHTML = () => q.steps && q.steps.length ? `<details open><summary>✅ Correct approach, step by step</summary><ol class="steps">${q.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><p class="dim sm">Say it in your own words and give a real example from your work.</p></details>` : (q.m ? `<details open><summary>✅ Model answer</summary><p>${esc(q.m)}</p></details>` : '');
  const box = UI.answerBox($('.abox', el), { ph: o.ph, onCheck: (txt, meta) => {
    const g = C.grade(txt, q.keys); graded = true; clearInterval(tm);
    UI.mount(res, UI.resultHTML(g) + modelHTML() + (g.words > 0 && (meta.spoke || o.coach) ? UI.coachHTML(txt, meta.spoke ? meta.secs : 0) : '') + `<div class="row act"></div>`);
    if (g.words > 0) { const S_ = S(); S_.dims.push({ k: g.know, c: g.conf, r: g.reason, l: g.clar, o: g.overall }); S_.dims = S_.dims.slice(-60); if (meta.spoke) S_.spoken++; if (q.id) UI.markSeen(q.id); UI.save(); UI.mis('answer'); UI.checkBadges(); }
    if (g.overall >= .75) UI.confetti();
    o.onGraded && o.onGraded(g, txt, $('.act', res), box);
  } });
  $$('[data-h]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.h;
    if (k === 'hint') { const hs = C.hints(q); if (hn < hs.length) out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Hint ${hn + 1}:</b> ${esc(hs[hn++])}</div>`); else UI.toast('No more hints. Try "I don\'t know" for a safe answer.'); }
    if (k === 'idk') { out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Interview rescue:</b> ${esc(C.rescue(q))}<div class="row" style="margin-top:8px"><button class="btn sm use">Use as my answer</button></div></div>`); $('.use', out).onclick = () => { box.set(C.rescue(q)); UI.toast('Added. Edit it in your own words.'); }; }
    if (k === 'exp') out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Structure your answer:</b>${C.explainTemplate(q).map(x => `<div>${esc(x)}</div>`).join('')}</div>`);
  });
  if (o.timer) { let left = o.timer; const t = $('.tm', el); t.textContent = '⏱ ' + left + 's'; tm = setInterval(() => { left--; t.textContent = '⏱ ' + Math.max(0, left) + 's'; if (left <= 0) { clearInterval(tm); if (!graded) box.check(); } }, 1000); UI.onLeave(() => clearInterval(tm)); }
  return el;
};

/* generic multiple choice engine */
UI.mcq = (host, items, o = {}) => {
  let i = 0, score = 0, lives = o.lives || 0, left = o.time || 0, tm = null, done = false;
  const end = () => { if (done) return; done = true; clearInterval(tm); o.onDone && o.onDone({ score, total: items.length, answered: i, lives }); };
  if (o.time) { tm = setInterval(() => { left--; const t = $('.tm', host); if (t) t.textContent = '⏱ ' + Math.max(0, left) + 's'; if (left <= 0) end(); }, 1000); UI.onLeave(() => clearInterval(tm)); }
  function show() {
    if (done) return; if (i >= items.length || (o.lives && lives <= 0)) return end();
    const it = items[i];
    UI.mount(host, `<div class="card pop"><div class="mhead"><span>${esc(o.label || 'Question')} ${i + 1}/${items.length}</span>${o.lives ? `<span>❤️ ${lives}</span>` : ''}${o.time ? `<span class="tm">⏱ ${left}s</span>` : ''}<span>Score ${score}</span></div>
    <div class="bar"><i data-w="${Math.round(i / items.length * 100)}" style="width:0"></i></div><h3 class="qtext" style="margin-top:14px">${esc(it.q)}</h3>${it.code ? `<pre>${esc(it.code)}</pre>` : ''}
    <div class="opts">${it.o.map((x, k) => `<button class="opt" data-k="${k}"><b>${'ABCD'[k] || k + 1}</b><span>${esc(x)}</span></button>`).join('')}</div><div class="fbk"></div></div>`);
    $$('.opt', host).forEach(b => b.onclick = () => {
      if (done) return; const k = +b.dataset.k, ok = k === it.a; $$('.opt', host).forEach(x => x.disabled = true);
      b.classList.add(ok ? 'ok' : 'no'); $$('.opt', host)[it.a].classList.add('ok');
      if (ok) score++; else if (o.lives) lives--;
      o.onAnswer && o.onAnswer(ok, it);
      $('.fbk', host).innerHTML = `<p class="fbtxt"><b>${ok ? 'Correct!' : 'Not quite.'}</b> ${esc(it.why || '')}</p><div class="row" style="margin-top:10px"><button class="btn primary next">${i + 1 >= items.length ? 'Finish' : 'Next'}</button></div>`;
      const nx = () => { i++; show(); }; $('.next', host).onclick = nx; if (o.auto) setTimeout(() => { if (!done && items[i] === it) nx(); }, 1100);
    });
  }
  show();
};
UI.finishCard = (host, { title, score, total, xp, again, extra, back }) => {
  const p = total ? score / total : 0; if (p >= .8) UI.confetti();
  UI.mount(host, `<div class="card pop center"><h2 style="margin-top:0">${esc(title)}</h2>${UI.ring(p, 'correct', p >= .7 ? 'var(--good)' : p >= .4 ? 'var(--warn)' : 'var(--bad)')}<p class="big">${score} / ${total}</p>${extra || ''}<p class="dim">+${xp} XP</p><div class="row" style="justify-content:center">${again ? '<button class="btn primary again">Play again</button>' : ''}<a class="btn" href="${back || '#/practice'}">Back</a></div></div>`);
  if (again) $('.again', host).onclick = again;
};
root.UI = UI;
})(window);
