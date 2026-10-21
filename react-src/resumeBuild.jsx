import React, { useState } from 'react';
import { Helper, summaryFrom } from './resumeHelp.jsx';
import ResumeUpload from './ResumeUpload.jsx';
import { parse } from './resumeTpl.js';
import { D, C } from './lib.js';
import { useS } from './ctx.jsx';
const L2 = s => s.split('\n').map(x => x.trim()).filter(Boolean);
export function compose(f) {
  const out = [f.name.trim() || 'Your Name'], c = [f.phone, f.email].map(x => x.trim()).filter(Boolean).join('   ');
  if (f.role.trim()) out.push(f.role.trim()); if (c) out.push(c); if (f.city.trim()) out.push(f.city.trim()); out.push('');
  if (f.summary.trim()) out.push('SUMMARY', f.summary.trim(), '');
  const sk = f.skills.trim(); if (sk) out.push('SKILLS', sk, '');
  const jobs = f.jobs.filter(j => j.role.trim()); if (jobs.length) { out.push('EXPERIENCE'); jobs.forEach(j => { out.push(`${j.role.trim()}   ${j.dates.trim()} ${j.company.trim()}`.replace(/\s{3,}$/, '')); L2(j.pts).forEach(p => out.push('- ' + p)); }); out.push(''); }
  const pr = f.projects.filter(p => p.title.trim()); if (pr.length) { out.push('PROJECTS'); pr.forEach((p, i) => { out.push(`Project #${i + 1}: ${p.title.trim()}`); if (p.tech.trim()) out.push('Technologies: ' + p.tech.trim()); if (p.desc.trim()) out.push('Description: ' + p.desc.trim()); }); out.push(''); }
  if (f.edu.trim()) out.push('EDUCATION', ...L2(f.edu), '');
  if (f.certs.trim()) out.push('CERTIFICATIONS', ...L2(f.certs), '');
  return out.join('\n');
}
const T = (l, v, set, ph, rows) => <label>{l}{rows ? <textarea style={{ minHeight: rows * 24 }} value={v} placeholder={ph} onChange={e => set(e.target.value)} /> : <input value={v} placeholder={ph} onChange={e => set(e.target.value)} />}</label>;
export default function Builder({ onDone }) {
  const { S } = useS(); const [note, setNote] = useState(''); const [f, setF] = useState({ role: '', years: 'fresher', field: '', name: '', phone: '', email: '', city: '', summary: '', skills: '', jobs: [{ role: '', company: '', dates: '', pts: '' }], projects: [{ title: '', tech: '', desc: '' }], edu: '', certs: '' });
  const u = k => v => setF(o => ({ ...o, [k]: v }));
  const uj = (i, k) => v => setF(o => ({ ...o, jobs: o.jobs.map((j, n) => n === i ? { ...j, [k]: v } : j) }));
  const up = (i, k) => v => setF(o => ({ ...o, projects: o.projects.map((j, n) => n === i ? { ...j, [k]: v } : j) }));
  const fill = text => { try { const d = parse(text, []), sec = k => d.sections.find(x => x.kind === k), ph = d.contact.find(x => /\d{5}/.test(x)) || '', em = d.contact.find(x => /@/.test(x)) || '', ct = d.contact.find(x => !/@|\d{5}|linkedin/i.test(x)) || '', ex = sec('experience'), pj = sec('projects'), sk = sec('skills');
      const ym = text.match(/(\d{1,2})\+?\s*years?/i), yn = ym ? +ym[1] : (ex && ex.entries.length ? 1 : 0), yv = yn < 1 ? 'fresher' : yn < 2 ? '1' : yn < 3 ? '2' : yn < 6 ? '4' : '7';
      setF(o => ({ ...o, years: yv, name: d.name !== 'Your Name' ? d.name : o.name, role: d.title || o.role, phone: ph, email: em, city: ct, summary: sec('summary') ? sec('summary').lines.join(' ') : o.summary, skills: sk && !sk.derived ? sk.lines.join(', ') : o.skills,
        jobs: ex && ex.entries.length ? ex.entries.map(e => ({ role: e.role, company: e.company, dates: e.dates, pts: e.pts.join('\n') })) : o.jobs, projects: pj && pj.projects.length ? pj.projects.map(p => ({ title: p.title.replace(/^project\s*#?\s*\d+\s*:?\s*/i, ''), tech: (p.meta.find(m => /tech|environment/i.test(m[0])) || [0, ''])[1], desc: [p.desc, ...p.pts].filter(Boolean).join(' ') })) : o.projects,
        edu: sec('education') ? sec('education').lines.join('\n') : o.edu, certs: sec('certs') ? sec('certs').lines.join('\n') : o.certs }));
      setNote('We filled the form from your resume. Check each box, then tap Improve to make the wording stronger.'); } catch (e) { setNote('Could not read that resume. You can still type the details below.'); } };
  const ctx = [f.role, f.skills, f.field].join(' '), fieldSkills = f.field ? D.SKILLS.filter(x => x.track === f.field).map(x => x.n).slice(0, 14) : [];
  const addSkill = n => setF(o => ({ ...o, skills: o.skills.split(/[,;]/).map(x => x.trim()).includes(n) ? o.skills : (o.skills.trim() ? o.skills.trim().replace(/,$/, '') + ', ' : '') + n }));
  const ok = f.name.trim().length > 1 && (f.skills.trim() || f.edu.trim() || f.jobs.some(j => j.role.trim()));
  return <div className="card"><b>Create a resume for you</b><p className="dim sm">Fill what you have. Skip what you don't. You can edit everything later and choose a template.</p>
    <div className="note"><b>Let us help you write it.</b> Type in simple words. Tap <b>✨ Improve my wording</b> and we make each line stronger, or tap <b>💡 Ideas</b> for points you can add. We guide you; you stay in control.</div>
    <div className="card"><b>Already have a resume?</b> <span className="dim sm">Upload it and we fill this form for you. Read on your device only.</span><ResumeUpload onText={fill} />{S.resume && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => fill(S.resume)}>Use my saved resume</button>}{note && <p className="sm" style={{ marginTop: 8 }}>✅ {note}</p>}</div>
    <div className="grid">{T('Job you want', f.role, u('role'), 'For example: ServiceNow Developer')}<label>Experience<select value={f.years} onChange={e => u('years')(e.target.value)}><option value="fresher">Fresher</option><option value="1">1 year</option><option value="2">2 years</option><option value="4">3 to 5 years</option><option value="7">6+ years</option></select></label><label>Your field<select value={f.field} onChange={e => u('field')(e.target.value)}><option value="">Choose</option>{D.TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
    <div className="grid" style={{ marginTop: 10 }}>{T('Full name', f.name, u('name'), 'For example: Priya Sharma')}{T('Phone', f.phone, u('phone'), '+91 98765 43210')}{T('Email', f.email, u('email'), 'name@gmail.com')}{T('City', f.city, u('city'), 'Chennai, Tamil Nadu')}</div>
    <div style={{ marginTop: 10 }}>{T('About you (2 lines)', f.summary, u('summary'), 'Write a line or two about you, or let us write a first draft.', 3)}<div className="row" style={{ marginTop: 6 }}><button className="btn sm" onClick={() => u('summary')(summaryFrom({ role: f.role, years: f.years, skills: f.skills, field: (D.TRACKS.find(t => t.id === f.field) || {}).name }))}>✍️ Write a draft for me</button></div><Helper value={f.summary} mode="text" ctx={ctx} onApply={u('summary')} /></div>
    <div style={{ marginTop: 10 }}>{T('Skills (separate with commas)', f.skills, u('skills'), 'ServiceNow, JavaScript, SQL, Incident management', 2)}{fieldSkills.length > 0 && <><p className="dim sm" style={{ margin: '6px 0 4px' }}>Tap the skills you really have:</p><div className="row">{fieldSkills.map(n => <button key={n} className="chip" onClick={() => addSkill(n)}>+ {n}</button>)}</div></>}</div>
    <h3 style={{ marginTop: 16 }}>Work experience <span className="dim sm">(skip if you are a fresher)</span></h3>
    {f.jobs.map((j, i) => <div key={i} className="card"><div className="grid">{T('Job title', j.role, uj(i, 'role'), 'ServiceNow Developer')}{T('Company', j.company, uj(i, 'company'), 'Company name')}{T('Dates', j.dates, uj(i, 'dates'), 'Jan 2024 - Present')}</div><div style={{ marginTop: 8 }}>{T('What you did (one point per line, simple words are fine)', j.pts, uj(i, 'pts'), 'worked on incidents\nmade catalog items for HR', 3)}<Helper value={j.pts} mode="bullets" ctx={ctx + ' ' + j.role} onApply={uj(i, 'pts')} /></div></div>)}
    <button className="btn sm" onClick={() => setF(o => ({ ...o, jobs: [...o.jobs, { role: '', company: '', dates: '', pts: '' }] }))}>+ Add another job</button>
    <h3 style={{ marginTop: 16 }}>Projects or internships</h3>
    {f.projects.map((p, i) => <div key={i} className="card"><div className="grid">{T('Project name', p.title, up(i, 'title'), 'Leave request form')}{T('Tools used', p.tech, up(i, 'tech'), 'ServiceNow, JavaScript')}</div><div style={{ marginTop: 8 }}>{T('What it does and your part (simple words are fine)', p.desc, up(i, 'desc'), 'made a leave form for managers to approve', 2)}<Helper value={p.desc} mode="text" ctx={ctx} onApply={up(i, 'desc')} label="Improve my wording" /></div></div>)}
    <button className="btn sm" onClick={() => setF(o => ({ ...o, projects: [...o.projects, { title: '', tech: '', desc: '' }] }))}>+ Add another project</button>
    <div style={{ marginTop: 16 }}>{T('Education (one line each)', f.edu, u('edu'), 'B.E. Computer Science, Anna University, 2025', 2)}</div>
    <div style={{ marginTop: 10 }}>{T('Certificates (one per line)', f.certs, u('certs'), 'ServiceNow Certified System Administrator', 2)}</div>
    <div className="row" style={{ marginTop: 14 }}><button className="btn primary big" disabled={!ok} onClick={() => onDone(compose(f))}>✨ Create my resume</button>{!ok && <span className="dim sm">Add your name and at least your skills, education or a job.</span>}</div></div>;
}
