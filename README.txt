CAREER LAB - WEBSITE
====================
Learn. Practice. Prepare. Perform.

HOW TO RUN
1. Easiest (works with voice): upload this folder to GitHub Pages, Netlify or any HTTPS host and open the link in Chrome or Edge.
2. On a computer: run "python3 -m http.server 8000" inside this folder and open http://localhost:8000
   (Opening index.html by double-click works for most things, but the microphone and code sandbox need http://localhost or https.)

WHAT IS INSIDE
- Learn: 12 topics, each with a story, the idea, an example, a tip, a quiz and an "Explain it" answer.
- Answer by VOICE (mic button, speech to text) or by typing. Every answer gets a score for
  knowledge, confidence, reasoning and clarity, with the ideas you covered and missed.
- Interview Rescue: Hint (3 levels), "I don't know" (a safe way to answer), "Help me explain" (answer structure).
- Interview: practice questions by level, plus a Mock interview built from your resume and job description,
  with adaptive follow-up questions and a final report.
- Career studio: upload/paste resume (.docx, .txt), score, improvements and a better version;
  paste a job description; Resume vs JD match (strong / practice / priority skills).
- Practice: Rapid fire, Fix the incident, Spot the bug, Order it, Match it, Code lab (JavaScript with tests).
- Progress: XP, levels, streaks, badges, readiness rings, export/import, dark and light theme, voice language.

PRIVACY
Everything stays in your browser (localStorage). Nothing is uploaded. Voice recognition is done by your
browser (Chrome sends audio to its speech service).

NOTES
- Scoring is rule-based (keywords and wording), so it is an estimate. A backend with an AI model
  can be added later for deeper feedback. Keep API keys on the server, never in this folder.
- Voice works in Chrome and Edge. In other browsers you can type.
- PDF resumes are not read yet. Use .docx/.txt or paste the text.
- Add your own content in js/data.js (topics, questions, scenarios, code challenges).
- Test the logic: node tests/test.js
- This is an independent learning app. It is not affiliated with or endorsed by ServiceNow.
