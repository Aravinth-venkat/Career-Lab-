/* Padimachi smart search: normal topic search, and a "guide me" assistant that understands what you want and shows where to start. Rule based, runs in your browser. */
/* GENERATED from smart.js by genD.mjs. Do not edit. */
export default function make(root) {
'use strict';
const UI = root.UI, { $, $$, esc, D, mount } = UI, S = () => UI.S, app = $('#app'), V = UI.VIEWS, LD = root.LADDER, LAB = () => UI.LAB || {};
const STOP = new Set('i a an the to of for and or in on at is are am be want like need how what where can do my me you your with about please help learn study start know get some more any from into this that it'.split(' '));
const words = t => String(t || '').toLowerCase().replace(/[^a-z0-9+#. ]+/g, ' ').split(/\s+/).filter(Boolean);
const toks = t => words(t).filter(w => w.length > 1 && !STOP.has(w));
const KWT = { data: ['data analyst', 'data analytics', 'power bi', 'tableau', 'business analyst', 'sql analyst', 'looker'], qa: ['qa engineer', 'quality assurance', 'software testing', 'test engineer', 'selenium', 'sdet', 'manual testing', 'playwright'], teach: ['teacher', 'teaching', 'b.ed', 'bed', 'ctet', 'tet', 'tgt', 'pgt', 'school teacher', 'tutor', 'lecturer'], health: ['nurse', 'nursing', 'gnm', 'hospital', 'medical coding', 'patient care', 'staff nurse', 'healthcare', 'tpa'], dmkt: ['digital marketing', 'seo', 'social media', 'google ads', 'meta ads', 'performance marketing', 'content marketing', 'email marketing', 'ppc'], cyber: ['cyber security', 'cybersecurity', 'soc analyst', 'infosec', 'ethical hacking', 'penetration testing', 'vapt', 'siem', 'security analyst', 'phishing'], cloud: ['devops', 'sre', 'site reliability', 'kubernetes', 'terraform', 'ci cd', 'cloud engineer', 'docker'], servicenow: ['servicenow', 'service now', 'snow', 'itsm', 'glide', 'glide record', 'gliderecord', 'pdi', 'service portal', 'cmdb'], mw: ['moveworks', 'move works', 'movework', 'ai assistant', 'conversational ai'], programming: ['python', 'java', 'javascript', 'coding', 'software', 'full stack', 'fullstack', 'sql', 'git', 'programming', 'react', 'node', 'developer', 'html', 'css'], itfund: ['network', 'networking', 'cloud', 'security', 'cyber', 'aws', 'azure', 'linux', 'it support', 'devops', 'help desk'], hr: ['hr', 'human resource', 'recruit', 'payroll', 'talent'], finance: ['finance', 'account', 'accounting', 'tally', 'gst', 'audit', 'tax', 'banking'], sales: ['sales', 'marketing', 'seo', 'crm', 'digital marketing'], ops: ['supply chain', 'logistics', 'inventory', 'warehouse', 'operations', 'procurement'], support: ['customer support', 'customer service', 'call center', 'bpo', 'support executive'], pm: ['project management', 'scrum', 'agile', 'pmp', 'project manager', 'project'], eng: ['mechanical', 'thermodynamics', 'manufacturing', 'automobile', 'mech'], soft: ['communication', 'english', 'self intro', 'soft skills'], design: ['ui ux', 'ux', 'ui design', 'figma', 'graphic', 'photoshop', 'designer', 'design'], cad: ['cad', 'autocad', 'solidworks', 'catia', 'draughtsman', 'drafting'], civil: ['civil', 'construction', 'site engineer', 'structural', 'surveying'], elec: ['electrical', 'electronics', 'embedded', 'plc', 'circuit', 'eee', 'ece'], ind: ['quality', 'safety', 'six sigma', 'lean', 'iso', 'ehs', 'industrial'] };
const trackHits = text => { const raw = String(text), t = ' ' + raw.toLowerCase().replace(/[^a-z0-9+#. ]+/g, ' ') + ' '; const out = []; Object.keys(KWT).forEach(k => { let best = -1, len = 0; KWT[k].forEach(w => { const i = t.indexOf(' ' + w + ' '); if (i >= 0 && w.length > len) { best = i; len = w.length; } }); if (best >= 0) out.push({ track: k, pos: best, len }); }); const m = raw.match(/\bIT\b/); if (m && !out.some(o => o.track === 'itfund')) out.push({ track: 'itfund', pos: m.index + 1, len: 2 }); out.forEach(o => { o.from = /(i am|i'm|as|from|work(ed|ing)? (as|in)|background in|studied|graduate in|degree in|btech in|b\.?e\.? in)( a| an| the)?\s*$/.test(t.slice(Math.max(0, o.pos - 32), o.pos + 1)); }); return out.sort((a, b) => a.pos - b.pos); };
const yearsOf = text => { const m = String(text).match(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/i); if (m) return +m[1]; if (/\b(fresher|student|beginner|no experience|just graduated|graduate|zero experience)\b/i.test(text)) return 0; return null; };
const INTENTS = [
  ['switch', /\b(switch|change career|changing career|career change|transition|shift to|move to|moving to|jump to|move into|get into|enter|from .{2,30} to)\b/i],
  ['jobs', /\b(job|jobs|opportunit|compan(y|ies)|hiring|vacanc|apply|openings?)\b/i],
  ['code', /\b(code|coding|script|scripting|hands.?on|program(ming)?|write a|background script|practice (the )?script|lab)\b/i],
  ['interview', /\b(interview|mock|round|rounds|prepare|preparation|questions?)\b/i],
  ['level', /\b(level|levels|promotion|promoted|position|designation|senior|lead|ladder|grow|growth|next step)\b/i],
  ['resume', /\b(resume|cv)\b/i],
  ['speak', /\b(english|speak|speaking|pronounc|communicat|self.?intro|introduce|fluency)\b/i],
  ['profile', /\b(setting|settings|profile|theme|dark mode|voice|goal|streak|xp|my progress)\b/i],
  ['learn', /\b(learn|study|start|begin|teach|understand|course|tutorial|how to|know about|basics|become)\b/i]
];
const intentOf = text => { for (const [k, re] of INTENTS) if (re.test(text)) return k; return null; };
const roleOf = text => /\b(admin|administrator|administration)\b/i.test(text) ? 'admin' : /\b(develop\w*|dev|script\w*|coder|programmer)\b/i.test(text) ? 'dev' : null;

/* ---------- normal search ---------- */
const sc = (hay, tk) => { if (!tk.length) return 0; hay = hay.toLowerCase(); let n = 0; tk.forEach(w => { if (hay.includes(w)) n++; }); return n >= Math.ceil(tk.length / 2) ? n / tk.length : 0; };
const PAGES = [['Learn: all topics', '#/learn', 'learn topics lessons study read'], ['Study paths', '#/paths', 'study path role admin developer roadmap plan'], ['Coding lab', '#/lab', 'code coding script python java javascript html css practice lab hands on'], ['Career levels', '#/ladder', 'career level promotion position senior lead ladder designation'], ['Jobs and interview rounds', '#/jobs', 'jobs companies opportunities interview rounds apply hiring'], ['Switch careers', '#/switch', 'switch change career transition move field'], ['Mock interview', '#/mock', 'mock interview practice follow up'], ['Speaking lab', '#/speak', 'speaking english fillers grammar pace voice'], ['Resume studio', '#/career/resume', 'resume cv score improve upload'], ['Job description match', '#/career/jd', 'job description jd match'], ['Daily challenge', '#/challenge', 'daily challenge quiz streak'], ['Practice games', '#/practice', 'practice games flashcards quiz'], ['Interview questions', '#/interview', 'interview questions hr technical scenarios'], ['My progress', '#/progress', 'progress badges xp score'], ['Profile and settings', '#/profile', 'profile settings theme voice goal availability microphone'], ['How it works', '#/guide', 'help guide how it works tour']];
function search(text) {
  const tk = toks(text), phrase = words(text).join(' '); if (!tk.length) return [];
  const groups = [], add = (title, items) => { if (items.length) groups.push({ title, items }); };
  const tp = D.TOPICS.map(t => { const al = (t.aliases || ''), s = sc(t.name, tk) * 4 + sc(al, tk) * 3 + (phrase.length > 2 && t.name.toLowerCase().includes(phrase) ? 3 : 0); return { t, s }; }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8);
  add('Topics', tp.map(x => ({ t: x.t.ic + ' ' + x.t.name, d: (UI.trackOf(x.t.track) || {}).name + ' · ' + x.t.facts.length + ' key terms', href: '#/topic/' + x.t.id })));
  const terms = D.FACTS.filter(f => sc(f.t, tk) >= 1 || (phrase.length > 3 && f.t.toLowerCase().includes(phrase))).slice(0, 6);
  add('Key terms', terms.map(f => ({ t: f.t, d: f.d, href: '#/topic/' + f.topic + '/terms' })));
  add('Study paths', (D.PATHS || []).filter(p => sc(p.name + ' ' + p.desc + ' ' + (UI.trackOf(p.track) || {}).name, tk) > 0).slice(0, 5).map(p => ({ t: '🗺️ ' + p.name, d: p.desc, href: '#/paths/' + p.track + '/' + p.id })));
  const labs = []; Object.keys(LAB()).forEach(k => LAB()[k].forEach(c => { if (sc(c.title + ' ' + c.prompt, tk) >= 0.6) labs.push({ t: '💻 ' + c.title, d: k.toUpperCase() + ' lab · ' + ['', 'basics', 'working level', 'advanced'][c.tier], href: '#/lab/' + k + '/' + c.id }); })); add('Coding practice', labs.slice(0, 5));
  const lv = []; Object.keys(LD.tracks).forEach(k => LD.tracks[k].levels.forEach((l, i) => { if (sc(l.t + ' ' + l.alt, tk) >= 0.6) lv.push({ t: '🪜 ' + l.t, d: 'Level ' + (i + 1) + ' in ' + (UI.trackOf(k) || {}).name, href: '#/ladder/' + k + '/' + [0, 0.5, 1, 3, 6, 9, 13][i] }); })); add('Career levels', lv.slice(0, 5));
  add('Interview questions', D.OPEN.filter(o => sc(o.q, tk) >= 0.6).slice(0, 4).map(o => ({ t: o.q, d: o.cat, href: '#/interview/' + (o.cat === 'Technical' ? 'tech' : 'hr') })));
  add('Pages', PAGES.filter(p => sc(p[0] + ' ' + p[2], tk) > 0).slice(0, 5).map(p => ({ t: p[0], d: 'Open this page', href: p[1] })));
  return groups;
}

/* ---------- guide me (live agent) ---------- */
const labOf = text => /javascript|\bjs\b|node|react/i.test(text) ? 'js' : /\bpython\b/i.test(text) ? 'py' : /\bjava\b/i.test(text) ? 'java' : /html|css|web ?page|front.?end|full.?stack/i.test(text) ? 'web' : /servicenow|service now|glide|background script/i.test(text) ? 'sn' : null;
const tn = id => (UI.trackOf(id) || { name: 'your field' }).name;
const firstPath = (tr, role) => { const ps = (D.PATHS || []).filter(p => p.track === tr); return role === 'admin' ? ps.find(p => p.id === 'snadmin') || ps[0] : role === 'dev' ? ps.find(p => p.id === 'sndev') || ps[0] : ps[0]; };
const topicsOf = p => p ? [...new Set(p.stages.flatMap(s => s.topics))].map(id => D.TOPICS.find(t => t.id === id)).filter(Boolean) : [];
const step = (t, d, href, btn) => ({ t, d, href, btn });
function answer(text, ctx) {
  const hits = trackHits(text), intent = intentOf(text), role = roleOf(text) || (ctx && ctx.role), yrs = yearsOf(text), skip = new Set(); hits.forEach(h => KWT[h.track].forEach(w => words(w).forEach(x => skip.add(x)))); const tp = findTopic(text, skip);
  const years = yrs !== null ? yrs : (ctx && ctx.years !== undefined ? ctx.years : (S().lad && S().lad.years !== undefined ? S().lad.years : null));
  let track = hits.length ? hits[0].track : (ctx && ctx.track) || (tp ? tp.track : null); if (ctx && ctx.track === 'servicenow' && roleOf(text) && hits.every(h => h.track === 'programming' || h.track === 'servicenow')) track = 'servicenow';
  const m = { ctx: { track, role, years: yrs !== null ? yrs : ctx && ctx.years } };
  if (hits.length === 1 && hits[0].track === 'programming' && /developer/i.test(text) && /servicenow/i.test(text)) track = 'servicenow';
  /* switching */
  const sw = intent === 'switch' || (hits.length >= 2 && /\b(want|wish|like|looking|planning|plan|trying|interested|need)\b/i.test(text) && /\b(i am|i'm|as a|as an|from|work|worked|working|background|studied|graduate|degree|engineer)\b/i.test(text));
  if (sw && (hits.length >= 2 || (hits.length === 1 && S().track && S().track !== hits[0].track && intent === 'switch'))) {
    let from, to;
    if (hits.length >= 2) { const f = hits.find(h => h.from) || hits[0]; from = f.track; to = (hits.find(h => h.track !== from) || hits[1]).track; } else { from = S().track; to = hits[0].track; }
    const y = years === null ? 2 : years, L1 = LD.tracks[to].levels[y < 3 ? 1 : 2], p = firstPath(to);
    m.text = `You want to move from <b>${esc(tn(from))}</b> to <b>${esc(tn(to))}</b>. Many people do this. You will probably start as <b>${esc(L1.t)}</b> and grow fast if you show real learning.`;
    m.steps = [step('Read your switch plan', 'It shows what you already bring, a 90 day study plan, projects, your self introduction and how to answer "why are you switching?".', `#/switch/${from}/${to}/${y}`, 'Open my plan'), step('Learn the basics first', topicsOf(p).slice(0, 3).map(t => t.name).join(', ') || tn(to), p ? `#/paths/${to}/${p.id}` : `#/learn/${to}`, 'Open study path'), step('Practise out loud', 'Practise your self introduction until it sounds natural.', '#/speak/intro', 'Practise now'), step('Find jobs for switchers', 'Roles, companies and interview rounds for your new field.', `#/jobs/${to}/${y < 3 ? 0.5 : 2}`, 'See jobs')];
    m.chips = ['Where do I practise coding?', 'Show jobs for ' + tn(to), 'What interview rounds should I expect?']; return m;
  }
  if (intent === 'code') {
    const lab = labOf(text) || (track === 'servicenow' ? 'sn' : 'js'), names = { sn: 'ServiceNow script', js: 'JavaScript', web: 'web page', py: 'Python', java: 'Java' }, tier = years === null || years < 1 ? 'basic' : years < 3 ? 'working level' : 'advanced';
    m.text = `For hands-on practice, open the <b>${names[lab]} lab</b>. You will see <b>${tier}</b> questions${years === null ? ' (tell me your years of experience to change this)' : ''}. Write the code, press run and see your percentage score.`;
    m.steps = [step('Open the ' + names[lab] + ' lab', 'Pick a question. Each one has a hint and a model solution after you try.', '#/lab/' + lab, 'Start practising'), step('Set your experience', 'The lab shows only questions that match your experience.', '#/lab', 'Choose level'), step('Understand the interview round', 'See what hands-on rounds look like at your level.', '#/jobs', 'See rounds')];
    m.chips = lab === 'sn' ? ['Show me Python practice', 'I have 3 years experience'] : ['Show me ServiceNow script practice', 'Show me Java practice']; return m;
  }
  if (intent === 'jobs') {
    const tr = track || S().track || 'servicenow', y = years === null ? 1 : years, L = LD.tracks[tr].levels[LD.levelFor(y)];
    m.text = `For <b>${esc(tn(tr))}</b> at your level, look for <b>${esc(L.t)}</b> roles. I show roles, companies that hire in your field and the interview rounds to expect.`;
    m.steps = [step('See roles and companies', 'With search links for LinkedIn, Naukri and Indeed.', `#/jobs/${tr}/${y}`, 'Open jobs'), step('Prepare for the rounds', 'Each round has a button to practise it.', `#/jobs/${tr}/${y}`, 'See the rounds'), step('Fix your resume first', 'A clear resume gets more calls.', '#/career/resume', 'Check resume')];
    m.chips = ['What interview rounds should I expect?', 'How do I reach the next level?']; return m;
  }
  if (intent === 'level') {
    const tr = track || S().track || 'servicenow', y = years === null ? 1 : years;
    m.text = `This shows the <b>company ladder in ${esc(tn(tr))}</b>, where you are with ${y} year${y === 1 ? '' : 's'}, and what the next position needs.`;
    m.steps = [step('See where you stand', 'All seven levels from Intern to Head, with what each person does.', `#/ladder/${tr}/${y}`, 'Open career levels'), step('Study for the next level', 'Topics and skills to tick off.', `#/ladder/${tr}/${y}`, 'See the next level')]; return m;
  }
  if (intent === 'resume') { m.text = 'Add your resume and Padimachi gives a score, shows what to fix and builds questions from your own projects.'; m.steps = [step('Add or check your resume', 'Upload .docx, .pdf or .txt, or paste text.', '#/career/resume', 'Open resume studio'), step('Match a job description', 'See which words your resume is missing.', '#/career/jd', 'Match a job'), step('Practise your projects', 'Questions come from your own resume.', '#/project', 'Project interview')]; return m; }
  if (intent === 'speak') { m.text = 'Speaking is the fastest way to get interview ready. Start with your self introduction, then fix filler words and pace.'; m.steps = [step('Practise your self introduction', 'Say it out loud and get feedback.', '#/speak/intro', 'Start'), step('Speaking lab', 'Fillers, grammar and pace.', '#/speak', 'Open'), step('Mock interview', 'Questions that follow up on your answers.', '#/mock', 'Try a mock')]; return m; }
  if (intent === 'profile') { m.text = 'Your profile shows your current state, your settings and which features work on this device.'; m.steps = [step('Open your profile', 'Settings, progress and device check.', '#/profile', 'Open profile')]; return m; }
  if (intent === 'interview') {
    const tr = track || S().track || 'servicenow', y = years === null ? 1 : years;
    m.text = `To prepare for a <b>${esc(tn(tr))}</b> interview, follow this order: know the rounds, learn the topics, practise scenarios, then do mock interviews.`;
    m.steps = [step('Know the rounds', 'What happens in each round at your level.', `#/jobs/${tr}/${y}`, 'See rounds'), step('Practise real situations', 'Scenario questions with step by step answers.', '#/interview/scenarios', 'Open scenarios'), step('Technical questions', 'With model answers.', '#/interview/tech', 'Open questions'), step('Mock interview', 'Spoken questions with follow ups.', '#/mock', 'Start mock')]; return m;
  }
  /* learning (default when a field or topic is known) */
  if (track === 'servicenow' && !role && !tp) { m.ask = true; m.text = 'ServiceNow has two main roles. <b>Administrators</b> configure and run the platform. <b>Developers</b> write scripts, build apps and integrations. Which one do you want?'; m.chips = ['Administrator', 'Developer', 'Not sure, tell me the difference']; m.ctx.track = 'servicenow'; return m; }
  if (/not sure|difference/i.test(text) && ctx && ctx.track === 'servicenow') { m.text = 'An <b>administrator</b> keeps the platform running: users, forms, workflows, reports and imports. A <b>developer</b> builds new things with code: scripts, integrations and apps. Beginners often start as administrators, then move to development. Pick one and I will show where to start.'; m.chips = ['Administrator', 'Developer']; m.ctx.track = 'servicenow'; return m; }
  if (tp && (!hits.length || tp.track === track)) {
    m.text = `For <b>${esc(tp.name)}</b>, study in this order: read the lesson, go deeper, learn the key terms, take the quiz, then solve the real situation.`;
    m.steps = [step('Learn the idea', tp.story, '#/topic/' + tp.id, 'Open lesson'), step('Go deeper', 'How it works step by step, common mistakes, hands-on tasks and interview answers.', '#/topic/' + tp.id + '/deep', 'Deep dive'), step('Learn the key terms', tp.facts.slice(0, 4).map(f => f.t).join(', ') + '…', '#/topic/' + tp.id + '/terms', 'Key terms'), step('Test yourself', 'Quiz, then a real-time scenario.', '#/topic/' + tp.id + '/quiz', 'Take the quiz'), step('Find more to read', 'Official and free study areas.', '#/topic/' + tp.id + '/study', 'Study more')]; return m;
  }
  if (track) {
    const p = firstPath(track, role), ts = topicsOf(p), yl = years === null ? '' : years < 1 ? ' Since you are starting out, begin at stage 1 and go in order.' : ' With your experience, skim stage 1 and spend time on the later stages.';
    m.text = `You want to learn <b>${esc(tn(track))}${role ? ' as ' + (role === 'admin' ? 'an administrator' : 'a developer') : ''}</b>. Here is where to start.${yl}`;
    m.steps = [step('Open your study path', p ? p.name + ': ' + p.stages.length + ' stages from basics to interview ready.' : 'All topics in this field.', p ? `#/paths/${track}/${p.id}` : `#/learn/${track}`, 'Start here'), step('Your first topics', ts.slice(0, 3).map(t => t.name).join(', ') || 'See the learn page', ts[0] ? '#/topic/' + ts[0].id : '#/learn/' + track, 'Open first topic')];
    if (track === 'servicenow') m.steps.push(step('Get a free practice instance', 'ServiceNow gives a free Personal Developer Instance so you can practise on a real platform.', 'https://developer.servicenow.com', 'Open developer site'), step(role === 'admin' ? 'Practise configuration tasks' : 'Practise scripting', role === 'admin' ? 'Each topic has hands-on tasks in the Deep dive tab.' : 'Write scripts and see your score.', role === 'admin' ? '#/topic/snausers/deep' : '#/lab/sn', 'Open practice'));
    else if (['programming', 'itfund', 'mw', 'design'].includes(track)) m.steps.push(step('Practise hands-on', 'Write code or build a small project and see your score.', track === 'programming' ? '#/lab' : '#/paths/' + track, 'Open practice'));
    m.steps.push(step('Prepare for interviews', 'Know the rounds and practise out loud.', `#/jobs/${track}/${years === null ? 0.5 : years}`, 'Interview prep'));
    m.chips = ['Which companies hire for this?', 'How do I reach the next level?', 'I want to switch from another field']; return m;
  }
  if (!hits.length && !tp) {
    const g = search(text); m.text = g.length ? 'I am not sure what you want to do, but here is what I found. You can also tell me more, for example: <i>"I am a fresher and want to learn Python"</i>.' : 'I did not understand that. Tell me what you want in your own words, for example: <i>"I like to learn ServiceNow"</i> or <i>"I am a mechanical engineer and want an IT job"</i>.';
    m.found = g; m.chips = ['I like to learn ServiceNow', 'Coding practice for Python', 'I am a mechanical engineer and want an IT job']; return m;
  }
  m.text = 'Tell me more about what you want.'; return m;
}
function findTopic(text, skip) { const tk = toks(text).filter(w => !(skip && skip.has(w))); if (!tk.length) return null; let best = null, bs = 0; D.TOPICS.forEach(t => { const s = sc(t.name, tk) * 4 + sc(t.aliases || '', tk) * 2; if (s > bs) { bs = s; best = t; } }); return bs >= 2.5 ? best : null; }

/* ---------- views ---------- */
const SAMPLES = ['I like to learn ServiceNow', 'Coding practice for Python', 'I am a mechanical engineer and want an IT job', 'What interview rounds should I expect?', 'Business rules'];
const botHTML = m => `<div class="bubble bot"><div class="bt">${m.text}</div>${m.steps ? `<ol class="gsteps">${m.steps.map((s, i) => `<li><div><b>${esc(s.t)}</b><p class="dim sm">${esc(s.d || '')}</p></div>${s.href.startsWith('http') ? `<a class="btn sm primary" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">${esc(s.btn)}</a>` : `<a class="btn sm ${i === 0 ? 'primary' : ''}" href="${esc(s.href)}">${esc(s.btn)}</a>`}</li>`).join('')}</ol>` : ''}${m.found ? resultsHTML(m.found) : ''}${m.chips ? `<div class="chips qc">${m.chips.map(c => `<button class="chip ask">${esc(c)}</button>`).join('')}</div>` : ''}</div>`;
const resultsHTML = g => g.map(x => `<div class="rg"><h3>${esc(x.title)}</h3>${x.items.map(i => `<a class="card hover rr" href="${esc(i.href)}"><b>${esc(i.t)}</b><span class="dim sm">${esc(i.d)}</span></a>`).join('')}</div>`).join('');

V.search = (qEnc) => {
  const q0 = decodeURIComponent(qEnc || ''), mode = S().sm;
  if (!mode) {
    mount(app, `<h1>🔍 Search</h1><p class="dim">How would you like search to work? You can change this any time.</p><div class="grid"><button class="card hover tcard" data-m="agent"><div class="ic">🧭</div><h3>Guide me</h3><p class="dim sm">Tell me what you want in your own words, like "I like to learn ServiceNow". I show where to start, step by step, like a live agent.</p></button><button class="card hover tcard" data-m="search"><div class="ic">🔎</div><h3>Normal search</h3><p class="dim sm">Type a word and get a list of matching topics, key terms, questions and pages.</p></button></div><div class="row"><button class="btn" id="dm">▶ Show me how it works first</button></div>`);
    $$('[data-m]', app).forEach(b => b.onclick = () => { S().sm = b.dataset.m; UI.save(); V.search(qEnc); }); $('#dm').onclick = () => { S().sm = 'agent'; UI.save(); V.search(qEnc); setTimeout(() => demo(), 300); }; return;
  }
  mount(app, `<h1>🔍 Search</h1><div class="tabs"><button data-m="agent" class="${mode === 'agent' ? 'on' : ''}">🧭 Guide me</button><button data-m="search" class="${mode === 'search' ? 'on' : ''}">🔎 Normal search</button></div>
  <div class="card sbox"><form id="sf" autocomplete="off"><input type="text" id="sq" placeholder="${mode === 'agent' ? 'Tell me what you want, for example: I like to learn ServiceNow' : 'Search topics, terms, questions, pages'}" aria-label="Search" value="${esc(mode === 'search' ? q0 : '')}"><button class="btn primary" type="submit" aria-label="Search">Go</button>${root.SpeechRecognition || root.webkitSpeechRecognition ? '<button class="btn" type="button" id="mic" aria-label="Speak">🎤</button>' : ''}</form><div class="chips" id="samples">${SAMPLES.map(s => `<button class="chip ask">${esc(s)}</button>`).join('')}</div>${mode === 'agent' ? '<div class="row"><button class="btn sm" id="dm">▶ Show me how it works</button></div>' : ''}</div><div id="chat" class="chat" aria-live="polite"></div>`);
  $$('.tabs button', app).forEach(b => b.onclick = () => { S().sm = b.dataset.m; UI.save(); V.search(qEnc); });
  const chat = $('#chat'), sq = $('#sq'); let ctx = {};
  const say = (text, who) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = who === 'me' ? `<div class="bubble me">${esc(text)}</div>` : ''; chat.appendChild(d); return d; };
  const handle = text => {
    text = text.trim(); if (!text) return;
    if (S().sm === 'search') { chat.innerHTML = ''; const g = search(text); chat.innerHTML = g.length ? resultsHTML(g) + (S().sm === 'search' ? '<p class="dim sm">Want step by step help instead? Switch to <b>Guide me</b> above.</p>' : '') : `<div class="card"><p>No results for "${esc(text)}". Try another word, or switch to <b>Guide me</b> and describe what you want.</p></div>`; return; }
    say(text, 'me'); const r = answer(text, ctx); ctx = Object.assign({}, ctx, r.ctx || {}); const d = say('', 'bot'); d.innerHTML = botHTML(r); bind(d); d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const bind = el => $$('.ask', el).forEach(b => b.onclick = () => { const t = b.textContent; if (S().sm === 'search') sq.value = t; handle(t); });
  bind(app);
  $('#sf').onsubmit = e => { e.preventDefault(); const t = sq.value; if (S().sm === 'agent') sq.value = ''; handle(t); };
  const dm = $('#dm'); if (dm) dm.onclick = () => demo();
  const mic = $('#mic'); if (mic) mic.onclick = () => { const R = root.SpeechRecognition || root.webkitSpeechRecognition, r = new R(); r.lang = S().lang || 'en-IN'; r.onresult = e => { const t = e.results[0][0].transcript; sq.value = t; $('#sf').requestSubmit(); }; r.onerror = () => UI.toast('Could not hear you. Check microphone permission.'); try { r.start(); UI.toast('Listening…'); } catch (e) {} };
  if (q0) { if (S().sm === 'agent') handle(q0); else handle(q0); }
};

/* ---------- demo: shows how search works ---------- */
let demoRun = 0;
async function demo() {
  const run = ++demoRun, sleep = ms => new Promise(r => setTimeout(r, ms)), alive = () => run === demoRun && document.body.contains($('#sq'));
  if (S().sm !== 'agent') { S().sm = 'agent'; UI.save(); V.search(''); await sleep(300); }
  const sq = $('#sq'), chat = $('#chat'); if (!sq) return; chat.innerHTML = '';
  const cap = document.createElement('div'); cap.className = 'democap'; cap.innerHTML = '<b></b><small></small><button class="btn sm" id="dstop">Stop demo</button>'; chat.before(cap);
  const say = (n, t) => { cap.querySelector('b').textContent = n; cap.querySelector('small').textContent = t; };
  cap.querySelector('#dstop').onclick = () => { demoRun++; cap.remove(); sq.classList.remove('hl'); };
  const finish = () => { cap.remove(); sq.classList.remove('hl'); };
  say('Step 1 of 4', 'Type what you want in your own words.'); sq.classList.add('hl'); sq.focus();
  const txt = 'I like to learn ServiceNow'; sq.value = ''; for (const ch of txt) { if (!alive()) return finish(); sq.value += ch; await sleep(55); } await sleep(500);
  if (!alive()) return finish(); sq.classList.remove('hl'); $('#sf').requestSubmit(); sq.value = '';
  say('Step 2 of 4', 'I understand the field. When I need more detail, I ask you.'); await sleep(2600); if (!alive()) return finish();
  const chip = $$('#chat .qc .chip').find(c => /developer/i.test(c.textContent)); if (chip) { chip.classList.add('hl'); say('Step 3 of 4', 'Tap an answer. Here we choose Developer.'); await sleep(1800); if (!alive()) return finish(); chip.click(); }
  await sleep(500); say('Step 4 of 4', 'Follow the steps from top to bottom. The first button, "Start here", takes you to the right place.'); await sleep(3500);
  if (alive()) { say('Your turn', 'Type your own goal above, for example: "coding practice for Python".'); sq.focus(); await sleep(4000); } finish();
}
UI.searchDemo = demo;
UI.smart = { answer, search, trackHits, intentOf, yearsOf, roleOf };
return root.UI; }
