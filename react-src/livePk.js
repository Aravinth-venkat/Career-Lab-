/* Profile writer: ready-to-copy text for LinkedIn and Naukri built from the visitor's resume on this device. Nothing is uploaded. Never invents facts: gaps show as [brackets]. */
/* GENERATED from profilekit.js by genD.mjs. Do not edit. */
export default function make(root) {
'use strict';
const UI = root.UI, { $, $$, esc, mount } = UI, S = () => UI.S, app = $('#app'), V = UI.VIEWS, D = UI.D, LD = root.LADDER, J = root.JOBS;

/* ---------- reading the resume ---------- */
const GENERIC = new Set('rules routines attention discipline behaviour school teacher student feedback security network cloud analytics quality production maintenance fit beam column soil foundation motor circuit integration discovery hiring sourcing screening retention operations communication'.split(' '));
let SK = null;
const skillList = () => (D.SKILLS || []).map(s => ({ s, re: new RegExp('(^|[^a-z0-9])(' + [s.n].concat((s.al || []).filter(x => x.includes(' ') || (x.length >= 4 && !GENERIC.has(x.trim().toLowerCase())))).map(x => x.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')([^a-z0-9]|$)') }));
const EXCL = new Set('mechanical electrical civil finance sales marketing design support teaching nursing nurse engineering manager management production quality safety planning operations service customer client project handover documentation english hindi tamil'.split(' '));
const isTitle = h => { const w = h.toLowerCase().split(/\s+/); return w.length <= 3 && ROLE.test(w[w.length - 1]) && (w.length === 1 || w.slice(0, -1).every(x => /^(hr|staff|senior|junior|sr|jr|sales|support|customer|software|qa|it|mechanical|civil|electrical|site|process|business|data|product|project|marketing|finance|account|accounts|recruitment|talent|social|media|digital)$/.test(x))); };
const nice = h => { h = String(h || '').trim(); if (h === h.toLowerCase()) h = h.length <= 3 ? h.toUpperCase() : cap(h); return h; };
/* Skills are shown the way the person wrote them, not as our internal topic names. */
const skillsIn = t => { SK = SK || skillList(); const x = ' ' + String(t || '') + ' ', seen = new Set(), out = []; SK.forEach(k => { const m = new RegExp(k.re.source, 'i').exec(x); if (!m) return; const hit = nice(m[2]), key = hit.toLowerCase(); if (seen.has(key) || isTitle(hit) || EXCL.has(key)) return; seen.add(key); out.push({ n: hit, track: k.s.track, key: k.s.n }); }); return out.filter(a => !out.some(b => b !== a && b.n.length > a.n.length && new RegExp('(^|\\s)' + a.n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)').test(b.n.toLowerCase()))); };
const ROLE = /\b(engineer|developer|analyst|executive|manager|administrator|admin|consultant|specialist|designer|accountant|recruiter|teacher|nurse|technician|officer|associate|lead|architect|tester|supervisor|coordinator|intern|trainee|assistant|marketer|agent|representative|drafter|draftsman|auditor|planner|scientist)\b/i;
const WEAK = [[/^responsible for\s+/i, 'Managed '], [/^worked on\s+/i, 'Contributed to '], [/^worked with\s+/i, 'Partnered with '], [/^handled\s+/i, 'Managed '], [/^helped\s+(?:in\s+|with\s+)?/i, 'Supported '], [/^involved in\s+/i, 'Contributed to '], [/^assisted (?:in|with)?\s*/i, 'Supported '], [/^was responsible for\s+/i, 'Managed '], [/^duties include\s+/i, 'Handled '], [/^tasked with\s+/i, 'Handled '], [/^participated in\s+/i, 'Contributed to ']];
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const trim = (s, n) => { s = String(s || '').replace(/[ \t]+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n - 1), i = c.lastIndexOf(' '); return (i > n * 0.6 ? c.slice(0, i) : c).replace(/[,;:|\-\s]+$/, '') + '…'; };
const list = (a, and) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + (and || ' and ') + a[a.length - 1];

const BADNAME = /\b(evaluation|sheet|resume|r\u00e9sum\u00e9|curriculum|vitae|cv|skills?|profile|summary|objective|contact|details|personal|education|experience|declaration|page|form|assessment|report|template|name|role|date|training|certificat\w*|application|candidate|job|title|address|mobile|phone|email|linkedin|github|work|history|projects?|career|professional|technical|key|about|me|reference\w*|achievements?|responsibilit\w*|internship|college|university|school|company|location)\b/i;
const LABEL = /^\s*(?:name|role|designation|current role|current designation|position|job title|title|profile|applying for|post)\s*[:\-\u2013]\s*/i;
const CITYRE = /\b(Chennai|Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Delhi|New Delhi|Gurugram|Gurgaon|Noida|Kolkata|Coimbatore|Kochi|Cochin|Ahmedabad|Jaipur|Chandigarh|Thiruvananthapuram|Trivandrum|Madurai|Trichy|Tiruchirappalli|Visakhapatnam|Indore|Nagpur|Lucknow|Bhubaneswar|Mysuru|Mysore|Vadodara|Surat|Salem|Vellore|Tirunelveli|Erode|Tiruppur|Hosur)\b/i;
const fixCity = c => { c = String(c || '').trim(); if (!c) return ''; const l = c.toLowerCase(); if (l === 'bangalore') return 'Bengaluru'; if (l === 'gurgaon') return 'Gurugram'; if (l === 'cochin') return 'Kochi'; if (l === 'trivandrum') return 'Thiruvananthapuram'; if (l === 'trichy') return 'Tiruchirappalli'; if (l === 'mysore') return 'Mysuru'; return c.replace(/\b\w/g, x => x.toUpperCase()); };
const tcase = n => n.split(/\s+/).map(w => w.length > 1 && w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w).join(' ');
function detectName(lines, kv, res) {
  const lab = kv('full name|candidate name|name'); if (lab && lab.split(/\s+/).length <= 5 && !/[@\d]/.test(lab)) return tcase(lab.replace(/\(.*\)/, '').trim());
  for (const l of lines.slice(0, 14)) {
    const t = l.replace(/[,|]+$/g, '').trim(), w = t.split(/\s+/);
    if (t.length > 40 || w.length < 2 || w.length > 4 || /[@\d:\/]/.test(t) || BADNAME.test(t) || ROLE.test(t)) continue;
    if (!w.every(x => /^[A-Za-z][A-Za-z.'\-]*$/.test(x) && (x[0] === x[0].toUpperCase()))) continue;
    return tcase(t);
  }
  const em = (res.match(/([A-Za-z]+)[._-]([A-Za-z]+)@/) || []); if (em[1]) return cap(em[1].toLowerCase()) + ' ' + cap(em[2].toLowerCase());
  return '';
}
function read() {
  const res = String(S().resume || ''), lines = res.split(/\r?\n/).map(l => l.trim()).filter(Boolean), found = res.length > 60 ? skillsIn(res) : [];
  const kv = (labels) => { const re = new RegExp('^\\s*(?:' + labels + ')\\s*[:\\-\u2013]\\s*(.+)$', 'i'); for (const l of lines.slice(0, 80)) { const m = re.exec(l); if (m && m[1].trim()) return m[1].trim(); } return ''; };
  const name = detectName(lines, kv, res), email = (res.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/) || [''])[0];
  const count = {}; found.forEach(s => { count[s.track] = (count[s.track] || 0) + 1; });
  const track = (S().track && D.TRACKS.some(t => t.id === S().track)) ? S().track : (Object.keys(count).sort((a, b) => count[b] - count[a])[0] || (UI.myTracks && UI.myTracks()[0]) || '');
  const roles = {}; lines.slice(0, 60).filter(l => l.length <= 80 && ROLE.test(l) && !/@|www\.|http/i.test(l)).forEach(l => { const m = l.replace(LABEL, '').replace(/^[\W_]+|[\W_]+$/g, '').replace(/\s+(at|in|\||-|,)\s+.*$/i, ''); if (m && m.split(/\s+/).length <= 5 && !BADNAME.test(m)) roles[m] = (roles[m] || 0) + 1; });
  const labelled = kv('role|designation|current role|current designation|position|job title|title|profile|applying for|post').replace(/\s+(at|\|)\s+.*$/i, '').replace(/[\W_]+$/g, '');
  const role = (labelled && labelled.split(/\s+/).length <= 6 ? labelled : '') || Object.keys(roles).sort((a, b) => roles[b] - roles[a] || a.length - b.length)[0] || '';
  const expL = kv('total experience|experience|exp|work experience'), expN = (/(\d{1,2}(?:\.\d)?)/.exec(expL) || [])[1];
  const locL = kv('current location|location|city|base location|current city|place'), city = fixCity((CITYRE.exec(locL || '') || CITYRE.exec(lines.slice(0, 25).join(' | ')) || [])[1] || (locL && locL.length < 30 ? locL.split(/[,\/]/)[0].trim() : ''));
  const company = kv('current company|current employer|company|organisation|organization|employer').replace(/[\W_]+$/g, '');
  const noticeL = kv('notice period|notice'), notice = noticeL ? noticeL.replace(/\.$/, '') : '';
  const declared = kv('key skills|technical skills|primary skills|skills|skill set|tools').split(/[,;|\/]/).map(x => x.trim()).filter(x => x && x.length <= 36 && x.split(/\s+/).length <= 4);
  const bullets = lines.map(l => l.replace(/^[•▪●‣\-\*–>•▪●]+\s*/, '')).filter(l => l.length >= 28 && l.length <= 260 && /[a-z]{3}/i.test(l) && l.split(/\s+/).length >= 5 && !/@/.test(l) && !/^(skills?|tools?|technologies|education|projects?|summary|objective|languages?|key skills|technical skills|declaration|hobbies|personal)\b\s*[:\-]/i.test(l) && !/^[A-Za-z &\/]{3,28}:\s/.test(l) && (l.match(/,/g) || []).length < 5).slice(0, 40);
  const proofs = bullets.filter(l => /\d/.test(l) && /%|\b\d{2,}\b|\b\d+\s*(k|lakh|crore|users|tickets|cases|clients|projects|members|people|hours|days)\b/i.test(l));
  const years = res.length > 60 && LD ? (LD.detectYears(res) !== null ? LD.detectYears(res) : (/\bfresher\b|recent graduate|final year|fresh graduate/i.test(res) ? 0 : null)) : null;
  const skills = []; declared.concat(found.map(x => x.n)).forEach(x => { const k = x.toLowerCase(); if (!skills.some(y => y.toLowerCase() === k) && !EXCL.has(k) && !isTitle(x)) skills.push(nice(x)); });
  return { res, has: res.length > 60, name: name || S().name || '', email, skills, found, track, role, bullets, proofs, years: expN !== undefined ? +expN : years, city, company, notice };
}
function improve(b) {
  let t = b.replace(/\s+/g, ' ').replace(/\.$/, '');
  for (const [re, to] of WEAK) if (re.test(t)) { t = t.replace(re, to); break; }
  t = cap(t); const has = /\d/.test(t);
  return trim(t, 190) + (has ? '' : ' [add a number: how many, how much or how fast]');
}

/* ---------- field wording ---------- */
const FAM = { it: { val: 'keep systems running well and solve user problems fast', work: ['I break a problem into small steps and test each one.', 'I document what I fix so the next person can repeat it.', 'I explain technical things in plain words.'], posts: ['A bug or issue you fixed this month and how you found the cause', 'A tool or shortcut that saved you time', 'Three mistakes you made as a beginner in your field', 'A small project you built, with a screenshot', 'A question you were asked in an interview and your answer'] }, biz: { val: 'grow results with clear numbers and good customer relationships', work: ['I start with the customer need and measure the result.', 'I follow up on time and keep clear records.', 'I like working with people and learning from data.'], posts: ['A customer or colleague problem you solved and the result', 'One number you improved and how', 'A tip from your daily work that others can use', 'What you learned from a hard month', 'A book, course or tool that helped you grow'] }, core: { val: 'deliver safe, accurate work on time at the site and in the plant', work: ['I follow safety and quality standards without shortcuts.', 'I check drawings, measurements and records twice.', 'I work well with site teams, vendors and supervisors.'], posts: ['A site or plant problem you solved and the result', 'A safety habit that every team should follow', 'A drawing or design lesson with a before and after', 'A standard or tool you learned this year', 'A project you are proud of, with photos where allowed'] }, design: { val: 'turn ideas into clear, usable designs people enjoy', work: ['I start with the user and the problem, not the screen.', 'I share work early and improve it with feedback.', 'I explain design choices in simple words.'], posts: ['A before and after of a design you improved', 'The process behind one project, from problem to result', 'A design lesson you learned the hard way', 'A tool or shortcut that speeds up your work', 'Feedback you received and what you changed'] } };
const fam = t => (J && J.family ? J.family(t) : 'biz');
const stage = y => y === null || y === undefined || isNaN(y) ? 'e' : y < 1 ? 'f' : y < 3 ? 'e' : y < 6 ? 'm' : 's';
const CITIES = 'Bengaluru, Hyderabad, Chennai, Pune and remote';

/* ---------- the text builders ---------- */
function build(f) {
  const o = {}, T = f.fieldName, y = f.years, st = stage(y), R = f.role || (T ? T + (st === 'f' ? ' fresher' : ' professional') : 'Professional'), F = FAM[f.fam] || FAM.biz;
  const sk = f.skills, s3 = sk.slice(0, 3), s5 = sk.slice(0, 5), s8 = sk.slice(0, 8), city = f.city || '[your city]', tgt = f.target || R;
  const yrs = y === null || y === undefined || isNaN(y) ? '' : (y < 1 ? 'less than 1 year' : (Math.round(y) === y ? y : y.toFixed(1)) + (y === 1 ? ' year' : ' years'));
  const shortest = f.proofs.map(b => improve(b).replace(/\s*\[add.*$/, '')).filter(x => x.length <= 75).sort((a, b) => a.length - b.length)[0] || '';
  const proof = f.proof || shortest;
  const hasProof = !!proof, ph = '[add a result with a number]';
  /* LinkedIn headlines */
  const h = [];
  h.push(trim(`${R} | ${s3.length ? list(s3, ', ') : '[3 key skills]'} | ${hasProof ? proof : (yrs ? yrs + ' in ' + (T || 'my field') : 'Open to ' + tgt + ' roles')}`, 220));
  h.push(trim(`${s3[0] ? s3[0] + ' ' : ''}${R} helping teams ${F.val}`, 220));
  h.push(trim(st === 'f' ? `${R} (fresher) | ${s3.length ? list(s3, ', ') : '[3 key skills]'} | Open to roles in ${city === '[your city]' ? 'India' : city}` : `Open to ${tgt} roles | ${yrs ? yrs + ' of experience' : 'Experienced'} | ${s3.length ? list(s3, ', ') : '[3 key skills]'}`, 220));
  o.headlines = h;
  /* LinkedIn about */
  const inT = T && !R.toLowerCase().includes(T.toLowerCase().split(/[^a-z]+/)[0]) ? ' in ' + T : '';
  const hook = st === 'f' ? `I am a ${R} starting my career${inT}. I learn fast, build real projects and enjoy solving problems that people actually face.` : st === 's' ? `I lead ${T ? T + ' ' : ''}work with ${yrs} of experience. I am known for helping teams ${F.val}.` : `I am a ${R}${yrs ? ' with ' + yrs + ' of experience' : ''}${inT}. I help teams ${F.val}.`;
  const pr = (f.proof ? [f.proof] : f.proofs.slice(0, 3).map(b => improve(b).replace(/\s*\[add.*$/, ''))).filter(Boolean);
  const result = pr.length ? pr.map(x => '• ' + cap(trim(x, 170))).join('\n') : '• ' + ph + '\n• ' + ph + '\n• ' + ph;
  const ask = `I am open to ${tgt} roles${f.city ? ' in ' + f.city : ' in ' + CITIES}. You can message me here or write to ${f.email || '[your email]'}.`;
  o.about = `${hook}\n\nWhat I bring\n${s8.length ? '• Skills: ' + list(s8, ', ') : '• Skills: [list your 6 to 8 main skills]'}\n${result}\n\nHow I work\n${F.work.map(x => '• ' + x).join('\n')}\n\n${ask}`;
  o.aboutShort = trim(`${hook} ${s5.length ? 'Skills: ' + list(s5, ', ') + '.' : ''} ${ask.split('.')[0]}.`, 300);
  /* experience bullets */
  o.bullets = f.bullets.slice(0, 8).map(b => ({ from: trim(b, 200), to: improve(b) }));
  /* skills */
  const gap = (D.SKILLS || []).filter(s => f.track && s.track === f.track && !sk.includes(s.n) && !(f.keys || []).includes(s.n)).map(s => s.n).slice(0, 8);
  o.skills = sk.slice(0, 25); o.gap = gap;
  /* extras */
  const first = (f.name || '').trim().split(/\s+/), slug = x => x.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const fl = first.length > 1 ? slug(first[0]) + '-' + slug(first[first.length - 1]) : (first[0] ? slug(first[0]) : 'yourname');
  const field = (T || 'career').toLowerCase().split(/[^a-z]+/)[0] || 'career';
  o.urls = [fl, fl + '-' + field, fl + (st === 'f' ? '-fresher' : '-' + (slug(R).slice(0, 14)))].filter((x, i, a) => a.indexOf(x) === i).map(x => 'linkedin.com/in/' + x);
  o.banner = trim(`${R}  |  ${s3.length ? s3.join('  ·  ') : '[3 key skills]'}`, 80);
  const kw = (J && J.KW && J.KW[f.track] ? J.KW[f.track] : []).slice(0, 4);
  o.titles = [R].concat(kw).filter((x, i, a) => x && a.findIndex(z => z.toLowerCase() === x.toLowerCase()) === i).slice(0, 5);
  const you = f.name ? f.name.split(/\s+/)[0] : '[your name]';
  o.connect = [
    trim(`Hi [name], I am ${you}, a ${R}${T ? ' in ' + T : ''}. I saw your work at [company] and would like to stay connected and learn from your team.`, 300),
    trim(`Hi [name], I am ${you}${yrs ? ' with ' + yrs + ' in ' + (T || 'this field') : ''}. I am interested in the ${tgt} role at [company]. Could you tell me about the team? I would be grateful for any guidance.`, 300),
    trim(`Hi [name], we both studied or worked in ${T || 'the same field'}. I am exploring ${tgt} roles and would value 10 minutes of your advice. Thank you for considering.`, 300)];
  o.referral = `Hi [name],\n\nI hope you are well. I am ${you}, a ${R}${yrs ? ' with ' + yrs + ' of experience' : ''}${s3.length ? ' in ' + list(s3, ', ') : ''}. I saw an opening for [job title] at [company] ([job link]) and my background matches well: ${hasProof ? proof : '[one result that matches the job]'}.\n\nWould you be comfortable referring me, or sharing who the hiring manager is? I have attached my resume. I understand if it is not possible and I am grateful for your time.\n\nThank you,\n${f.name || '[your name]'}`;
  o.recruiter = `Hi [recruiter name],\n\nI am ${you}, ${R}${yrs ? ' with ' + yrs + ' of experience' : ''}. My main skills are ${s5.length ? list(s5, ', ') : '[skills]'}. I am looking for ${tgt} roles${f.city ? ' in ' + f.city : ''} and can join in ${f.notice || '[notice period]'}. If you have a suitable opening, I would be happy to share my resume. Thank you.`;
  o.followup = `Hi [name],\n\nI applied for [job title] at [company] on [date] and wanted to confirm that my application reached you. I remain very interested because [one reason]. Please tell me if you need anything else from me.\n\nThank you,\n${f.name || '[your name]'}`;
  o.recommend = `Hi [name], I am updating my LinkedIn profile and would be grateful for a short recommendation about our work on [project or task]. If it helps, you could mention [one specific thing you saw me do]. I would be happy to write one for you too. Thank you!`;
  o.post = `${proofLine(f, hasProof ? proof : '')}`;
  o.postIdeas = F.posts;
  const tag = ['#' + (T || 'career').replace(/[^A-Za-z]+/g, ''), '#OpenToWork', '#Hiring', '#CareerGrowth', '#Learning'].concat(s3.map(x => '#' + x.replace(/[^A-Za-z0-9]+/g, '')));
  o.tags = tag.filter((x, i, a) => x.length > 2 && a.indexOf(x) === i).slice(0, 8).join(' ');
  /* Naukri */
  const nsk = sk.concat(kw.filter(k => !sk.some(s => s.toLowerCase() === k.toLowerCase()))).slice(0, 20);
  o.nhead = trim(`${R}${yrs ? ' | ' + yrs : ''} | ${nsk.slice(0, 6).join(', ') || '[key skills]'} | ${f.notice ? 'Notice period ' + f.notice : 'Notice period [days]'}`, 250);
  o.nsum = trim(`${yrs ? yrs.replace(/^./, c => c.toUpperCase()) + ' of experience' : 'Experience'} as ${R}${T ? ' in ' + T : ''}. Key skills: ${nsk.slice(0, 12).join(', ') || '[list skills]'}. ${pr.length ? 'Worked on: ' + pr.map(x => trim(x, 120)).join('; ') + '.' : 'Achievements: ' + ph + '.'} Strengths: ${F.work.map(x => x.replace(/^I /, '').replace(/\.$/, '')).join('; ')}. Looking for ${tgt} roles${f.city ? ' in ' + f.city : ''}. Available to join in ${f.notice || '[notice period]'}.`, 1000);
  o.nskills = nsk;
  o.itskills = sk.slice(0, 8).map(x => `${x}  |  Version: [add]  |  Last used: ${new Date().getFullYear()}  |  Experience: [years] yrs`);
  o.desired = [`Desired job role: ${tgt}`, `Industry: ${f.industry}`, `Location: ${f.city || '[your city]'}${f.city ? ', and 2 nearby cities' : ''}`, 'Job type: Permanent', 'Employment type: Full time', 'Expected salary: [only if you are sure; some people leave it as negotiable]'];
  o.nrole = f.bullets.length ? f.bullets.slice(0, 5).map(b => '• ' + improve(b)).join('\n') : '• [Describe what you did in 4 to 5 lines, each starting with a verb and ending with a number]';
  o.nreply = `Thank you for reaching out. I am interested in the opportunity. Current role: ${R}${f.company ? ' at ' + f.company : ''}. Total experience: ${yrs || '[years]'}. Current CTC: [number]. Expected CTC: [number]. Notice period: ${f.notice || '[days]'}. Current location: ${f.city || '[city]'}. Please share the job description and the interview process. Thank you.`;
  /* common */
  o.pitch30 = `Hi, I am ${f.name || '[your name]'}. I am a ${R}${yrs ? ' with ' + yrs + ' of experience' : ''}${T ? ' in ' + T : ''}. ${s3.length ? 'I work mainly with ' + list(s3) + '. ' : ''}${hasProof ? 'Recently, ' + proof + '. ' : ''}I am now looking for a ${tgt} role where I can ${F.val}.`;
  o.tmay = `${o.pitch30}\n\nBefore this, [one line about your last role or study]. What I enjoy most is [one thing you enjoy]. I would like to grow into [next step] and I believe this role is the right step because [one reason].`;
  o.whatsapp = `Hi [name], hope you are well. I am looking for a new ${tgt} role${f.city ? ' in ' + f.city : ''}. My skills: ${s5.length ? list(s5, ', ') : '[skills]'}. If you know of any opening or a hiring manager I can talk to, please let me know. I can send my resume. Thank you!`;
  o.subjects = [`Application for ${tgt}${yrs ? ' | ' + yrs : ''} | ${f.name || '[your name]'}`, `${tgt} | ${s3.length ? s3.join(', ') : '[key skills]'} | ${f.notice ? 'Notice period ' + f.notice : 'Notice period [days]'}`, `Referred by [name] | ${tgt} application`];
  o.cover = `Dear Hiring Team,\n\nI am applying for the ${tgt} role at [company]. I have ${yrs ? yrs + ' of' : ''} experience in ${T || '[field]'}${s3.length ? ', mainly with ' + list(s3) : ''}. ${hasProof ? 'Recently, ' + proof + '.' : '[One result that matches the job.]'}\n\nI have attached my resume and would be glad to discuss how I can help your team. I can join in ${f.notice || '[notice period]'}.\n\nThank you for your time.\n${f.name || '[your name]'}`;
  return o;
}
function proofLine(f, proof) {
  const T = f.fieldName || 'my field';
  return `This month I learned something useful about ${T}.\n\n${proof ? 'One result I am proud of: ' + proof + '.' : 'One result I am proud of: [add a result with a number].'}\n\nWhat helped me:\n1. [first thing]\n2. [second thing]\n3. [third thing]\n\nIf you work in ${T}, what would you add?\n\n${f.tags || ''}`;
}

/* ---------- screen ---------- */
const INDUSTRY = { servicenow: 'IT Services and Software', programming: 'IT Services and Software', itfund: 'IT Services and Software', cloud: 'IT Services and Software', cyber: 'IT Services and Software', data: 'IT Services and Software', qa: 'IT Services and Software', mw: 'IT Services and Software', hr: 'HR, Recruitment and Staffing', finance: 'Accounting, Banking and Finance', sales: 'Sales, Marketing and Advertising', dmkt: 'Marketing and Advertising', ops: 'Logistics and Supply Chain', support: 'BPO, Customer Service and IT Services', pm: 'IT Services and Consulting', eng: 'Engineering and Manufacturing', cad: 'Engineering and Design', civil: 'Construction and Infrastructure', elec: 'Electrical and Electronics Manufacturing', ind: 'Manufacturing and Industrial', design: 'Design, Media and Advertising', teach: 'Education and Training', health: 'Healthcare and Hospitals', soft: 'General' };
let ST = null;
function fields(r) {
  const sig = String((S().resume || '').length) + ':' + (S().resume || '').slice(0, 40), saved = ((S().pk || {}).sig === sig ? S().pk : {}), tr = saved.track || r.track, tn = tr ? ((UI.trackOf(tr) || {}).name || '') : '';
  const sk = (saved.skills !== undefined ? saved.skills.split(/[,\n]/).map(x => x.trim()).filter(Boolean) : r.skills);
  return { name: saved.name !== undefined ? saved.name : r.name, role: saved.role !== undefined ? saved.role : r.role, target: saved.target || '', years: saved.years !== undefined && saved.years !== '' ? +saved.years : r.years, city: saved.city !== undefined ? saved.city : r.city, company: saved.company !== undefined ? saved.company : r.company, email: r.email, notice: r.notice, proof: saved.proof || '', skills: sk, track: tr, fieldName: tn, fam: tr ? fam(tr) : 'biz', industry: INDUSTRY[tr] || 'Select the closest industry', bullets: r.bullets, proofs: r.proofs, tags: '', keys: r.found.map(x => x.key) };
}
const LIM = { headline: 220, about: 2600, nhead: 250, nsum: 1000, connect: 300 };
function box(id, title, text, limit, hint) {
  const over = limit && text.length > limit;
  return `<div class="card pkbox"><div class="row" style="justify-content:space-between;align-items:flex-start"><b>${esc(title)}</b><button class="btn sm pkcopy" data-for="${id}">Copy</button></div>${hint ? `<p class="dim sm" style="margin:.3em 0">${esc(hint)}</p>` : ''}<textarea class="inp pkta" id="${id}" rows="${Math.min(14, Math.max(2, Math.ceil(text.length / 48) + (text.split('\n').length - 1)))}" spellcheck="true">${esc(text)}</textarea><div class="pkc dim sm" data-c="${id}" data-l="${limit || 0}">${text.length}${limit ? ' / ' + limit + ' characters' : ' characters'}${over ? ' · too long, shorten it' : ''}</div></div>`;
}
const gaps = t => (t.match(/\[[^\]]+\]/g) || []).length;
function render() {
  const r = read(), f = fields(r); f.tags = ''; const o = build(f); f.tags = o.tags; o.post = proofLine(f, f.proof || (f.proofs[0] ? improve(f.proofs[0]).replace(/\s*\[add.*$/, '') : ''));
  const tab = ST.tab, tabs = [['li', 'LinkedIn'], ['nk', 'Naukri'], ['msg', 'Messages'], ['chk', 'Checklists']].map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('');
  const skillsTxt = f.skills.join(', ');
  const form = `<details class="card pkdet"${f.name && f.role ? '' : ' open'}><summary><b>Written for: ${esc(f.name || 'your name')}</b> <span class="dim sm">· ${esc(f.role || 'your role')}${f.years === null || f.years === undefined || isNaN(f.years) ? '' : ' · ' + esc(f.years) + ' yrs'}${f.city ? ' · ' + esc(f.city) : ''}. Tap to check or change.</span></summary><p class="dim sm">Taken from your resume. Change anything that is wrong, then press Update text. Your details stay on this phone.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><label class="dim sm">Your name<input class="inp" id="pkn" value="${esc(f.name)}"></label><label class="dim sm">Current or main role<input class="inp" id="pkr" value="${esc(f.role)}" placeholder="For example Support Engineer"></label><label class="dim sm">Role you want next<input class="inp" id="pkt" value="${esc(f.target)}" placeholder="Same as above if blank"></label><label class="dim sm">Years of experience<input class="inp" id="pky" type="number" min="0" max="40" step="0.5" value="${f.years === null || f.years === undefined || isNaN(f.years) ? '' : esc(f.years)}"></label><label class="dim sm">City<input class="inp" id="pkc" value="${esc(f.city)}" placeholder="For example Chennai"></label><label class="dim sm">Company (optional)<input class="inp" id="pkco" value="${esc(f.company)}"></label></div><label class="dim sm" style="display:block;margin-top:8px">Your best result with a number (optional, must be true)<input class="inp" id="pkp" value="${esc(f.proof)}" placeholder="For example cut ticket closing time by 30 percent"></label><label class="dim sm" style="display:block;margin-top:8px">Skills (comma separated, most important first)<textarea class="inp" id="pks" rows="2">${esc(skillsTxt)}</textarea></label><div class="row" style="margin-top:8px"><button class="btn primary" id="pkgo">Update text</button><button class="btn ghost" id="pkrs">Take it from my resume again</button></div></details>`;
  let body = '';
  const li = () => {
    body += `<div class="card"><h3>LinkedIn headline</h3><p class="dim sm">Pick one. The headline shows next to your name everywhere, so lead with your role and skills. Limit 220 characters.</p></div>`;
    o.headlines.forEach((x, i) => { body += box('pkh' + i, 'Headline option ' + (i + 1), x, LIM.headline); });
    body += box('pkab', 'About section (full)', o.about, LIM.about, 'Limit 2,600 characters. The first 3 lines show before See more, so the hook matters most.');
    body += box('pkas', 'About section (short, for the first lines)', o.aboutShort, 300);
    body += `<div class="card"><h3>Experience bullets, rewritten</h3><p class="dim sm">${o.bullets.length ? 'From your resume. Each starts with a strong verb. Replace each [bracket] with a real number.' : 'Add your resume to see your own lines rewritten here.'}</p></div>`;
    if (o.bullets.length) body += box('pkbl', 'All bullets (copy into one job)', o.bullets.map(b => '• ' + b.to).join('\n'), 0, 'Use 3 to 5 per job. Keep the best ones.') + `<div class="card"><b class="sm">Before and after</b>${o.bullets.slice(0, 4).map(b => `<p class="sm"><span class="dim">Before:</span> ${esc(b.from)}<br><b>After:</b> ${esc(b.to)}</p>`).join('')}</div>`;
    body += box('pksk', 'Skills to add (' + o.skills.length + ')', o.skills.join('\n'), 0, 'Add all of these in Skills, then pin the top 3. LinkedIn allows up to 50.');
    if (o.gap.length) body += box('pkgp', 'Learn these next, then add them', o.gap.join('\n'), 0, 'Jobs in your field often mention these. Add one only after you can show an example.');
    body += box('pkur', 'Custom profile link ideas', o.urls.join('\n'), 0, 'Profile, Edit public profile and URL. Pick the first one that is free.');
    body += box('pkbn', 'Banner text', o.banner, 80, 'Make the banner image on Canva with this line and your field colours.');
    body += box('pkti', 'Open to Work: job titles to add', o.titles.join('\n'), 0, 'Choose Recruiters only if you do not want your company to see it. Add 5 titles, locations and Hybrid, Onsite or Remote.');
    body += box('pkpo', 'Ready post (edit and publish)', o.post, 3000, 'Post once a week. Activity brings recruiters to your profile.');
    body += box('pkpi', 'Five more post ideas', o.postIdeas.map((x, i) => (i + 1) + '. ' + x).join('\n'), 0);
    body += box('pktg', 'Hashtags', o.tags, 0, 'Use 3 to 5 under each post.');
  };
  const nk = () => {
    body += `<div class="card"><h3>Naukri profile</h3><p class="dim sm">Recruiters on Naukri search by words, so use the exact names of your skills and tools. Do not stuff keywords you cannot explain in an interview.</p></div>`;
    body += box('pknh', 'Resume headline', o.nhead, LIM.nhead, 'Limit 250 characters. Role, years, top skills and notice period.');
    body += box('pkns', 'Profile summary', o.nsum, LIM.nsum, 'Keep it to about 1,000 characters.');
    body += box('pknk', 'Key skills (add all)', o.nskills.join(', '), 0, 'Add each as a tag. Put the most important first.');
    body += box('pkni', 'IT skills table', o.itskills.join('\n'), 0, 'Fill version, last used year and experience for each skill. Be honest.');
    body += box('pknr', 'Employment details (current job)', o.nrole, 0, 'Paste in the job description box of your current role.');
    body += box('pknd', 'Desired career profile', o.desired.join('\n'), 0, 'Fill these in Career profile.');
    body += box('pknp', 'Reply when a recruiter calls or messages', o.nreply, 0, 'Fill the brackets before sending. Reply the same day.');
  };
  const msg = () => {
    body += `<div class="card"><h3>Messages you can copy</h3><p class="dim sm">Replace each [bracket]. Personal and short messages get more replies than long ones.</p></div>`;
    o.connect.forEach((x, i) => { body += box('pkcn' + i, 'LinkedIn connection note ' + (i + 1), x, LIM.connect, 'Limit 300 characters.'); });
    body += box('pkrf', 'Ask for a referral', o.referral, 0) + box('pkrc', 'Message to a recruiter', o.recruiter, 0) + box('pkfu', 'Follow up after applying', o.followup, 0) + box('pkrm', 'Ask for a recommendation', o.recommend, 0);
    body += box('pkp3', '30 second introduction', o.pitch30, 0, 'For calls, networking and the start of an interview.') + box('pktm', 'Tell me about yourself (about 1 minute)', o.tmay, 0);
    body += box('pkwa', 'WhatsApp message to friends and ex-colleagues', o.whatsapp, 0) + box('pksu', 'Email subject lines for applications', o.subjects.join('\n'), 0) + box('pkcv', 'Short cover email', o.cover, 0);
  };
  const chk = () => {
    const A = [['LinkedIn', ['Clear profile photo: face, plain background, smiling', 'Banner with your role and skills', 'Headline with role, skills and a result', 'About section with a strong first 3 lines', 'Experience bullets with numbers', '15 or more relevant skills, top 3 pinned', 'Custom profile link', 'Featured section: a project, a certificate or a post', 'At least 2 recommendations', 'Open to Work set to Recruiters only if needed', 'Connect with 5 people every week and post once a week']], ['Naukri', ['Profile completeness at 100 percent', 'Resume headline updated', 'Profile summary with real keywords', 'Key skills and IT skills table filled', 'Notice period, current and expected CTC filled', 'Photo added', 'Latest resume uploaded as PDF', 'Phone and email correct and verified', 'Update the profile once a week, for example the headline or a skill', 'Reply to recruiters the same day']], ['Both profiles', ['Same name, role, dates and skills on both', 'No spelling mistakes: read each line aloud', 'Do not list a skill you cannot explain in 2 minutes', 'Never share Aadhaar, PAN or bank details in a profile', 'Never pay anyone for a job or a profile boost', 'Check your profile every month and after every new project']]];
    A.forEach(a => { body += `<div class="card"><h3>${a[0]}</h3><ul class="plist">${a[1].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`; });
  };
  ({ li, nk, msg, chk }[tab] || li)();
  const gapN = gaps(o.about + o.nsum + o.referral), warn = !r.has ? '<div class="card"><b>No resume added yet.</b><p class="dim sm">You can still use this page. Fill Your details above, or add your resume so we can fill them for you.</p><div id="pkup"></div></div>' : '';
  const note = `<div class="card"><b class="sm">⚠️ Be honest</b><p class="dim sm">Only claim what you really did. Fill each <b>[bracket]</b> with a true fact. ${gapN ? 'There are ' + gapN + ' brackets to fill in the main texts.' : ''} Nothing here is uploaded: it is written on your phone from your own details.</p></div>`;
  mount(app, `<h1>✍️ LinkedIn and Naukri profile writer</h1><p class="dim">Ready-to-copy text for your profiles, built from your resume. Tap Copy, paste it on the site and edit it into your own voice.</p>${warn}${form}<div class="tabs" id="pkt">${tabs}</div><div id="pkb">${body}</div>${note}`);
  if (!r.has) UI.uploader($('#pkup'), 'resume', 'Add your resume', 'Word, PDF or pasted text.', () => { S().pk = {}; UI.save(); render(); });
  $$('#pkt button').forEach(b => b.onclick = () => { ST.tab = b.dataset.t; render(); window.scrollTo(0, $('#pkt').offsetTop - 70); });
  $('#pkgo').onclick = () => { S().pk = { sig: String((S().resume || '').length) + ':' + (S().resume || '').slice(0, 40), name: $('#pkn').value.trim(), role: $('#pkr').value.trim(), target: $('#pkt').value.trim(), years: $('#pky').value, city: $('#pkc').value.trim(), company: $('#pkco').value.trim(), proof: $('#pkp').value.trim(), skills: $('#pks').value, track: (S().pk || {}).track }; UI.save(); render(); UI.toast('Text updated'); };
  $('#pkrs').onclick = () => { S().pk = {}; UI.save(); render(); };
  $$('.pkta').forEach(t => { t.oninput = () => { const c = $('[data-c="' + t.id + '"]'); if (!c) return; const l = +c.dataset.l; c.textContent = t.value.length + (l ? ' / ' + l + ' characters' : ' characters') + (l && t.value.length > l ? ' · too long, shorten it' : ''); c.style.color = l && t.value.length > l ? 'var(--bad, #ff6b6b)' : ''; }; t.oninput(); });
  $$('.pkcopy').forEach(b => b.onclick = () => { const t = document.getElementById(b.dataset.for); if (!t) return; const done = () => { b.textContent = 'Copied ✓'; setTimeout(() => { b.textContent = 'Copy'; }, 1600); }; try { navigator.clipboard.writeText(t.value).then(done, () => { t.select(); document.execCommand('copy'); done(); }); } catch (e) { t.select(); try { document.execCommand('copy'); done(); } catch (x) {} } });
}
V.profilekit = () => { ST = ST || { tab: 'li' }; render(); };
UI.profileKit = { read, build, improve, proofLine, INDUSTRY, fam };
return root.UI; }
