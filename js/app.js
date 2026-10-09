(function () {
'use strict';
const { SKILLS, TOPICS, INTERVIEW, SCENARIOS, ORDERS, MATCHES, BUGS, CODE, TIPS } = DATA, C = Core;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'careerlab_v1', today = Math.floor(Date.now() / 864e5);
const def = () => ({ xp: 0, streak: 0, last: 0, acc: {}, dims: [], resume: '', jd: '', gaps: [], mock: 0, rapid: 0, incident: 0, badges: {}, lang: 'en-IN', theme: 'dark', solved: {}, puz: 0, m: { day: 0, d: {} } });
let S = def();
try { S = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
if (S.last !== today) { S.streak = S.last === today - 1 ? S.streak + 1 : 1; S.last = today; save(); }
document.documentElement.dataset.theme = S.theme;
let cleanups = [];
const onLeave = f => cleanups.push(f);

/* ---------- small UI helpers ---------- */
function toast(m) { const t = $('#toast'), d = document.createElement('div'); d.textContent = m; t.appendChild(d); setTimeout(() => d.remove(), 2700); }
function confetti() {
  const c = $('#fx'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#5eead4', '#818cf8', '#f472b6', '#fbbf24', '#4ade80'];
  const P = Array.from({ length: 130 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: cols[Math.random() * 5 | 0], r: Math.random() * 6 }));
  let f = 0;
  (function loop() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); if (++f < 120) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height); })();
}
const BADGES = [
  { id: 'xp100', n: 'Getting started', ic: '🌱', t: () => S.xp >= 100 }, { id: 'xp500', n: 'On a roll', ic: '🔥', t: () => S.xp >= 500 }, { id: 'xp1500', n: 'Pro learner', ic: '🏆', t: () => S.xp >= 1500 },
  { id: 'str3', n: '3-day streak', ic: '📅', t: () => S.streak >= 3 }, { id: 'res', n: 'Resume ready', ic: '📄', t: () => !!S.resume }, { id: 'mock', n: 'First mock', ic: '🎤', t: () => S.mock > 0 },
  { id: 'code', n: 'Code solver', ic: '💻', t: () => Object.keys(S.solved).length > 0 }, { id: 'rapid', n: 'Rapid fire 8+', ic: '⚡', t: () => S.rapid >= 8 }, { id: 'ready', n: 'Interview ready', ic: '⭐', t: () => S.mock >= 75 }
];
function checkBadges() { BADGES.forEach(b => { if (!S.badges[b.id] && b.t()) { S.badges[b.id] = 1; toast(b.ic + ' Badge unlocked: ' + b.n); } }); }
function addXP(n) {
  n = Math.round(n); if (n <= 0) return; const before = Math.floor(S.xp / 100); S.xp += n;
  toast('+' + n + ' XP'); if (Math.floor(S.xp / 100) > before) { toast('Level up! You are level ' + (Math.floor(S.xp / 100) + 1)); confetti(); }
  checkBadges(); save(); top();
}
function mis(k, n = 1) { if (S.m.day !== today) S.m = { day: today, d: {} }; S.m.d[k] = (S.m.d[k] || 0) + n; save(); }
const record = (name, ok) => { const a = S.acc[name] || [0, 0]; S.acc[name] = [a[0] + (ok ? 1 : 0), a[1] + 1]; save(); };
const acc = name => { const a = S.acc[name]; return a && a[1] ? a[0] / a[1] : 0; };
const pct = v => Math.round(v * 100);
function ring(v, label, color) { return `<div class="ring" data-p="${pct(v)}" style="${color ? '--c:' + color : ''}"><div><b>${pct(v)}</b><small>${esc(label)}</small></div></div>`; }
function animateRings(root) { requestAnimationFrame(() => requestAnimationFrame(() => $$('.ring[data-p]', root).forEach(r => r.style.setProperty('--p', r.dataset.p)))); $$('.bar i[data-w]', root).forEach(b => requestAnimationFrame(() => b.style.width = b.dataset.w + '%')); }
const meter = (t, v) => `<div class="meter"><span><b>${esc(t)}</b><b>${pct(v)}%</b></span><div class="bar"><i data-w="${pct(v)}" style="width:0"></i></div></div>`;
const chips = (a, cls) => a.length ? `<div class="chips">${a.map(x => `<span class="chip ${cls}">${esc(x)}</span>`).join('')}</div>` : '';
const mount = (el, html) => { el.innerHTML = html; animateRings(el); return el; };

/* ---------- voice + typed answer box ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function answerBox(host, o = {}) {
  host.innerHTML = `<div class="ans"><textarea rows="${o.rows || 5}" placeholder="${esc(o.ph || 'Speak with the mic, or type your answer here...')}" aria-label="Your answer"></textarea>
  <div class="ans-bar">${SR ? '<button type="button" class="btn mic">🎤 Speak</button>' : ''}<span class="live"></span><span class="dim sm wc">0 words</span><button type="button" class="btn ghost sm clr">Clear</button><button type="button" class="btn primary chk">Check answer</button></div>
  ${SR ? '' : '<p class="dim sm">Voice input needs Chrome or Edge. You can type your answer instead.</p>'}</div>`;
  const ta = $('textarea', host), live = $('.live', host), mic = $('.mic', host);
  let rec = null, on = false;
  const count = () => $('.wc', host).textContent = C.words(ta.value) + ' words';
  const ui = () => { if (mic) { mic.classList.toggle('rec', on); mic.textContent = on ? '⏹ Stop' : '🎤 Speak'; } };
  function start() {
    rec = new SR(); rec.lang = S.lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + r[0].transcript.trim(); else interim += r[0].transcript; } live.textContent = interim; count(); };
    rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('Microphone permission was denied'); on = false; ui(); } };
    rec.onend = () => { if (on) { try { rec.start(); } catch (e) {} } else { live.textContent = ''; ui(); } };
    try { rec.start(); on = true; ui(); } catch (e) { toast('Could not start the microphone'); }
  }
  const stop = () => { on = false; if (rec) { try { rec.stop(); } catch (e) {} } ui(); };
  if (mic) mic.onclick = () => on ? stop() : start();
  ta.addEventListener('input', count);
  $('.clr', host).onclick = () => { ta.value = ''; live.textContent = ''; count(); ta.focus(); };
  const check = () => { stop(); o.onCheck && o.onCheck(ta.value.trim()); };
  $('.chk', host).onclick = check;
  onLeave(stop);
  return { check, stop, get value() { return ta.value; }, set(v) { ta.value = v; count(); } };
}

function resultHTML(g) {
  const o = pct(g.overall);
  return `<div class="res"><div class="ring" data-p="${o}" style="--c:${o >= 70 ? 'var(--good)' : o >= 45 ? 'var(--warn)' : 'var(--bad)'}"><div><b>${o}</b><small>score</small></div></div>
  <div class="meters">${meter('Knowledge', g.know)}${meter('Confidence', g.conf)}${meter('Reasoning', g.reason)}${meter('Clarity', g.clar)}</div></div>
  <p class="fbtxt">${esc(C.feedback(g))}</p>${g.hit.length ? '<p class="dim sm">You covered</p>' + chips(g.hit, 'g') : ''}${g.miss.length ? '<p class="dim sm">Ideas to add</p>' + chips(g.miss, 'r') : ''}`;
}

/* A question with hints, rescue, explain-helper, voice/typed answer, scoring */
function qaCard(q, o = {}) {
  const el = document.createElement('div'); el.className = 'card pop';
  el.innerHTML = `${o.kind ? `<span class="tag">${esc(o.kind)}</span>` : ''}<h3>${esc(q.q)}</h3>${o.timer ? '<div class="tm"></div>' : ''}
  <div class="row"><button class="btn ghost sm" data-h="hint">💡 Hint</button><button class="btn ghost sm" data-h="idk">🆘 I don't know</button><button class="btn ghost sm" data-h="exp">🧩 Help me explain</button></div><div class="helpout"></div><div class="abox" style="margin-top:12px"></div><div class="result"></div>`;
  let hn = 0, tm = null, graded = false; const out = $('.helpout', el), res = $('.result', el);
  const box = answerBox($('.abox', el), {
    ph: o.ph, onCheck: txt => {
      const g = C.grade(txt, q.keys); graded = true; clearInterval(tm);
      mount(res, resultHTML(g) + `${q.m ? `<details><summary>Model answer</summary><p>${esc(q.m)}</p></details>` : ''}<div class="row act"></div>`);
      if (g.words > 0) { S.dims.push({ k: g.know, c: g.conf, r: g.reason, l: g.clar, o: g.overall }); S.dims = S.dims.slice(-60); save(); mis('answer'); }
      if (g.overall >= .75) confetti();
      o.onGraded && o.onGraded(g, txt, $('.act', res), box);
    }
  });
  $$('[data-h]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.h;
    if (k === 'hint') { const hs = C.hints(q); if (hn < hs.length) { out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Hint ${hn + 1}:</b> ${esc(hs[hn++])}</div>`); } else toast('No more hints. Try "I don\'t know" for a safe answer.'); }
    if (k === 'idk') { out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Interview rescue:</b> ${esc(C.rescue(q))}<div class="row" style="margin-top:8px"><button class="btn sm use">Use as my answer</button></div></div>`); $('.use', out).onclick = () => { box.set(C.rescue(q)); toast('Added. Edit it in your own words.'); }; }
    if (k === 'exp') out.insertAdjacentHTML('beforeend', `<div class="hint"><b>Structure your answer:</b>${C.explainTemplate(q).map(x => `<div>${esc(x)}</div>`).join('')}</div>`);
  });
  if (o.timer) {
    let left = o.timer; const t = $('.tm', el); t.textContent = '⏱ ' + left + 's';
    tm = setInterval(() => { left--; t.textContent = '⏱ ' + Math.max(0, left) + 's'; if (left <= 0) { clearInterval(tm); if (!graded) box.check(); } }, 1000); onLeave(() => clearInterval(tm));
  }
  return el;
}

/* generic multiple choice engine: quiz, rapid fire, incident game, spot the bug */
function mcq(host, items, o = {}) {
  let i = 0, score = 0, lives = o.lives || 0, left = o.time || 0, tm = null, done = false;
  function end() { if (done) return; done = true; clearInterval(tm); o.onDone && o.onDone({ score, total: items.length, lives }); }
  if (o.time) { tm = setInterval(() => { left--; const t = $('.tm', host); if (t) t.textContent = '⏱ ' + Math.max(0, left) + 's'; if (left <= 0) end(); }, 1000); onLeave(() => clearInterval(tm)); }
  function show() {
    if (done) return; if (i >= items.length || (o.lives && lives <= 0)) return end();
    const it = items[i];
    mount(host, `<div class="card pop"><div class="mhead"><span>${esc(o.label || 'Question')} ${i + 1}/${items.length}</span>${o.lives ? `<span>❤️ ${lives}</span>` : ''}${o.time ? `<span class="tm">⏱ ${left}s</span>` : ''}<span>Score ${score}</span></div>
    <div class="bar"><i data-w="${Math.round(i / items.length * 100)}" style="width:0"></i></div><h3 style="margin-top:14px">${esc(it.q)}</h3>${it.code ? `<pre>${esc(it.code)}</pre>` : ''}
    <div class="opts">${it.o.map((x, k) => `<button class="opt" data-k="${k}">${esc(x)}</button>`).join('')}</div><div class="fbk"></div></div>`);
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
}
function finishCard(host, { title, score, total, xp, again, extra }) {
  const p = total ? score / total : 0; if (p >= .8) confetti();
  mount(host, `<div class="card pop center"><h2 style="margin-top:0">${esc(title)}</h2>${ring(p, 'correct', p >= .7 ? 'var(--good)' : p >= .4 ? 'var(--warn)' : 'var(--bad)')}<p class="big">${score} / ${total}</p>${extra || ''}<p class="dim">+${xp} XP</p><div class="row" style="justify-content:center">${again ? '<button class="btn primary again">Play again</button>' : ''}<a class="btn" href="#/practice">Practice hub</a></div></div>`);
  if (again) $('.again', host).onclick = again;
}

/* ---------- navigation ---------- */
const NAV = [['home', 'Home', '🏠'], ['learn', 'Learn', '📚'], ['practice', 'Practice', '🎮'], ['interview', 'Interview', '🎤'], ['career', 'Career', '📄'], ['progress', 'Me', '📊']];
function top() {
  const chip = `<span class="pill">🔥 ${S.streak}</span><span class="pill">⭐ ${S.xp} XP</span><span class="pill">Lv ${Math.floor(S.xp / 100) + 1}</span>`;
  const nav = NAV.map(n => `<a class="nav" data-r="${n[0]}" href="#/${n[0]}"><span class="ic">${n[2]}</span><span>${n[1]}</span></a>`).join('');
  $('#side').innerHTML = `<div class="brand"><span class="logo">CL</span>Career Lab</div>${nav}<div class="chip-xp">${chip}</div>`;
  $('#top').innerHTML = `<div class="brand"><span class="logo">CL</span>Career Lab</div><span class="sp"></span>${chip}`;
  $('#tabs').innerHTML = nav; mark();
}
function mark() { const r = location.hash.replace(/^#\/?/, '').split('/')[0] || 'home'; const b = { topic: 'learn', play: 'practice', code: 'practice', mock: 'interview' }[r] || r; $$('.nav').forEach(a => a.classList.toggle('on', a.dataset.r === b)); }
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const VIEWS = {};

/* ---------- home ---------- */
VIEWS.home = () => {
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const learn = avg(TOPICS.map(t => acc(t.name))), iv = S.dims.length ? avg(S.dims.slice(-10).map(d => d.o)) : 0, rs = S.resume ? C.analyzeResume(S.resume, SKILLS).score / 100 : 0;
  const d = S.m.day === today ? S.m.d : {}, M = [['quiz', 'Finish a topic quiz', 1], ['answer', 'Answer 3 questions by voice or typing', 3], ['game', 'Play one practice game', 1], ['code', 'Pass a coding challenge', 1]];
  const next = !S.resume ? ['Add your resume', '#/career/resume'] : S.xp < 50 ? ['Start your first topic', '#/learn'] : ['Take a mock interview', '#/mock'];
  mount(app, `<div class="card hero"><div class="sp"><span class="tag">Learn. Practice. Prepare. Perform.</span><h1>${greet}!</h1><p class="dim">Level ${Math.floor(S.xp / 100) + 1} · ${S.xp % 100}/100 XP to the next level</p><div class="bar"><i data-w="${S.xp % 100}" style="width:0"></i></div><div class="row" style="margin-top:16px"><a class="btn primary" href="${next[1]}">${next[0]} →</a><a class="btn" href="#/practice">Play a game</a></div></div>
  <div class="rings">${ring(learn, 'learning')}${ring(iv, 'interview', 'var(--acc2)')}${ring(rs, 'resume', 'var(--pink)')}</div></div>
  <div class="grid"><div class="card"><h3>Today's missions</h3>${M.map(m => { const n = d[m[0]] || 0, ok = n >= m[2]; return `<div class="mis ${ok ? 'done' : ''}"><div class="ck">${ok ? '✓' : ''}</div><span>${m[1]}${m[2] > 1 ? ` (${Math.min(n, m[2])}/${m[2]})` : ''}</span></div>`; }).join('')}</div>
  <div class="card"><h3>Your career journey</h3>${['Upload your resume', 'Add the job description', 'See your skill gaps', 'Learn and practice the gaps', 'Take a mock interview', 'Review feedback and repeat'].map((s, i) => `<div class="step"><b>${i + 1}.</b> ${s}</div>`).join('')}</div>
  <div class="card"><h3>Daily tip</h3><p class="big" style="font-size:1.15rem">${esc(TIPS[today % TIPS.length])}</p><p class="dim sm">Tip: answer out loud with the mic. Speaking is the best interview practice.</p></div></div>`);
};

/* ---------- learn ---------- */
VIEWS.learn = () => mount(app, `<h1>Learn</h1><p class="dim">Each topic: a story, the idea, a quiz, then explain it in your own words.</p><div class="grid">${TOPICS.map((t, i) => `<a class="card hover tcard" href="#/topic/${t.id}" style="animation-delay:${i * 40}ms"><div class="ic">${t.ic}</div><h3>${esc(t.name)}</h3><div class="bar"><i data-w="${pct(acc(t.name))}" style="width:0"></i></div><p class="dim sm">${S.acc[t.name] ? pct(acc(t.name)) + '% quiz accuracy' : 'Not started'}</p></a>`).join('')}</div>`);

VIEWS.topic = (id) => {
  const t = TOPICS.find(x => x.id === id); if (!t) return VIEWS.learn();
  const skill = SKILLS.find(s => s.n === t.skill), tabs = [['learn', 'Learn'], ['quiz', 'Quiz'], ['explain', 'Explain it']];
  mount(app, `<a class="dim" href="#/learn">← All topics</a><h1>${t.ic} ${esc(t.name)}</h1><div class="tabs">${tabs.map((x, i) => `<button data-t="${x[0]}" class="${i ? '' : 'on'}">${x[1]}</button>`).join('')}</div><div id="pane"></div>`);
  const pane = $('#pane');
  function show(k) {
    $$('.tabs button', app).forEach(b => b.classList.toggle('on', b.dataset.t === k)); pane.innerHTML = ''; cleanups.forEach(f => f()); cleanups = [];
    if (k === 'learn') mount(pane, `<div class="card pop"><span class="tag">Think of it like this</span><p>${esc(t.story)}</p></div><div class="card pop"><span class="tag">The idea</span><p>${esc(t.lesson)}</p>${/\n|var /.test(t.ex) ? `<pre>${esc(t.ex)}</pre>` : `<p class="dim">${esc(t.ex)}</p>`}</div><div class="card pop"><span class="tag">Remember</span><p class="big" style="font-size:1.2rem">${esc(t.tip)}</p></div><div class="row"><button class="btn primary" data-go="quiz">Take the quiz →</button></div>`), $('[data-go]', pane).onclick = () => show('quiz');
    if (k === 'quiz') mcq(pane, t.qs, { label: 'Question', onAnswer: (ok) => record(t.name, ok), onDone: r => { const xp = r.score * 10 + (r.score === r.total ? 20 : 0); addXP(xp); mis('quiz'); finishCard(pane, { title: t.name + ' quiz', score: r.score, total: r.total, xp, again: () => show('quiz') }); } });
    if (k === 'explain') pane.appendChild(qaCard({ q: t.explainQ || 'Explain ' + t.name + ' in your own words, as you would in an interview.', keys: t.explainKeys || skill.keys, m: skill.m, topic: t.name }, { kind: 'Explain it', onGraded: (g, txt, act) => { addXP(g.overall * 25); act.innerHTML = '<a class="btn" href="#/interview">More interview questions →</a>'; } }));
  }
  $$('.tabs button', app).forEach(b => b.onclick = () => show(b.dataset.t)); show('learn');
};

/* ---------- practice ---------- */
VIEWS.practice = () => {
  const G = [['rapid', '⚡', 'Rapid fire', '60 seconds. How many can you get right?'], ['incident', '🚨', 'Fix the incident', 'Real scenarios. Three lives.'], ['bug', '🐞', 'Spot the bug', 'Find what is wrong in the script.'], ['order', '🔢', 'Order it', 'Put the steps in the right order.'], ['match', '🧩', 'Match it', 'Match each term to its meaning.'], ['code', '💻', 'Code lab', 'Write JavaScript and run tests.']];
  mount(app, `<h1>Practice</h1><p class="dim">Short games that make the ideas stick.</p><div class="grid">${G.map(g => `<a class="card hover tcard" href="#/${g[0] === 'code' ? 'code' : 'play/' + g[0]}"><div class="ic">${g[1]}</div><h3>${g[2]}</h3><p class="dim sm">${g[3]}</p></a>`).join('')}</div>`);
};
VIEWS.play = (kind) => {
  mount(app, `<a class="dim" href="#/practice">← Practice</a><div id="g"></div>`); const host = $('#g');
  if (kind === 'rapid') {
    const all = []; TOPICS.forEach(t => t.qs.forEach(q => all.push(Object.assign({ topic: t.name }, q))));
    mcq(host, C.shuffle(all).slice(0, 20), { label: 'Rapid', time: 60, auto: true, onAnswer: (ok, it) => record(it.topic, ok), onDone: r => { const xp = r.score * 4; S.rapid = Math.max(S.rapid, r.score); addXP(xp); mis('game'); finishCard(host, { title: 'Time is up!', score: r.score, total: r.total, xp, again: () => VIEWS.play('rapid') }); } });
  } else if (kind === 'incident') {
    mcq(host, SCENARIOS.map(s => ({ q: s.d, o: s.o, a: s.a, why: s.why })), { label: 'Scenario', lives: 3, onDone: r => { const xp = r.score * 15; S.incident = Math.max(S.incident, r.score); addXP(xp); mis('game'); finishCard(host, { title: r.lives > 0 ? 'All incidents handled!' : 'Out of lives', score: r.score, total: r.total, xp, again: () => VIEWS.play('incident') }); } });
  } else if (kind === 'bug') {
    mcq(host, BUGS.map(b => ({ q: 'What is wrong with this script?', code: b.code, o: b.o, a: b.a, why: b.why })), { label: 'Bug', onDone: r => { const xp = r.score * 10; addXP(xp); mis('game'); finishCard(host, { title: 'Bug hunt complete', score: r.score, total: r.total, xp, again: () => VIEWS.play('bug') }); } });
  } else if (kind === 'order') playOrder(host); else if (kind === 'match') playMatch(host); else VIEWS.practice();
};
function playOrder(host) {
  const P = ORDERS[Math.random() * ORDERS.length | 0]; let pick = [];
  mount(host, `<div class="card pop"><span class="tag">Order it</span><h3>${esc(P.t)}</h3><p class="dim">Tap the steps in the correct order.</p><div class="opts">${C.shuffle(P.steps).map(s => `<button class="opt" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="step dim" id="mine">Your order will appear here</div><div class="row"><button class="btn ghost" id="rs">Reset</button><button class="btn primary" id="ck">Check</button></div><div id="out"></div></div>`);
  $$('.opt', host).forEach(b => b.onclick = () => { pick.push(b.dataset.s); b.disabled = true; $('#mine').innerHTML = pick.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>'); });
  $('#rs').onclick = () => playOrder(host);
  $('#ck').onclick = () => { let ok = 0; P.steps.forEach((s, i) => { if (pick[i] === s) ok++; }); const p = ok / P.steps.length, xp = Math.round(p * 20); S.puz++; addXP(xp); mis('game'); mount($('#out'), `<div class="center">${ring(p, 'correct', p >= .8 ? 'var(--good)' : 'var(--warn)')}<p class="big">${ok} of ${P.steps.length} in the right place</p><div class="step"><b>Correct order</b><br>${P.steps.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>')}</div><div class="row" style="justify-content:center"><button class="btn primary" id="nx">Next puzzle</button></div></div>`); $('#nx').onclick = () => playOrder(host); if (p >= .8) confetti(); };
}
function playMatch(host) {
  const M = MATCHES[Math.random() * MATCHES.length | 0], defs = C.shuffle(M.map(p => p[1]));
  mount(host, `<div class="card pop"><span class="tag">Match it</span><h3>Match each term to its meaning</h3>${M.map((p, i) => `<div class="step"><b>${esc(p[0])}</b><select data-i="${i}"><option value="">Choose...</option>${defs.map(d => `<option>${esc(d)}</option>`).join('')}</select></div>`).join('')}<div class="row"><button class="btn primary" id="ck">Check</button></div><div id="out"></div></div>`);
  $('#ck').onclick = () => { let ok = 0; const wrong = []; $$('select', host).forEach(s => { const i = +s.dataset.i; if (s.value === M[i][1]) ok++; else wrong.push(M[i]); }); const p = ok / M.length; S.puz++; addXP(p * 20); mis('game'); mount($('#out'), `<div class="center">${ring(p, 'correct', p >= .75 ? 'var(--good)' : 'var(--warn)')}<p class="big">${ok} of ${M.length} matched</p>${wrong.length ? `<div class="step"><b>Correct answers for the ones you missed</b>${wrong.map(w => `<br>${esc(w[0])}: ${esc(w[1])}`).join('')}</div>` : ''}<div class="row" style="justify-content:center"><button class="btn primary" id="nx">Next puzzle</button></div></div>`); $('#nx').onclick = () => playMatch(host); if (p >= .75) confetti(); };
}

/* ---------- code lab ---------- */
function runTests(code, ch) {
  return new Promise(res => {
    const src = `self.onmessage=e=>{const {code,fn,tests}=e.data;try{const f=new Function(code+'\\n;return typeof '+fn+'==="function"?'+fn+':null')();if(!f){postMessage({err:'Function '+fn+' was not found'});return}const out=[];for(const [args,exp] of tests){let got,ok=false,err=null;try{got=f(...JSON.parse(JSON.stringify(args)));ok=JSON.stringify(got)===JSON.stringify(exp)}catch(x){err=String(x)}out.push({args,exp,got,ok,err})}postMessage({out})}catch(x){postMessage({err:String(x)})}}`;
    let w; try { w = new Worker(URL.createObjectURL(new Blob([src]))); } catch (e) { return res({ err: 'Your browser blocked the code sandbox. Try Chrome or Edge.' }); }
    const t = setTimeout(() => { w.terminate(); res({ err: 'Timed out. Is there an infinite loop?' }); }, 2000);
    w.onmessage = e => { clearTimeout(t); w.terminate(); res(e.data); }; w.onerror = e => { clearTimeout(t); w.terminate(); res({ err: e.message || 'Error in your code' }); };
    w.postMessage({ code, fn: ch.fn, tests: ch.tests });
  });
}
VIEWS.code = (id) => {
  const ch = CODE.find(c => c.id === id) || CODE[0];
  mount(app, `<a class="dim" href="#/practice">← Practice</a><h1>💻 Code lab</h1><div class="tabs">${CODE.map(c => `<button data-id="${c.id}" class="${c.id === ch.id ? 'on' : ''}">${S.solved[c.id] ? '✓ ' : ''}${esc(c.title)}</button>`).join('')}</div>
  <div class="card"><p>${esc(ch.prompt)}</p><textarea class="code" id="ed" rows="10" spellcheck="false" aria-label="Code editor">${esc(S.solved['draft_' + ch.id] || ch.starter)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="run">▶ Run tests</button><button class="btn ghost" id="rst">Reset code</button></div><div id="out"></div></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => location.hash = '#/code/' + b.dataset.id);
  const ed = $('#ed'); ed.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText('  ', s, ed.selectionEnd, 'end'); } });
  $('#rst').onclick = () => { ed.value = ch.starter; };
  $('#run').onclick = async () => {
    const out = $('#out'); out.innerHTML = '<p class="dim">Running...</p>'; S.solved['draft_' + ch.id] = ed.value; save();
    const r = await runTests(ed.value, ch); if (r.err) { out.innerHTML = `<p class="fbtxt" style="color:var(--bad)">${esc(r.err)}</p>`; return; }
    const ok = r.out.filter(x => x.ok).length, all = ok === r.out.length;
    out.innerHTML = r.out.map((x, i) => `<div class="step">${x.ok ? '✅' : '❌'} Test ${i + 1}: <code>${esc(ch.fn + '(' + x.args.map(a => JSON.stringify(a)).join(', ') + ')')}</code>${x.ok ? '' : `<br><span class="dim sm">expected ${esc(JSON.stringify(x.exp))}, got ${esc(x.err || JSON.stringify(x.got))}</span>`}</div>`).join('') + `<p class="big">${ok} / ${r.out.length} passed</p>`;
    if (all && !S.solved[ch.id]) { S.solved[ch.id] = 1; addXP(40); mis('code'); confetti(); } else if (all) toast('Already solved. Nice!'); save();
  };
};

/* ---------- interview ---------- */
VIEWS.interview = (mode, idx) => {
  if (mode === 'q') {
    const q = INTERVIEW[+idx]; if (!q) return VIEWS.interview();
    mount(app, `<a class="dim" href="#/interview">← All questions</a><div id="qa"></div>`);
    $('#qa').appendChild(qaCard({ q: q.q, keys: q.keys, m: q.m, topic: q.topic }, { kind: q.lv + ' · ' + q.topic, onGraded: (g, t, act) => { addXP(g.overall * 20); act.innerHTML = `<a class="btn primary" href="#/interview/q/${(+idx + 1) % INTERVIEW.length}">Next question →</a>`; } }));
    return;
  }
  const lv = ['All', 'Fresher', '2-4 years', '4-7 years'], cur = lv.includes(mode) ? mode : 'All';
  mount(app, `<h1>Interview</h1><div class="grid"><div class="card hover"><span class="tag">Real interview</span><h3>Mock interview from your resume</h3><p class="dim">Self-introduction, resume questions, job-description gaps, a project, a scenario and follow-ups that adapt to your answers.</p><a class="btn primary" href="#/mock">Start mock interview</a></div>
  <div class="card"><span class="tag">How scoring works</span><p class="dim">Each answer is checked for knowledge (key ideas), confidence (direct wording), reasoning (because, first, then) and clarity (length and structure). Even a wrong answer earns credit for how boldly and clearly you explain it.</p></div></div>
  <h2>Practice questions</h2><div class="tabs">${lv.map(l => `<button data-l="${l}" class="${l === cur ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="grid">${INTERVIEW.map((q, i) => ({ q, i })).filter(x => cur === 'All' || x.q.lv === cur).map(x => `<a class="card hover tcard" href="#/interview/q/${x.i}"><span class="tag">${esc(x.q.lv)}</span><h3 style="font-size:1rem;margin-top:8px">${esc(x.q.q)}</h3></a>`).join('')}</div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => location.hash = '#/interview/' + b.dataset.l);
};

VIEWS.mock = () => {
  const found = C.extractSkills(S.resume, SKILLS), jdS = S.jd ? C.extractSkills(S.jd, SKILLS) : [], gaps = jdS.filter(s => !found.includes(s));
  mount(app, `<h1>Mock interview</h1><div class="card"><h3>Your plan</h3><p class="dim">${S.resume ? 'Questions are built from your resume' : 'No resume saved, so you will get a general interview'}${S.jd ? ' and your job description' : ''}. About 7 questions, 2 minutes each. Answer by voice or typing.</p>${found.length ? '<p class="dim sm">Skills found on your resume</p>' + chips(found.slice(0, 10), 'g') : ''}${gaps.length ? '<p class="dim sm">Gaps from the job description</p>' + chips(gaps, 'r') : ''}<div class="row"><button class="btn primary" id="go">Start interview</button><a class="btn" href="#/career/resume">${S.resume ? 'Update resume' : 'Add resume'}</a></div><p class="dim sm">Scores are an automatic estimate from your answer text, not a psychological test.</p></div>`);
  $('#go').onclick = () => runMock(found, gaps);
};
function runMock(found, gaps) {
  const qs = C.buildMock({ resume: S.resume, found, gaps, skills: SKILLS, scenarios: SCENARIOS, scenarioKeys: SCENARIOS.map(s => s.k) }), res = [], used = []; let i = 0, follows = 0;
  function next() {
    if (i >= qs.length) return report(); const q = qs[i];
    app.innerHTML = `<div><h1>Question ${i + 1} of ${qs.length}</h1><div class="bar" style="margin-bottom:16px"><i data-w="${Math.round(i / qs.length * 100)}" style="width:0"></i></div></div>`; animateRings(app);
    app.appendChild(qaCard(q, { kind: q.kind, timer: 120, onGraded: (g, txt, act) => {
      res.push(g); let f = null; if (follows < 2) f = C.followUp(txt, g, used); if (f) { qs.splice(i + 1, 0, f); used.push(f.topic); follows++; }
      act.innerHTML = `<button class="btn primary nx">${f ? 'Next: follow-up question' : i + 1 >= qs.length ? 'See my report' : 'Next question'}</button>`; $('.nx', act).onclick = () => { i++; next(); };
    } }));
    scrollTo({ top: 0 });
  }
  function report() {
    cleanups.forEach(f => f()); cleanups = [];
    const k = avg(res.map(g => g.know)), c = avg(res.map(g => g.conf)), r = avg(res.map(g => g.reason)), l = avg(res.map(g => g.clar)), o = k * .4 + r * .2 + c * .2 + l * .2;
    const dims = { Knowledge: k, Confidence: c, Reasoning: r, Clarity: l }, keys = Object.keys(dims).sort((a, b) => dims[b] - dims[a]);
    const tips = { Knowledge: 'Revise the Learn topics for the skills on your resume, then retry.', Confidence: "Use direct statements like 'I built...'. A confident answer with a gap can be corrected; a vague one cannot.", Reasoning: 'Explain why. Use because, first, then and for example.', Clarity: 'Aim for 4 to 6 sentences: context, what you did, and the result.' };
    S.mock = Math.max(S.mock, pct(o)); addXP(o * 80); mis('answer', 0);
    mount(app, `<h1>Interview report</h1><div class="card hero"><div class="sp"><span class="tag">${o >= .75 ? 'Interview ready' : o >= .5 ? 'Getting there' : 'Keep practising'}</span><p class="big">${pct(o)}% overall</p><p class="dim">${res.length} answers scored. Strongest: <b>${keys[0]}</b>. Work on: <b>${keys[3]}</b>.</p></div>${ring(o, 'overall', o >= .7 ? 'var(--good)' : o >= .45 ? 'var(--warn)' : 'var(--bad)')}</div>
    <div class="grid"><div class="card"><h3>Breakdown</h3>${Object.keys(dims).map(n => meter(n, dims[n])).join('')}</div><div class="card"><h3>What to do next</h3><p>${esc(tips[keys[3]])}</p><p class="dim sm">Keep practising the topics with the lowest quiz accuracy, then retake the interview.</p><div class="row"><a class="btn primary" href="#/learn">Open Learn</a><a class="btn" href="#/mock">Try again</a></div></div></div>`);
    if (o >= .75) confetti();
  }
  next();
}

/* ---------- career studio: resume, job description, match ---------- */
async function docxText(file) {
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer); let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw new Error('bad zip');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true), name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl));
    if (name === 'word/document.xml') {
      const s = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = buf.subarray(s, s + cs); let xml;
      if (method === 0) xml = new TextDecoder().decode(data); else xml = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      return xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }
    p += 46 + nl + xl + cl;
  }
  throw new Error('document.xml not found');
}
function pickText(cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.txt,.md,.docx';
  i.onchange = async () => { const f = i.files[0]; if (!f) return; try { const t = /\.docx$/i.test(f.name) ? await docxText(f) : await f.text(); if (t.trim().length < 40) throw 0; cb(t); } catch (e) { toast('Could not read that file. Use .txt or .docx, or paste the text.'); } };
  i.click();
}
function uploader(pane, kind, title, hint) {
  mount(pane, `<div class="card pop"><h3>${title}</h3><p class="dim">${hint} Your text stays in this browser and is never uploaded.</p><div class="row"><button class="btn primary" id="up">📁 Choose file (.docx, .txt)</button></div><p class="dim sm">or paste the text</p><textarea id="pt" rows="8" placeholder="Paste here..."></textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="sv">Analyze</button></div></div>`);
  const set = t => { S[kind] = t; checkBadges(); save(); route(); };
  $('#up').onclick = () => pickText(set); $('#sv').onclick = () => { const t = $('#pt').value.trim(); t.length < 40 ? toast('Please add more text') : set(t); };
}
VIEWS.career = (tab) => {
  tab = ['resume', 'jd', 'match'].includes(tab) ? tab : 'resume';
  mount(app, `<h1>Career studio</h1><div class="tabs">${[['resume', 'Resume'], ['jd', 'Job description'], ['match', 'Resume vs JD']].map(t => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${t[1]}</button>`).join('')}</div><div id="pane"></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => location.hash = '#/career/' + b.dataset.t);
  const pane = $('#pane');
  if (tab === 'resume') careerResume(pane); else if (tab === 'jd') careerJD(pane); else careerMatch(pane);
};
function careerResume(pane) {
  if (!S.resume) return uploader(pane, 'resume', 'Upload your resume', 'Get a score, fixes and a better version, then practise questions from it.');
  const a = C.analyzeResume(S.resume, SKILLS);
  mount(pane, `<div class="card hero pop"><div class="sp"><span class="tag">${a.score >= 75 ? 'Strong' : a.score >= 50 ? 'Good, can improve' : 'Needs work'}</span><p class="big">Resume score ${a.score}/100</p><p class="dim">${a.words} words · ${a.found.length} skills found</p><div class="row"><button class="btn primary" id="imp">✨ Make my resume better</button><a class="btn" href="#/mock">Interview from my resume</a><button class="btn ghost" id="rep">Use another</button></div></div>${ring(a.score / 100, 'score', a.score >= 70 ? 'var(--good)' : 'var(--warn)')}</div>
  <div class="grid"><div class="card"><h3>Breakdown</h3>${a.items.map(it => meter(it.n + ' (' + it.pts + '/' + it.max + ')', it.pts / it.max)).join('')}</div><div class="card"><h3>Skills found</h3>${chips(a.found, 'g') || '<p class="dim">None yet</p>'}<h3 style="margin-top:16px">How to improve</h3>${a.tips.length ? a.tips.map(t => `<div class="step">${esc(t)}</div>`).join('') : '<p class="dim">Nothing major. Nice resume!</p>'}</div></div><div id="better"></div>`);
  $('#rep').onclick = () => { S.resume = ''; save(); route(); };
  $('#imp').onclick = () => {
    const better = C.improveResume(S.resume, a.found), after = C.analyzeResume(better, SKILLS);
    mount($('#better'), `<div class="card pop"><h3>Better version: estimated ${a.score} → ${after.score}</h3><p class="dim sm">Weak phrases replaced, summary and skills added where missing. Edit the [brackets] and add real numbers before sending.</p><textarea id="bt" rows="14">${esc(better)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="cp">Copy</button><button class="btn" id="dl">Download .txt</button></div></div>`);
    $('#cp').onclick = () => { navigator.clipboard.writeText($('#bt').value).then(() => toast('Copied'), () => toast('Select the text and copy it')); };
    $('#dl').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([$('#bt').value], { type: 'text/plain' })); l.download = 'improved-resume.txt'; l.click(); };
    $('#better').scrollIntoView({ behavior: 'smooth' });
  };
}
function careerJD(pane) {
  if (!S.jd) return uploader(pane, 'jd', 'Add the job description', 'Paste or upload the JD for your interview. You can skip this and still practise.');
  const jd = C.extractSkills(S.jd, SKILLS), mine = C.extractSkills(S.resume, SKILLS);
  mount(pane, `<div class="card pop"><h3>Skills the job asks for</h3>${jd.length ? chips(jd.map(s => s), 'y') : '<p class="dim">No known skills detected. Try pasting more of the description.</p>'}<div class="row"><a class="btn primary" href="#/career/match">See resume vs JD →</a><button class="btn ghost" id="rep">Use another JD</button></div></div>${!S.resume ? '<div class="card"><p class="dim">Add your resume too, to see your gaps.</p><a class="btn" href="#/career/resume">Add resume</a></div>' : ''}`);
  $('#rep').onclick = () => { S.jd = ''; save(); route(); };
}
function careerMatch(pane) {
  if (!S.resume || !S.jd) return mount(pane, `<div class="card"><p>Add both your resume and a job description to see how you match.</p><div class="row"><a class="btn" href="#/career/resume">Resume</a><a class="btn" href="#/career/jd">Job description</a></div></div>`);
  const mine = C.extractSkills(S.resume, SKILLS), jd = C.extractSkills(S.jd, SKILLS), am = {};
  jd.forEach(s => { const t = TOPICS.find(x => x.skill === s); if (t && S.acc[t.name]) am[s] = acc(t.name); });
  const m = C.jdMatch(mine, jd, am), link = s => { const t = TOPICS.find(x => x.skill === s); return t ? `<a class="chip" href="#/topic/${t.id}">${esc(s)} →</a>` : `<span class="chip">${esc(s)}</span>`; };
  S.gaps = m.priority; save();
  mount(pane, `<div class="card hero pop"><div class="sp"><span class="tag">Resume vs job description</span><p class="big">${m.pct}% match</p><p class="dim">${jd.length} skills asked for · ${m.strong.length + m.practice.length} on your resume</p><div class="row"><a class="btn primary" href="#/mock">Start personalised preparation →</a></div></div>${ring(m.pct / 100, 'match', m.pct >= 70 ? 'var(--good)' : 'var(--warn)')}</div>
  <div class="grid"><div class="card"><h3>🟢 Strong</h3>${chips(m.strong, 'g') || '<p class="dim">None yet</p>'}</div><div class="card"><h3>🟡 Practice</h3>${m.practice.length ? `<div class="chips">${m.practice.map(link).join('')}</div>` : '<p class="dim">None</p>'}</div><div class="card"><h3>🔴 Priority</h3>${m.priority.length ? `<div class="chips">${m.priority.map(link).join('')}</div>` : '<p class="dim">No gaps. Great!</p>'}</div></div>`);
}

/* ---------- progress and settings ---------- */
VIEWS.progress = () => {
  const learn = avg(TOPICS.map(t => acc(t.name))), last = S.dims.slice(-10), D = k => avg(last.map(d => d[k])), rs = S.resume ? C.analyzeResume(S.resume, SKILLS).score / 100 : 0;
  mount(app, `<h1>My progress</h1><div class="card hero"><div class="sp"><p class="big">Level ${Math.floor(S.xp / 100) + 1}</p><p class="dim">${S.xp} XP · 🔥 ${S.streak}-day streak</p><div class="bar"><i data-w="${S.xp % 100}" style="width:0"></i></div></div><div class="rings">${ring(learn, 'learning')}${ring(avg(last.map(d => d.o)), 'interview', 'var(--acc2)')}${ring(rs, 'resume', 'var(--pink)')}</div></div>
  <div class="grid"><div class="card"><h3>Interview skills (last answers)</h3>${last.length ? meter('Knowledge', D('k')) + meter('Confidence', D('c')) + meter('Reasoning', D('r')) + meter('Clarity', D('l')) : '<p class="dim">Answer a few questions to see this.</p>'}</div>
  <div class="card"><h3>Topic accuracy</h3>${TOPICS.map(t => meter(t.name, acc(t.name))).join('')}</div></div>
  <h2>Badges</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'on' : ''}"><b>${b.ic}</b><span class="sm">${b.n}</span></div>`).join('')}</div>
  <h2>Settings</h2><div class="card"><div class="grid"><label>Theme<select id="th"><option value="dark">Dark</option><option value="light">Light</option></select></label><label>Voice language<select id="lg"><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ta-IN">Tamil</option><option value="hi-IN">Hindi</option></select></label></div><p class="dim sm">Answer scoring looks for English keywords, so speak English for the most accurate score.</p>
  <div class="row"><button class="btn" id="ex">Export progress</button><button class="btn" id="im">Import progress</button><button class="btn ghost" id="rs">Reset everything</button></div></div>`);
  $('#th').value = S.theme; $('#lg').value = S.lang;
  $('#th').onchange = e => { S.theme = e.target.value; document.documentElement.dataset.theme = S.theme; save(); };
  $('#lg').onchange = e => { S.lang = e.target.value; save(); };
  $('#ex').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); l.download = 'career-lab-progress.json'; l.click(); };
  $('#im').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { S = Object.assign(def(), JSON.parse(await i.files[0].text())); save(); toast('Progress imported'); route(); top(); } catch (e) { toast('That file is not valid'); } }; i.click(); };
  $('#rs').onclick = () => { if (confirm('Delete all progress, your resume and job description from this browser?')) { S = def(); S.last = today; S.streak = 1; save(); route(); top(); } };
};

/* ---------- router ---------- */
const app = $('#app');
function route() {
  cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = [];
  const parts = location.hash.replace(/^#\/?/, '').split('/'), view = VIEWS[parts[0] || 'home'] || VIEWS.home; mark();
  app.classList.remove('in'); void app.offsetWidth;
  try { view(parts[1], parts[2]); } catch (e) { console.error(e); app.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="dim">${esc(e.message)}</p><a class="btn" href="#/home">Go home</a></div>`; }
  app.classList.add('in'); window.scrollTo({ top: 0 });
}
addEventListener('hashchange', route);
top(); checkBadges(); route();
window.__CL = { S: () => S, route };
})();
