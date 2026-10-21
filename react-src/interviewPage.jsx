import React, { useState, useMemo, useEffect } from 'react';
import { D, C, modeOf } from './lib.js';
import { useS } from './ctx.jsx';
const GEN = ['HR', 'Behavioural', 'Situational', 'Fresher', 'Leadership', 'Telephonic', 'Ethics'];
const pct = v => Math.round(v * 100);
const Bar = ({ l, v, tip }) => <div style={{ margin: '8px 0' }} title={tip}><div className="row" style={{ justifyContent: 'space-between' }}><span className="sm">{l}</span><span className="sm dim">{pct(v)}%</span></div><div className="bar"><i style={{ width: pct(v) + '%' }} /></div></div>;
const copy = t => { try { navigator.clipboard.writeText(t); } catch (e) { } };
export default function Interview({ arg }) {
  const forced = arg && D.OPEN.find(x => x.id === arg);
  const { S, set } = useS(), mode = modeOf(S), saved = S.myans || {};
  const det = useMemo(() => { try { return S.resume ? (C.detectTrack(S.resume, D.SKILLS)[0] || {}).track : ''; } catch (e) { return ''; } }, [S.resume]);
  const [track, setTrack] = useState(forced && forced.track || S.track || det || ''), [cat, setCat] = useState(forced ? forced.cat : mode === 'new' || mode === 'fresher' ? 'Fresher' : 'Technical');
  const [i, setI] = useState(0), [txt, setTxt] = useState(''), [g, setG] = useState(null), [fu, setFu] = useState(null), [help, setHelp] = useState(false), [view, setView] = useState('practice');
  const pool = useMemo(() => D.OPEN.filter(q => q.q && q.keys && q.m && (cat === 'Technical' ? q.cat === 'Technical' && (!track || q.track === track) : q.cat === cat)), [track, cat]);
  useEffect(() => { setI(0); setTxt(''); setG(null); setFu(null); }, [track, cat]);
  useEffect(() => { if (forced) { const k = D.OPEN.filter(x => x.cat === forced.cat && (forced.cat !== 'Technical' || x.track === forced.track)).findIndex(x => x.id === forced.id); if (k >= 0) setI(k); } }, [arg]);
  const q = fu || pool[i % Math.max(1, pool.length)];
  const topic = q && D.TOPICS.find(t => t.id === q.topic), tn = (D.TRACKS.find(t => t.id === (q && q.track || track)) || {}).name;
  const related = useMemo(() => !q ? [] : D.OPEN.filter(x => x.id !== q.id && x.cat === q.cat && (q.cat !== 'Technical' || x.track === q.track) && x.topic === q.topic).slice(0, 4), [q]);
  const hints = useMemo(() => { try { return q ? C.hints(q) : []; } catch (e) { return []; } }, [q]), frame = useMemo(() => { try { return q ? C.explainTemplate(q) : []; } catch (e) { return []; } }, [q]), safe = useMemo(() => { try { return q ? C.rescue(q) : ''; } catch (e) { return ''; } }, [q]);
  const reset = () => { setTxt(''); setG(null); setFu(null); setHelp(false); };
  const next = () => { setI(x => x + 1); reset(); };
  const check = () => { const r = C.grade(txt, q.keys), cc = (() => { try { return C.coach(txt, 0); } catch (e) { return null; } })(); setG({ ...r, cc, fb: C.feedback(r) }); if (r.words >= 8) set(o => ({ dims: [...(o.dims || []), { o: r.overall }].slice(-60), xp: (o.xp || 0) + 5 })); };
  const askFollow = () => { try { const f = C.followUp(txt, g, []); if (f) { setFu({ ...f, id: 'fu' + Date.now() }); setTxt(''); setG(null); setHelp(false); } } catch (e) { } };
  const keep = () => set(o => ({ myans: { ...(o.myans || {}), [q.id]: { q: q.q, a: txt, s: g ? g.overall : 0, cat: q.cat, ts: Date.now() } } }));
  const answered = (S.dims || []).length, avg = answered ? Math.round((S.dims.reduce((a, b) => a + b.o, 0) / answered) * 100) : 0, mine = Object.entries(saved).sort((a, b) => b[1].ts - a[1].ts);
  const tips = (q && (q.track || track) === 'servicenow' ? (D.TIPS || []) : []).slice(0, 4);
  return <>
    <h1>🎤 Interview practice</h1>
    <p className="dim">Pick your field and the type of question. Answer in your own words, get feedback, and save the answers you like to use again.</p>
    <div className="tabs"><button className={'chip' + (view === 'practice' ? ' on' : '')} onClick={() => setView('practice')}>Practise</button><button className={'chip' + (view === 'saved' ? ' on' : '')} onClick={() => setView('saved')}>My saved answers ({mine.length})</button><a className="chip" href="#/mock">🎙️ Mock interview</a><a className="chip" href="#/speak">🗣️ Speak your answer</a></div>
    {view === 'saved' ? <>{!mine.length && <div className="card">Nothing saved yet. After you check an answer, tap <b>Save this answer</b> and it appears here to copy and reuse.</div>}
      {mine.map(([id, m]) => <div className="card" key={id}><span className="tag">{m.cat}</span><h3 style={{ margin: '8px 0' }}>{m.q}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{m.a}</p><div className="row"><button className="btn sm" onClick={() => copy(m.a)}>📋 Copy</button><button className="btn sm ghost" onClick={() => set(o => { const n = { ...(o.myans || {}) }; delete n[id]; return { myans: n }; })}>Delete</button><span className="dim sm">Score {pct(m.s)}%</span></div></div>)}</> : <>
      <div className="card"><div className="row"><label>Your field<select value={track} onChange={e => setTrack(e.target.value)}><option value="">Choose your field</option>{D.TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <div className="row" style={{ flex: 1 }}>{['Technical', ...GEN].map(c => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div></div>
        {cat === 'Technical' && !track && <p className="note" style={{ marginTop: 10 }}>Choose your field above to get questions for your own work.</p>}
        <p className="dim sm" style={{ margin: '10px 0 0' }}>{pool.length} questions here · you have answered {answered} so far{answered ? ' · average score ' + avg + '%' : ''}</p></div>
      {!q ? <div className="card">No questions for this choice yet. Try another type.</div> : <div className="card">
        <div className="row"><span className="tag">{fu ? 'Follow-up' : q.cat}</span>{tn && q.cat === 'Technical' && <span className="tag alt">{tn}</span>}{!fu && <span className="dim sm">Question {(i % pool.length) + 1} of {pool.length}</span>}</div>
        <h2 style={{ margin: '10px 0' }}>{q.q}</h2>
        <button className="btn sm ghost" onClick={() => setHelp(!help)}>{help ? 'Hide help' : '💡 Need help answering?'}</button>
        {help && <div className="note" style={{ marginTop: 8 }}><b>How to answer</b><ul className="sm">{frame.map((f, k) => <li key={k}>{f.replace(/^\d\.\s*/, '')}</li>)}</ul>{hints.length > 0 && <><b>Hints</b><ul className="sm">{hints.map((f, k) => <li key={k}>{f}</li>)}</ul></>}<b>If you are stuck, start like this</b><p className="sm" style={{ margin: '4px 0 0' }}>{safe}</p></div>}
        <textarea style={{ minHeight: 140, marginTop: 10 }} placeholder="Type your answer…" value={txt} onChange={e => setTxt(e.target.value)} />
        <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={check} disabled={txt.trim().length < 5}>Check my answer</button><button className="btn" onClick={next}>Another question</button><span className="dim sm">{txt.trim() ? txt.trim().split(/\s+/).length : 0} words · aim for 40 to 90</span></div></div>}
      {g && q && <div className="card"><h3>Your feedback</h3><p>{g.fb}</p>
        <Bar l="Knowledge" v={g.know} tip="Did you cover the key ideas?" /><Bar l="Confidence" v={g.conf} tip="Direct words, no hedging" /><Bar l="Reasoning" v={g.reason} tip="Because, for example, so that" /><Bar l="Clarity" v={g.clar} tip="Clear, not too short or too long" />
        {g.hit.length > 0 && <p className="sm">✅ <b>You covered:</b> {g.hit.join(', ')}</p>}{g.miss.length > 0 && <p className="sm">➕ <b>Add these ideas:</b> {g.miss.slice(0, 6).join(', ')}</p>}
        {g.cc && g.cc.tips.length > 0 && <><b className="sm">Speaking tips</b><ul className="sm dim">{g.cc.tips.slice(0, 3).map((t, k) => <li key={k}>{t}</li>)}</ul></>}
        <div className="note"><b>A strong answer looks like this</b><p style={{ margin: '6px 0 0' }}>{q.m}</p></div>
        <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={keep}>{saved[q.id] ? '✓ Saved. Save again' : '💾 Save this answer'}</button><button className="btn" onClick={() => copy(txt)}>📋 Copy my answer</button><button className="btn" onClick={askFollow}>↪ Ask me a follow-up</button><button className="btn" onClick={next}>Next question</button></div></div>}
      {q && <div className="grid">
        {topic && <a className="card" href={'#/topic/' + topic.id}><h3>📚 Revise: {topic.name}</h3><p className="dim sm">Read the lesson and key terms, then take the quiz.</p></a>}
        {!topic && track && <a className="card" href={'#/learn/' + track}><h3>📚 Learn {tn}</h3><p className="dim sm">Lessons and quizzes for your field.</p></a>}
        <a className="card" href="#/mock"><h3>🎙️ Full mock interview</h3><p className="dim sm">A timed round with a score at the end.</p></a>
        <a className="card" href="#/report"><h3>📊 Fix your resume</h3><p className="dim sm">Interviewers ask about what is on it. Make it strong first.</p></a></div>}
      {related.length > 0 && <div className="card"><b>More questions on the same topic</b>{related.map(x => <p key={x.id} style={{ margin: '8px 0 0' }}><button className="btn sm ghost" style={{ textAlign: 'left' }} onClick={() => { const k = pool.findIndex(p => p.id === x.id); if (k >= 0) { setI(k); reset(); } else { setFu(x); setTxt(''); setG(null); } }}>{x.q}</button></p>)}</div>}
      <div className="card"><b>Quick interview tips</b><ul className="sm">{tips.map((t, k) => <li key={k}>{t}</li>)}<li>Use a real example from your work, study or project in every answer.</li><li>Start with the answer in one sentence, then give the reason, then the example.</li></ul></div></>}
  </>;
}
