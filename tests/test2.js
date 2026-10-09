const assert = require('assert'); const D = require('../js/content.js'), C = require('../js/core.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok - ' + name); };
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
t('data integrity', () => {
  assert.strictEqual(D.TOPICS.length, 41);
  const ids = new Set(D.TOPICS.map(x => x.id)); assert.strictEqual(ids.size, 41);
  D.TOPICS.forEach(x => { assert(x.facts.length >= 6, x.id + ' facts'); assert(x.scen && C.steps(x.scen[1]).length >= 4, x.id + ' scen'); assert(x.lesson && x.story && x.tip, x.id);
    assert(D.TRACKS.some(tr => tr.id === x.track), x.id + ' track'); });
  const terms = D.FACTS.map(f => f.t.toLowerCase()); assert.strictEqual(new Set(terms).size, terms.length);
  D.FACTS.forEach(f => { assert(f.t.length > 1 && f.d.length > 8, f.id); });
  D.OPEN.forEach(o => assert(o.q && o.keys.length >= 4 && o.m, o.id));
});
t('generated questions are valid and distinct', () => {
  const qs = C.genQuestions(D.FACTS, { count: 40 }, rnd); assert(qs.length >= 38);
  qs.forEach(q => { assert(q.o[q.a] !== undefined); if (q.o.length === 4) assert.strictEqual(new Set(q.o).size, 4, q.q); });
  assert.strictEqual(new Set(qs.map(q => q.id)).size, qs.length);
  const topic = 'incident', a = C.genQuestions(D.FACTS, { count: 3, topic }, rnd), b = C.genQuestions(D.FACTS, { count: 3, topic, seen: a.map(q => q.id) }, rnd);
  assert(!b.some(q => a.find(x => x.id === q.id)), 'no repeats while unseen remain');
});
t('collapse voice repeats', () => {
  assert.strictEqual(C.collapseRuns('hi hi hi hi'), 'hi'); assert.strictEqual(C.collapseRuns('I had had enough'), 'I had had enough');
  assert.strictEqual(C.collapseRuns('tell me tell me about it'), 'tell me about it');
});
t('merge speech finals', () => {
  assert.strictEqual(C.mergeFinals(['hi', 'hi how', 'hi how are you']), 'hi how are you');
  assert.strictEqual(C.mergeFinals(['hello my name is', 'Priya and I work']), 'hello my name is Priya and I work');
  assert.strictEqual(C.mergeFinals(['hi hi hi hi']), 'hi'); assert.strictEqual(C.mergeFinals([]), '');
});
t('stem matching', () => { const g = C.grade('The rules are triggered when records are updated', ['rule', 'trigger', 'update']); assert.strictEqual(g.hit.length, 3); });
t('scenario questions', () => { D.TOPICS.forEach(x => { const q = C.scenQ(x); assert(q.keys.length >= 4, x.id); const g = C.grade(x.scen[1].replace(/;/g, '. First then because'), q.keys); assert(g.know > .9, x.id + ' model answer scores high'); }); });
const RES = `Priya Nair\npriya@mail.com +91 98765 43210\nSUMMARY\nServiceNow developer with 3 years experience.\nEXPERIENCE\n- Built a REST integration between ServiceNow and an HR system that reduced onboarding time by 40%\n- Configured Business Rules and Flow Designer flows for incident assignment, supporting 500 users\n- Managed the CMDB and ran Discovery for 2000 servers\nSKILLS ServiceNow, ITSM, REST, SQL\nEDUCATION B.E. Computer Science`;
t('resume pipeline', () => {
  const tr = C.detectTrack(RES, D.SKILLS); assert.strictEqual(tr[0].track, 'servicenow');
  const found = C.extractSkills(RES, D.SKILLS); assert(found.length >= 3);
  const r = C.buildProjectRound(RES, D.TOPICS, ['servicenow']); assert(r.length >= 4); assert(!r.some(q => /Recruitment|Performance/.test(q.kind)), 'no HR scenarios for an IT resume'); assert(r.some(q => /Your resume says/.test(q.q))); assert(r.some(q => /situation/i.test(q.q)));
  const p = C.skillLearnPath(found, D.TOPICS, {}, 'servicenow'); assert(p.length >= 3); assert(p[0].kind === 'resume');
  const c = C.claimsCheck(['A', 'B', 'C'], { A: .9, B: .2 }); assert.deepStrictEqual([c.solid, c.shaky, c.untested], [['A'], ['B'], ['C']]);
  const fs = C.extractSkills(RES, D.SKILLS); assert(!fs.includes('HR fundamentals') && !fs.includes('Recruitment & onboarding'), 'IT resume must not claim HR skills: ' + fs);
  assert(!C.projectLines(RES).some(l => /^ServiceNow developer with/.test(l)), 'summary is not a project line');
  const hr = 'Anita\nSUMMARY\nHR executive. Managed recruitment for 40 hires and handled payroll queries and employee grievances for 300 employees.\nSKILLS recruitment, payroll';
  assert.strictEqual(C.detectTrack(hr, D.SKILLS)[0].track, 'hr');
});
t('speaking coach and read aloud', () => {
  const c = C.coach('Um basically I is working on project project and like I am having 3 years experience', 20); assert(c.fillers.um && c.repeats.includes('project') && c.grammar.length >= 2);
  assert(C.coach('I build integrations between systems. First I gather the requirements from the business. Then I design the flow and test it with real data. Finally I monitor errors after release.', 12).score > 80);
  const r = C.readAloud('Good morning my name is Priya', 'good morning my name Priya'); assert.strictEqual(r.pct, 83); assert.deepStrictEqual(r.missed, ['is']);
});
t('intro and plan', () => { assert(/My name is Asha/.test(C.introText({ name: 'Asha', role: 'analyst', years: '2 years', skills: ['Excel', 'SQL'] }))); const p = C.studyPlan(D.TOPICS.slice(0, 3), 7); assert.strictEqual(p.length, 7); assert(p[6].items.some(i => i.k === 'mock')); });
console.log('\nAll ' + n + ' v2 tests passed');
