# The AI Classroom 🧠

A free, interactive educational website that teaches Artificial Intelligence to students of all ages. Built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

**Live site:** [soumil-boop.github.io/AI-SITE](https://soumil-boop.github.io/AI-SITE)
**Repo:** [github.com/Soumil-Boop/AI-SITE](https://github.com/Soumil-Boop/AI-SITE)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (multi-page) |
| Styling | Vanilla CSS with custom design system |
| Scripting | Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts — Nunito + Inter |
| Lab & Exam questions | Local engine by default: algorithmic maths + JSON question bank (free, offline). Optional Claude Sonnet 4.6 via a Cloudflare Worker proxy. |
| API proxy (optional) | Cloudflare Worker — `ai-classroom-proxy.aiteachingsite.workers.dev` |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Hosting | GitHub Pages |
| Dev server | VS Code Live Server (port 5501) |

---

## Project Structure

```
AI SITE/                            <- git root (README, BACKEND_SETUP, .git live here)
├── README.md
├── BACKEND_SETUP.md
└── ai-classroom/                   <- Live Server root
    ├── index.html                  <- Home page + Lab + Exam Prep (all inline)
    ├── pages/
    │   ├── what-is-ai.html
    │   ├── history.html
    │   ├── types.html
    │   ├── study-tools.html
    │   ├── more-study.html
    │   ├── ethics.html
    │   ├── quiz.html
    │   ├── lab.html                <- Standalone visual maths lab (Axon tutor)
    │   ├── finder.html
    │   ├── resources.html
    │   ├── contact.html
    │   ├── login.html              <- Firebase compat SDK auth page
    │   ├── dashboard.html          <- Student dashboard
    │   └── admin.html              <- Admin panel (admin role only)
    ├── css/
    │   ├── base/
    │   │   ├── variables.css
    │   │   ├── reset.css
    │   │   └── typography.css
    │   ├── components/
    │   │   ├── nav.css
    │   │   ├── buttons.css
    │   │   ├── cards.css
    │   │   └── forms.css
    │   ├── layout/
    │   │   ├── grid.css            <- Timeline lives here (dots centred on the line)
    │   │   └── sections.css
    │   ├── pages/                  <- hero, lab, quiz, finder, study page styles
    │   └── dashboard.css           <- Login, dashboard, admin styles
    ├── js/
    │   ├── core/
    │   │   ├── nav.js              <- mountNav() shared nav function
    │   │   └── utils.js            <- global helpers (rnd, pick, debounce...)
    │   ├── components/
    │   │   ├── lab.js              <- Standalone maths lab logic (plain script)
    │   │   ├── finder.js
    │   │   ├── quiz.js
    │   │   └── contact.js
    │   ├── auth/
    │   │   └── auth.js             <- Firebase ES module (future use)
    │   ├── db/
    │   │   ├── users.js
    │   │   ├── progress.js
    │   │   └── badges.js
    │   ├── questions-engine.js     <- NEW: swappable question engine for Lab + Exam Prep
    │   └── firebase-config.js
    └── data/
        ├── tools-data.js
        └── question-bank.json      <- NEW: 98+ verified MCQs for concept subjects + exam prep
```

---

## Git / Deployment

- `main` branch — production, auto-deploys to GitHub Pages
- `dev` branch — active development

```bash
git checkout dev
git add .
git commit -m "message"
git push origin dev

# To deploy:
git checkout main
git pull origin main
git merge dev
git push origin main
git checkout dev
```

---

## Lab & Exam Question Engine (NEW)

The Curriculum Lab and Exam Prep on `index.html` no longer call the Claude API directly. Browsers cannot call `api.anthropic.com` from a web page (CORS blocks it), and the API also costs money per question. Both now run through a **swappable question engine** in `js/questions-engine.js`.

### The switch

At the top of `js/questions-engine.js`:

```js
const QUESTION_SOURCE = 'json';   // 'json' = free local questions · 'api' = live Claude via Worker
```

- **`'json'` (default, free):**
  - **Maths** is generated algorithmically in the browser — infinite unique questions, always correct, scaled by age band and topic. Covers addition, subtraction, multiplication, division, fractions, decimals, percentages, ratio, algebra, geometry, perimeter/area, time, money, statistics and more.
  - **Concept subjects** (Science, English, History, Geography) and **Exam Prep** (GK, Aptitude, Reasoning, English) pull from `data/question-bank.json` — a curated bank of verified multiple-choice questions. If a topic has no exact match, it falls back to another question in the same age band rather than breaking.
  - Works offline, costs nothing, has no rate limits — suitable for any number of students.

- **`'api'` (optional, paid):**
  - Sends prompts to Claude Sonnet 4.6 through the Cloudflare Worker proxy, for live AI-generated questions.
  - The JSON bank stays as an **automatic fallback** if the API errors or runs out of credit. Maths always stays local (cheaper and always correct).

### Expanding the bank

Add entries to `data/question-bank.json`. Each item is a 4-option MCQ; the `answer` string must exactly match one of the four `options`. Structure:

```
lab.<subject>.<age>[]      subjects: science, english, history, geography · ages: 5-7, 8-10, 11-13, 14-16
exam.<subject>.<difficulty>[]   subjects: gk, aptitude, reasoning, english · difficulty: easy, medium, hard
```

Maths is NOT stored here — it is generated in `questions-engine.js`.

### Cloudflare Worker proxy (for `'api'` mode)

- URL: `https://ai-classroom-proxy.aiteachingsite.workers.dev`
- Forwards POST requests to the Claude API with the API key attached server-side, and adds CORS headers.
- The Anthropic API key is stored as a Worker **secret** named `ANTHROPIC_API_KEY` (never in the site code).
- Free tier: 100,000 requests/day. The only cost is Anthropic API usage (roughly half a cent to one cent per question on Sonnet 4.6).

---

## Design System

### Colours
| Token | Value | Role |
|---|---|---|
| --brand | #1D4ED8 | Primary blue |
| --brand-dark | #1E3A8A | Nav, dark backgrounds |
| --brand-light | #DBEAFE | Light tints |
| --accent | #F97316 | Orange CTAs |
| --accent-dark | #C2410C | Dark orange text |
| --green | #059669 | Success, correct answers |
| --purple | #7C3AED | History accents |
| --text | #111827 | Body text |
| --muted | #6B7280 | Secondary text |

### Typography
- Headings: Nunito 700-900
- Body: Inter 400-600

### Content Rules
- No em dashes anywhere in display content
- Contractions used throughout for friendly tone
- Home page mascot is **Felix** (robot SVG with floating animation). The in-Lab / Exam Prep tutor bubble is named **Byte**; the standalone maths lab (`pages/lab.html`) uses **Axon**.

---

## Pages Overview

### Home (index.html)
- Felix mascot with float animation and blinking eyes
- Neural network canvas animation
- Quote carousel, stats bar, feature cards
- Hosts the Curriculum Lab and Exam Prep (see below)

### History (pages/history.html)
- Timeline from 1950 to today (6 milestones)
- Dot styles and the vertical line live in `css/layout/grid.css`
- The line is centred on the dots via `.timeline::before { left: 32.5px }` (24.5px on mobile), so it runs through the middle of every circle

### Lab (index.html — two tabs)

**Curriculum Lab**
- Local engine questions by default (free); optional Claude via Worker
- 5 curricula: CBSE, ICSE, UK, US, IB
- 4 age groups: 5-7, 8-10, 11-13, 14-16
- 5 subjects: Maths (numeric, with block visuals for young ages), Science, English, History, Geography (MCQ)
- Byte tutor bubble, hints, explanations, streak tracker

**Exam Prep**
- Local engine questions by default (free); optional Claude via Worker
- 5 exams: CUET, Railways, Bank PO, SSC, UPSC
- 4 subjects: GK, Aptitude, Reasoning, English
- Difficulty: Easy, Medium, Hard
- Timer: 30s, 60s, 90s, 2 minutes
- Scoreboard: Correct, Wrong, Accuracy, Streak

### Standalone Maths Lab (pages/lab.html)
- Separate, fully offline visual maths lab (addition/subtraction/multiplication/counting) generated in `js/components/lab.js`
- Loaded as a plain script (no ES-module imports)

### Quiz (pages/quiz.html)
- 5 questions, instant feedback
- 4-tier result: Beginner / Curious / Informed / Expert

### Find My AI Tool (pages/finder.html)
- 20+ tools, keyword scoring, subject and free filters

---

## Backend (Firebase)

**Project ID:** ai-classroom-ad779
**Auth Domain:** ai-classroom-ad779.firebaseapp.com
**Firestore Region:** asia-south2

### Auth Providers
- Email/Password: enabled
- Google: enabled
- Anonymous (Guest): enabled

### Login Flow
- Admin logs in -> goes to admin.html automatically
- Student logs in -> goes to dashboard.html automatically
- Guest -> goes to home page
- Logo on login page links back to home
- Sign out always lands on home page (uses window.location.replace)

### Firestore Structure
```
users/{uid}
  name, email, role, curriculum, ageGroup
  createdAt, lastActive
  totalQuestions, bestStreak, badgesEarned[]

progress/{uid}/lab/{sessionId}
  subject, curriculum, ageGroup, topic
  correct, wrong, accuracy, streak, timestamp

progress/{uid}/quiz/{sessionId}
  score, total, accuracy, answers, timestamp

progress/{uid}/examprep/{sessionId}
  exam, subject, difficulty
  correct, wrong, accuracy, streak, timestamp
```

### Firestore Rules
```
users/{uid}: read/update by owner or admin, create by auth user, delete by admin only
progress/{uid}/*: read/write by owner, read by admin
```

### Roles
- student: default, sees personal dashboard
- admin: manually set in Firestore console, sees admin panel
- No role management UI yet — set manually in Firebase console

### Dashboard (pages/dashboard.html)
- Role badge reads from Firestore (shows Admin or Student)
- Stats: Questions, Accuracy, Streak, Badges
- Score Over Time chart (Chart.js)
- Accuracy by Subject chart (Chart.js)
- Preferences: name, curriculum, age group
- Auto-creates Firestore profile if missing on load
- Delete account (must type email to confirm)

### Admin Panel (pages/admin.html)
- Back to Site link + Sign Out in top bar
- Analytics: Total Students, Total Questions, Guest Users, Active Today
- All users table with search, promote/demote, reset progress, delete
- Protected: redirects non-admins to home page

### Badges
| Badge | Trigger |
|---|---|
| First Step 🎯 | First quiz completed |
| On Fire 🔥 | 10 streak |
| Unstoppable ⚡ | 25 streak |
| Legendary 👑 | 50 streak |
| Polymath 📚 | All 5 subjects tried |
| Exam Ready 🏛️ | All 5 exams tried |
| Century 💯 | 100 questions answered |
| Scholar 🎓 | 500 questions answered |
| Perfect Score ⭐ | 5/5 on quiz |

### IMPORTANT: SDK Used
login.html, dashboard.html, and admin.html use Firebase COMPAT SDK loaded from CDN via script tags — NOT ES modules. This was a deliberate fix after ES module imports failed silently. Do not change these to ES modules.

Firebase credentials are hardcoded directly in each of these three files.

---

## To Set Yourself as Admin
1. Sign up on the site
2. Go to Firebase console -> Firestore -> users collection
3. Find your document (named with your uid)
4. Change role field from student to admin
5. Sign out and sign back in -> you will go to admin.html

---

## Known Issues / TODO
- Lab and Exam Prep now generate questions for free, offline (local engine). ✅
- History timeline circles are now centred on the vertical line. ✅
- Standalone maths lab (`pages/lab.html`) now runs (removed broken ES-module imports). ✅
- Progress saving still pending: Lab, Quiz and Exam Prep do not yet write sessions to Firestore. Wiring needs a compat-SDK save path called at end of session.
- Contact form has no email backend
- No password reset on login page
- Nav Sign In button only on index.html, not on individual pages
- Dashboard shows email as name if no display name set
- Tutor/mascot naming is inconsistent across pages (Felix / Byte / Axon)

---

## Local Development
- Live Server root: ai-classroom/ folder
- Home: http://127.0.0.1:5501/ai-classroom/
- Login: http://127.0.0.1:5501/ai-classroom/pages/login.html
- Dashboard: http://127.0.0.1:5501/ai-classroom/pages/dashboard.html
- Admin: http://127.0.0.1:5501/ai-classroom/pages/admin.html

Note: the question bank loads via `fetch('data/question-bank.json')`, so the Lab must be served over http (Live Server), not opened as a `file://` path.

---

*Made with love for curious learners everywhere. AI is a tool. You are the thinker. Felix agrees.*
