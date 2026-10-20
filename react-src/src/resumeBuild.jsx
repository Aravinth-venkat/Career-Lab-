import React, { useState } from 'react';
const L2 = s => s.split('\n').map(x => x.trim()).filter(Boolean);
export function compose(f) {
  const out = [f.name.trim() || 'Your Name'], c = [f.phone, f.email].map(x => x.trim()).filter(Boolean).join('   ');
  if (c) out.push(c); if (f.city.trim()) out.push(f.city.trim()); out.push('');
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
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', summary: '', skills: '', jobs: [{ role: '', company: '', dates: '', pts: '' }], projects: [{ title: '', tech: '', desc: '' }], edu: '', certs: '' });
  const u = k => v => setF(o => ({ ...o, [k]: v }));
  const uj = (i, k) => v => setF(o => ({ ...o, jobs: o.jobs.map((j, n) => n === i ? { ...j, [k]: v } : j) }));
  const up = (i, k) => v => setF(o => ({ ...o, projects: o.projects.map((j, n) => n === i ? { ...j, [k]: v } : j) }));
  const ok = f.name.trim().length > 1 && (f.skills.trim() || f.edu.trim() || f.jobs.some(j => j.role.trim()));
  return <div className="card"><b>Create a resume for you</b><p className="dim sm">Fill what you have. Skip what you don't. You can edit everything later and choose a template.</p>
    <div className="grid">{T('Full name', f.name, u('name'), 'For example: Priya Sharma')}{T('Phone', f.phone, u('phone'), '+91 98765 43210')}{T('Email', f.email, u('email'), 'name@gmail.com')}{T('City', f.city, u('city'), 'Chennai, Tamil Nadu')}</div>
    <div style={{ marginTop: 10 }}>{T('About you (2 lines)', f.summary, u('summary'), 'Fresher in computer science, keen to start as a ServiceNow developer. Built two small projects and completed the ServiceNow admin course.', 3)}</div>
    <div style={{ marginTop: 10 }}>{T('Skills (separate with commas)', f.skills, u('skills'), 'ServiceNow, JavaScript, SQL, Incident management', 2)}</div>
    <h3 style={{ marginTop: 16 }}>Work experience <span className="dim sm">(skip if you are a fresher)</span></h3>
    {f.jobs.map((j, i) => <div key={i} className="card"><div className="grid">{T('Job title', j.role, uj(i, 'role'), 'ServiceNow Developer')}{T('Company', j.company, uj(i, 'company'), 'Company name')}{T('Dates', j.dates, uj(i, 'dates'), 'Jan 2024 - Present')}</div><div style={{ marginTop: 8 }}>{T('What you did (one point per line)', j.pts, uj(i, 'pts'), 'Built catalog items for HR requests\nFixed 40 incidents a month', 3)}</div></div>)}
    <button className="btn sm" onClick={() => setF(o => ({ ...o, jobs: [...o.jobs, { role: '', company: '', dates: '', pts: '' }] }))}>+ Add another job</button>
    <h3 style={{ marginTop: 16 }}>Projects or internships</h3>
    {f.projects.map((p, i) => <div key={i} className="card"><div className="grid">{T('Project name', p.title, up(i, 'title'), 'Leave request form')}{T('Tools used', p.tech, up(i, 'tech'), 'ServiceNow, JavaScript')}</div><div style={{ marginTop: 8 }}>{T('What it does and your part', p.desc, up(i, 'desc'), 'Built a form that routes leave requests to the manager and cut approval time.', 2)}</div></div>)}
    <button className="btn sm" onClick={() => setF(o => ({ ...o, projects: [...o.projects, { title: '', tech: '', desc: '' }] }))}>+ Add another project</button>
    <div style={{ marginTop: 16 }}>{T('Education (one line each)', f.edu, u('edu'), 'B.E. Computer Science, Anna University, 2025', 2)}</div>
    <div style={{ marginTop: 10 }}>{T('Certificates (one per line)', f.certs, u('certs'), 'ServiceNow Certified System Administrator', 2)}</div>
    <div className="row" style={{ marginTop: 14 }}><button className="btn primary big" disabled={!ok} onClick={() => onDone(compose(f))}>✨ Create my resume</button>{!ok && <span className="dim sm">Add your name and at least your skills, education or a job.</span>}</div></div>;
}
