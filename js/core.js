/* Career Lab core logic: pure functions, works in browser and Node (for tests). */
(function (root) {
  const HEDGES = ["maybe", "i think", "i guess", "not sure", "probably", "kind of", "sort of", "i don't know", "i dont know", "might be", "possibly", "not really", "no idea", " um ", " uh "];
  const BOLD = ["i built", "i designed", "i implemented", "i led", "i created", "i configured", "i fixed", "i delivered", "definitely", "clearly", "i decided", "my role", "i was responsible", "i developed", "i resolved", "i owned", "i ensured", "i automated", "i worked on", "i handled"];
  const LOGIC = ["because", "so that", "therefore", "if ", "then", "first", "second", "next", "finally", "for example", "for instance", "as a result", "which means", "due to", "in order to", "since "];

  function words(t) { return (t || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length; }

  const STOP = new Set("a an the and or but if then of to in on at for with by from as is are was were be been being it its this that these those i you he she we they my your our their me us them do does did done have has had will would can could should may might shall not no yes so than too very just also into out up down over under about after before when where which who whom what why how all any each every some such only own same other more most both few many much one two three using used use make made get got per via etc".split(" "));
  function stem(w) { w = w.toLowerCase().replace(/[^a-z0-9]/g, ""); if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y"; for (const suf of ["ations", "ation", "ments", "ment", "ings", "ing", "ed", "es", "s"]) if (w.length > suf.length + 3 && w.endsWith(suf)) return w.slice(0, -suf.length); return w; }
  function tokens(t) { return (t || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
  function keyHit(t, stems, k) { k = k.toLowerCase(); if (t.includes(k)) return true; const ks = tokens(k); return ks.length > 0 && ks.every(x => stems.has(stem(x))); }

  /* Chrome speech-to-text can emit the same words many times. Collapse those glitches. */
  function collapseRuns(text) {
    let t = (text || "").replace(/\s+/g, " ").trim(), prev;
    do { prev = t; t = t.replace(/\b([\w'-]+)(?:\s+\1\b){2,}/gi, "$1").replace(/\b((?:[\w'-]+\s+){1,7}[\w'-]+)(?:\s+\1\b)+/gi, "$1"); } while (t !== prev);
    return t;
  }

  /* Android Chrome often sends each final result as a growing copy of the previous one ("hi", "hi how", "hi how are you"). Keep only the longest. */
  function mergeFinals(list) {
    const out = [];
    (list || []).map(x => (x || "").trim()).filter(Boolean).forEach(cur => {
      const prev = out.length ? out[out.length - 1] : null, lc = cur.toLowerCase();
      if (prev !== null && lc.startsWith(prev.toLowerCase())) out[out.length - 1] = cur;
      else if (prev !== null && prev.toLowerCase().startsWith(lc)) { /* shorter echo, ignore */ }
      else out.push(cur);
    });
    return collapseRuns(out.join(" "));
  }

  function grade(text, keys) {
    const t = " " + (text || "").toLowerCase() + " ";
    const w = words(text);
    const hit = [], miss = [];
    const stems = new Set(tokens(text).map(stem));
    (keys || []).forEach(k => (keyHit(t, stems, k) ? hit : miss).push(k));
    const know = keys && keys.length ? Math.min(1, hit.length / (keys.length * 0.6)) : 0;
    const hed = HEDGES.filter(x => t.includes(x)).length;
    const bold = BOLD.filter(x => t.includes(x)).length;
    const logic = LOGIC.filter(x => t.includes(x)).length;
    let conf = 0.5 + 0.12 * bold - 0.15 * hed;
    if (w >= 25) conf += 0.15;
    if (w < 8) conf -= 0.25;
    conf = Math.max(0, Math.min(1, conf));
    let reason = Math.min(1, logic / 3);
    let clar = 0.2;
    if (w >= 10) clar = 0.5;
    if (w >= 25) clar = 0.8;
    if (w >= 40 && w <= 160) clar = 1;
    if (w > 220) clar = 0.7;
    if (w === 0) { conf = 0; reason = 0; clar = 0; }
    const overall = know * 0.4 + reason * 0.2 + conf * 0.2 + clar * 0.2;
    return { know, conf, reason, clar, overall, hit, miss, words: w, hedges: hed };
  }

  function feedback(g) {
    if (g.words === 0) return "No answer yet. Even a short attempt helps: say what you do know, then reason step by step.";
    if (g.know >= 0.6 && g.conf >= 0.6) return "Strong answer: correct ideas and a confident delivery.";
    if (g.know < 0.4 && g.conf >= 0.6) return "You sounded confident, which is a real strength, but key ideas are missing. Keep the boldness and add the missing concepts.";
    if (g.know >= 0.6 && g.conf < 0.6) return g.hedges > 0 ? "You know this, but it sounded unsure. Replace 'I think' or 'maybe' with direct statements." : "You covered the right ideas. Add more detail, a reason and a real example so it sounds confident.";
    if (g.hedges >= 2) return "Several hedging phrases made the answer sound unsure. State what you know directly, then explain why.";
    return "Good start. Add the missing ideas and explain your reasoning with 'because' and 'for example'.";
  }

  /* Interview Rescue: progressive hints and a safe way to answer when unsure */
  function hints(q) {
    const k = q.keys || [];
    return [
      "Think about the main purpose of " + (q.topic || "this concept") + ". What problem does it solve?",
      "Try to mention these ideas: " + k.slice(0, 2).join(", ") + (k.length > 2 ? " ..." : ""),
      "Structure it: what it is, how it works (" + k.slice(2, 5).join(", ") + "), one example, one limitation."
    ];
  }
  function rescue(q) {
    const k = (q.keys || []).slice(0, 3);
    return "I don't remember every detail, but my understanding is that this relates to " + (k.join(", ") || "the core concept") + ". I would first confirm the requirement, check the relevant configuration and logs, reproduce the behaviour, then validate any fix before releasing it.";
  }
  function explainTemplate(q) {
    const k = q.keys || [];
    return ["1. Definition: say what it is in one sentence" + (k[0] ? " (use the word '" + k[0] + "')" : "") + ".",
      "2. How it works: explain the steps" + (k[1] ? " (mention '" + k[1] + "')" : "") + ".",
      "3. Example: describe one real case you have seen or built.",
      "4. Limitation or trade-off: when would you not use it?"];
  }

  /* ---------- Resume ---------- */
  function has(t, a) { a = a.trim(); if (!a) return false; if (a.length > 5) return t.includes(a); const e = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return new RegExp("(^|[^a-z0-9])" + e + "($|[^a-z0-9])").test(t); }
  function extractSkills(text, skills) {
    const t = " " + (text || "").toLowerCase();
    const m = skills.filter(s => s.al.some(a => has(t, a))); if (m.length < 3) return m.map(s => s.n);
    const c = {}; m.forEach(s => { c[s.track] = (c[s.track] || 0) + 1; }); const top = Object.keys(c).sort((a, b) => c[b] - c[a])[0];
    return m.filter(s => c[s.track] >= 2 || s.track === top).map(s => s.n); /* a single stray word from another field (for example "HR system" in an IT resume) is not a skill */
  }

  function analyzeResume(text, skills) {
    const t = (text || "").toLowerCase(), w = words(text), items = [], tips = [];
    let cp = 0;
    if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)) cp += 5; else tips.push("Add a professional email address.");
    if (/\+?\d[\d\s-]{8,}\d/.test(text)) cp += 5; else tips.push("Add a phone number.");
    items.push({ n: "Contact details", pts: cp, max: 10 });
    const secs = { Summary: ["summary", "objective", "profile"], Experience: ["experience", "employment", "work history"], Skills: ["skills", "technologies"], Education: ["education", "university", "college", "degree"], "Projects or certifications": ["project", "certif"] };
    let sp = 0;
    Object.keys(secs).forEach(k => { if (secs[k].some(x => t.includes(x))) sp += 5; else tips.push("Add a " + k + " section."); });
    items.push({ n: "Sections", pts: sp, max: 25 });
    const found = extractSkills(text, skills);
    const tk = detectTrack(text, skills).slice(0, 1).map(x => x.track);
    if (found.length < 6) tips.push("List more skills you truly have, for example: " + skills.filter(s => !found.includes(s.n) && (!tk.length || tk.includes(s.track))).slice(0, 4).map(s => s.n).join(", ") + ".");
    items.push({ n: "Skills", pts: Math.min(25, found.length * 3), max: 25 });
    const nn = (t.match(/\d+\s?%|[₹$€]\s?\d|\b\d{1,4}(?:[.,]\d+)?\+?\s?(?:k|m|lakhs?|crores?|users|incidents|tickets|projects|hours|systems|applications|records|requests|clients|teams|customers|employees|hires|candidates|invoices|orders|units|vendors|accounts|leads|deals|calls|cases|members|people|machines|parts|suppliers|stores|reports|audits|servers|days|weeks|months)\b/g) || []).length;
    if (nn < 3) tips.push("Add numbers to show impact, e.g. 'reduced incident backlog by 30%' or 'supported 500 users'.");
    items.push({ n: "Measurable impact", pts: Math.min(20, nn * 5), max: 20 });
    let lp = 2;
    if (w >= 250 && w <= 700) lp = 10; else if ((w >= 150 && w < 250) || (w > 700 && w <= 900)) lp = 6;
    if (lp < 10) tips.push("Aim for about 250 to 700 words (1 to 2 pages). Yours is " + w + ".");
    items.push({ n: "Length", pts: lp, max: 10 });
    const weak = ["responsible for", "worked on", "helped", "etc.", "duties include", "hard working", "team player"].filter(x => t.includes(x)).length;
    if (weak) tips.push("Replace weak phrases (responsible for, worked on, helped) with action verbs like led, built, delivered.");
    items.push({ n: "Strong wording", pts: Math.max(0, 10 - 3 * weak), max: 10 });
    return { score: items.reduce((a, b) => a + b.pts, 0), items, found, tips, words: w };
  }

  function improveResume(text, found) {
    let out = text;
    const rep = [["Responsible for", "Led"], ["responsible for", "led"], ["Worked on", "Delivered"], ["worked on", "delivered"], ["Helped", "Supported"], ["helped", "supported"], ["Duties include", "Delivered"], ["etc.", ""], ["Hard working", "Results-driven"], ["hard working", "results-driven"], ["Team player", "Collaborative"], ["team player", "collaborative"]];
    rep.forEach(([a, b]) => { out = out.split(a).join(b); });
    const low = out.toLowerCase();
    if (!/summary|objective|profile/.test(low)) {
      const top = found.length ? found.slice(0, 4).join(", ") : "the target technology";
      out = "PROFESSIONAL SUMMARY\nProfessional with hands-on experience in " + top + ". Skilled at turning requirements into reliable solutions with a focus on measurable results. [Add your years of experience and one headline achievement.]\n\n" + out;
    }
    if (!low.includes("skills") && found.length) out += "\n\nTECHNICAL SKILLS\n" + found.map(s => "- " + s).join("\n");
    out += "\n\nBEFORE YOU SEND THIS\n- Start every bullet with a strong verb\n- Add a number to each bullet (for example: reduced incident backlog by 30%)\n- Keep it to 1 or 2 pages";
    return out;
  }

  /* ---------- Resume vs Job Description ---------- */
  function jdMatch(resumeSkills, jdSkills, accuracy) {
    accuracy = accuracy || {};
    const strong = [], practice = [], priority = [];
    jdSkills.forEach(s => {
      if (resumeSkills.includes(s)) {
        const a = accuracy[s];
        (a === undefined || a >= 0.7 ? strong : practice).push(s);
      } else priority.push(s);
    });
    const pct = jdSkills.length ? Math.round(100 * (strong.length + practice.length * 0.6) / jdSkills.length) : 0;
    return { strong, practice, priority, pct };
  }

  /* ---------- Mock interview builder ---------- */
  function shuffle(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((rnd || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function buildMock(opts, rnd) {
    const { resume, found, gaps, skills, scenarios, scenarioKeys } = opts;
    const bank = {}; skills.forEach(s => bank[s.n] = s);
    const qs = [];
    const ik = ["experience", "year", "project", "skill", "currently", "team", "goal", "looking"].concat(found.slice(0, 3).map(x => x.toLowerCase()));
    qs.push({ kind: "Self-introduction", q: "Let's begin. Please introduce yourself in a few sentences.", keys: ik, m: "Cover who you are, your experience, two or three key skills from your resume, one achievement, and what you want next.", topic: "your introduction" });
    const pool = shuffle(found.filter(n => bank[n] && bank[n].keys), rnd).slice(0, 2);
    const gapQs = shuffle((gaps || []).filter(n => bank[n] && bank[n].keys), rnd).slice(0, 2);
    pool.forEach(n => qs.push({ kind: "From your resume: " + n, q: "Your resume mentions " + n + ". Explain what it is and where you have used it.", keys: bank[n].keys, m: bank[n].m, topic: n }));
    gapQs.forEach(n => qs.push({ kind: "From the job description: " + n, q: "The job description asks for " + n + ". What do you know about it, and how would you approach it?", keys: bank[n].keys, m: bank[n].m, topic: n }));
    while (qs.length < 4) {
      const n = shuffle(Object.keys(bank).filter(x => bank[x].keys && !qs.some(q => q.topic === x)), rnd)[0];
      qs.push({ kind: "Technical: " + n, q: "A role like this usually expects " + n + ". Explain what it is and where it is used.", keys: bank[n].keys, m: bank[n].m, topic: n });
    }
    const line = (resume || "").split("\n").map(s => s.trim()).find(s => s.length > 40 && s.length < 220 && /project|built|develop|implement|%/i.test(s));
    qs.push({ kind: line ? "Project from your resume" : "Project", q: line ? "Your resume says: \"" + line + "\" Walk me through exactly what you did and the result." : "Describe a project you are proud of: the problem, your role and the result.", keys: ["built", "designed", "implemented", "configured", "developed", "result", "improved", "reduced", "tested", "users", "team", "requirement"], m: "Describe the problem, your role, the steps you took and the measurable result.", topic: "your project" });
    const gi = Math.floor((rnd || Math.random)() * scenarios.length);
    qs.push({ kind: "Scenario", q: scenarios[gi].d + " Explain what you would do and why.", keys: scenarioKeys[gi], m: scenarios[gi].why, topic: "this scenario" });
    qs.push({ kind: "Behaviour", q: "Tell me about a time something went wrong in a project. What did you do?", keys: ["problem", "fix", "learn", "team", "root cause", "result", "communicate", "next time"], m: "Name the problem, what you did to fix it, how you communicated, and what you learned.", topic: "your experience" });
    return qs;
  }

  /* Adaptive follow-ups: the next question depends on what the candidate said */
  const FOLLOW = [
    { re: /\brest\b|\bapi\b/i, q: "You mentioned REST/API. What authentication method did you use, and how did you handle failures?", keys: ["oauth", "basic", "token", "retry", "error", "status", "log", "timeout"], m: "Name the auth method (for example OAuth or basic auth), how tokens expire or refresh, and how you handle errors with retries and logging.", topic: "REST" },
    { re: /business rule/i, q: "You mentioned Business Rules. Was it before or after, and why did you choose that?", keys: ["before", "after", "insert", "update", "async", "condition", "recursion"], m: "Before changes values on the record being saved; after acts once saved; async avoids slowing the user. Mention conditions and avoiding recursion.", topic: "Business Rules" },
    { re: /cmdb|\bci\b/i, q: "You mentioned the CMDB. How do you keep the data accurate?", keys: ["discovery", "reconcil", "owner", "audit", "relationship", "duplicate", "stale"], m: "Use discovery or integrations, reconciliation rules, ownership, audits and removal of stale or duplicate CIs.", topic: "CMDB" },
    { re: /flow designer|flow\b/i, q: "You mentioned flows. How do you handle errors and test them?", keys: ["error", "test", "notification", "retry", "log", "condition", "rollback"], m: "Add error handling and notifications, log failures, test with real data and plan a way to recover.", topic: "Flow Designer" },
    { re: /\bglide|gliderecord|script include/i, q: "You mentioned server scripting. How do you make sure it performs well?", keys: ["limit", "query", "index", "async", "loop", "glideaggregate", "log"], m: "Limit and index queries, avoid queries inside loops, prefer GlideAggregate for counts, use async where possible and measure with logs.", topic: "scripting" }
  ];
  function followUp(answer, g, used) {
    if (g.words === 0) return null;
    if (g.know < 0.35 && g.words < 40) return { kind: "Follow-up (simpler)", q: "Let me make it easier: in one or two sentences, what problem does it solve and who uses it?", keys: ["problem", "user", "automat", "data", "process", "business", "service"], m: "Say what problem it solves, who uses it, and give one short example.", topic: "the basics", follow: true };
    for (const f of FOLLOW) if (f.re.test(answer) && !used.includes(f.topic)) return Object.assign({ kind: "Follow-up" , follow: true }, f);
    return null;
  }

  /* ---------- v2: question generator (never repeats until the pool is used up) ---------- */
  function rng(rnd) { return rnd || Math.random; }
  function genQuestions(facts, o, rnd) {
    o = o || {}; const n = o.count || 8, seen = new Set(o.seen || []), r = rng(rnd);
    const pool = facts.filter(f => (!o.topic || f.topic === o.topic) && (!o.track || f.track === o.track));
    const unseen = shuffle(pool.filter(f => !seen.has(f.id)), r), again = shuffle(pool.filter(f => seen.has(f.id)), r);
    const pick = unseen.concat(again).slice(0, n), out = [];
    const near = f => shuffle(facts.filter(x => x.id !== f.id && x.t.toLowerCase() !== f.t.toLowerCase() && x.d.toLowerCase() !== f.d.toLowerCase()), r)
      .sort((a, b) => (b.topic === f.topic) - (a.topic === f.topic) + (b.track === f.track ? .5 : 0) - (a.track === f.track ? .5 : 0));
    pick.forEach((f, i) => {
      const kind = Math.floor(r() * 3), ds = near(f).slice(0, 3);
      if (ds.length < 3) return;
      let q, opts, ans;
      if (kind === 0) { q = "Which term is described here?\n" + f.d + "."; opts = shuffle([f.t].concat(ds.map(x => x.t)), r); ans = opts.indexOf(f.t); }
      else if (kind === 1) { q = "What does \"" + f.t + "\" mean?"; opts = shuffle([f.d].concat(ds.map(x => x.d)), r); ans = opts.indexOf(f.d); }
      else { const real = r() < .5, shown = real ? f.d : ds[0].d; q = "True or false: \"" + f.t + "\" means: " + shown; opts = ["True", "False"]; ans = real ? 0 : 1; }
      out.push({ id: f.id, q, o: opts, a: ans, why: f.t + ": " + f.d + ".", fid: f.id, topic: f.topic });
    });
    return out;
  }
  function genOpen(open, o, rnd) {
    o = o || {}; const seen = new Set(o.seen || []);
    let p = open.filter(x => (!o.track || x.track === o.track || !x.track) && (!o.cat || x.cat === o.cat));
    const un = shuffle(p.filter(x => !seen.has(x.id)), rnd), ag = shuffle(p.filter(x => seen.has(x.id)), rnd);
    return un.concat(ag).slice(0, o.count || 5);
  }

  /* ---------- v2: scenarios with model answers ---------- */
  const sig = w => tokens(w).filter(x => x.length > 3 && !STOP.has(x));
  function steps(model) { return String(model || "").split(";").map(x => x.trim()).filter(Boolean); }
  function keysFrom(model, max) {
    const out = []; steps(model).forEach(s => { const ws = sig(s).sort((a, b) => b.length - a.length); const w = ws.find(x => !out.includes(x)); if (w) out.push(w); });
    return out.slice(0, max || 7);
  }
  function scenQ(topic) {
    if (!topic || !topic.scen) return null;
    const st = steps(topic.scen[1]);
    return { id: "sc:" + topic.id, kind: "Real-time scenario: " + topic.name, q: topic.scen[0] + " What would you do, step by step?", keys: keysFrom(topic.scen[1]), m: st.map((x, i) => (i + 1) + ". " + x).join("\n"), steps: st, topic: topic.name };
  }

  /* ---------- v2: speaking coach ---------- */
  const FILL = ["um", "uh", "erm", "like", "you know", "basically", "actually", "literally", "i mean", "kind of", "sort of", "so yeah"];
  const GRAMMAR = [[/\bi is\b/i, "Say 'I am', not 'I is'."], [/\b(he|she|it) don't\b/i, "Say 'he/she/it doesn't'."], [/\bmore better\b/i, "Say 'better', not 'more better'."], [/\bdiscuss about\b/i, "Say 'discuss' without 'about'."], [/\bi am having\b/i, "Say 'I have' (for example 'I have 3 years of experience')."], [/\brevert back\b/i, "Say 'reply' or 'revert' (not 'revert back')."], [/\bmyself\s+[A-Z][a-z]+/, "Start with 'My name is ...' instead of 'Myself ...'."], [/\bone of the (\w+)\s+(?!\w+s\b)/i, null], [/\bi have (\d+) years? experience\b/i, "Say '... years of experience'."], [/\bpeoples\b/i, "'People' is already plural."], [/\binformations\b/i, "'Information' has no plural."], [/\bstaffs\b/i, "'Staff' has no plural here."], [/\bi worked in (\w+) project\b/i, "Say 'I worked on a project' or 'in the X project'."], [/\bgood in (\w+)\b/i, "Say 'good at'."], [/\bwhere\s+i\s+was\s+working\b/i, null]];
  function coach(text, secs) {
    const t = " " + (text || "").toLowerCase().replace(/[.,!?]/g, " ") + " ", w = words(text), tips = [], stat = {};
    if (!w) return { score: 0, tips: ["Say or type your answer first."], fillers: {}, repeats: [], words: 0, wpm: 0 };
    const fillers = {}; FILL.forEach(f => { const m = t.split(" " + f + " ").length - 1; if (m) fillers[f] = m; });
    const fc = Object.values(fillers).reduce((a, b) => a + b, 0);
    const toks = tokens(text), rep = []; for (let i = 1; i < toks.length; i++) if (toks[i] === toks[i - 1] && toks[i].length > 1 && !rep.includes(toks[i])) rep.push(toks[i]);
    const gram = GRAMMAR.filter(g => g[1] && g[0].test(text)).map(g => g[1]);
    const sents = (text || "").split(/[.!?]+/).map(x => x.trim()).filter(Boolean), long = sents.filter(x => words(x) > 35).length;
    const wpm = secs && secs > 3 ? Math.round(w / (secs / 60)) : 0;
    let sc = 100; sc -= Math.min(30, fc / w * 300); sc -= Math.min(15, rep.length * 5); sc -= Math.min(24, gram.length * 8); sc -= long * 6;
    if (w < 15) sc -= 15; if (wpm && (wpm < 90 || wpm > 180)) sc -= 8;
    if (fc) tips.push("Filler words: " + Object.keys(fillers).map(k => "'" + k + "' x" + fillers[k]).join(", ") + ". Pause silently instead.");
    if (rep.length) tips.push("Repeated words: " + rep.slice(0, 4).join(", ") + ". Finish one thought, then move on.");
    gram.forEach(g => tips.push(g));
    if (long) tips.push("Some sentences are very long. Aim for under 25 words per sentence.");
    if (wpm && wpm > 180) tips.push("You are speaking fast (" + wpm + " words/min). Aim for 120 to 160.");
    if (wpm && wpm < 90) tips.push("Your pace is slow (" + wpm + " words/min). Aim for 120 to 160 and keep going.");
    if (w < 15) tips.push("Very short. Add one example or one reason.");
    if (!tips.length) tips.push("Clear delivery. Keep this pace and structure.");
    return { score: Math.max(0, Math.round(sc)), tips, fillers, repeats: rep, words: w, wpm, grammar: gram };
  }

  /* ---------- v2: read-aloud practice (pronunciation and fluency) ---------- */
  function readAloud(target, said) {
    const a = tokens(target), b = tokens(said), n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) L[i][j] = a[i - 1] === b[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
    const hit = new Set(); let i = n, j = m; while (i > 0 && j > 0) { if (a[i - 1] === b[j - 1]) { hit.add(i - 1); i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--; }
    const missed = a.filter((_, k) => !hit.has(k)), pct = n ? Math.round(100 * hit.size / n) : 0;
    return { pct, missed: missed.filter((x, k, z) => z.indexOf(x) === k), total: n };
  }

  /* ---------- v2: self-introduction builder ---------- */
  function introText(p) {
    const s = (p.skills || []).filter(Boolean), list = s.length > 1 ? s.slice(0, -1).join(", ") + " and " + s[s.length - 1] : (s[0] || "my core skills");
    return "Good morning. My name is " + (p.name || "[your name]") + ". I am a " + (p.role || "[your role]") + " with " + (p.years || "[number]") + " of experience. I mainly work with " + list + ". " +
      (p.achievement ? "One of my achievements: " + p.achievement + ". " : "One thing I am proud of is [a result with a number]. ") +
      "I am now looking for " + (p.goal || "a role where I can grow and add value") + ". Thank you for the opportunity.";
  }

  /* ---------- v2: study plan ---------- */
  function studyPlan(topics, days) {
    days = days || 7; const plan = []; const list = topics.length ? topics : [];
    for (let d = 0; d < days; d++) {
      const t = list[d % Math.max(1, list.length)], items = [];
      if (d === 0) items.push({ k: "intro", t: "Write and practise your self-introduction (aim for 45 to 60 seconds)" });
      if (t) { items.push({ k: "learn", t: "Learn: " + t.name, topic: t.id }, { k: "quiz", t: "Take the " + t.name + " quiz", topic: t.id }, { k: "scen", t: "Answer the real-time scenario for " + t.name + " out loud", topic: t.id }); }
      if (d === days - 1) items.push({ k: "mock", t: "Take a full mock interview and read the report" }); else if (d % 2 === 1) items.push({ k: "speak", t: "Speaking drill: read aloud, then record one answer and check the coach tips" });
      plan.push({ day: d + 1, items });
    }
    return plan;
  }

  /* ---------- v2: resume to track / projects / learning path ---------- */
  function detectTrack(text, skills) {
    const t = " " + (text || "").toLowerCase(), c = {};
    skills.forEach(s => { if (s.al.some(a => has(t, a))) c[s.track || "servicenow"] = (c[s.track || "servicenow"] || 0) + 1; });
    return Object.keys(c).map(k => ({ track: k, n: c[k] })).sort((a, b) => b.n - a.n);
  }
  function projectLines(resume) {
    const seen = new Set(); return (resume || "").split(/\n+/).map(s => s.replace(/^[\s\-*•·●▪◦\d.)]+/, "").trim()).filter(s => {
      if (s.length < 35 || s.length > 280) return false; const k = s.toLowerCase(); if (seen.has(k)) return false;
      if (!(/^(built|build|develop|implement|design|configur|integrat|automat|migrat|manag|led|lead|creat|deliver|reduc|improv|increas|resolv|negotiat|launch|handl|analy|prepar|support|train|recruit|audit|reconcil|sold|optimi|maintain|inspect|test|coordinat|conduct|execut|drove|ran|set up|establish|monitor|process|review|plan|organi|facilitat|streamlin|generat|achiev|won|closed|onboard|screen|source)/i.test(s) || /\bproject\b/i.test(s))) return false;
      seen.add(k); return true; }).slice(0, 8);
  }
  function topicsInText(text, topics) {
    const t = " " + (text || "").toLowerCase(); return topics.filter(tp => tp.scen && ((tp.aliases ? tp.aliases.split(";") : []).concat([tp.name.toLowerCase(), (tp.skill || "").toLowerCase()])).some(a => a.trim().length > 3 && has(t, a)));
  }
  const OWN = ["built", "designed", "implemented", "configured", "developed", "result", "improved", "reduced", "tested", "team", "requirement", "role", "responsib"];
  function buildProjectRound(resume, topics, tracks) {
    if (tracks && tracks.length) topics = topics.filter(t => tracks.includes(t.track) || t.track === "pm" || t.track === "soft");
    const out = [], lines = projectLines(resume), used = new Set();
    lines.slice(0, 3).forEach((ln, i) => {
      const lk = sig(ln).filter((x, k, z) => z.indexOf(x) === k).slice(0, 5);
      out.push({ id: "pl" + i, kind: "Your project " + (i + 1), q: "Your resume says: \"" + ln + "\" What was the problem, what exactly did YOU do, and what was the result?", keys: lk.concat(["result", "my role"]), m: "Describe it as: Situation (the problem and context), Task (your responsibility), Action (the specific steps YOU took, naming tools and decisions), Result (a number or visible outcome). Be honest about what the team did versus what you did.", topic: "your project", line: ln });
      topicsInText(ln, topics).slice(0, 1).forEach(tp => { if (!used.has(tp.id)) { used.add(tp.id); const sq = scenQ(tp); out.push(Object.assign(sq, { kind: "Because your project used " + tp.name, q: "In the project above you worked with " + tp.name + ". Real-time situation: " + sq.q })); } });
    });
    topicsInText(resume, topics).forEach(tp => { if (!used.has(tp.id) && used.size < 8) { used.add(tp.id); out.push(scenQ(tp)); } });
    out.push({ id: "pch", kind: "Project depth", q: "In your most recent project, what was the hardest problem, how did you find the cause, and what would you do differently now?", keys: ["problem", "cause", "log", "test", "fix", "learn", "differently", "team"], m: "Name one real problem, how you investigated (logs, reproduce, ask), the fix, and one improvement you would make. Interviewers value honest learning.", topic: "your project" });
    return out;
  }
  function claimsCheck(found, scores) {
    const solid = [], shaky = [], untested = [];
    found.forEach(s => { const v = scores[s]; if (v === undefined) untested.push(s); else if (v >= .6) solid.push(s); else shaky.push(s); });
    return { solid, shaky, untested };
  }
  function skillLearnPath(found, topics, accuracy, track) {
    const foundSet = new Set(found), mine = topics.filter(t => foundSet.has(t.skill) || foundSet.has(t.name));
    const rank = t => accuracy[t.name] === undefined ? .5 : accuracy[t.name];
    const a = mine.slice().sort((x, y) => rank(x) - rank(y)).map(t => ({ topic: t, why: accuracy[t.name] === undefined ? "On your resume, not practised yet" : rank(t) < .7 ? "On your resume, accuracy " + Math.round(rank(t) * 100) + "%" : "On your resume, keep it fresh", kind: "resume" }));
    const ids = new Set(mine.map(t => t.id)), tr = track || (mine[0] && mine[0].track);
    const b = topics.filter(t => t.track === tr && !ids.has(t.id)).sort((x, y) => (x.adv ? 1 : 0) - (y.adv ? 1 : 0)).slice(0, 4).map(t => ({ topic: t, why: "Often asked next in " + tr + " interviews", kind: "next" }));
    return a.concat(b);
  }

  const api = { grade, feedback, hints, rescue, explainTemplate, extractSkills, analyzeResume, improveResume, jdMatch, buildMock, followUp, shuffle, words, stem, collapseRuns, mergeFinals, genQuestions, genOpen, steps, keysFrom, scenQ, coach, readAloud, introText, studyPlan, detectTrack, projectLines, topicsInText, buildProjectRound, claimsCheck, skillLearnPath };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
