/* Views part 1: navigation, home, start, learn, topic, resume path, practice games */
(function (root) {
'use strict';
const UI = root.UI, { $, $$, esc, D, C, A, mount, pct, avg, ring, meter, chips, today } = UI; const S = () => UI.S, app = $('#app');
const V = UI.VIEWS = {};
const NAV = [['home', 'Home', '🏠'], ['learn', 'Learn', '📚'], ['practice', 'Practice', '🎮'], ['interview', 'Interview', '🎤'], ['career', 'Career', '📄'], ['progress', 'Me', '📊']];
UI.top = () => {
  const chip = `<span class="pill">🔥 ${S().streak}</span><span class="pill">⭐ ${S().xp} XP</span><span class="pill">Lv ${Math.floor(S().xp / 100) + 1}</span>`;
  const nav = NAV.map(n => `<a class="nav" data-r="${n[0]}" href="#/${n[0]}"><span class="ic">${n[2]}</span><span>${n[1]}</span></a>`).join('');
  $('#side').innerHTML = `<a class="brand" href="#/home"><span class="logo">CL</span>Career Lab</a>${nav}<a class="nav" data-r="speak" href="#/speak"><span class="ic">🗣️</span><span>Speaking lab</span></a><div class="chip-xp">${chip}</div>`;
  $('#top').innerHTML = `<a class="brand" href="#/home"><span class="logo">CL</span>Career Lab</a><span class="sp"></span>${chip}`;
  $('#tabs').innerHTML = nav; UI.mark();
};
UI.mark = () => { const r = location.hash.replace(/^#\/?/, '').split('/')[0] || 'home'; const b = { topic: 'learn', path: 'learn', play: 'practice', code: 'practice', mock: 'interview', project: 'interview', start: 'home' }[r] || r; $$('.nav').forEach(a => a.classList.toggle('on', a.dataset.r === b)); };
const tname = id => (UI.trackOf(id) || { name: 'All fields' }).name;
const topicById = id => D.TOPICS.find(t => t.id === id);
const topicAcc = t => UI.acc(t.name);
const learnedAvg = () => { const v = D.TOPICS.map(topicAcc).filter(x => x !== undefined); return v.length ? avg(v) : 0; };
UI.skillEditor = (host, after) => {
  const found = UI.skillsFound(), all = D.SKILLS.map(s => s.n).filter(n => !found.includes(n)).sort();
  host.innerHTML = `<div class="chips">${found.map(s => `<span class="chip g">${esc(s)} <button class="x" data-rm="${esc(s)}" aria-label="Remove ${esc(s)}">×</button></span>`).join('') || '<span class="dim">No skills detected yet.</span>'}</div>
  <div class="row" style="margin-top:8px"><select class="addsel" aria-label="Add a skill"><option value="">+ Add a skill I have...</option>${all.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>`;
  $$('[data-rm]', host).forEach(b => b.onclick = () => { const n = b.dataset.rm; S().extra = (S().extra || []).filter(x => x !== n); if (!S().removed.includes(n)) S().removed.push(n); UI.save(); after(); });
  $('.addsel', host).onchange = e => { const n = e.target.value; if (!n) return; S().removed = (S().removed || []).filter(x => x !== n); if (!S().extra.includes(n)) S().extra.push(n); UI.save(); after(); };
};

/* ---------- start: choose a field ---------- */
V.start = () => {
  const groups = ['IT', 'Non-IT', 'Everyone'], intro = { IT: 'Technical roles', 'Non-IT': 'Business, people, operations and engineering roles', Everyone: 'Useful for every career' };
  mount(app, `<div class="center"><span class="tag">Step 1</span><h1>What field are you preparing for?</h1><p class="dim">Pick one. You can change it any time. Your resume will add more topics automatically.</p></div>${groups.map(g => `<h2>${g === 'IT' ? '💻 IT' : g === 'Non-IT' ? '🏢 Non-IT' : '🌟 Everyone'}<small class="dim"> ${intro[g]}</small></h2><div class="grid">${D.TRACKS.filter(t => t.group === g).map(t => `<button class="card hover tcard pick ${S().track === t.id ? 'sel' : ''}" data-t="${t.id}">${A.cover(t.id, t.ic)}<h3>${esc(t.name)}</h3><p class="dim sm">${esc(t.desc)}</p></button>`).join('')}</div>`).join('')}`);
  $$('.pick', app).forEach(b => b.onclick = () => { S().track = b.dataset.t; UI.save(); UI.toast('Field set: ' + tname(S().track)); location.hash = '#/home'; });
};

/* ---------- home ---------- */
V.home = () => {
  if (!S().track && !S().resume && !S().seenStart) { S().seenStart = 1; UI.save(); return V.start(); }
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening', tr = S().track || UI.myTracks()[0] || 'all';
  const iv = S().dims.length ? avg(S().dims.slice(-10).map(d => d.o)) : 0, rs = S().resume ? C.analyzeResume(S().resume, D.SKILLS).score / 100 : 0;
  const found = UI.skillsFound(), path = S().resume ? C.skillLearnPath(found, D.TOPICS, UI.accMap(), UI.myTracks()[0]) : UI.topicsFor(S().track).slice(0, 4).map(t => ({ topic: t, why: 'Start here' }));
  const nextT = (path.find(p => UI.acc(p.topic.name) === undefined || UI.acc(p.topic.name) < .7) || path[0] || {}).topic;
  const d = S().m.day === today ? S().m.d : {}, M = [['quiz', 'Finish a topic quiz', 1], ['answer', 'Answer 3 questions by voice or typing', 3], ['game', 'Play one practice game', 1], ['scen', 'Solve one real-time scenario', 1]];
  const primary = !S().track && !S().resume ? ['Choose your field', '#/start'] : !S().resume ? ['Add your resume for a personal plan', '#/career/resume'] : ['Open my learning path', '#/path'];
  const fact = D.FACTS.filter(f => !S().track || f.track === S().track || f.track === 'soft'); const wf = fact[today % fact.length];
  mount(app, `<div class="card hero"><div class="sp"><span class="tag">Learn · Practice · Prepare · Perform</span><h1>${greet}!</h1><p class="dim">${S().track ? esc(tname(S().track)) + ' · ' : ''}Level ${Math.floor(S().xp / 100) + 1} · ${S().xp % 100}/100 XP to the next level</p><div class="bar"><i data-w="${S().xp % 100}" style="width:0"></i></div>
  <div class="row" style="margin-top:16px"><a class="btn primary" href="${primary[1]}">${primary[0]} →</a>${S().resume ? '<a class="btn" href="#/project">Project interview</a>' : '<a class="btn" href="#/learn">Start learning</a>'}</div></div><div class="heroart">${A.hero(tr, (UI.trackOf(tr) || {}).ic)}</div></div>
  <div class="grid"><div class="card"><h3>📍 Next for you</h3>${nextT ? `<a class="next-t" href="#/topic/${nextT.id}">${A.cover(nextT.track, nextT.ic)}<div><b>${esc(nextT.name)}</b><p class="dim sm">${esc(nextT.tip)}</p></div></a><div class="row"><a class="btn primary sm" href="#/topic/${nextT.id}">Learn</a><a class="btn sm" href="#/topic/${nextT.id}/scenario">Scenario</a></div>` : '<p class="dim">Choose a field to begin.</p>'}</div>
  <div class="card"><h3>Your readiness</h3><div class="rings">${ring(learnedAvg(), 'learning')}${ring(iv, 'interview', 'var(--acc2)')}${ring(rs, 'resume', 'var(--pink)')}</div></div>
  <div class="card"><h3>Today's missions</h3>${M.map(m => { const n = d[m[0]] || 0, ok = n >= m[2]; return `<div class="mis ${ok ? 'done' : ''}"><div class="ck">${ok ? '✓' : ''}</div><span>${m[1]}${m[2] > 1 ? ` (${Math.min(n, m[2])}/${m[2]})` : ''}</span></div>`; }).join('')}</div></div>
  <h2>Everything in one place</h2><div class="grid feat">${[['#/path', '🧭', 'Resume learning path', 'Topics chosen from your own resume'], ['#/project', '🛠️', 'Project interview', 'Questions from your projects with correct answers'], ['#/speak', '🗣️', 'Speaking lab', 'Fix fillers, grammar and pace'], ['#/interview/scenarios', '🧩', 'Real-time scenarios', 'Situations with step-by-step solutions'], ['#/play/flash', '🃏', 'Flashcards', 'Learn key terms fast'], ['#/mock', '🎤', 'Mock interview', 'Adaptive follow-up questions']].map(f => `<a class="card hover tcard" href="${f[0]}"><div class="ic">${f[1]}</div><h3>${f[2]}</h3><p class="dim sm">${f[3]}</p></a>`).join('')}</div>
  <div class="grid" style="margin-top:16px"><div class="card"><span class="tag">Word of the day</span><h3>${esc(wf.t)}</h3><p>${esc(wf.d)}.</p><a class="dim sm" href="#/topic/${wf.topic}">Learn more →</a></div><div class="card"><h3>Daily tip</h3><p class="big" style="font-size:1.15rem">${esc(D.TIPS[today % D.TIPS.length])}</p><p class="dim sm">Answer out loud with the mic: speaking is the best interview practice.</p></div></div>`);
};

/* ---------- learn ---------- */
V.learn = (trk) => {
  const sel = trk && trk !== 'all' ? trk : (trk === 'all' ? '' : '');
  const q = (V.learn.q || '').toLowerCase(), cur = trk ? (trk === 'all' ? '' : trk) : (S().track || '');
  const list = D.TOPICS.filter(t => (!cur || t.track === cur || (cur !== 'soft' && t.track === 'soft' && false)) && (!q || t.name.toLowerCase().includes(q) || t.facts.some(f => f.t.toLowerCase().includes(q))));
  const rec = S().resume ? C.skillLearnPath(UI.skillsFound(), D.TOPICS, UI.accMap(), UI.myTracks()[0]).filter(p => p.kind === 'resume').slice(0, 4) : [];
  mount(app, `<h1>Learn</h1><p class="dim">${D.TOPICS.length} topics · ${D.FACTS.length} key terms · real-time scenarios in every topic.</p>
  <div class="tabs"><button data-tr="all" class="${!cur ? 'on' : ''}">All</button>${D.TRACKS.map(t => `<button data-tr="${t.id}" class="${cur === t.id ? 'on' : ''}">${t.ic} ${esc(t.name)}</button>`).join('')}</div>
  <input type="text" id="sq" placeholder="Search topics or terms (for example: SLA, balance sheet, STAR)" value="${esc(V.learn.q || '')}" aria-label="Search">
  ${rec.length && !q && !cur ? `<h2>🧭 Picked from your resume</h2><div class="grid">${rec.map(p => tcard(p.topic, p.why)).join('')}</div>` : ''}
  <h2>${cur ? esc(tname(cur)) : 'All topics'} <small class="dim">(${list.length})</small></h2><div class="grid">${list.map(t => tcard(t)).join('') || '<p class="dim">No topic matches. Try another word.</p>'}</div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => { location.hash = '#/learn/' + b.dataset.tr; });
  const sq = $('#sq'); sq.oninput = () => { V.learn.q = sq.value; const pos = sq.selectionStart; V.learn(trk); const n = $('#sq'); n.focus(); n.setSelectionRange(pos, pos); };
};
const tcard = (t, why) => { const a = topicAcc(t); return `<a class="card hover tcard topic" href="#/topic/${t.id}">${A.cover(t.track, t.ic)}<div class="tb"><h3>${esc(t.name)}</h3><p class="dim sm">${esc(why || tname(t.track))} · ${t.facts.length} terms</p><div class="bar"><i data-w="${pct(a)}" style="width:0"></i></div><p class="dim sm">${a === undefined ? 'Not started' : pct(a) + '% quiz accuracy'}</p></div></a>`; };

V.topic = (id, tab) => {
  const t = topicById(id); if (!t) return V.learn();
  const tabs = [['learn', 'Learn'], ['terms', 'Key terms'], ['quiz', 'Quiz'], ['scenario', 'Scenario'], ['explain', 'Explain it']]; tab = tabs.some(x => x[0] === tab) ? tab : 'learn';
  const idx = D.TOPICS.indexOf(t), nextT = D.TOPICS.filter(x => x.track === t.track)[(D.TOPICS.filter(x => x.track === t.track).indexOf(t) + 1) % D.TOPICS.filter(x => x.track === t.track).length];
  mount(app, `<a class="dim" href="#/learn/${t.track}">← ${esc(tname(t.track))}</a><div class="thead">${A.cover(t.track, t.ic)}<div><h1 style="margin:0">${esc(t.name)}</h1><p class="dim">${t.facts.length} key terms · quiz · real-time scenario</p></div></div>
  <div class="tabs">${tabs.map(x => `<button data-t="${x[0]}" class="${x[0] === tab ? 'on' : ''}">${x[1]}</button>`).join('')}</div><div id="pane"></div>`);
  const pane = $('#pane');
  $$('.tabs button', app).forEach(b => b.onclick = () => { history.replaceState(null, '', '#/topic/' + id + '/' + b.dataset.t); UI.runCleanups(); $$('.tabs button', app).forEach(x => x.classList.toggle('on', x === b)); show(b.dataset.t); });
  function show(k) {
    pane.innerHTML = '';
    if (k === 'learn') { mount(pane, `<div class="card pop callout"><span class="tag">Think of it like this</span><p>${esc(t.story)}</p></div><div class="card pop"><span class="tag">The idea</span><p>${esc(t.lesson)}</p>${/\n|var /.test(t.ex) ? `<pre>${esc(t.ex)}</pre>` : `<div class="example"><b>Example</b><p>${esc(t.ex)}</p></div>`}</div>
      <div class="card pop"><span class="tag">Key terms preview</span><div class="chips">${t.facts.map(f => `<span class="chip">${esc(f.t)}</span>`).join('')}</div></div><div class="card pop"><span class="tag">Remember</span><p class="big" style="font-size:1.2rem">${esc(t.tip)}</p></div>
      <div class="row"><button class="btn primary" data-go="terms">Study key terms →</button><button class="btn" data-go="quiz">Take the quiz</button><button class="btn" data-go="scenario">Real-time scenario</button></div>`);
      $$('[data-go]', pane).forEach(b => b.onclick = () => $(`.tabs [data-t="${b.dataset.go}"]`).click()); }
    if (k === 'terms') { mount(pane, `<div class="card"><p class="dim">Say each definition out loud in your own words. That is how it sticks.</p></div><div class="grid terms">${t.facts.map(f => `<div class="card term"><h3>${esc(f.t)}</h3><p>${esc(f.d)}.</p></div>`).join('')}</div><div class="row" style="margin-top:14px"><a class="btn primary" href="#/play/flash/${t.id}">🃏 Flashcards for this topic</a></div>`); }
    if (k === 'quiz') runTopicQuiz(pane, t, () => show('quiz'));
    if (k === 'scenario') { const sq = C.scenQ(t); mount(pane, `<div class="card callout"><span class="tag">Real-time scenario</span><p class="big" style="font-size:1.15rem">${esc(t.scen[0])}</p><p class="dim sm">Answer as you would at work: what do you do first, then next? The correct approach is shown after you answer.</p></div><div id="qa"></div><div class="row" style="margin-top:12px"><a class="btn" href="#/topic/${nextT.id}/scenario">Next: ${esc(nextT.name)} →</a></div>`); $('#qa').appendChild(UI.qaCard(sq, { kind: 'Scenario', coach: true, onGraded: (g, txt, act) => { UI.addXP(g.overall * 30); UI.mis('scen'); UI.record(t.name, g.overall >= .5); act.innerHTML = `<a class="btn primary" href="#/topic/${t.id}/quiz">Take the quiz</a>`; } })); }
    if (k === 'explain') pane.appendChild(UI.qaCard({ id: 'ex:' + t.id, q: 'Explain ' + t.name + ' in your own words, as you would in an interview. Include one example.', keys: t.facts.map(f => f.t.toLowerCase()).slice(0, 8), m: t.lesson + ' ' + t.ex, topic: t.name }, { kind: 'Explain it', coach: true, onGraded: (g, txt, act) => { UI.addXP(g.overall * 25); act.innerHTML = '<a class="btn" href="#/interview">More interview questions →</a>'; } }));
  }
  show(tab);
};
function topicQuestions(t, n) {
  const legacy = (t.qs || []).map((x, i) => ({ id: 'q:' + t.id + i, q: x.q, o: x.o, a: x.a, why: x.why, topic: t.id })), seen = new Set(UI.seenIds());
  const gen = C.genQuestions(D.FACTS, { count: n, topic: t.id, seen: [...seen] });
  const all = C.shuffle(legacy.filter(q => !seen.has(q.id)).slice(0, 3).concat(gen)); const uniq = [], ids = new Set();
  all.forEach(q => { if (!ids.has(q.id)) { ids.add(q.id); uniq.push(q); } });
  return uniq.slice(0, n);
}
function runTopicQuiz(pane, t, again) {
  const items = topicQuestions(t, 8), fresh = items.filter(q => !S().seen[q.id]).length;
  UI.mcq(pane, items, { label: t.name, onAnswer: (ok, it) => { UI.record(t.name, ok); UI.markSeen(it.id); UI.save(); }, onDone: r => { const xp = r.score * 10 + (r.score === r.total ? 20 : 0); UI.addXP(xp); UI.mis('quiz'); UI.finishCard(pane, { title: t.name + ' quiz', score: r.score, total: r.total, xp, again, back: '#/topic/' + t.id, extra: `<p class="dim sm">${fresh} of ${items.length} questions were new to you. A new set is made each time.</p>` }); } });
}

/* ---------- resume-based learning path ---------- */
V.path = () => {
  if (!S().resume) { return mount(app, `<h1>🧭 Resume learning path</h1><div class="card hero pop"><div class="sp"><h2 style="margin-top:0">Your resume decides what you learn</h2><p class="dim">Add your resume and Career Lab picks the topics you claim, finds the ones you should know next, and builds a 7-day plan. Your text stays in this browser.</p><div class="row"><a class="btn primary" href="#/career/resume">Add my resume</a><a class="btn" href="#/start">Choose a field instead</a></div></div><div class="heroart">${A.hero(S().track || 'all', '🧭')}</div></div>`); }
  const found = UI.skillsFound(), trks = UI.myTracks(), path = C.skillLearnPath(found, D.TOPICS, UI.accMap(), trks[0]), plan = C.studyPlan(path.map(p => p.topic), 7);
  mount(app, `<h1>🧭 Your learning path</h1><div class="card"><h3>Skills found on your resume</h3><p class="dim sm">Check this list. Remove anything you do not really know, and add what is missing. Interviewers ask about everything on a resume.</p><div id="skl"></div><p class="dim sm" style="margin-top:8px">Field detected: ${trks.map(x => '<b>' + esc(tname(x)) + '</b>').join(', ') || 'none yet'}</p></div>
  <h2>Topics for you</h2><div class="grid">${path.map(p => `<div class="card"><span class="tag ${p.kind === 'next' ? 'alt' : ''}">${p.kind === 'next' ? 'Level up' : 'From your resume'}</span><h3>${p.topic.ic} ${esc(p.topic.name)}</h3><p class="dim sm">${esc(p.why)}</p><div class="row"><a class="btn sm primary" href="#/topic/${p.topic.id}">Learn</a><a class="btn sm" href="#/topic/${p.topic.id}/quiz">Quiz</a><a class="btn sm" href="#/topic/${p.topic.id}/scenario">Scenario</a></div></div>`).join('') || '<p class="dim">No matching topics yet. Add skills above.</p>'}</div>
  <h2>7-day plan</h2><div class="plan">${plan.map(d => `<div class="card day"><h3>Day ${d.day}</h3>${d.items.map((it, i) => { const key = d.day + '-' + i, on = S().doneDays[key]; const href = it.topic ? '#/topic/' + it.topic + '/' + ({ learn: 'learn', quiz: 'quiz', scen: 'scenario' }[it.k]) : it.k === 'intro' ? '#/speak/intro' : it.k === 'mock' ? '#/mock' : '#/speak'; return `<label class="chk ${on ? 'on' : ''}"><input type="checkbox" data-k="${key}" ${on ? 'checked' : ''}><a href="${href}">${esc(it.t)}</a></label>`; }).join('')}</div>`).join('')}</div>`);
  const draw = () => UI.skillEditor($('#skl'), () => V.path()); draw();
  $$('.plan input', app).forEach(c => c.onchange = () => { S().doneDays[c.dataset.k] = c.checked ? 1 : 0; UI.save(); c.parentElement.classList.toggle('on', c.checked); if (c.checked) UI.addXP(5); });
};

/* ---------- practice hub ---------- */
V.practice = () => {
  const G = [['quick', '🎯', 'Quick quiz', '10 fresh questions, never repeated until you have seen them all'], ['rapid', '⚡', 'Rapid fire', '60 seconds. How many can you get right?'], ['flash', '🃏', 'Flashcards', 'Flip, say it out loud, mark what you know'], ['order', '🔢', 'Order the steps', 'Put a real-time scenario in the right order'], ['match', '🧩', 'Match it', 'Match terms to meanings'], ['incident', '🚨', 'Fix the incident', 'IT service scenarios. Three lives'], ['bug', '🐞', 'Spot the bug', 'Find what is wrong in the script'], ['code', '💻', 'Code lab', 'Write JavaScript and run tests']];
  mount(app, `<h1>Practice</h1><div class="row"><label class="dim">Practising: <select id="trk" style="width:auto;display:inline-block">${'<option value="">All fields</option>' + D.TRACKS.map(t => `<option value="${t.id}">${t.ic} ${esc(t.name)}</option>`).join('')}</select></label></div>
  <div class="grid" style="margin-top:14px">${G.map(g => `<a class="card hover tcard" href="#/${g[0] === 'code' ? 'code' : 'play/' + g[0]}"><div class="ic">${g[1]}</div><h3>${g[2]}</h3><p class="dim sm">${g[3]}</p></a>`).join('')}<a class="card hover tcard" href="#/speak"><div class="ic">🗣️</div><h3>Speaking lab</h3><p class="dim sm">Read aloud, self-introduction, free answers with coaching</p></a></div>`);
  $('#trk').value = S().track || ''; $('#trk').onchange = e => { S().track = e.target.value; UI.save(); };
};
const poolFacts = () => D.FACTS.filter(f => !S().track || f.track === S().track);
V.play = (kind, arg) => {
  mount(app, `<a class="dim" href="#/practice">← Practice</a><div id="g"></div>`); const host = $('#g'), restart = () => V.play(kind, arg);
  if (kind === 'quick') {
    const qs = C.genQuestions(D.FACTS, { count: 10, track: S().track || undefined, seen: UI.seenIds() }), fresh = qs.filter(q => !S().seen[q.id]).length;
    UI.mcq(host, qs, { label: 'Quiz', onAnswer: (ok, it) => { UI.markSeen(it.id); const tp = topicById(it.topic); if (tp) UI.record(tp.name, ok); UI.save(); }, onDone: r => { const xp = r.score * 6; UI.addXP(xp); UI.mis('game'); UI.mis('quiz'); UI.finishCard(host, { title: 'Quiz complete', score: r.score, total: r.total, xp, again: restart, extra: `<p class="dim sm">${fresh} new questions this round.</p>` }); } });
  } else if (kind === 'rapid') {
    const qs = C.genQuestions(D.FACTS, { count: 30, track: S().track || undefined, seen: UI.seenIds() });
    UI.mcq(host, qs, { label: 'Rapid', time: 60, auto: true, onAnswer: (ok, it) => { UI.markSeen(it.id); const tp = topicById(it.topic); if (tp) UI.record(tp.name, ok); }, onDone: r => { const xp = r.score * 4; S().rapid = Math.max(S().rapid, r.score); UI.addXP(xp); UI.mis('game'); UI.finishCard(host, { title: 'Time is up!', score: r.score, total: r.answered || r.total, xp, again: restart }); } });
  } else if (kind === 'incident') {
    UI.mcq(host, D.SCENARIOS.map(s => ({ q: s.d, o: s.o, a: s.a, why: s.why })), { label: 'Scenario', lives: 3, onDone: r => { const xp = r.score * 15; S().incident = Math.max(S().incident, r.score); UI.addXP(xp); UI.mis('game'); UI.finishCard(host, { title: r.lives > 0 ? 'All incidents handled!' : 'Out of lives', score: r.score, total: r.total, xp, again: restart }); } });
  } else if (kind === 'bug') {
    UI.mcq(host, D.BUGS.map(b => ({ q: 'What is wrong with this script?', code: b.code, o: b.o, a: b.a, why: b.why })), { label: 'Bug', onDone: r => { const xp = r.score * 10; UI.addXP(xp); UI.mis('game'); UI.finishCard(host, { title: 'Bug hunt complete', score: r.score, total: r.total, xp, again: restart }); } });
  } else if (kind === 'order') playOrder(host); else if (kind === 'match') playMatch(host); else if (kind === 'flash') playFlash(host, arg); else V.practice();
};
function playOrder(host) {
  const pool = D.TOPICS.filter(t => t.scen && (!S().track || t.track === S().track)), t = pool[Math.random() * pool.length | 0], steps = C.steps(t.scen[1]).slice(0, 6); let pick = [];
  mount(host, `<div class="card pop"><span class="tag">Order the steps · ${esc(t.name)}</span><h3>${esc(t.scen[0])}</h3><p class="dim">Tap the steps in the order you would do them.</p><div class="opts" id="pool">${C.shuffle(steps).map(s => `<button class="opt" data-s="${esc(s)}"><span>${esc(s)}</span></button>`).join('')}</div><div class="step dim" id="mine">Your order will appear here</div><div class="row"><button class="btn ghost" id="rs">Reset</button><button class="btn primary" id="ck">Check</button></div><div id="out"></div></div>`);
  $$('#pool .opt', host).forEach(b => b.onclick = () => { pick.push(b.dataset.s); b.disabled = true; $('#mine').innerHTML = pick.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>'); });
  $('#rs').onclick = () => playOrder(host);
  $('#ck').onclick = () => { let ok = 0; steps.forEach((s, i) => { if (pick[i] === s) ok++; }); const p = ok / steps.length, xp = Math.round(p * 20); S().puz++; UI.addXP(xp); UI.mis('game'); mount($('#out'), `<div class="center">${ring(p, 'correct', p >= .8 ? 'var(--good)' : 'var(--warn)')}<p class="big">${ok} of ${steps.length} in the right place</p><div class="step"><b>Correct order</b><br>${steps.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>')}</div><div class="row" style="justify-content:center"><button class="btn primary" id="nx">Next puzzle</button></div></div>`); $('#nx').onclick = () => playOrder(host); if (p >= .8) UI.confetti(); };
}
function playMatch(host) {
  const pool = poolFacts(), M = C.shuffle(pool.filter((f, i, a) => a.findIndex(x => x.d === f.d) === i)).slice(0, 5), defs = C.shuffle(M.map(f => f.d));
  mount(host, `<div class="card pop"><span class="tag">Match it</span><h3>Match each term to its meaning</h3>${M.map((f, i) => `<div class="step"><b>${esc(f.t)}</b><select data-i="${i}"><option value="">Choose...</option>${defs.map(d => `<option>${esc(d)}</option>`).join('')}</select></div>`).join('')}<div class="row"><button class="btn primary" id="ck">Check</button></div><div id="out"></div></div>`);
  $('#ck').onclick = () => { let ok = 0; const wrong = []; $$('select', host).forEach(s => { const i = +s.dataset.i; if (s.value === M[i].d) ok++; else wrong.push(M[i]); }); const p = ok / M.length; S().puz++; UI.addXP(p * 20); UI.mis('game'); mount($('#out'), `<div class="center">${ring(p, 'correct', p >= .75 ? 'var(--good)' : 'var(--warn)')}<p class="big">${ok} of ${M.length} matched</p>${wrong.length ? `<div class="step"><b>Correct answers for the ones you missed</b>${wrong.map(w => `<br>${esc(w.t)}: ${esc(w.d)}`).join('')}</div>` : ''}<div class="row" style="justify-content:center"><button class="btn primary" id="nx">Next puzzle</button></div></div>`); $('#nx').onclick = () => playMatch(host); if (p >= .75) UI.confetti(); };
}
function playFlash(host, topic) {
  const t = topic && topicById(topic), pool = t ? t.facts : poolFacts(); let deck = C.shuffle(pool).slice(0, 12), known = 0, i = 0, tot = deck.length;
  function show() {
    if (!deck.length) { UI.addXP(known * 3); UI.mis('game'); return UI.finishCard(host, { title: 'Flashcards done', score: known, total: tot, xp: known * 3, again: () => playFlash(host, topic), back: t ? '#/topic/' + t.id : '#/practice' }); }
    const f = deck[0]; mount(host, `<div class="card pop"><div class="mhead"><span>${t ? esc(t.name) : 'Flashcards'} · ${deck.length} left</span><span>Known ${known}</span></div><div class="bar"><i data-w="${Math.round((tot - deck.length) / tot * 100)}" style="width:0"></i></div>
    <button class="flip" id="fl" aria-label="Flip card"><span class="face front"><small class="dim">Tap to flip. First say it out loud.</small><b>${esc(f.t)}</b></span><span class="face back"><small class="dim">Meaning</small><b>${esc(f.d)}.</b></span></button><div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="ag">Again</button><button class="btn primary" id="kn">I knew it</button></div></div>`);
    $('#fl').onclick = e => e.currentTarget.classList.toggle('on'); $('#kn').onclick = () => { known++; deck.shift(); show(); }; $('#ag').onclick = () => { deck.push(deck.shift()); show(); };
  }
  show();
}
})(window);
