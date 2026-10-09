/* Views part 2: speaking lab, interview, project round, career studio, code lab, progress, router */
(function (root) {
'use strict';
const UI = root.UI, V = UI.VIEWS, { $, $$, esc, D, C, A, mount, pct, avg, ring, meter, chips, today } = UI; const S = () => UI.S, app = $('#app');
const tname = id => (UI.trackOf(id) || { name: 'All fields' }).name;
const topicById = id => D.TOPICS.find(t => t.id === id);

/* ---------- speaking lab ---------- */
const READ = [
  ['Easy', 'Good morning. My name is Priya and I have three years of experience.'],
  ['Easy', 'I enjoy solving problems and working with a team.'],
  ['Easy', 'Thank you for giving me this opportunity to interview.'],
  ['Medium', 'In my last project I reduced the response time by thirty percent.'],
  ['Medium', 'First I gathered the requirements, then I designed and tested the solution.'],
  ['Medium', 'When the deadline was at risk, I prioritised the critical tasks and informed the stakeholders.'],
  ['Medium', 'I would like to explain my approach step by step.'],
  ['Hard', 'The customer was dissatisfied because the delivery was delayed, so I coordinated with the supplier and resolved it within a day.'],
  ['Hard', 'Through regular communication and careful planning, our team consistently exceeded its quarterly targets.'],
  ['Hard', 'I am particularly interested in this position because it combines technical depth with responsibility for outcomes.']
];
const PHRASES = [
  ['Starting an answer', ['"Let me explain it step by step."', '"In my experience, ..."', '"The way I approach this is ..."']],
  ['Buying thinking time', ['"That is a good question. Let me think for a moment."', '"Let me structure my answer."']],
  ['When you are not sure', ['"I have not worked on that directly, but my understanding is ..."', '"I do not remember the exact detail, but I would find out by ..."']],
  ['Showing ownership', ['"I was responsible for ..." (not "we did")', '"I decided to ... because ..."']],
  ['Finishing strongly', ['"As a result, ..." and then a number', '"Would you like me to go deeper on any part?"']],
  ['Common mistakes to avoid', ['Say "I have 3 years of experience", not "I am having 3 years experience".', 'Say "discuss the plan", not "discuss about the plan".', 'Say "My name is ...", not "Myself ...".']]
];
V.speak = (mode) => {
  const tabs = [['read', 'Read aloud'], ['intro', 'Self-introduction'], ['free', 'Free answer'], ['phrases', 'Useful phrases']]; mode = tabs.some(x => x[0] === mode) ? mode : 'read';
  mount(app, `<h1>🗣️ Speaking lab</h1><p class="dim">Practise out loud. The coach counts filler words, repeated words, pace, and common grammar slips. ${UI.hasVoice ? '' : '<b>Voice needs Chrome or Edge; you can still type.</b>'}</p><div class="tabs">${tabs.map(t => `<button data-t="${t[0]}" class="${t[0] === mode ? 'on' : ''}">${t[1]}</button>`).join('')}</div><div id="pane"></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => { location.hash = '#/speak/' + b.dataset.t; });
  const pane = $('#pane');
  if (mode === 'read') {
    let i = Math.floor(Math.random() * READ.length);
    (function show() {
      const [lv, s] = READ[i % READ.length];
      mount(pane, `<div class="card pop"><span class="tag">${lv}</span><p class="read">${esc(s)}</p><p class="dim sm">Read it clearly at a steady pace. Then tap Compare.</p><div id="ab"></div><div id="out"></div><div class="row" style="margin-top:10px"><button class="btn" id="nx">Next sentence →</button></div></div>`);
      UI.answerBox($('#ab'), { rows: 2, cta: 'Compare', ph: 'Your spoken words appear here...', onCheck: (txt, meta) => {
        const r = C.readAloud(s, txt), c = C.coach(txt, meta.spoke ? meta.secs : 0);
        const words = s.split(/\s+/), missed = new Set(r.missed.map(x => x.toLowerCase()));
        UI.addXP(r.pct / 10); UI.mis('answer');
        mount($('#out'), `<div class="res">${ring(r.pct / 100, 'match', UI.scoreColor(r.pct))}<div class="meters"><p class="read sm">${words.map(w => `<span class="${missed.has(w.toLowerCase().replace(/[^a-z0-9']/g, '')) ? 'miss' : 'ok'}">${esc(w)}</span>`).join(' ')}</p><p class="dim sm">${r.pct >= 90 ? 'Excellent clarity.' : r.pct >= 70 ? 'Good. Slow down on the red words.' : 'Try again slowly, one phrase at a time.'}</p></div></div>${c.fillers && Object.keys(c.fillers).length ? `<p class="dim sm">Filler words noticed: ${Object.keys(c.fillers).join(', ')}</p>` : ''}<p class="dim sm">The score depends on the browser's speech recognition, so treat it as a guide, not a judge.</p>`);
        if (r.pct >= 90) UI.confetti();
      } });
      $('#nx').onclick = () => { i++; UI.runCleanups(); show(); };
    })();
  }
  if (mode === 'intro') {
    const p = S().intro || {}, found = UI.skillsFound().slice(0, 3).join(', ');
    mount(pane, `<div class="card"><h3>Build your self-introduction</h3><p class="dim">Present, past, future. About 45 to 60 seconds.</p><div class="grid"><label>Name<input type="text" id="n" value="${esc(p.name || '')}"></label><label>Role<input type="text" id="r" placeholder="for example: HR executive" value="${esc(p.role || '')}"></label><label>Experience<input type="text" id="y" placeholder="for example: 3 years" value="${esc(p.years || '')}"></label><label>Main skills (comma separated)<input type="text" id="s" value="${esc(p.skills || found)}"></label></div><label>One achievement with a number<input type="text" id="a" placeholder="for example: reduced hiring time by 20%" value="${esc(p.achievement || '')}"></label><label>What you want next<input type="text" id="g" placeholder="for example: a senior role in recruitment" value="${esc(p.goal || '')}"></label><div class="row" style="margin-top:12px"><button class="btn primary" id="mk">Write my introduction</button></div></div><div id="out"></div>`);
    $('#mk').onclick = () => {
      const o = { name: $('#n').value.trim(), role: $('#r').value.trim(), years: $('#y').value.trim(), skills: $('#s').value.trim(), achievement: $('#a').value.trim(), goal: $('#g').value.trim() }; S().intro = o; UI.save();
      const text = C.introText({ name: o.name, role: o.role, years: o.years, skills: o.skills.split(',').map(x => x.trim()).filter(Boolean), achievement: o.achievement, goal: o.goal });
      mount($('#out'), `<div class="card pop"><h3>Your introduction</h3><textarea id="it" rows="6">${esc(text)}</textarea><p class="dim sm">Replace anything in [brackets]. Make it sound like you.</p><h3 style="margin-top:14px">Now say it aloud</h3><div id="ab"></div><div id="res"></div></div>`);
      UI.answerBox($('#ab'), { rows: 4, cta: 'Check my delivery', onCheck: (txt, meta) => {
        const ref = $('#it').value, r = C.readAloud(ref, txt), c = C.coach(txt, meta.spoke ? meta.secs : 0); UI.addXP(15); UI.mis('answer');
        mount($('#res'), `<div class="res">${ring(c.score / 100, 'delivery', UI.scoreColor(c.score))}<div class="meters"><p>${r.pct}% of your written words were spoken${r.missed.length ? '. Missed: ' + esc(r.missed.slice(0, 8).join(', ')) : ''}.</p></div></div>${UI.coachHTML(txt, meta.spoke ? meta.secs : 0)}`);
      } });
    };
  }
  if (mode === 'free') {
    const q = C.genOpen(D.OPEN, { track: S().track || undefined, seen: UI.seenIds(), count: 1 })[0];
    mount(pane, `<div id="qa"></div><div class="row" style="margin-top:12px"><button class="btn" id="nx">Another question →</button></div>`);
    $('#qa').appendChild(UI.qaCard(q, { kind: q.cat, coach: true, onGraded: (g) => UI.addXP(g.overall * 20) })); $('#nx').onclick = () => { UI.runCleanups(); V.speak('free'); };
  }
  if (mode === 'phrases') mount(pane, `<div class="grid">${PHRASES.map(p => `<div class="card"><h3>${esc(p[0])}</h3>${p[1].map(x => `<div class="step">${esc(x)}</div>`).join('')}</div>`).join('')}</div>`);
};

/* ---------- interview hub ---------- */
const CATS = ['All', 'HR', 'Behavioural', 'Situational', 'Technical'];
V.interview = (mode, arg) => {
  if (mode === 'q') {
    const q = D.OPEN.find(x => x.id === arg); if (!q) return V.interview();
    mount(app, `<a class="dim" href="#/interview/${q.cat === 'Technical' ? 'tech' : 'hr'}">← Question bank</a><div id="qa"></div>`);
    $('#qa').appendChild(UI.qaCard(q, { kind: q.cat + (q.track ? ' · ' + tname(q.track) : ''), coach: true, onGraded: (g, t, act) => { UI.addXP(g.overall * 20); const n = C.genOpen(D.OPEN, { track: q.cat === 'Technical' ? (q.track || S().track || undefined) : undefined, cat: q.cat, seen: UI.seenIds(), count: 2 }).find(x => x.id !== q.id); act.innerHTML = n ? `<a class="btn primary" href="#/interview/q/${n.id}">Next question →</a>` : ''; } }));
    return;
  }
  if (mode === 'scenarios') {
    const trk = arg || S().track || ''; const list = D.TOPICS.filter(t => t.scen && (!trk || t.track === trk));
    return mount(app, `<a class="dim" href="#/interview">← Interview</a><h1>🧩 Real-time scenarios</h1><p class="dim">Situations you will face at work. Explain what you would do; then compare with the correct step-by-step approach.</p><div class="tabs"><button data-tr="" class="${!trk ? 'on' : ''}">All</button>${D.TRACKS.map(t => `<button data-tr="${t.id}" class="${trk === t.id ? 'on' : ''}">${t.ic} ${esc(t.name)}</button>`).join('')}</div><div class="grid">${list.map(t => `<a class="card hover tcard" href="#/topic/${t.id}/scenario"><span class="tag">${esc(t.name)}</span><h3 style="font-size:1rem;margin-top:8px">${esc(t.scen[0])}</h3></a>`).join('')}</div>`), $$('.tabs button', app).forEach(b => b.onclick = () => { location.hash = '#/interview/scenarios/' + b.dataset.tr; });
  }
  if (mode === 'hr' || mode === 'tech') {
    const cats = mode === 'hr' ? ['All', 'HR', 'Behavioural', 'Situational'] : ['Technical']; const cat = cats.includes(arg) ? arg : cats[0];
    const list = D.OPEN.filter(q => (mode === 'tech' ? q.cat === 'Technical' && (!S().track || q.track === S().track) : q.cat !== 'Technical' && (cat === 'All' || q.cat === cat)));
    return mount(app, `<a class="dim" href="#/interview">← Interview</a><h1>${mode === 'hr' ? 'HR & behavioural questions' : 'Technical questions · ' + esc(tname(S().track))}</h1>${mode === 'tech' ? `<p class="dim">Showing your field. Change it in <a href="#/start">Choose field</a>.</p>` : `<div class="tabs">${cats.map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div>`}<div class="grid">${list.map(q => `<a class="card hover tcard" href="#/interview/q/${q.id}"><span class="tag">${esc(q.cat)}</span> ${S().seen[q.id] ? '<span class="dim sm">✓ practised</span>' : ''}<h3 style="font-size:1rem;margin-top:8px">${esc(q.q)}</h3></a>`).join('') || '<p class="dim">No questions for this field yet. Try HR questions or scenarios.</p>'}</div>`), $$('.tabs button', app).forEach(b => b.onclick = () => { location.hash = '#/interview/hr/' + b.dataset.c; });
  }
  mount(app, `<h1>Interview</h1><p class="dim">Practise the way real interviews go: introduce yourself, answer about your resume, solve situations, and explain clearly.</p>
  <div class="grid"><div class="card hover hero2"><span class="tag">From your resume</span><h3>🛠️ Project interview</h3><p class="dim">Questions from the projects you wrote, real-time scenarios for the tools you used, and a check of every skill you claim.</p><a class="btn primary" href="#/project">${S().resume ? 'Start project interview' : 'Add resume first'}</a></div>
  <div class="card hover"><span class="tag">Full round</span><h3>🎤 Mock interview</h3><p class="dim">Self-introduction, resume and job-description questions, a project, a scenario and adaptive follow-ups.</p><a class="btn primary" href="#/mock">Start mock interview</a></div>
  <div class="card hover"><span class="tag">Real work</span><h3>🧩 Scenario arena</h3><p class="dim">${D.TOPICS.length} real-time situations with the correct step-by-step approach.</p><a class="btn" href="#/interview/scenarios">Open scenarios</a></div></div>
  <div class="grid" style="margin-top:16px"><a class="card hover tcard" href="#/interview/hr"><div class="ic">🧑‍🤝‍🧑</div><h3>HR & behavioural</h3><p class="dim sm">${D.OPEN.filter(q => q.cat !== 'Technical').length} questions with model answers</p></a><a class="card hover tcard" href="#/interview/tech"><div class="ic">🧠</div><h3>Technical questions</h3><p class="dim sm">${D.OPEN.filter(q => q.cat === 'Technical').length} questions across fields</p></a><a class="card hover tcard" href="#/speak/intro"><div class="ic">🙋</div><h3>Self-introduction</h3><p class="dim sm">Build it, say it, get coached</p></a></div>
  <div class="card" style="margin-top:16px"><span class="tag">How scoring works</span><p class="dim">Each answer is checked for knowledge (key ideas), confidence (direct wording), reasoning (because, first, then) and clarity (length and structure). Even a wrong answer earns credit for how boldly and clearly you explain it. Scores are an automatic estimate from your words, not a psychological test, and the correct answer is always shown so you can learn from it.</p></div>`);
};

/* ---------- interview runner (mock + project) ---------- */
function runRound(qs, o) {
  const res = [], used = []; let i = 0, follows = 0;
  function next() {
    UI.runCleanups(); if (i >= qs.length) return o.report(res, qs); const q = qs[i];
    app.innerHTML = `<div><span class="tag">${esc(o.title)}</span><h1>Question ${i + 1} of ${qs.length}</h1><div class="bar" style="margin-bottom:16px"><i data-w="${Math.round(i / qs.length * 100)}" style="width:0"></i></div></div>`; UI.animate(app);
    app.appendChild(UI.qaCard(q, { kind: q.kind, timer: o.timer || 150, coach: true, onGraded: (g, txt, act) => {
      res.push({ g, q }); o.onGraded && o.onGraded(q, g);
      let f = null; if (o.follow !== false && follows < 2) { f = C.followUp(txt, g, used); if (!f && g.words > 20 && !/\d/.test(txt) && !used.includes('result')) f = { kind: 'Follow-up', follow: true, topic: 'result', q: 'Can you put a number or a clear result on that? For example time saved, cost reduced, or customers helped.', keys: ['result', 'percent', 'reduced', 'improved', 'saved', 'increase', 'customers', 'time'], m: 'Give one measurable result (a number) and what changed because of your work. If you do not have exact numbers, give an honest estimate and say it is an estimate.' }; }
      if (f) { qs.splice(i + 1, 0, f); used.push(f.topic); follows++; }
      act.innerHTML = `<button class="btn primary nx">${f ? 'Next: follow-up question' : i + 1 >= qs.length ? 'See my report' : 'Next question'}</button>`; $('.nx', act).onclick = () => { i++; next(); };
    } }));
    scrollTo({ top: 0 });
  }
  next();
}
const dimsOf = res => { const k = avg(res.map(r => r.g.know)), c = avg(res.map(r => r.g.conf)), r = avg(res.map(r => r.g.reason)), l = avg(res.map(r => r.g.clar)); return { dims: { Knowledge: k, Confidence: c, Reasoning: r, Clarity: l }, o: k * .4 + r * .2 + c * .2 + l * .2 }; };
V.mock = () => {
  const found = UI.skillsFound(), trks = UI.myTracks(), jdS = S().jd ? C.extractSkills(S().jd, D.SKILLS) : [], gaps = jdS.filter(s => !found.includes(s));
  mount(app, `<h1>Mock interview</h1><div class="card"><h3>Your plan</h3><p class="dim">${S().resume ? 'Questions are built from your resume' : 'No resume saved, so you get a ' + esc(tname(S().track)) + ' interview'}${S().jd ? ' and your job description' : ''}. About 8 questions, 2 minutes each. Answer by voice or typing, and a short follow-up may come based on what you say.</p>${found.length ? '<p class="dim sm">Skills found on your resume</p>' + chips(found.slice(0, 10), 'g') : ''}${gaps.length ? '<p class="dim sm">Gaps from the job description</p>' + chips(gaps, 'r') : ''}<div class="row"><button class="btn primary" id="go">Start interview</button><a class="btn" href="#/career/resume">${S().resume ? 'Update resume' : 'Add resume'}</a></div><p class="dim sm">Scores are an automatic estimate from your answer text, not a psychological test.</p></div>`);
  $('#go').onclick = () => {
    const pool = D.SKILLS.filter(s => !trks.length || trks.includes(s.track) || found.includes(s.n));
    const qs = C.buildMock({ resume: S().resume, found: found.filter(n => pool.some(s => s.n === n)), gaps, skills: pool, scenarios: D.SCENARIOS, scenarioKeys: D.SCENARIOS.map(s => s.k) });
    const tps = D.TOPICS.filter(t => t.scen && (!trks.length || trks.includes(t.track))), sc = C.scenQ(C.shuffle(tps)[0] || D.TOPICS[0]);
    const si = qs.findIndex(q => q.kind === 'Scenario'); if (si >= 0) qs[si] = sc;
    const bi = qs.findIndex(q => q.kind === 'Behaviour'), beh = C.genOpen(D.OPEN, { cat: 'Behavioural', seen: UI.seenIds(), count: 1 })[0]; if (bi >= 0 && beh) qs[bi] = Object.assign({ kind: 'Behavioural' }, beh);
    runRound(qs, { title: 'Mock interview', report: (res) => { const { dims, o } = dimsOf(res); reportCard(res, dims, o, 'mock'); } });
  };
};
function reportCard(res, dims, o, kind, extra) {
  const keys = Object.keys(dims).sort((a, b) => dims[b] - dims[a]);
  const tips = { Knowledge: 'Revise the Learn topics for the skills on your resume, then retry.', Confidence: "Use direct statements like 'I built...'. A confident answer with a gap can be corrected; a vague one cannot.", Reasoning: 'Explain why. Use because, first, then and for example.', Clarity: 'Aim for 4 to 6 sentences: context, what you did, and the result.' };
  if (kind === 'mock') S().mock = Math.max(S().mock, pct(o)); UI.addXP(o * 80); UI.save(); UI.checkBadges();
  const real = n => D.TOPICS.some(t => t.name === n) || D.SKILLS.some(s => s.n === n);
  const weak = res.filter(r => r.g.know < .5 && r.q.topic && real(r.q.topic)).map(r => r.q.topic).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  mount(app, `<h1>Interview report</h1><div class="card hero"><div class="sp"><span class="tag">${o >= .75 ? 'Interview ready' : o >= .5 ? 'Getting there' : 'Keep practising'}</span><p class="big">${pct(o)}% overall</p><p class="dim">${res.length} answers scored. Strongest: <b>${keys[0]}</b>. Work on: <b>${keys[3]}</b>.</p></div>${ring(o, 'overall', UI.scoreColor(pct(o)))}</div>
  <div class="grid"><div class="card"><h3>Breakdown</h3>${Object.keys(dims).map(n => meter(n, dims[n])).join('')}</div><div class="card"><h3>What to do next</h3><p>${esc(tips[keys[3]])}</p>${weak.length ? '<p class="dim sm">Revise before your next try</p>' + chips(weak, 'r') : ''}<div class="row"><a class="btn primary" href="#/path">My learning path</a><a class="btn" href="#/${kind === 'mock' ? 'mock' : 'project'}">Try again</a></div></div></div>${extra || ''}`);
  if (o >= .75) UI.confetti();
}

/* ---------- project interview ---------- */
V.project = () => {
  if (!S().resume) return mount(app, `<h1>🛠️ Project interview</h1><div class="card hero pop"><div class="sp"><h2 style="margin-top:0">Interviewers ask about what you wrote</h2><p class="dim">Add your resume. Career Lab finds your projects and the tools you used, then asks about them with real-time scenarios and shows the correct approach for each.</p><a class="btn primary" href="#/career/resume">Add my resume</a></div><div class="heroart">${A.hero(S().track || 'all', '🛠️')}</div></div>`);
  const lines = C.projectLines(S().resume), trks = UI.myTracks(), tps = C.topicsInText(S().resume, D.TOPICS.filter(t => !trks.length || trks.includes(t.track) || t.track === 'pm')), found = UI.skillsFound();
  mount(app, `<h1>🛠️ Project interview</h1><div class="card"><h3>What we found in your resume</h3>${lines.length ? lines.slice(0, 5).map(l => `<div class="step">${esc(l)}</div>`).join('') : '<p class="dim">No project or experience lines were detected. Write bullets that start with action verbs (built, led, managed...) and try again. You will still get scenario questions for your skills.</p>'}${tps.length ? '<p class="dim sm">Tools and topics we will test</p>' + chips(tps.map(t => t.name), 'y') : ''}<div class="row"><button class="btn primary" id="go">Start (about ${Math.min(8, lines.slice(0, 3).length * 2 + tps.length + 1)} questions)</button><a class="btn" href="#/career/resume">Edit resume</a></div><p class="dim sm">Be honest in your answers. If you only supported part of a project, say which part. Real interviewers dig into details, and it is better to practise that here.</p></div>`);
  $('#go').onclick = () => {
    const qs = C.buildProjectRound(S().resume, D.TOPICS, trks); const scores = {};
    runRound(qs, { title: 'Project interview', timer: 180, onGraded: (q, g) => { if (q.id && q.id.startsWith('sc:')) { const t = topicById(q.id.slice(3)); if (t) { scores[t.skill || t.name] = Math.max(scores[t.skill || t.name] || 0, g.overall); S().claims[t.skill || t.name] = pct(g.overall); UI.record(t.name, g.overall >= .5); } } UI.save(); },
      report: (res) => {
        const { dims, o } = dimsOf(res), cc = C.claimsCheck(found.concat(Object.keys(scores).filter(x => !found.includes(x))), scores);
        const link = n => { const t = D.TOPICS.find(x => x.skill === n || x.name === n); return t ? `<a class="chip" href="#/topic/${t.id}">${esc(n)} →</a>` : `<span class="chip">${esc(n)}</span>`; };
        reportCard(res, dims, o, 'project', `<h2>Claims check</h2><p class="dim">Skills on a resume are claims. This shows how well you could back each one up today.</p><div class="grid"><div class="card"><h3>🟢 You can back these up</h3>${cc.solid.length ? `<div class="chips">${cc.solid.map(link).join('')}</div>` : '<p class="dim">None yet. Practise below.</p>'}</div><div class="card"><h3>🟠 Revise before the interview</h3>${cc.shaky.length ? `<div class="chips">${cc.shaky.map(link).join('')}</div><p class="dim sm">You listed these but the explanation was weak. Learn them or remove them from your resume.</p>` : '<p class="dim">None. Good.</p>'}</div><div class="card"><h3>⬜ Not tested yet</h3>${cc.untested.length ? `<div class="chips">${cc.untested.map(link).join('')}</div>` : '<p class="dim">All tested.</p>'}</div></div>`);
      } });
  };
};

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
V.code = (id) => {
  const ch = D.CODE.find(c => c.id === id) || D.CODE[0];
  mount(app, `<a class="dim" href="#/practice">← Practice</a><h1>💻 Code lab</h1><div class="tabs">${D.CODE.map(c => `<button data-id="${c.id}" class="${c.id === ch.id ? 'on' : ''}">${S().solved[c.id] ? '✓ ' : ''}${esc(c.title)}</button>`).join('')}</div>
  <div class="card"><p>${esc(ch.prompt)}</p><textarea class="code" id="ed" rows="10" spellcheck="false" aria-label="Code editor">${esc(S().solved['draft_' + ch.id] || ch.starter)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="run">▶ Run tests</button><button class="btn ghost" id="rst">Reset code</button></div><div id="out"></div></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => location.hash = '#/code/' + b.dataset.id);
  const ed = $('#ed'); ed.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); ed.setRangeText('  ', ed.selectionStart, ed.selectionEnd, 'end'); } });
  $('#rst').onclick = () => { ed.value = ch.starter; };
  $('#run').onclick = async () => {
    const out = $('#out'); out.innerHTML = '<p class="dim">Running...</p>'; S().solved['draft_' + ch.id] = ed.value; UI.save();
    const r = await runTests(ed.value, ch); if (r.err) { out.innerHTML = `<p class="fbtxt" style="color:var(--bad)">${esc(r.err)}</p>`; return; }
    const ok = r.out.filter(x => x.ok).length, all = ok === r.out.length;
    out.innerHTML = r.out.map((x, i) => `<div class="step">${x.ok ? '✅' : '❌'} Test ${i + 1}: <code>${esc(ch.fn + '(' + x.args.map(a => JSON.stringify(a)).join(', ') + ')')}</code>${x.ok ? '' : `<br><span class="dim sm">expected ${esc(JSON.stringify(x.exp))}, got ${esc(x.err || JSON.stringify(x.got))}</span>`}</div>`).join('') + `<p class="big">${ok} / ${r.out.length} passed</p>`;
    if (all && !S().solved[ch.id]) { S().solved[ch.id] = 1; UI.addXP(40); UI.mis('code'); UI.confetti(); } else if (all) UI.toast('Already solved. Nice!'); UI.save();
  };
};

/* ---------- career studio ---------- */
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
  i.onchange = async () => { const f = i.files[0]; if (!f) return; try { const t = /\.docx$/i.test(f.name) ? await docxText(f) : await f.text(); if (t.trim().length < 40) throw 0; cb(t); } catch (e) { UI.toast('Could not read that file. Use .txt or .docx, or paste the text. For PDF, copy the text and paste it.'); } };
  i.click();
}
function uploader(pane, kind, title, hint) {
  mount(pane, `<div class="card pop"><h3>${title}</h3><p class="dim">${hint} Your text stays in this browser and is never uploaded.</p><div class="row"><button class="btn primary" id="up">📁 Choose file (.docx, .txt)</button></div><p class="dim sm">PDF? Open it, select all, copy, and paste below.</p><textarea id="pt" rows="9" placeholder="Paste here..."></textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="sv">Analyze</button></div></div>`);
  const set = t => { S()[kind] = t; if (kind === 'resume') { S().extra = []; S().removed = []; } UI.checkBadges(); UI.save(); UI.route(); };
  $('#up').onclick = () => pickText(set); $('#sv').onclick = () => { const t = $('#pt').value.trim(); t.length < 40 ? UI.toast('Please add more text') : set(t); };
}
V.career = (tab) => {
  tab = ['resume', 'jd', 'match'].includes(tab) ? tab : 'resume';
  mount(app, `<h1>Career studio</h1><div class="tabs">${[['resume', 'Resume'], ['jd', 'Job description'], ['match', 'Resume vs JD']].map(t => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${t[1]}</button>`).join('')}</div><div id="pane"></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => location.hash = '#/career/' + b.dataset.t);
  const pane = $('#pane'); if (tab === 'resume') careerResume(pane); else if (tab === 'jd') careerJD(pane); else careerMatch(pane);
};
function careerResume(pane) {
  if (!S().resume) return uploader(pane, 'resume', 'Upload your resume', 'Get a score, fixes and a better version. Then learn and practise exactly what is on it.');
  const a = C.analyzeResume(S().resume, D.SKILLS), plain = C.projectLines(S().resume).filter(l => !/\d/.test(l)).slice(0, 4);
  mount(pane, `<div class="card hero pop"><div class="sp"><span class="tag">${a.score >= 75 ? 'Strong' : a.score >= 50 ? 'Good, can improve' : 'Needs work'}</span><p class="big">Resume score ${a.score}/100</p><p class="dim">${a.words} words · ${UI.skillsFound().length} skills · field: ${esc(UI.myTracks().map(tname).join(', ') || 'not detected')}</p><div class="row"><a class="btn primary" href="#/path">🧭 My learning path</a><a class="btn" href="#/project">Project interview</a><button class="btn" id="imp">✨ Make my resume better</button><button class="btn ghost" id="rep">Use another</button></div></div>${ring(a.score / 100, 'score', a.score >= 70 ? 'var(--good)' : 'var(--warn)')}</div>
  <div class="grid"><div class="card"><h3>Breakdown</h3>${a.items.map(it => meter(it.n + ' (' + it.pts + '/' + it.max + ')', it.pts / it.max)).join('')}</div><div class="card"><h3>Skills found</h3><p class="dim sm">Review and correct this list. It drives your questions.</p><div id="skl"></div></div></div>
  <div class="grid" style="margin-top:16px"><div class="card"><h3>How to improve</h3>${a.tips.length ? a.tips.map(t => `<div class="step">${esc(t)}</div>`).join('') : '<p class="dim">Nothing major. Nice resume!</p>'}</div>${plain.length ? `<div class="card"><h3>Add a result to these lines</h3>${plain.map(l => `<div class="step">${esc(l)}<br><span class="dim sm">Add: how many, how much faster, or what improved.</span></div>`).join('')}</div>` : ''}</div><div id="better"></div>`);
  UI.skillEditor($('#skl'), () => careerResume(pane));
  $('#rep').onclick = () => { S().resume = ''; UI.save(); UI.route(); };
  $('#imp').onclick = () => {
    const better = C.improveResume(S().resume, a.found), after = C.analyzeResume(better, D.SKILLS);
    mount($('#better'), `<div class="card pop"><h3>Better version: estimated ${a.score} → ${after.score}</h3><p class="dim sm">Weak phrases replaced, summary and skills added where missing. Edit the [brackets] and add real numbers before sending. Only keep what is true.</p><textarea id="bt" rows="14">${esc(better)}</textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="cp">Copy</button><button class="btn" id="dl">Download .txt</button></div></div>`);
    $('#cp').onclick = () => { navigator.clipboard.writeText($('#bt').value).then(() => UI.toast('Copied'), () => UI.toast('Select the text and copy it')); };
    $('#dl').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([$('#bt').value], { type: 'text/plain' })); l.download = 'improved-resume.txt'; l.click(); };
    $('#better').scrollIntoView({ behavior: 'smooth' });
  };
}
function careerJD(pane) {
  if (!S().jd) return uploader(pane, 'jd', 'Add the job description', 'Paste or upload the JD for your interview. You can skip this and still practise.');
  const jd = C.extractSkills(S().jd, D.SKILLS);
  mount(pane, `<div class="card pop"><h3>Skills the job asks for</h3>${jd.length ? chips(jd, 'y') : '<p class="dim">No known skills detected. Try pasting more of the description.</p>'}<div class="row"><a class="btn primary" href="#/career/match">See resume vs JD →</a><button class="btn ghost" id="rep">Use another JD</button></div></div>${!S().resume ? '<div class="card"><p class="dim">Add your resume too, to see your gaps.</p><a class="btn" href="#/career/resume">Add resume</a></div>' : ''}`);
  $('#rep').onclick = () => { S().jd = ''; UI.save(); UI.route(); };
}
function careerMatch(pane) {
  if (!S().resume || !S().jd) return mount(pane, `<div class="card"><p>Add both your resume and a job description to see how you match.</p><div class="row"><a class="btn" href="#/career/resume">Resume</a><a class="btn" href="#/career/jd">Job description</a></div></div>`);
  const mine = UI.skillsFound(), jd = C.extractSkills(S().jd, D.SKILLS), am = {};
  jd.forEach(s => { const t = D.TOPICS.find(x => x.skill === s || x.name === s); if (t && UI.acc(t.name) !== undefined) am[s] = UI.acc(t.name); });
  const m = C.jdMatch(mine, jd, am), link = s => { const t = D.TOPICS.find(x => x.skill === s || x.name === s); return t ? `<a class="chip" href="#/topic/${t.id}">${esc(s)} →</a>` : `<span class="chip">${esc(s)}</span>`; };
  S().gaps = m.priority; UI.save();
  mount(pane, `<div class="card hero pop"><div class="sp"><span class="tag">Resume vs job description</span><p class="big">${m.pct}% match</p><p class="dim">${jd.length} skills asked for · ${m.strong.length + m.practice.length} on your resume</p><div class="row"><a class="btn primary" href="#/mock">Start personalised preparation →</a></div></div>${ring(m.pct / 100, 'match', m.pct >= 70 ? 'var(--good)' : 'var(--warn)')}</div>
  <div class="grid"><div class="card"><h3>🟢 Strong</h3>${chips(m.strong, 'g') || '<p class="dim">None yet</p>'}</div><div class="card"><h3>🟡 Practice</h3>${m.practice.length ? `<div class="chips">${m.practice.map(link).join('')}</div>` : '<p class="dim">None</p>'}</div><div class="card"><h3>🔴 Priority</h3>${m.priority.length ? `<div class="chips">${m.priority.map(link).join('')}</div>` : '<p class="dim">No gaps. Great!</p>'}</div></div>`);
}

/* ---------- progress and settings ---------- */
V.progress = () => {
  const last = S().dims.slice(-10), Dm = k => avg(last.map(d => d[k])), rs = S().resume ? C.analyzeResume(S().resume, D.SKILLS).score / 100 : 0;
  const learn = (() => { const v = D.TOPICS.map(t => UI.acc(t.name)).filter(x => x !== undefined); return v.length ? avg(v) : 0; })();
  const claims = Object.values(S().claims).map(x => x / 100), jd = S().resume && S().jd ? C.jdMatch(UI.skillsFound(), C.extractSkills(S().jd, D.SKILLS), {}).pct / 100 : 0;
  const R = [['Knowledge', learn], ['Technical answers', Dm('k')], ['Scenario handling', avg(claims)], ['Communication', avg(last.map(d => (d.c + d.l) / 2))], ['Resume strength', rs], ['JD coverage', jd]];
  const focus = R.filter(r => r[1] > 0 || last.length).sort((a, b) => a[1] - b[1])[0];
  const started = D.TOPICS.filter(t => UI.acc(t.name) !== undefined).sort((a, b) => UI.acc(a.name) - UI.acc(b.name)).slice(0, 4);
  mount(app, `<h1>My progress</h1><div class="card hero"><div class="sp"><p class="big">Level ${Math.floor(S().xp / 100) + 1}</p><p class="dim">${S().xp} XP · 🔥 ${S().streak}-day streak</p><div class="bar"><i data-w="${S().xp % 100}" style="width:0"></i></div></div><div class="rings">${ring(learn, 'learning')}${ring(avg(last.map(d => d.o)), 'interview', 'var(--acc2)')}${ring(rs, 'resume', 'var(--pink)')}</div></div>
  <div class="grid"><div class="card"><h3>Career readiness</h3>${R.map(r => meter(r[0], r[1])).join('')}${focus && last.length ? `<p class="fbtxt">🔥 Focus next on <b>${esc(focus[0])}</b>.</p>` : '<p class="dim sm">Answer a few questions to unlock your focus advice.</p>'}</div>
  <div class="card"><h3>Weakest topics so far</h3>${started.length ? started.map(t => `<a class="weak" href="#/topic/${t.id}">${t.ic} ${esc(t.name)} <b>${pct(UI.acc(t.name))}%</b></a>`).join('') : '<p class="dim">Take a quiz to see this.</p>'}<h3 style="margin-top:14px">Speaking</h3><p class="dim sm">${S().spoken} spoken answers so far.</p></div></div>
  <h2>Badges</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${UI.BADGES.map(b => `<div class="badge ${S().badges[b.id] ? 'on' : ''}"><b>${b.ic}</b><span class="sm">${b.n}</span></div>`).join('')}</div>
  <h2>Settings</h2><div class="card"><div class="grid"><label>Theme<select id="th"><option value="dark">Dark</option><option value="light">Light</option></select></label><label>Voice language<select id="lg"><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ta-IN">Tamil</option><option value="hi-IN">Hindi</option></select></label><label>My field<select id="tk"><option value="">Not set</option>${D.TRACKS.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label></div><p class="dim sm">Answer scoring looks for English keywords, so speak English for the most accurate score.</p>
  <div class="row"><button class="btn" id="ex">Export progress</button><button class="btn" id="im">Import progress</button><button class="btn ghost" id="rs">Reset everything</button></div></div>`);
  $('#th').value = S().theme; $('#lg').value = S().lang; $('#tk').value = S().track;
  $('#th').onchange = e => { S().theme = e.target.value; document.documentElement.dataset.theme = S().theme; UI.save(); };
  $('#lg').onchange = e => { S().lang = e.target.value; UI.save(); }; $('#tk').onchange = e => { S().track = e.target.value; UI.save(); };
  $('#ex').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([JSON.stringify(S())], { type: 'application/json' })); l.download = 'career-lab-progress.json'; l.click(); };
  $('#im').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { UI.setState(JSON.parse(await i.files[0].text())); UI.toast('Progress imported'); UI.route(); UI.top(); } catch (e) { UI.toast('That file is not valid'); } }; i.click(); };
  $('#rs').onclick = () => { if (confirm('Delete all progress, your resume and job description from this browser?')) { UI.reset(); UI.route(); UI.top(); } };
};

/* ---------- router ---------- */
UI.route = () => {
  UI.runCleanups();
  const parts = location.hash.replace(/^#\/?/, '').split('/'), name = parts[0] || 'home', view = V[name] || V.home; UI.mark();
  app.classList.remove('in'); void app.offsetWidth;
  try { view(parts[1], parts[2]); } catch (e) { console.error(e); app.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="dim">${esc(e.message)}</p><a class="btn" href="#/home">Go home</a></div>`; }
  app.classList.add('in'); window.scrollTo({ top: 0 });
};
addEventListener('hashchange', UI.route);
UI.top(); UI.checkBadges(); UI.route();
window.__CL = { S: () => UI.S, route: UI.route };
})(window);
