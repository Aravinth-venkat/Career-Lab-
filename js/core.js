/* Career Lab core logic: pure functions, works in browser and Node (for tests). */
(function (root) {
  const HEDGES = ["maybe", "i think", "i guess", "not sure", "probably", "kind of", "sort of", "i don't know", "i dont know", "might be", "possibly", "not really", "no idea", " um ", " uh "];
  const BOLD = ["i built", "i designed", "i implemented", "i led", "i created", "i configured", "i fixed", "i delivered", "definitely", "clearly", "i decided", "my role", "i was responsible", "i developed", "i resolved", "i owned", "i ensured", "i automated", "i worked on", "i handled"];
  const LOGIC = ["because", "so that", "therefore", "if ", "then", "first", "second", "next", "finally", "for example", "for instance", "as a result", "which means", "due to", "in order to", "since "];

  function words(t) { return (t || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length; }

  function grade(text, keys) {
    const t = " " + (text || "").toLowerCase() + " ";
    const w = words(text);
    const hit = [], miss = [];
    (keys || []).forEach(k => (t.includes(k.toLowerCase()) ? hit : miss).push(k));
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
    if (g.know >= 0.6 && g.conf < 0.6) return "You know this, but it sounded unsure. Replace 'I think' or 'maybe' with direct statements.";
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
  function extractSkills(text, skills) {
    const t = " " + (text || "").toLowerCase();
    return skills.filter(s => s.al.some(a => t.includes(a))).map(s => s.n);
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
    if (found.length < 6) tips.push("List more skills you truly have, for example: " + skills.filter(s => !found.includes(s.n)).slice(0, 4).map(s => s.n).join(", ") + ".");
    items.push({ n: "Skills", pts: Math.min(25, found.length * 3), max: 25 });
    const nn = (t.match(/\d+\s?%|\b\d{1,4}\+?\s(?:users|incidents|tickets|projects|hours|systems|applications|records|requests|clients|teams|customers)/g) || []).length;
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

  const api = { grade, feedback, hints, rescue, explainTemplate, extractSkills, analyzeResume, improveResume, jdMatch, buildMock, followUp, shuffle, words };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
