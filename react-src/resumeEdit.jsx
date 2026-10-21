import React, { useState } from 'react';
import { Helper } from './resumeHelp.jsx';
const L2 = s => s.split('\n').map(x => x.trim()).filter(Boolean);
export const SWATCH = [['Teal', [0.05, 0.45, 0.55]], ['Navy', [0.13, 0.2, 0.42]], ['Purple', [0.38, 0.27, 0.78]], ['Green', [0.1, 0.45, 0.3]], ['Red', [0.7, 0.2, 0.2]], ['Orange', [0.8, 0.35, 0.1]], ['Slate', [0.2, 0.24, 0.3]], ['Black', [0.1, 0.1, 0.1]]];
const toHex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''), fromHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
export function Style({ o, setO }) {
  return <div className="card"><b>Style</b>
    <div className="row" style={{ marginTop: 8 }}><span className="dim sm">Colour</span>{SWATCH.map(([n, c]) => <button key={n} title={n} className="sw" style={{ background: toHex(c), outline: o.accent && toHex(o.accent) === toHex(c) ? '2px solid var(--acc)' : 'none' }} onClick={() => setO({ ...o, accent: c })} />)}<input type="color" aria-label="Custom colour" value={toHex(o.accent || [0.05, 0.45, 0.55])} onChange={e => setO({ ...o, accent: fromHex(e.target.value) })} style={{ width: 40, height: 32, padding: 0 }} /><button className="btn sm ghost" onClick={() => setO({ ...o, accent: null })}>Template colour</button></div>
    <div className="row" style={{ marginTop: 10 }}><span className="dim sm">Font</span>{[['', 'Template'], ['sans', 'Sans-serif'], ['serif', 'Serif']].map(([k, l]) => <button key={k} className={'chip' + ((o.font || '') === k ? ' on' : '')} onClick={() => setO({ ...o, font: k })}>{l}</button>)}
      <span className="dim sm" style={{ marginLeft: 10 }}>Text size</span>{[[0.92, 'Small'], [1, 'Normal'], [1.08, 'Large']].map(([k, l]) => <button key={k} className={'chip' + ((o.scale || 1) === k ? ' on' : '')} onClick={() => setO({ ...o, scale: k })}>{l}</button>)}</div></div>;
}
export function Content({ doc, setDoc }) {
  const [open, setOpen] = useState(false);
  const setSec = (i, p) => setDoc({ ...doc, sections: doc.sections.map((s, k) => k === i ? { ...s, ...p } : s) });
  const move = (i, d) => { const a = doc.sections.slice(), j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setDoc({ ...doc, sections: a }); };
  const del = i => setDoc({ ...doc, sections: doc.sections.filter((_, k) => k !== i) });
  const setEn = (i, j, p) => setSec(i, { entries: doc.sections[i].entries.map((e, k) => k === j ? { ...e, ...p } : e) });
  const setPr = (i, j, p) => setSec(i, { projects: doc.sections[i].projects.map((e, k) => k === j ? { ...e, ...p } : e) });
  return <div className="card"><div className="row" style={{ justifyContent: 'space-between' }}><b>Edit your content</b><button className="btn sm" onClick={() => setOpen(!open)}>{open ? 'Hide' : '✏️ Edit details'}</button></div>
    <p className="dim sm">Change any text, hide a section or move it up and down. The preview updates as you type.</p>
    {open && <>
      <div className="grid"><label>Name<input value={doc.name} onChange={e => setDoc({ ...doc, name: e.target.value })} /></label><label>Job title<input value={doc.title} onChange={e => setDoc({ ...doc, title: e.target.value })} /></label></div>
      <label style={{ display: 'block', marginTop: 10 }}>Contact (phone, email, city, links), one per line<textarea style={{ minHeight: 70 }} value={doc.contact.join('\n')} onChange={e => setDoc({ ...doc, contact: L2(e.target.value) })} /></label>
      {doc.sections.map((s, i) => <div key={i} className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><input style={{ maxWidth: 220, fontWeight: 700 }} value={s.title} onChange={e => setSec(i, { title: e.target.value })} /><div className="row"><label className="row sm"><input type="checkbox" style={{ width: 'auto' }} checked={!s.hidden} onChange={e => setSec(i, { hidden: !e.target.checked })} /> Show</label><button className="btn sm" onClick={() => move(i, -1)} aria-label="Move up">↑</button><button className="btn sm" onClick={() => move(i, 1)} aria-label="Move down">↓</button><button className="btn sm ghost" onClick={() => del(i)} aria-label="Delete section">🗑️</button></div></div>
        {s.kind === 'experience' ? <>{s.entries.map((e, j) => <div key={j} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <div className="grid"><label>Role<input value={e.role} onChange={x => setEn(i, j, { role: x.target.value })} /></label><label>Dates<input value={e.dates} onChange={x => setEn(i, j, { dates: x.target.value })} /></label><label>Company<input value={e.company} onChange={x => setEn(i, j, { company: x.target.value })} /></label></div>
          <label style={{ display: 'block', marginTop: 8 }}>What you did (one point per line)<textarea style={{ minHeight: 70 }} value={e.pts.join('\n')} onChange={x => setEn(i, j, { pts: L2(x.target.value) })} /></label><Helper value={e.pts.join('\n')} mode="bullets" ctx={e.role + ' ' + s.title} onApply={v => setEn(i, j, { pts: L2(v) })} />
          <button className="btn sm ghost" onClick={() => setSec(i, { entries: s.entries.filter((_, k) => k !== j) })}>Remove this job</button></div>)}
          <button className="btn sm" style={{ marginTop: 8 }} onClick={() => setSec(i, { entries: [...s.entries, { role: 'Job title', dates: 'Jan 2024 - Present', company: 'Company name', pts: [] }] })}>+ Add a job</button></>
        : s.kind === 'projects' ? <>{s.projects.map((p, j) => <div key={j} style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <label>Project title<input value={p.title} onChange={x => setPr(i, j, { title: x.target.value })} /></label>
          <label style={{ display: 'block', marginTop: 8 }}>Details (Client: ..., Role: ..., one per line)<textarea style={{ minHeight: 60 }} value={p.meta.map(m => m[0] + ': ' + m[1]).join('\n')} onChange={x => setPr(i, j, { meta: L2(x.target.value).map(l => { const k = l.indexOf(':'); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : ['Note', l]; }) })} /></label>
          <label style={{ display: 'block', marginTop: 8 }}>Description<textarea style={{ minHeight: 60 }} value={p.desc} onChange={x => setPr(i, j, { desc: x.target.value })} /></label>
          <label style={{ display: 'block', marginTop: 8 }}>Points (one per line)<textarea style={{ minHeight: 80 }} value={p.pts.join('\n')} onChange={x => setPr(i, j, { pts: L2(x.target.value) })} /></label><Helper value={p.pts.join('\n')} mode="bullets" ctx={p.title} onApply={v => setPr(i, j, { pts: L2(v) })} />
          <button className="btn sm ghost" onClick={() => setSec(i, { projects: s.projects.filter((_, k) => k !== j) })}>Remove this project</button></div>)}
          <button className="btn sm" style={{ marginTop: 8 }} onClick={() => setSec(i, { projects: [...s.projects, { title: 'Project name', meta: [], desc: '', pts: [] }] })}>+ Add a project</button></>
        : <><textarea style={{ minHeight: 90, marginTop: 8 }} value={s.lines.join('\n')} onChange={e => setSec(i, { lines: L2(e.target.value), derived: false })} />{(s.kind === 'summary' || s.kind === 'other') && <Helper value={s.lines.join('\n')} mode={s.kind === 'summary' ? 'bullets' : 'bullets'} ctx={s.title} onApply={v => setSec(i, { lines: L2(v) })} />}</>}
      </div>)}
      <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setDoc({ ...doc, sections: [...doc.sections, { kind: 'other', title: 'New section', lines: ['Write here'] }] })}>+ Add a section</button></>}</div>;
}
