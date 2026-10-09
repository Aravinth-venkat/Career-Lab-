CAREER LAB (website) - learn, practise, prepare, perform
=========================================================
HOW TO RUN
  Easiest: unzip, double-click index.html (Chrome or Edge).
  For voice input on some browsers use a local server:  python3 -m http.server   then open http://localhost:8000
  Host it anywhere static (GitHub Pages, Netlify). No build step, no internet needed (fonts are bundled).

WHAT IS INSIDE
  11 fields (IT and Non-IT), 41 topics, 276 key terms, a real-time scenario with a step-by-step correct approach in every topic,
  61+ interview questions (HR, behavioural, situational, technical), generated quizzes that avoid repeats,
  resume upload (.docx/.txt/paste) -> score, editable skills, learning path, 7-day plan, project interview, claims check,
  job-description match, mock interview with adaptive follow-ups, speaking lab (read aloud, self-introduction, coach),
  flashcards, order/match games, code lab, badges, progress export.

VOICE
  Uses the browser speech recognition (Chrome/Edge). The transcript is rebuilt from the recogniser results each time and
  repeated-word glitches are collapsed, so "hi" no longer becomes "hi hi hi hi". You can edit the text before checking.

PRIVACY
  Everything stays in your browser (localStorage). Nothing is uploaded.

HONEST NOTES
  Scores are keyword/structure based estimates, not a real AI judge. Model answers are general best-practice approaches;
  company-specific processes differ, so verify against your own project. Edit content in js/data.js and js/content-data.js.

TESTS (needs Node):  node tests/test.js && node tests/test2.js
