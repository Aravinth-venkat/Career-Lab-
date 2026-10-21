import React from 'react';
// "How hiring software reads your resume": our own checks, built from what recruiters' systems commonly need.
export function atsChecks(doc, txt, pages, tpl) {
  const items = [], add = (st, t, d) => items.push({ st, t, d });
  const has = k => doc.sections.some(s => s.kind === k && !s.hidden), ex = doc.sections.find(s => s.kind === 'experience'), words = String(txt || '').trim().split(/\s+/).length;
  const em = doc.contact.some(c => /@/.test(c)), ph = doc.contact.some(c => /\d{5}/.test(c));
  add(doc.name && doc.name !== 'Your Name' ? 'ok' : 'bad', 'Your name', doc.name && doc.name !== 'Your Name' ? 'Found: ' + doc.name : 'No name found on the first line. Put your full name at the top.');
  add(em ? 'ok' : 'bad', 'Email', em ? 'Found.' : 'No email found. Recruiters cannot reach you without it.');
  add(ph ? 'ok' : 'warn', 'Phone number', ph ? 'Found.' : 'No phone number found. Add it with the country code.');
  const need = [['experience', 'Experience'], ['education', 'Education'], ['skills', 'Skills']], miss = need.filter(([k]) => !has(k)).map(x => x[1]);
  add(miss.length ? 'warn' : 'ok', 'Standard section headings', miss.length ? 'Not found: ' + miss.join(', ') + '. Hiring software looks for these exact words, each on its own line.' : 'Experience, Education and Skills all found.');
  if (ex && ex.entries.length) { const nd = ex.entries.filter(e => !e.dates).length, nc = ex.entries.filter(e => !e.company).length; add(nd ? 'warn' : 'ok', 'Job dates', nd ? nd + ' job(s) have no dates the system can read. Write dates like "Jan 2024 - Present".' : 'Every job has a readable date range.'); add(nc ? 'warn' : 'ok', 'Company names', nc ? nc + ' job(s) have no company name.' : 'Every job has a company name.'); const pts = ex.entries.reduce((a, e) => a + e.pts.length, 0); if (!pts && !doc.sections.some(s => s.kind === 'projects')) add('warn', 'Achievement points', 'No bullet points under your jobs. Add 2 to 4 short points for each.'); }
  else add('warn', 'Work history', 'No jobs found. Freshers can skip this if projects and education are clear.');
  const odd = (String(txt).match(/[•●▪➤❖✔★☎✉\u{1F300}-\u{1FAFF}]/gu) || []).length; add(odd > 12 ? 'warn' : 'ok', 'Symbols and icons', odd > 12 ? 'Many special symbols or emoji found. Some systems drop them and scramble the text. Our PDF uses plain bullets.' : 'No risky symbols.');
  add(pages.length <= 2 ? 'ok' : 'warn', 'Length', pages.length + ' page' + (pages.length > 1 ? 's' : '') + (pages.length > 2 ? '. Aim for one or two pages.' : '. Good.'));
  add(words >= 250 && words <= 900 ? 'ok' : 'warn', 'Amount of text', words + ' words. ' + (words < 250 ? 'Quite short. Add skills, projects or achievements.' : words > 900 ? 'Long. Keep the strongest points.' : 'A good size.'));
  if (tpl === 'sidebar' || tpl === 'timeline') add('warn', 'Template layout', 'This template has two columns. Some older hiring systems read the side column out of order. For online applications, use Classic, Modern or Minimal.'); else add('ok', 'Template layout', 'Single column, plain fonts. Easy for hiring software to read.');
  const score = Math.round(100 * items.reduce((a, i) => a + (i.st === 'ok' ? 1 : i.st === 'warn' ? 0.55 : 0), 0) / items.length);
  return { items, score };
}
const ic = { ok: '✅', warn: '⚠️', bad: '❌' };
export default function Ats({ doc, txt, pages, tpl }) {
  const r = atsChecks(doc, txt, pages, tpl), ex = doc.sections.find(s => s.kind === 'experience');
  return <div className="card"><div className="row" style={{ gap: 18 }}><div className="score" style={{ '--p': r.score }}><span>{r.score}</span></div><div><h3>How hiring software reads your resume</h3><p className="dim sm">Many companies scan resumes with software before a person sees them. This check shows what it can find. It updates when you change the template or text.</p></div></div>
    <div className="grid" style={{ marginTop: 12 }}><div><b className="sm">What the software finds</b><ul className="sm"><li>Name: {doc.name}</li><li>Contact: {doc.contact.join(', ') || 'none'}</li><li>Sections: {doc.sections.filter(s => !s.hidden).map(s => s.title).join(', ')}</li>{ex && ex.entries.map((e, i) => <li key={i}>Job {i + 1}: {e.role || '?'} · {e.company || '?'} · {e.dates || 'no dates'}</li>)}</ul></div>
      <div><b className="sm">Checks</b><ul className="sm" style={{ listStyle: 'none', padding: 0 }}>{r.items.map((i, k) => <li key={k} style={{ margin: '6px 0' }}>{ic[i.st]} <b>{i.t}.</b> <span className="dim">{i.d}</span></li>)}</ul></div></div></div>;
}
