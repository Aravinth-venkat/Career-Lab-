/* Watch tab: animated, narrated lessons built from each topic, plus picture diagrams (flow and concept map) for the Learn tab. No video upload, works offline. */
/* GENERATED from watch.js by genD.mjs. Do not edit. */
export default function make(root) {
'use strict';
const UI = root.UI, { $, $$, esc } = UI, S = () => UI.S;
const sentences = t => (String(t || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]?/g) || []).map(x => x.trim()).filter(Boolean);
const short = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };

/* ---------- diagrams ---------- */
function flowHTML(steps, base, gap) {
  base = base || 0; gap = gap || .7;
  return `<div class="wflow">${steps.map((s, i) => `<div class="wnode wi" style="--d:${(base + i * gap).toFixed(2)}s"><span class="wn">${i + 1}</span><span>${esc(s)}</span></div>${i < steps.length - 1 ? `<span class="warrow wi" style="--d:${(base + i * gap + gap / 2).toFixed(2)}s">↓</span>` : ''}`).join('')}</div>`;
}
function mapHTML(center, terms, ic, base, gap) {
  base = base || 0; gap = gap || .45; const n = terms.length, pts = terms.map((t, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [50 + 38 * Math.cos(a), 50 + 38 * Math.sin(a), t]; });
  return `<div class="wmap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${pts.map((p, i) => `<line x1="50" y1="50" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" class="wline" style="--d:${(base + .3 * gap / .45 + i * gap).toFixed(2)}s"/>`).join('')}</svg><div class="wcenter wi" style="--d:${base}s"><span class="wic">${ic || '📘'}</span><b>${esc(short(center, 40))}</b></div>${pts.map((p, i) => `<div class="wbub wi" style="left:${p[0].toFixed(1)}%;top:${p[1].toFixed(1)}%;--d:${(base + .5 * gap / .45 + i * gap).toFixed(2)}s">${esc(short(p[2], 28))}</div>`).join('')}</div>`;
}
const termList = t => t.facts.slice(0, 6).map(f => f.t.replace(/^(DM|Health|Teach|Security|Attack|Login|Network|SOC) /, ''));
UI.pictureCard = t => {
  const how = t.deep && t.deep.how ? t.deep.how.slice(0, 6) : null, terms = termList(t);
  return `<div class="card pop picture"><span class="tag">Picture it</span><div class="pgrid">${how ? `<div><p class="dim sm">How it works, step by step</p>${flowHTML(how.map(x => short(x, 70)), 0, .2)}</div>` : ''}<div><p class="dim sm">Key ideas around ${esc(short(t.name, 40))}</p>${mapHTML(t.name, terms, t.ic, 0, .15)}</div></div></div>`;
};

/* ---------- slides ---------- */
function slides(t) {
  const out = [], f = t.facts, d = t.deep;
  const idea = sentences(t.lesson); const chunks = []; for (let i = 0; i < idea.length; i += 2) chunks.push(idea.slice(i, i + 2).join(' '));
  out.push({ h: `<div class="wtitle"><span class="wic big wi" style="--d:0s">${t.ic || '📘'}</span><h2 class="wi" style="--d:.3s">${esc(t.name)}</h2><p class="wquote wi" style="--d:.9s">${esc(t.story)}</p></div>`, say: `${t.name}. Think of it like this. ${t.story}` });
  out.push({ h: `<h3 class="wh wi">The idea</h3><ul class="wlist">${chunks.slice(0, 4).map((c, i) => `<li class="wi" style="--d:${(.4 + i * 1.1).toFixed(1)}s">${esc(c)}</li>`).join('')}</ul>`, say: t.lesson });
  if (d && d.how && d.how.length) out.push({ h: `<h3 class="wh wi">How it works</h3>${flowHTML(d.how.slice(0, 6), .4)}`, say: 'Here is how it works. ' + d.how.slice(0, 6).map((s, i) => 'Step ' + (i + 1) + '. ' + s).join(' ') });
  out.push({ h: `<h3 class="wh wi">Key terms at a glance</h3>${mapHTML(t.name, termList(t), t.ic, .3)}`, say: 'These are the key terms you will meet. ' + termList(t).join(', ') + '.' });
  const code = /\n|var |<|{/.test(t.ex);
  out.push({ h: `<h3 class="wh wi">Example</h3><div class="wex wi" style="--d:.5s">${code ? `<pre>${esc(t.ex)}</pre>` : `<p>${esc(t.ex)}</p>`}</div>`, say: code ? 'Here is a worked example on screen. Read it line by line.' : 'For example. ' + t.ex });
  const four = f.slice(0, 4);
  out.push({ h: `<h3 class="wh wi">What the words mean</h3><div class="wterms">${four.map((x, i) => `<div class="wterm wi" style="--d:${(.4 + i * 1.6).toFixed(1)}s"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('')}</div>`, say: four.map(x => x.t.replace(/^(DM|Health|Teach|Security|Attack|Login|Network|SOC) /, '') + '. ' + x.d + '.').join(' ') });
  if (d && d.mistakes && d.mistakes.length) out.push({ h: `<h3 class="wh wi">Common mistakes</h3><ul class="wlist bad">${d.mistakes.slice(0, 4).map((m, i) => `<li class="wi" style="--d:${(.4 + i * .9).toFixed(1)}s">${esc(m)}</li>`).join('')}</ul>`, say: 'Avoid these common mistakes. ' + d.mistakes.slice(0, 4).join(' ') });
  out.push({ h: `<h3 class="wh wi">Remember</h3><p class="wtip wi" style="--d:.4s">${esc(t.tip)}</p><p class="wi dim" style="--d:1.4s">Now take the quiz to lock it in.</p>`, say: 'Remember this. ' + t.tip + ' Now take the quiz to lock it in.', last: true });
  return out;
}

/* ---------- player ---------- */
UI.watchPane = (pane, t, goQuiz) => {
  const S_ = slides(t); let i = 0, playing = false, tok = 0, av = null;
  const speed = () => S().wrate || 1;
  pane.innerHTML = `<div class="card watch"><div class="wtop"><div class="wavslot"></div><div class="wmeta"><b>▶ Watch: ${esc(short(t.name, 50))}</b><span class="dim sm" id="wcount"></span></div></div><div class="wstage" id="wstage" aria-live="polite"></div><div class="wcap" id="wcap"></div><div class="wbar"><i id="wfill"></i></div><div class="wctl"><button class="btn sm ghost" id="wprev" aria-label="Previous slide">⏮</button><button class="btn sm primary" id="wplay">▶ Play</button><button class="btn sm ghost" id="wnext" aria-label="Next slide">⏭</button><button class="btn sm ghost" id="wspd" title="Speed"></button><button class="btn sm ghost" id="wgen" title="Voice"></button><button class="btn sm ghost" id="wvoi"></button></div><p class="dim sm">Tap Play and your coach teaches this topic in about 2 minutes. Use ⏮ ⏭ to move. Change the voice or speed any time.</p></div>`;
  const slot = $('.wavslot', pane); if (UI.Avatar) av = UI.Avatar.create(slot, { size: 84 });
  const stage = $('#wstage', pane), cap = $('#wcap', pane);
  const labels = () => { $('#wspd', pane).textContent = speed() + '×'; $('#wgen', pane).textContent = UI.Avatar && UI.Avatar.gender() === 'female' ? '👩 Sasi' : '👨 Venkat'; $('#wvoi', pane).textContent = UI.Avatar && UI.Avatar.voiceOn() ? '🔈' : '🔇'; $('#wplay', pane).textContent = playing ? '⏸ Pause' : '▶ Play'; };
  function render() {
    const s = S_[i]; stage.innerHTML = `<div class="wslide">${s.h}</div>`; cap.textContent = s.say; $('#wfill', pane).style.width = ((i + 1) / S_.length * 100) + '%'; $('#wcount', pane).textContent = 'Slide ' + (i + 1) + ' of ' + S_.length;
    if (s.last && !$('#wquiz', pane)) { const b = document.createElement('button'); b.id = 'wquiz'; b.className = 'btn primary'; b.textContent = 'Take the quiz →'; b.onclick = () => goQuiz && goQuiz(); stage.querySelector('.wslide').appendChild(b); }
    labels();
  }
  function stop() { tok++; if (av) av.stop(); }
  function speak() {
    stop(); const my = tok; const s = S_[i];
    if (!playing) return;
    const done = () => { if (my !== tok || !playing) return; if (i < S_.length - 1) { setTimeout(() => { if (my === tok && playing) { i++; render(); speak(); } }, 700); } else { playing = false; if (!(S().watched || {})[t.id]) UI.addXP && UI.addXP(10); S().watched = S().watched || {}; S().watched[t.id] = 1; UI.save(); labels(); } };
    if (av) av.say(s.say, { rate: .93 * speed(), caption: false, mood: 'idle' }).then(done); else setTimeout(done, Math.min(20000, 2500 + s.say.split(/\s+/).length * 330 / speed()));
  }
  function go(n) { i = Math.max(0, Math.min(S_.length - 1, n)); render(); if (playing) speak(); else stop(); }
  $('#wplay', pane).onclick = () => { playing = !playing; if (playing && i === S_.length - 1) { i = 0; render(); } labels(); if (playing) speak(); else stop(); };
  $('#wprev', pane).onclick = () => go(i - 1); $('#wnext', pane).onclick = () => go(i + 1);
  $('#wspd', pane).onclick = () => { const a = [.85, 1, 1.2, 1.4], k = (a.indexOf(speed()) + 1) % a.length; S().wrate = a[k]; UI.save(); labels(); if (playing) speak(); };
  $('#wgen', pane).onclick = () => { if (!UI.Avatar) return; UI.Avatar.setGender(UI.Avatar.gender() === 'male' ? 'female' : 'male'); S().vg = true; UI.save(); labels(); UI.toast('Voice: ' + UI.Avatar.voiceInfo()); if (playing) speak(); };
  $('#wvoi', pane).onclick = () => { S().vg = S().vg === false; UI.save(); labels(); if (playing) speak(); };
  UI.onLeave && UI.onLeave(() => { playing = false; stop(); });
  render();
};
UI.watchSlides = slides; UI.flowHTML = flowHTML; UI.mapHTML = mapHTML; UI.termList = termList;
return root.UI; }
