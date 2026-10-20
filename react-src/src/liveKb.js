/* Knowledge layer for the chat: security questions (legal and ethical only), definitions from topic facts, and matching to interview questions. */
/* GENERATED from kb.js by genD.mjs. Do not edit. */
export default function make(root) {
'use strict';
const UI = root.UI, D = UI.D || {}, esc = UI.esc;
const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9+# ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set('the a an of to in on for and or is are do does you your i me my how what why can should would tell about with it this that be at as by'.split(' '));
const toks = t => norm(t).split(' ').filter(w => w.length > 1 && !STOP.has(w));
const SEC = /\b(hack\w*|crack\w*|cyber\s*secur\w*|infosec|phishing|malware|ransomware|keylogger|ddos|exploit\w*|sql injection|xss|pentest\w*|penetration test\w*|ethical hack\w*|bug bounty|ctf|soc analyst|vulnerabilit\w*|brute\s*force|spyware|trojan|botnet|cve|owasp|kali linux|metasploit|burp ?suite|nmap|wireshark|firewall|encryption|zero.?day)\b/i;
const ATTACK = /(hack|crack|break into|get into|spy on|track|access|steal|bypass|ddos|attack|jam|clone|take over)[^.?]{0,40}(someone|somebody|girlfriend|boyfriend|wife|husband|friend|neighbou?r|ex\b|his|her|their|instagram|facebook|whatsapp|gmail|account|wi-?fi|wifi|phone|password|website|server|bank|atm|upi|college|school|company)|(make|build|create|write|code)[^.?]{0,25}(virus|malware|ransomware|keylogger|trojan|botnet|rat\b)|free (wi-?fi|wifi) password|password of (my )?(neighbou?r|friend|someone)|how to hack/i;
const LEARN = [
  { t: 'Learn the basics first', d: 'Networking (IP, DNS, HTTP), Linux commands and one scripting language. Every security job needs these.', href: '#/topic/cdlin', btn: 'Linux topic' },
  { t: 'Practise legally in labs', d: 'TryHackMe, Hack The Box and OWASP Juice Shop are made for practice. You hack only machines built for it.', href: 'https://tryhackme.com', btn: 'TryHackMe' },
  { t: 'Earn a recognised certificate', d: 'CompTIA Security+, then CEH or eJPT for hands-on testing. Employers in India ask for these.', href: 'https://www.google.com/search?q=' + encodeURIComponent('Security+ CEH eJPT certification India'), btn: 'See options' },
  { t: 'Find real work legally', d: 'SOC analyst, VAPT trainee, security analyst. Bug bounty on HackerOne or Bugcrowd is allowed only inside the stated scope.', href: 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent('SOC analyst'), btn: 'Search jobs' }
];
const DEFS = [
  [/phishing/, '<b>Phishing</b> is a fake email, SMS or page that tricks you into giving a password, OTP or money. Defence: check the sender and link, never share OTP, and use two-step login. Companies train staff to report such mails.'],
  [/ransomware/, '<b>Ransomware</b> locks files and asks for money. Defence: offline backups, updates, no unknown attachments, and limited admin rights. Security teams plan how to restore without paying.'],
  [/malware|virus|trojan|spyware/, '<b>Malware</b> is harmful software such as viruses, trojans and spyware. Defence: install only trusted apps, keep the system updated, use antivirus or endpoint protection, and watch for odd behaviour.'],
  [/sql injection/, '<b>SQL injection</b> happens when a site puts user input straight into a database query, so an attacker can change the query. Developers stop it with parameterised queries and input checks. Testers check for it only on systems they have written permission to test.'],
  [/\bxss\b|cross.site scripting/, '<b>XSS</b> lets harmful script run in another user\'s browser because a site shows input without cleaning it. Defence: output encoding, a content security policy, and safe frameworks.'],
  [/ddos/, '<b>DDoS</b> floods a service with traffic until real users cannot reach it. Defence: rate limits, CDN and traffic filtering. Doing it to anyone is a crime.'],
  [/firewall/, 'A <b>firewall</b> allows or blocks network traffic by rules, such as which ports and addresses may connect. It is the first gate of a network, not the only one.'],
  [/encryption/, '<b>Encryption</b> scrambles data so only someone with the key can read it. Used in HTTPS, WhatsApp and bank apps. Know the difference between encryption in transit and at rest.'],
  [/brute\s*force/, 'A <b>brute-force attack</b> tries many passwords until one works. Defence: long passwords, lockout after failed tries, two-step login.'],
  [/zero.?day/, 'A <b>zero-day</b> is a flaw nobody has fixed yet, so there is no patch. Defence: layered security, monitoring and quick patching once a fix appears.'],
  [/vulnerabilit|cve|owasp/, 'A <b>vulnerability</b> is a weakness that could be abused. CVE numbers name known ones and OWASP Top 10 lists the most common web ones. Security teams find, rank and fix them.'],
  [/soc analyst/, 'A <b>SOC analyst</b> watches alerts from security tools, decides what is real, and escalates or contains incidents. Entry skills: networking, Linux, logs, SIEM basics. Fresher roles are called L1 analyst.'],
  [/pentest|penetration|vapt|ethical hack/, '<b>Ethical hacking or penetration testing</b> means testing a system for weaknesses with written permission and a clear scope, then reporting fixes. Without permission the same act is illegal under the IT Act 2000.']
];
const ref = (a, ctx) => Object.assign({ text: '', steps: [], chips: [], found: [] }, a, { ctx: ctx || {} });
function security(text) {
  if (/\b(crack\w*|hack\w*)\s+(an?\s+|the\s+|my\s+|your\s+)?(interview|exam|test|placement|job|aptitude|upsc|gate|ctet|campus|round)/i.test(text) && !ATTACK.test(text.replace(/crack\w*|hack\w*/ig, 'x'))) return null;
  if (!SEC.test(text) && !ATTACK.test(text)) return null;
  if (ATTACK.test(text)) return ref({ text: 'I cannot help with getting into someone else\'s account, phone, Wi-Fi or system. That is a crime in India (IT Act 2000, sections 43 and 66) and can mean jail and a fine. <b>But a legal path exists</b>, and it pays well. Here is how to start:', steps: LEARN, chips: ['What is ethical hacking?', 'SOC analyst interview questions', 'How do I protect my own account?'] });
  const d = DEFS.find(x => x[0].test(text.toLowerCase()));
  if (d && !/(learn|start|career|job|become|roadmap|how to)/i.test(text)) return ref({ text: d[1], chips: ['How do I start a career in cyber security?', 'Interview questions on ethics'] });
  if (/protect|safe|secure my|strong password|stay safe/i.test(text)) return ref({ text: 'Simple steps that block most attacks: <b>use a different long password for each site, turn on two-step login, never share OTP, install updates, and check links before clicking</b>. Use a password manager if you can.', chips: ['What is phishing?', 'How do I start a career in cyber security?'] });
  return ref({ text: 'Cyber security is a real career in India. You learn how systems break so you can defend them, always <b>with permission</b>. Follow these steps:', steps: LEARN, chips: ['What is a SOC analyst?', 'What is phishing?', 'Interview questions on ethics'] });
}
function define(text) {
  const m = /^(?:what is|what are|what's|define|explain|meaning of|tell me about)\s+(?:an?\s+|the\s+)?(.+?)\??$/i.exec(text.trim()); if (!m || !D.FACTS) return null;
  const k = norm(m[1]); if (k.length < 3) return null;
  const PRE = /^(dm|health|teach|security|attack|login|network|soc) /, strip = x => norm(x).replace(PRE, ''), sp = x => norm(x).replace(/ /g, ''), ks = k.replace(/ /g, '');
  const f = D.FACTS.find(x => norm(x.t) === k) || D.FACTS.find(x => strip(x.t) === k) || D.FACTS.find(x => sp(x.t) === ks) || D.FACTS.find(x => norm(x.t).startsWith(k + ' ') && k.length > 4) || D.FACTS.find(x => strip(x.t).startsWith(k + ' ') && k.length >= 3);
  if (!f) {
    const o = (D.OPEN || []).find(x => { const n = ' ' + norm(x.q) + ' '; return /^ (what is|what are|what s) /.test(n) && n.indexOf(' ' + k + ' ') >= 0 && k.length >= 3; });
    if (o) return ref({ text: '<b>' + esc(o.q) + '</b><br>' + esc(o.m), steps: [{ t: 'Practise this question', d: 'Answer it, then get feedback on your words.', href: '#/interview/q/' + o.id, btn: 'Practise' }] });
    return null;
  }
  return ref({ text: '<b>' + esc(f.t) + '</b>: ' + esc(f.d), steps: [{ t: 'Learn it properly', d: 'Open the topic for a story, examples and practice.', href: '#/topic/' + f.topic, btn: 'Open topic' }], chips: ['Give an example', 'Tell me more'] }, { last: f.t, topic: f.topic });
}
function question(text) {
  if (!D.OPEN) return null; const a = toks(text); if (a.length < 2 && !/yourself/i.test(text)) return null;
  const sa = new Set(a); let best = null, bs = 0;
  D.OPEN.forEach(o => { const b = toks(o.q); if (!b.length) return; let c = 0; b.forEach(w => { if (sa.has(w)) c++; }); const s = c / Math.max(b.length, a.length); if (s > bs) { bs = s; best = o; } });
  if (!best || bs < 0.6) return null;
  return ref({ text: 'This looks like the interview question <b>"' + esc(best.q) + '"</b>. How to answer: ' + esc(best.m), steps: [{ t: 'Practise this question', d: 'Answer it, then get feedback on your words.', href: '#/interview/q/' + best.id, btn: 'Practise' }], chips: ['Show HR questions'] });
}

const stem = w => w.length > 4 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w;
const tokset = t => new Set(toks(t).map(stem));
const FAQ = () => root.FAQ || [];
function faqScore(text, f) {
  const n = ' ' + norm(text) + ' ', ts = tokset(text); let sc = 0;
  f.k.forEach(k => { const kn = norm(k); if (!kn) return; if (n.indexOf(' ' + kn + ' ') >= 0 || n.indexOf(' ' + kn.split(' ').map(stem).join(' ') + ' ') >= 0) { sc += kn.split(' ').length * 2; return; } const kt = kn.split(' ').filter(w => w.length > 1 && !STOP.has(w)).map(stem); if (kt.length > 1 && kt.every(w => ts.has(w))) sc += kt.length * 1.5; else if (kt.length === 1 && kt[0].length > 3 && ts.has(kt[0])) sc += 1; });
  return sc;
}
function related(text, n) {
  if (!D.OPEN) return []; const a = tokset(text); if (!a.size) return [];
  return D.OPEN.map(o => { const b = toks(o.q); let c = 0; b.forEach(w => { if (a.has(w)) c++; }); return { o, s: c / Math.max(1, Math.min(b.length, 6)) }; }).filter(x => x.s >= 0.34).sort((x, y) => y.s - x.s).slice(0, n).map(x => ({ t: x.o.q, href: '#/interview/q/' + x.o.id }));
}
function faq(text, ctx) {
  const list = FAQ(); if (!list.length) return null; let best = null, bs = 0;
  list.forEach(f => { const sc = faqScore(text, f); if (sc > bs) { bs = sc; best = f; } });
  if (!best || bs < 2) return null;
  const rel = related(best.t + ' ' + text, 4), found = rel.length ? [{ title: 'Related interview questions', items: rel }] : [];
  return ref({ text: '<b>' + esc(best.t) + '</b><br>' + esc(best.a), steps: best.s, chips: best.c.concat(['Tell me more']), found }, { last: best.t });
}
function more(text, ctx) {
  if (!/^(tell me more|more|more info|next|another|continue|go on|example|give example|explain more|elaborate)\b/i.test(text.trim())) return null;
  const last = ctx && ctx.last; if (!last) return ref({ text: 'Tell me a topic first, for example <i>resume tips</i> or <i>notice period</i>, and I will go deeper.', chips: ['Resume tips', 'Notice period', 'Salary negotiation'] });
  const rel = related(last, 6), tp = (D.TOPICS || []).filter(t => { const a = tokset(last); return toks(t.name).some(w => a.has(w)); }).slice(0, 4);
  const found = [];
  if (rel.length) found.push({ title: 'Practise these questions', items: rel });
  if (tp.length) found.push({ title: 'Learn the topic', items: tp.map(t => ({ t: t.name, href: '#/topic/' + t.id })) });
  const sibs = FAQ().filter(f => f.t !== last).map(f => ({ f, s: faqScore(last, f) })).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.f.t);
  return ref({ text: found.length ? 'Here is more on <b>' + esc(last) + '</b>. Practise the questions, then open the topic page for a story, examples and a quiz.' : 'That is the main guidance for <b>' + esc(last) + '</b>. These are close topics you may want next.', found, chips: sibs }, ctx);
}
function overview(text) {
  const m = /^(?:what is|what's|tell me about|about|career in|jobs in|how to (?:become|start|begin)(?: an?)?(?: career in)?|explain)\s+(?:an?\s+|the\s+)?(.+?)\??$/i.exec(text.trim()); const q = norm(m ? m[1] : text); if (!q || q.length < 3) return null;
  const GEN = new Set(['career', 'job', 'jobs', 'become', 'work', 'field', 'role', 'roles', 'course', 'learn', 'fresher', 'salary', 'salaries', 'pay', 'start', 'starting', 'scope']);
  const qt = [...tokset(q)].filter(w => !GEN.has(w)); let tr = null, bs = 0;
  if (qt.length) (D.TRACKS || []).forEach(t => { const bag = tokset(t.name + ' ' + t.id + ' ' + (t.desc || '')), nb = tokset(t.name); let sc = 0; qt.forEach(w => { if (bag.has(w)) sc++; else if (w.length >= 5 && [...bag].some(b => b.length >= 5 && b.slice(0, 4) === w.slice(0, 4))) sc += 0.9; if (nb.has(w)) sc += 0.5; }); if (norm(t.name) === q || t.id === q) sc += 3; if (sc > bs) { bs = sc; tr = t; } });
  if (!tr) return null;
  const tps = (D.TOPICS || []).filter(t => t.track === tr.id).slice(0, 5), L = root.LADDER && root.LADDER.tracks && root.LADDER.tracks[tr.id], roles = L ? L.levels.slice(0, 5).map(l => l.t) : [], JB = root.JOBS && root.JOBS.CO && root.JOBS.CO[tr.id], cos = JB ? JB.slice(0, 3).map(c => c[0]) : [];
  let t = '<b>' + esc(tr.ic || '') + ' ' + esc(tr.name) + '</b><br>' + esc(tr.desc || '') + '.';
  if (tps.length) t += '<br><b>What you learn:</b> ' + tps.map(x => esc(x.name)).join(', ') + '.';
  if (roles.length) t += '<br><b>Roles, junior to senior:</b> ' + roles.map(esc).join(' → ') + '.';
  if (cos.length) t += '<br><b>Who hires:</b> ' + cos.map(esc).join(', ') + ' and similar companies.';
  return ref({ text: t, steps: [{ t: 'Start learning ' + tr.name, d: 'Topics in order, with quizzes.', href: '#/learn/' + tr.id, btn: 'Open topics' }, { t: 'Roles and interview rounds', d: 'For your experience level.', href: '#/jobs/' + tr.id + '/1', btn: 'See roles' }, { t: 'Practise interview questions', d: 'Technical questions with model answers.', href: '#/interview/tech', btn: 'Practise' }], chips: ['What should I learn first?', 'Interview rounds to expect', 'Skills employers want', 'How do I get promoted?', 'Which companies hire?'] }, { track: tr.id });
}
function followup(text, ctx) {
  const t = norm(text), FUP = /learn first|where (do|should) i start|learning order|what to learn|roadmap|interview rounds?|rounds to expect|interview process|skills? employers|what do employers|get promoted|promotion path|which compan|companies hire|who hires/;
  let id = (ctx && ctx.track) || (FUP.test(t) ? (UI.S && UI.S.track) : null);
  if (!id && FUP.test(t)) return ref({ text: 'Happy to help! Tell me your <b>field</b> first so I can be exact. Pick one below, or choose it in <a href="#/start">Choose field</a>.', steps: [{ t: 'Choose your field', d: 'Everything adapts to it.', href: '#/start', btn: 'Choose field' }], chips: ['What should I learn first for Finance & Accounting?', 'What should I learn first for Customer Support?', 'What should I learn first for Programming & Data?'] });
  if (!id) return null;
  const tr = (D.TRACKS || []).find(x => x.id === id); if (!tr) return null;
  const L = root.LADDER && root.LADDER.tracks && root.LADDER.tracks[id], lv = L ? L.levels : [], tps = (D.TOPICS || []).filter(x => x.track === id);
  const nm = esc(tr.name), c = { track: id }, more = ['What should I learn first?', 'Interview rounds to expect', 'Skills employers want', 'How do I get promoted?', 'Which companies hire?'];
  const nxt = k => more.filter(x => x !== k).slice(0, 4);
  if (/learn first|where (do|should) i start|learning order|what to learn|roadmap|order to learn/.test(t)) {
    const f = tps.slice(0, 6);
    return ref({ text: 'Great question! For <b>' + nm + '</b> go in this order, one topic at a time, and do the quiz after each one:<br>' + f.map((x, i) => (i + 1) + '. <b>' + esc(x.name) + '</b>').join('<br>') + '<br>Do one topic a day and you will have the base in about a week. Small steps, big result. 💪', steps: [{ t: 'Start with ' + (f[0] ? f[0].name : 'topic 1'), d: 'Read the story, then take the quiz.', href: f[0] ? '#/topic/' + f[0].id : '#/learn/' + id, btn: 'Open topic' }, { t: 'Watch it as a lesson', d: 'Animated, with voice. Good for busy days.', href: f[0] ? '#/topic/' + f[0].id : '#/learn/' + id, btn: 'Watch' }, { t: 'All topics', d: 'Full list for this field.', href: '#/learn/' + id, btn: 'See all' }], chips: nxt('What should I learn first?') }, c);
  }
  if (/interview rounds?|rounds to expect|interview process|how many rounds/.test(t))
    return ref({ text: 'For <b>' + nm + '</b> most companies run <b>3 to 4 rounds</b>:<br>1. <b>Screening call</b> with HR: your background, notice period, salary range.<br>2. <b>Technical round</b>: questions on the core topics, sometimes a small task or case.<br>3. <b>Manager or lead round</b>: how you solve problems, work with people and handle pressure.<br>4. <b>HR round</b>: offer, joining date, culture fit.<br>Senior roles often add a design or case discussion. Practise out loud, it really helps!', steps: [{ t: 'Technical questions', d: 'With model answers for this field.', href: '#/interview/' + id, btn: 'Practise' }, { t: 'HR and behavioural', d: 'Tell me about yourself, strengths, why leave.', href: '#/interview/hr', btn: 'Practise HR' }], chips: nxt('Interview rounds to expect') }, c);
  if (/skills?|tools?|what do employers|employers want|requirements?|what.*required/.test(t) && lv.length) {
    const a = lv.slice(0, 3).filter(l => l.skills).map(l => '<b>' + esc(l.t) + ':</b> ' + esc(Array.isArray(l.skills) ? l.skills.join(', ') : l.skills));
    if (a.length) return ref({ text: 'What employers look for in <b>' + nm + '</b>, level by level:<br>' + a.join('<br>') + '<br>Pick two from the first level and get comfortable. Employers like depth more than a long list.', steps: [{ t: 'Your career ladder', d: 'Every level with skills and what to learn next.', href: '#/ladder', btn: 'Open ladder' }], chips: nxt('Skills employers want') }, c);
  }
  if (/promot|grow|growth|next level|senior|career path|ladder/.test(t) && lv.length) {
    const a = lv.slice(0, 7).map(l => '<b>' + esc(l.t) + '</b>' + (l.promote ? ': ' + esc(l.promote) : ''));
    return ref({ text: 'The growth path in <b>' + nm + '</b>:<br>' + a.join('<br>') + '<br>Tip: ask your manager what the next level needs, then write it down as a goal.', steps: [{ t: 'See your ladder', d: 'Where you are and what is next.', href: '#/ladder', btn: 'Open ladder' }, { t: 'Raise it professionally', d: 'Draft email for a promotion or salary review.', href: '#/toolkit', btn: 'Toolkit' }], chips: nxt('How do I get promoted?') }, c);
  }
  if (/compan|hire|hiring|employer|where to apply|apply/.test(t))
    return ref({ text: 'Plenty of employers hire for <b>' + nm + '</b> across India, from big firms to startups. The Companies page matches them to your field, experience and city.', steps: [{ t: 'Companies for you', d: 'Filter by field, city and experience.', href: '#/companies', btn: 'Open companies' }, { t: 'Roles and openings', d: 'Role titles and where to search.', href: '#/jobs/' + id + '/1', btn: 'See roles' }], chips: nxt('Which companies hire?') }, c);
  return null;
}
function chitchat(text) {
  const t = norm(text);
  if (/^(hi|hii+|hello|hey|vanakkam|namaste|good (morning|evening|afternoon))$/.test(t)) return ref({ text: 'Vanakkam' + ((UI.S.name || '').trim() ? ', ' + esc(UI.S.name.trim().split(/\s+/)[0]) : '') + '! ' + (UI.S.streak > 1 ? 'Your <b>' + UI.S.streak + '-day streak</b> is looking great. ' : '') + 'I am <b>Soluuuu</b>, your career buddy. Ask me about resumes, interviews, salary, notice period, jobs, or any topic in your field.', chips: ['Resume tips', 'Tell me about yourself', 'Where to apply'] });
  if (/^(hi|hii+|hello|hey|vanakkam|namaste|hai) (bro|da|dei|sir|madam|anna|buddy|friend|soluuuu|there|all)$/.test(t)) return chitchat('hi');
  if (/^(who are you|what are you|your name|who r u|are you a bot|are you ai)$/.test(t)) return ref({ text: 'I am <b>Soluuuu</b>, the career buddy inside Padimachi. I answer from the lessons, interview questions and career guides on this site, so I will say plainly when I do not know something.', chips: ['What can you do?', 'Resume tips', 'Where to apply'] });
  if (/(how to use|how do i use|how does this (app|site|website) work|how it works|getting started|where to start)/.test(t) && !/(excel|python|sql|tool)/.test(t)) return ref({ text: 'Quick start: <b>1)</b> upload your resume or choose your field, <b>2)</b> learn one topic, <b>3)</b> practise questions out loud, <b>4)</b> check jobs and your career ladder. Your streak and daily goal keep you going.', steps: [{ t: 'Choose your field', d: 'Everything adapts to it.', href: '#/start', btn: 'Choose field' }, { t: 'Upload your resume', d: 'Stays in your browser. We never upload it.', href: '#/resume', btn: 'Resume' }], chips: ['Is it free?', 'Do you save my resume?'] });
  if (/(joke|funny|sing|poem|weather|cricket score|movie)/.test(t)) return ref({ text: 'I am better at careers than comedy. Try me on <b>resume, interviews, salary or jobs</b>.', chips: ['Resume tips', 'Tell me about yourself', 'Where to apply'] });
  if (/\b(job|velai|vela|work)\b.*\b(venum|venuma|kidaikum|kidaikuma|kidaikkum|kedaikum|enga|epdi|eppadi|thedu|theda)\b|\b(velai|vela) (thedu|theda|kidaikum)/.test(t)) return faq('where to apply');
  if (/^(thanks|thank you|thx|nandri|ok thanks)$/.test(t)) return ref({ text: 'Happy to help. Ask me anything else, any time.', chips: ['Interview preparation', 'First job'] });
  if (/^(bye|goodbye|see you)$/.test(t)) return ref({ text: 'All the best! Come back after your interview and tell me how it went.' });
  if (/(what can you do|help me|what do you know|menu|how can you help|options|what to ask)/.test(t)) return ref({ text: 'I can help with: <b>resume</b> (tips, ATS, fresher), <b>job search</b> (where to apply, referrals, fake offers), <b>interviews</b> (HR, behavioural, technical, online), <b>offers</b> (salary, notice period, comparing offers), <b>first 90 days</b>, <b>career switch</b>, <b>learning paths</b> for every field, and <b>cyber safety</b>. Just type your question.', chips: ['Resume tips', 'Salary negotiation', 'Switch careers', 'What is phishing?'] });
  return null;
}

/* ---- Tamil / Hinglish keywords, topic explainers, compare, memory ---- */
const TG = [[/\b(sollunga|sollu|solluga|batao|bataiye|bata do|bataye)\b/g, 'tell me'], [/\b(enna|kya hai|kya)\b/g, 'what is'], [/\b(eppadi|epdi|kaise|kese)\b/g, 'how to'], [/\b(sambalam|salary kitna|pagar)\b/g, 'salary'], [/\b(kelvigal|kelvi|sawal|prashn)\b/g, 'questions'], [/\b(velai|naukri)\b/g, 'job'], [/\b(udaharan|udharanam|example kudu)\b/g, 'example'], [/\b(thevai|chahiye)\b/g, 'need'], [/\b(vs|versus|aur)\b/g, 'vs']];
function tg(t) { let x = ' ' + String(t || '').toLowerCase() + ' '; TG.forEach(r => { x = x.replace(r[0], r[1]); }); x = x.replace(/\s+/g, ' ').trim(); return x.replace(/^(.+?) what is$/, '$1'); }
function findTopic(name) {
  const k = norm(name).replace(/^(a|an|the) /, ''); if (!k || k.length < 3) return null; const TP = D.TOPICS || [];
  const k2 = k.replace(/s$/, '');
  return TP.find(t => norm(t.name) === k) || TP.find(t => norm(t.name).replace(/s$/, '') === k2) || TP.find(t => norm(t.skill || '') === k) || TP.find(t => String(t.aliases || '').split(',').some(a => norm(a) === k)) || TP.find(t => norm(t.name).startsWith(k + ' ') || norm(t.name).endsWith(' ' + k)) || (k.indexOf(' ') < 0 && k.length >= 3 ? TP.find(t => norm(t.name).split(' ').some(w => w.replace(/s$/, '') === k2)) : null) || null;
}
function findFact(name) {
  const k = norm(name), PRE = /^(dm|health|teach|security|attack|login|network|soc) /; if (!k || k.length < 3) return null;
  return (D.FACTS || []).find(x => norm(x.t) === k) || (D.FACTS || []).find(x => norm(x.t).replace(PRE, '') === k) || null;
}
function topicCard(t, ctxExtra) {
  const qs = (D.OPEN || []).filter(o => o.topic === t.id).slice(0, 2), rq = qs.length ? qs : related(t.name + ' ' + (t.skill || ''), 2).map(x => ({ q: x.t, m: '', id: (x.href || '').split('/').pop() }));
  let h = '<b>' + esc((t.ic || '') + ' ' + t.name) + '</b><br><b>Story:</b> ' + esc(t.story || '') + '<br><b>In simple words:</b> ' + esc(t.lesson || '');
  if (t.ex) h += '<br><b>Example:</b> ' + esc(t.ex);
  if (t.tip) h += '<br><b>Remember:</b> ' + esc(t.tip);
  const q0 = (t.qs && t.qs[0]) || null;
  if (rq.length) h += '<br><b>Interview angle:</b> ' + esc(rq[0].q) + (rq[0].m ? ' ' + esc(rq[0].m) : '');
  return ref({ text: h, steps: [{ t: 'Open the full topic', d: 'Story, examples, quiz and a Watch lesson.', href: '#/topic/' + t.id, btn: 'Open topic' }].concat(rq[0] && rq[0].id ? [{ t: 'Practise the interview question', d: rq[0].q, href: '#/interview/q/' + rq[0].id, btn: 'Practise' }] : []), chips: ['Give an example', 'Interview answer for ' + t.name, 'Tell me more'] }, Object.assign({ last: t.name, topic: t.id }, ctxExtra || {}));
}
function explain(text, ctx) {
  const t = norm(text);
  const m = /^(?:explain|teach me|story of|story for|example of|give (?:me )?an? example (?:of|for)|interview answer (?:for|on)|how to answer|how do i explain)\s+(.+?)(?: with (?:an? )?(?:story|example)| in simple words| simply)?$/.exec(t);
  const dm = /^(?:what is|what are|what s|tell me about|define)\s+(?:an?\s+|the\s+)?(.+)$/.exec(t);
  let tp = null;
  if (m) tp = findTopic(m[1]); else if (dm) tp = findTopic(dm[1]);
  if (!tp) return null;
  if (/^interview answer/.test(t) || /^how to answer/.test(t)) { const q = (D.OPEN || []).filter(o => o.topic === tp.id)[0]; if (q) return ref({ text: '<b>' + esc(q.q) + '</b><br>' + esc(q.m), steps: [{ t: 'Practise it', d: 'Answer aloud and get feedback.', href: '#/interview/q/' + q.id, btn: 'Practise' }], chips: ['Give an example', 'Tell me more'] }, { last: tp.name, topic: tp.id }); }
  return topicCard(tp);
}
function followMem(text, ctx) {
  const t = norm(text), id = ctx && ctx.topic; if (!id) return null; const tp = (D.TOPICS || []).find(x => x.id === id); if (!tp) return null;
  if (/^(give (me )?(an? )?example|example|show example|real example|one more example)$/.test(t)) { const f = (tp.facts || []).slice(0, 3).map(x => '<b>' + esc(x.t) + ':</b> ' + esc(x.d)).join('<br>'); return ref({ text: '<b>Example for ' + esc(tp.name) + ':</b> ' + esc(tp.ex || tp.lesson || '') + (f ? '<br><br>Key ideas:<br>' + f : ''), steps: [{ t: 'Try the quiz', d: 'Check what you learned.', href: '#/topic/' + tp.id, btn: 'Open topic' }], chips: ['Interview answer for ' + tp.name, 'Tell me more'] }, ctx); }
  if (/^(interview answer for |how to answer )/.test(t) || /^(interview question|how will it be asked)$/.test(t)) { const q = (D.OPEN || []).find(o => o.topic === tp.id); const r = q ? { q: q.q, m: q.m, id: q.id } : null; return ref({ text: r ? '<b>' + esc(r.q) + '</b><br>' + esc(r.m) : 'In an interview, explain <b>' + esc(tp.name) + '</b> in 3 parts: what it is (' + esc((tp.lesson || '').split('.')[0]) + '), a real example (' + esc(tp.ex || 'from your work') + '), and why it matters.', steps: r ? [{ t: 'Practise it', d: 'Answer aloud and get feedback.', href: '#/interview/q/' + r.id, btn: 'Practise' }] : [], chips: ['Give an example', 'Tell me more'] }, ctx); }
  if (/^(next|tell me more|more|continue|go on|explain more|elaborate)$/.test(t)) { const rest = (tp.facts || []).slice(0, 6).map(x => '<b>' + esc(x.t) + ':</b> ' + esc(x.d)).join('<br>'); return ref({ text: 'More on <b>' + esc(tp.name) + '</b>:<br>' + rest, steps: [{ t: 'Watch it as a lesson', d: 'Animated with voice.', href: '#/topic/' + tp.id, btn: 'Open topic' }], chips: ['Give an example', 'Interview answer for ' + tp.name] }, ctx); }
  return null;
}
function compare(text) {
  const t = norm(tg(text)); const m = /^(?:difference between|diff between|compare|what is the difference between|whats the difference between|difference of)\s+(?:an?\s+|the\s+)?(.+?)\s+(?:and|vs|with)\s+(?:an?\s+|the\s+)?(.+)$/.exec(t) || /^(.+?)\s+vs\s+(.+)$/.exec(t) || /^(?:what is|whats)\s+(?:an?\s+|the\s+)?(.+?)\s+vs\s+(.+)$/.exec(t);
  if (!m) return null; const a = m[1].trim(), b = m[2].replace(/\?$/, '').trim(); if (a.length < 2 || b.length < 2) return null;
  const side = n => { const f = findFact(n), tp = findTopic(n); return f ? { n: f.t, d: f.d, topic: f.topic } : tp ? { n: tp.name, d: (tp.lesson || '').split('. ').slice(0, 2).join('. '), topic: tp.id } : null; };
  const x = side(a), y = side(b); if (!x || !y) return null;
  return ref({ text: '<b>' + esc(x.n) + ' vs ' + esc(y.n) + '</b><br><b>' + esc(x.n) + ':</b> ' + esc(x.d) + '<br><b>' + esc(y.n) + ':</b> ' + esc(y.d) + '<br><b>Simple way to remember:</b> ask what each one does and when you would choose it. Say one example for each in an interview.', steps: [{ t: 'Open ' + x.n, d: 'Full topic.', href: '#/topic/' + x.topic, btn: 'Open' }, { t: 'Open ' + y.n, d: 'Full topic.', href: '#/topic/' + y.topic, btn: 'Open' }], chips: ['Tell me more', 'Give an example'] }, { last: x.n, topic: x.topic });
}
function wrap(r, text, ctx) {
  if (!r) return r;
  if (!(r.chips && r.chips.length)) r.chips = (ctx && ctx.topic) ? ['Give an example', 'Tell me more'] : ['Tell me more', 'What can you do?', 'Resume tips'];
  r.ctx = r.ctx || {}; if (r.ctx.topic === undefined) r.ctx.topic = null; if (r.ctx.last === undefined) { const t = /^(tell me more|more|next|example|give example)$/i.test(String(text).trim()) ? null : String(text).replace(/\?$/, ''); if (t) r.ctx.last = t; }
  return r;
}
function answer0(text, ctx) { return chitchat(text) || followup(text, ctx) || more(text, ctx) || security(text) || faq(text, ctx) || question(text) || define(text) || overview(text) || null; }
function answer(text, ctx) {
  const raw = String(text || ''), t2 = tg(raw), alt = t2 !== raw.toLowerCase().trim() ? t2 : raw;
  const r = chitchat(alt) || followMem(alt, ctx) || compare(alt) || explain(alt, ctx) || answer0(alt, ctx) || (alt !== raw ? answer0(raw, ctx) : null);
  return wrap(r, raw, ctx);
}
const NOTFOUND = 'I do not have a good answer for that yet, and I would rather say so than guess. Try different words, for example <i>resume tips</i>, <i>notice period</i> or <i>what is ServiceNow</i>. You can also pick your field in <a href="#/start">Choose field</a> or browse <a href="#/interview/hr">HR and behavioural questions</a>.';
UI.kb = { answer, NOTFOUND, security, define, question, faq, overview, more, related, followup, explain, compare, tg };
return root.UI; }
