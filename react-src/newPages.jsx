import React, { useState, useEffect, useMemo } from 'react';
import { useJobs, FRESH, ago } from './ctx.jsx';
import { D, C } from './lib.js';

/* ---------- Is this job real? (rule based, runs on the device, nothing is sent anywhere) ---------- */
const FLAGS = [
  [/(registration|processing|security|training|kit|laptop|id card|interview|joining|refundable)\s*(fee|fees|charge|charges|deposit|amount)|pay\s*(rs\.?|inr|₹)?\s*\d+|deposit|advance payment|send money|transfer .*(rs|inr|₹)/i, 3, 'Asks you to pay money', 'A real employer never charges you for a job, training, a laptop or an interview. This is the strongest sign of a scam.'],
  [/\b(otp|aadhaar|aadhar|pan card|bank (account|details)|cvv|upi pin|card number|password)\b/i, 3, 'Asks for sensitive details early', 'Real companies ask for ID and bank details only after a signed offer, and never for an OTP, a PIN or a password.'],
  [/guarantee(d)? (a )?(job|placement|selection)|100% (job|placement|selection)|sure (job|selection)|no interview|without (an )?interview|direct (joining|selection)/i, 2, 'Promises a job with no real selection', 'Genuine hiring has an interview or a test. A guaranteed job or a selection with no interview is a warning sign.'],
  [/(earn|income)\s*(up to\s*)?(rs\.?|inr|₹)?\s*\d[\d,]*\s*(per|a|\/)\s*(day|week|hour)|work from home.*(earn|income)|part[- ]time.*(earn|income)|like (and|&) (subscribe|share)|(task|review).*(earn|commission)|daily payout/i, 2, 'Easy money for simple tasks', 'Offers of high daily pay for liking videos, rating products or typing at home are almost always task scams.'],
  [/\b(whatsapp|telegram)\b.*\b(only|contact|apply|message|hr)\b|\bcontact (hr|us) on (whatsapp|telegram)\b|wa\.me\/|t\.me\//i, 2, 'Hiring only through WhatsApp or Telegram', 'Companies hire through their own site, email or known job portals. Be careful when the whole process is on a chat app.'],
  [/@(gmail|yahoo|outlook|hotmail|rediffmail|proton)\.(com|in|me)/i, 1, 'Official mail from a free email address', 'A company recruiter normally writes from the company domain, not a free email account. Check the domain matches the real website.'],
  [/(urgent|immediate|limited seats?|last (date|day) (today|tomorrow)|hurry|apply (now|today) only|only \d+ (seats|vacancies) left)/i, 1, 'Pressure to act fast', 'Scammers rush you so you do not check. A real offer gives you time to read and verify.'],
  [/(selected|shortlisted|congratulations).*(without|no) (applying|application)|you have been (selected|shortlisted) for/i, 2, 'You were selected though you never applied', 'Be careful with offers for jobs you did not apply to, especially from companies you never contacted.'],
  [/(gift|lottery|prize|reward|bonus).*(claim|click|link)|bit\.ly|tinyurl|cutt\.ly|shorturl|\.xyz\b|\.top\b|\.click\b/i, 1, 'Short or odd links', 'Shortened or strange web links hide where they lead. Open the company\'s real site yourself instead.'],
  [/(visa|abroad|overseas|dubai|gulf|canada|uk|europe).*(job|vacancy|hiring).*(fee|pay|agent|consultancy)|work visa.*(guarantee|sure)/i, 2, 'Overseas job with agent fees', 'Overseas hiring through agents who charge fees is a common fraud. Check the agent on the Ministry of External Affairs eMigrate list.'],
];
const GOOD = [
  [/@(?!gmail|yahoo|outlook|hotmail|rediffmail|proton)[a-z0-9-]+\.(com|in|co\.in|org)\b/i, 'The mail uses a company style address, but still check that it matches the real company website.'],
  [/(interview|assessment|technical round|hr round)/i, 'It talks about an interview or an assessment, which is how real hiring works.'],
];

export function ScamCheck() {
  const [txt, setTxt] = useState(''), [co, setCo] = useState(''), [done, setDone] = useState(false);
  const hits = useMemo(() => FLAGS.filter(f => f[0].test(txt)), [txt]);
  const score = hits.reduce((a, f) => a + f[1], 0);
  const lvl = score >= 4 ? ['high', 'High risk', 'Very likely a scam. Do not pay or share details.'] : score >= 2 ? ['mid', 'Be careful', 'Some warning signs. Verify before you reply.'] : txt.trim().length > 40 ? ['low', 'No major warning sign found', 'This check is only a helper. Still verify the company yourself.'] : null;
  const q = co.trim() ? encodeURIComponent(co.trim()) : '';
  return <>
    <h1>🛡️ Is this job real?</h1>
    <p className="dim">Paste the job message, email or offer letter text. We look for the common signs of a fake job. Nothing you paste leaves your device.</p>
    <div className="card">
      <label className="dim sm">Message or offer text</label>
      <textarea className="inp" rows={8} placeholder="Paste the WhatsApp message, email or offer text here" value={txt} onChange={e => { setTxt(e.target.value); setDone(true); }} style={{ width: '100%' }} />
      <label className="dim sm" style={{ marginTop: 8, display: 'block' }}>Company name (optional)</label>
      <input className="inp" placeholder="For example: ABC Technologies" value={co} onChange={e => setCo(e.target.value)} style={{ width: '100%' }} />
    </div>
    {lvl && <div className={'card scam-' + lvl[0]}><h3>{lvl[0] === 'high' ? '🚨 ' : lvl[0] === 'mid' ? '⚠️ ' : '✅ '}{lvl[1]}</h3><p>{lvl[2]}</p></div>}
    {hits.map((f, i) => <div className="card" key={i}><b>{f[2]}</b><p className="dim sm">{f[3]}</p></div>)}
    {done && !hits.length && txt.trim().length > 40 && GOOD.filter(g => g[0].test(txt)).map((g, i) => <div className="card" key={i}><p className="dim sm">{g[1]}</p></div>)}
    <div className="card">
      <h3>Check it yourself in 5 steps</h3>
      <ol className="steps">
        <li>Open the company's own website by typing its name in a search. Do not use the link in the message.</li>
        <li>Find the same job on the company's careers page. A real job is listed there.</li>
        <li>Check the recruiter's name on LinkedIn and see if they work at that company.</li>
        <li>Never pay, and never share an OTP, PIN or bank card details.</li>
        <li>Ask someone you trust before you travel to an unknown address.</li>
      </ol>
      {q && <div className="row"><a className="btn" target="_blank" rel="noreferrer" href={'https://www.google.com/search?q=' + q + '+careers'}>Search {co.trim()} careers ↗</a><a className="btn" target="_blank" rel="noreferrer" href={'https://www.google.com/search?q=' + q + '+job+scam+fake+reviews'}>Search scam reports ↗</a></div>}
      <p className="dim sm">Report cyber fraud at cybercrime.gov.in or call 1930 in India.</p>
    </div>
    <p className="dim sm">This is a helper based on common patterns. It can miss a scam or flag a real message, so always verify.</p>
  </>;
}

/* ---------- First job in 30 days ---------- */
const WEEKS = [
  ['Week 1: Get ready', 'Resume, profile and basics', [
    ['Upload your resume and read the report', '#/report'], ['Make a clean resume in Resume Studio', '#/resumepdf'], ['Pick 1 job type to aim for (do not chase everything)', '#/journey'],
    ['Create or refresh your LinkedIn and Naukri profile', ''], ['Write your 30 second self introduction', '#/interview'], ['Learn the 5 most asked skills for your job type', '#/learn']]],
  ['Week 2: Start applying', 'Apply every day', [
    ['Apply to 5 fresher jobs today', '#/career'], ['Check walk-in drives in your city', '#/walkin'], ['Track every application in My applications', '#/tracker'],
    ['Use Is this job real? before you trust any offer', '#/scam'], ['Ask 3 seniors or friends for a referral', ''], ['Apply to 5 more jobs and follow up on the old ones', '#/career']]],
  ['Week 3: Practise interviews', 'Be confident', [
    ['Answer 10 interview questions aloud', '#/interview'], ['Do 2 mock interviews', '#/mock'], ['Practise speaking in English for 15 minutes', '#/speak'],
    ['Prepare your project or college story with the STAR method', '#/interview'], ['Learn how to answer salary questions', '#/ctc'], ['Fix your resume using the Interview feedback', '#/resumepdf']]],
  ['Week 4: Close the offer', 'Decide well', [
    ['Attend every interview and note what was asked', ''], ['Send a thank you message after each interview', ''], ['Compare offers with the Offer helper', '#/offer'],
    ['Check the salary in hand with the CTC tool', '#/ctc'], ['Read the offer letter fully and verify the company', '#/scam'], ['Plan your first 30 days at work', '#/journey']]],
];
const PK = 'careerlab_plan30';
const loadP = () => { try { return JSON.parse(localStorage.getItem(PK) || '{}'); } catch (e) { return {}; } };
export function Plan30() {
  const [d, setD] = useState(loadP);
  const tog = k => setD(p => { const n = { ...p, [k]: !p[k] }; try { localStorage.setItem(PK, JSON.stringify(n)); } catch (e) { } return n; });
  const total = WEEKS.reduce((a, w) => a + w[2].length, 0), done = Object.values(d).filter(Boolean).length;
  return <>
    <h1>🗓️ First job in 30 days</h1>
    <p className="dim">A simple daily plan for freshers. Tick each step as you finish. Your ticks stay on this device.</p>
    <div className="card"><b>{done} of {total} steps done</b><div className="bar"><i style={{ width: Math.round(done / total * 100) + '%' }} /></div></div>
    {WEEKS.map((w, wi) => <div className="card" key={wi}><h3>{w[0]}</h3><p className="dim sm">{w[1]}</p>
      {w[2].map((s, si) => { const k = wi + '-' + si; return <label key={k} className="row" style={{ alignItems: 'center', gap: 8, padding: '6px 0' }}><input type="checkbox" checked={!!d[k]} onChange={() => tog(k)} /> <span style={{ textDecoration: d[k] ? 'line-through' : 'none', flex: 1 }}>{s[0]}</span>{s[1] && <a className="sm" href={s[1]}>Open →</a>}</label>; })}
    </div>)}
    <p className="dim sm">There is no promise of a job in 30 days. It depends on your skills, your city and the market. The plan keeps you moving every day.</p>
  </>;
}

/* ---------- City job guides (built from the live job data) ---------- */
export const CITY_LIST = [['Bengaluru', /bengaluru|bangalore/i], ['Chennai', /chennai/i], ['Hyderabad', /hyderabad|secunderabad/i], ['Pune', /pune/i], ['Mumbai', /mumbai|navi mumbai|thane/i], ['Delhi NCR', /delhi|gurugram|gurgaon|noida|ghaziabad|faridabad/i], ['Coimbatore', /coimbatore/i], ['Kolkata', /kolkata/i], ['Kochi', /kochi|cochin|ernakulam/i], ['Ahmedabad', /ahmedabad/i]];
export function Cities({ arg }) {
  const jobs = useJobs(); const sel = CITY_LIST.find(c => c[0].toLowerCase() === decodeURIComponent(arg || '').toLowerCase());
  const stats = useMemo(() => (jobs || []).length ? CITY_LIST.map(([n, re]) => { const l = jobs.filter(j => re.test(j.l || '')); return [n, l.length, l.filter(j => FRESH.test(j.t + ' ' + (j.d || '').slice(0, 300))).length]; }) : null, [jobs]);
  if (!jobs) return <div className="card">Loading…</div>;
  if (!sel) return <>
    <h1>🏙️ Jobs by city</h1><p className="dim">See how many jobs are open in each city and what skills they ask for. Built from our live job list.</p>
    <div className="grid">{(stats || CITY_LIST.map(c => [c[0], 0, 0])).map(([n, k, f]) => <a key={n} className="card" href={'#/cities/' + encodeURIComponent(n)}><b>📍 {n}</b><p className="dim sm">{k} jobs · {f} for freshers</p></a>)}</div>
    <p className="dim sm">Counts come from company career pages we track, so they show part of the market, not all of it.</p></>;
  const list = jobs.filter(j => sel[1].test(j.l || ''));
  const sk = {}; list.forEach(j => { (C.extractSkills ? C.extractSkills(j.t + ' ' + (j.d || ''), D.SKILLS) : []).forEach(s => { sk[s] = (sk[s] || 0) + 1; }); });
  const top = Object.entries(sk).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const co = {}; list.forEach(j => { co[j.c] = (co[j.c] || 0) + 1; }); const topCo = Object.entries(co).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const fr = list.filter(j => FRESH.test(j.t + ' ' + (j.d || '').slice(0, 300)));
  const newest = [...list].sort((a, b) => (b.s || 0) - (a.s || 0)).slice(0, 6);
  return <>
    <a className="dim" href="#/cities">← All cities</a><h1 style={{ marginTop: 8 }}>📍 Jobs in {sel[0]}</h1>
    <div className="card"><b>{list.length} open jobs</b> in our list, <b>{fr.length}</b> that welcome freshers.</div>
    {top.length > 0 && <div className="card"><h3>Skills asked for most</h3><div className="row" style={{ flexWrap: 'wrap' }}>{top.map(([n, k]) => <span className="tag" key={n}>{n} · {k}</span>)}</div><p className="dim sm">Learn these first if you want a job here. <a href="#/learn">Open Learn</a></p></div>}
    {topCo.length > 0 && <div className="card"><h3>Companies hiring most</h3>{topCo.map(([n, k]) => <p key={n} className="sm" style={{ margin: '4px 0' }}>{n} <span className="dim">· {k} jobs</span></p>)}</div>}
    <div className="card"><h3>Newest openings</h3>{newest.map(j => <p key={j.id} className="sm" style={{ margin: '6px 0' }}><a href={j.u} target="_blank" rel="noreferrer">{j.t}</a> <span className="dim">· {j.c}{j.s ? ' · ' + ago(j.s) : ''}</span></p>)}<div className="row"><a className="btn primary" href="#/career">See all jobs</a><a className="btn" href="#/walkin">Walk-in drives</a></div></div>
    <p className="dim sm">Based on company career pages we track. Salary is not shown unless the company posts it.</p>
  </>;
}

/* ---------- Was this clear? ---------- */
const CK = 'careerlab_clear';
export function Clear({ id }) {
  const [v, setV] = useState(() => { try { return (JSON.parse(localStorage.getItem(CK) || '{}'))[id] || ''; } catch (e) { return ''; } });
  const set = x => { setV(x); try { const o = JSON.parse(localStorage.getItem(CK) || '{}'); o[id] = x; localStorage.setItem(CK, JSON.stringify(o)); } catch (e) { } };
  return <div className="card"><div className="row" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><b>Was this clear?</b>
    <button className={'chip' + (v === 'yes' ? ' on' : '')} onClick={() => set('yes')}>👍 Yes</button><button className={'chip' + (v === 'no' ? ' on' : '')} onClick={() => set('no')}>🤔 Not yet</button></div>
    {v === 'no' && <p className="dim sm">Try the Key terms and Quiz tabs, or ask Career mentor. <a href="#/mentor">Open mentor</a> · <a href="https://t.me/padimachi_jobs" target="_blank" rel="noreferrer">Tell us what was unclear</a></p>}
    {v === 'yes' && <p className="dim sm">Great. Try the Quiz tab to check yourself.</p>}</div>;
}
