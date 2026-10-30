import React, { useMemo } from 'react';
import { D, C, modeOf, yearsOf } from './lib.js';
import { useS } from './ctx.jsx';
import { norm, level, levelTitle, skillsFound, myTracks, accMap, BADGES, tname } from './coreC.jsx';
import './ladderShim.js';
import LD from '../../cl-src/js/ladder.js';
const Tile = ({ ic, n, l }) => <div className="card tile"><b className="tn">{ic} {n}</b><div className="dim sm">{l}</div></div>;
const Go = ({ href, ic, t, d }) => <a className="card" href={href}><h3>{ic} {t}</h3><p className="dim sm">{d}</p></a>;
export default function HomeDash() {
  const { S } = useS(), N = norm(S), mode = modeOf(S), y = yearsOf(S);
  const d = useMemo(() => {
    const tr = N.track || myTracks(N)[0] || '', T = D.TRACKS.find(t => t.id === tr) || {}, L = LD.tracks[tr], yy = y === null || y === undefined ? 0 : y, lv = L ? LD.levelFor(yy) : -1;
    let a = null; try { a = C.analyzeResume(S.resume, D.SKILLS); } catch (e) { }
    const sk = skillsFound(N), miss = D.SKILLS.filter(s => s.track === tr && !sk.includes(s.n)).slice(0, 4), am = accMap(N), weak = Object.entries(am).filter(([, v]) => v !== undefined && v < 0.6).sort((p, q) => p[1] - q[1]).slice(0, 3).map(x => x[0]);
    const badges = BADGES.filter(b => (N.badges || {})[b.id]).concat(BADGES.filter(b => !(N.badges || {})[b.id] && b.t(N))), apps = Array.isArray(S.apps) ? S.apps : [];
    return { tr, T, lv, cur: L && L.levels[lv], nxt: L && L.levels[lv + 1], a, sk, miss, weak, badges: badges.slice(0, 8), apps, solved: Object.keys(N.solved || {}).filter(k => !k.startsWith('draft_')).length, topics: D.TOPICS.filter(t => am[t.name] !== undefined).length };
  }, [S]);
  const ans = (N.dims || []).length, avg = ans ? Math.round(N.dims.reduce((x, z) => x + z.o, 0) / ans * 100) : 0, applied = d.apps.filter(x => x.st && x.st !== 'wish').length, tn = d.T.name || 'your field';
  const fresh = mode === 'new' || mode === 'fresher';
  const recs = fresh ? [['#/companies', '🏢', 'Companies that hire freshers', 'See employers in ' + tn + ' and what each looks for.'], ['#/career', '💼', 'Fresher jobs', 'Openings that welcome 0 to 1 year.'], ['#/walkin', '🚶', 'Walk-in drives', 'Interviews you can attend in person, city by city.'], ['#/plan', '🗓️', 'First job in 30 days', 'A daily plan to get your first job.'], ['#/scam', '🛡️', 'Is this job real?', 'Paste an offer and check for scam signs.'], ['#/learn/' + d.tr, '📚', 'Learn ' + tn, 'Lessons, key terms and quizzes for your field.'], ['#/interview', '🎤', 'Practise interviews', 'Questions for your field, with feedback.'], ...(['servicenow', 'programming'].includes(d.tr) ? [['#/lab', '💻', 'Coding lab', 'Write code and see tests pass.']] : []), ['#/journey', '🧭', 'Where to start', 'An 8-step guide from resume to first day.']]
    : mode === 'exp' ? [['#/ladder', '🪜', 'Career ladder', 'Where you are and what the next level needs.'], ['#/mentor', '🧑‍🏫', 'Career mentor', 'Plan a job change or a switch to a new field.'], ['#/toolkit', '🧰', 'Career toolkit', 'Explain your work well and write salary and promotion emails.'], ['#/career', '💼', 'Matched jobs', 'Roles that fit your skills.'], ['#/ctc', '💵', 'Offer and CTC check', 'Turn an offer into monthly in-hand pay.'], ['#/interview', '🎤', 'Interview preparation', 'Practise the questions for your field.']]
    : [['#/mentor', '🧑‍🏫', 'Career mentor', 'Plan your next move at your level.'], ['#/toolkit', '🧰', 'Career toolkit', 'Emails for raises, promotions and offers.'], ['#/offer', '🤝', 'Offer helper', 'Compare offers and negotiate well.'], ['#/ladder', '🪜', 'Career ladder', 'What lead and head roles expect.'], ['#/ctc', '💵', 'CTC to in-hand', 'See real monthly pay and notice buyout.'], ['#/career', '💼', 'Matched roles', 'Senior openings that fit.']];
  return <>
    <h2>Where you stand</h2>
    <div className="grid">
      <Tile ic="🧭" n={d.cur ? d.cur.t : tn} l={d.cur ? 'Your level in ' + tn + (y !== null && y !== undefined ? ' · about ' + y + ' year' + (y === 1 ? '' : 's') : '') : 'Your field'} />
      <Tile ic="📄" n={d.a ? d.a.score + '/100' : '-'} l={'Resume score · ' + d.sk.length + ' skills found'} />
      <Tile ic="🎯" n={d.nxt ? d.nxt.t : 'Top of the ladder'} l="Your next step up" />
      <Tile ic="🔥" n={(N.streak || 0) + ' day' + ((N.streak || 0) === 1 ? '' : 's')} l={'Practice streak · level ' + level(N.xp) + ' ' + levelTitle(N.xp)} />
    </div>
    <div className="grid">
      <div className="card"><h3>🏅 What you have achieved</h3>
        <p className="sm">{ans} interview answer{ans === 1 ? '' : 's'} practised{ans ? ' (average ' + avg + '%)' : ''} · {d.topics} topic{d.topics === 1 ? '' : 's'} studied · {d.solved} coding challenge{d.solved === 1 ? '' : 's'} solved · {applied} application{applied === 1 ? '' : 's'} sent</p>
        <div className="row">{d.badges.map(b => <span key={b.id} className={'chip' + ((N.badges || {})[b.id] ? ' on' : '')} title={(N.badges || {})[b.id] ? 'Earned' : 'Not earned yet'} style={(N.badges || {})[b.id] ? {} : { opacity: .45 }}>{b.ic} {b.n}</span>)}</div>
        <p className="dim sm" style={{ marginBottom: 0 }}>Bright badges are earned. Faded ones are next.</p></div>
      <div className="card"><h3>🔎 Areas to work on</h3>
        {d.a && d.a.tips.length > 0 && <><b className="sm">Fix on your resume</b><ul className="sm">{d.a.tips.slice(0, 3).map((t, k) => <li key={k}>{t}</li>)}</ul></>}
        {d.miss.length > 0 && <><b className="sm">Skills to add for {tn}</b><div className="row" style={{ margin: '6px 0 10px' }}>{d.miss.map(s => { const t = D.TOPICS.find(x => x.skill === s.n); return <a key={s.n} className="chip" href={t ? '#/topic/' + t.id : '#/learn/' + d.tr}>➕ {s.n}</a>; })}</div></>}
        {d.weak.length > 0 && <><b className="sm">Revise these (quiz score under 60%)</b><div className="row" style={{ marginTop: 6 }}>{d.weak.map(n => { const t = D.TOPICS.find(x => x.name === n); return <a key={n} className="chip" href={t ? '#/topic/' + t.id : '#/learn'}>{n}</a>; })}</div></>}
        {!(d.a && d.a.tips.length) && !d.miss.length && !d.weak.length && <p className="sm dim">Nothing urgent. Keep practising.</p>}</div>
    </div>
    <h2>Recommended for you</h2><p className="dim sm" style={{ marginTop: -6 }}>{fresh ? 'Because you are starting out, begin with companies, learning and practice.' : mode === 'exp' ? 'Because you have some experience, focus on your next move and how you present your work.' : 'Because you are senior, focus on roles, offers and negotiation.'}</p>
    <div className="grid">{recs.map(r => <Go key={r[0]} href={r[0]} ic={r[1]} t={r[2]} d={r[3]} />)}</div>
    <h2>Quick answers</h2>
    <div className="grid"><Go href="#/journey" ic="🚀" t="Where and how do I start?" d="The 8-step journey: know your level, close gaps, apply, interview, join." /><Go href="#/report" ic="✅" t="Is my resume right?" d="Your score, missing skills and what to fix first." /><Go href="#/mock" ic="🎙️" t="How do I prepare for the interview?" d="Practise answers, take a timed mock and get a score." /><Go href="#/resumepdf" ic="📄" t="Resume Studio" d="Pick a template, improve the wording, download PDF or Word." /></div>
  </>;
}
