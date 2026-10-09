/* Career Lab content v2 (data lives in content-data.js). Builds tracks, topics, facts, skills and the question bank. */
(function (root) {
const D = root.DATA || require('./data.js'), X = root.CONTENT || require('./content-data.js');
const facts = s => s.split("|").map(x => { const i = x.indexOf("="); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; });
const topics = D.TOPICS.map(t => Object.assign({}, t, { track: "servicenow", facts: facts(X.snf[t.id]), adv: false }));
X.raw.forEach(r => topics.push({ id: r[0], track: r[1], name: r[2], ic: r[3], skill: r[2], aliases: r[4], story: r[5], lesson: r[6], ex: r[7], tip: r[8], facts: facts(r[9]), adv: !!r[10], qs: [] }));
topics.forEach(t => { if (X.scen[t.id]) t.scen = X.scen[t.id]; });
const FACTS = [];
topics.forEach(t => { t.facts = t.facts.map((f, i) => { const o = { id: t.id + ":" + i, t: f[0], d: f[1], topic: t.id, track: t.track }; FACTS.push(o); return o; }); });
const drop = ["JavaScript", "SQL", "Agile"];
const skills = D.SKILLS.filter(s => !drop.includes(s.n)).map(s => Object.assign({ track: ["Python", "Java"].includes(s.n) ? "programming" : "servicenow" }, s));
topics.filter(t => t.aliases).forEach(t => skills.push({ n: t.name, al: t.aliases.split(";").map(x => x.trim().toLowerCase()), keys: t.facts.slice(0, 8).map(f => f.t.toLowerCase()), m: t.lesson, track: t.track }));
const open = X.open.map((o, i) => ({ id: "o" + i, cat: o.c, q: o.q, keys: o.k, m: o.m, topic: "interview" }));
Object.keys(X.tech).forEach(tr => X.tech[tr].forEach((x, i) => open.push({ id: "t" + tr + i, cat: "Technical", track: tr, q: x.q, keys: x.k, m: x.m, topic: tr })));
D.INTERVIEW.forEach((x, i) => open.push({ id: "s" + i, cat: "Technical", track: "servicenow", q: x.q, keys: x.keys, m: x.m, topic: x.topic, lv: x.lv }));
Object.assign(D, { TRACKS: X.tracks, TOPICS: topics, SKILLS: skills, FACTS, OPEN: open });
if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
