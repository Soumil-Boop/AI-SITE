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
| AI Questions | Anthropic Claude API (claude-sonnet-4-6) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Hosting | GitHub Pages |
| Dev server | VS Code Live Server (port 5501) |

---

## Project Structure

```
AI SITE/
└── ai-classroom/               <- Live Server root
    ├── index.html              <- Home page with nav
    ├── README.md
    ├── BACKEND_SETUP.md
    ├── pages/
    │   ├── what-is-ai.html
    │   ├── history.html
    │   ├── types.html
    │   ├── study-tools.html
    │   ├── more-study.html
    │   ├── ethics.html
    │   ├── quiz.html
    │   ├── lab.html
    │   ├── finder.html
    │   ├── resources.html
    │   ├── contact.html
    │   ├── login.html          <- Firebase compat SDK auth page
    │   ├── dashboard.html      <- Student dashboard
    │   └── admin.html          <- Admin panel (admin role only)
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
    │   │   ├── grid.css
    │   │   └── sections.css
    │   └── dashboard.css       <- Login, dashboard, admin styles
    ├── js/
    │   ├── core/
    │   │   ├── nav.js          <- mountNav() shared nav function
    │   │   └── utils.js
    │   ├── components/
    │   │   ├── lab.js
    │   │   ├── finder.js
    │   │   ├── quiz.js
    │   │   └── contact.js
    │   ├── auth/
    │   │   └── auth.js         <- Firebase ES module (future use)
    │   ├── db/
    │   │   ├── users.js
    │   │   ├── progress.js
    │   │   └── badges.js
    │   └── firebase-config.js
    └── data/
        └── tools-data.js
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
- Mascot name is Felix (robot SVG with floating animation)

---

## Pages Overview

### Home (index.html)
- Felix mascot with float animation and blinking eyes
- Neural network canvas animation
- Quote carousel, stats bar, feature cards

### History (pages/history.html)
- Timeline from 1950 to today (6 milestones)
- Dots use `outline` not `box-shadow` to prevent clipping
- Timeline has `padding-left: 10px` and `overflow: visible`

### Lab (pages/lab.html)
Two tabs:

**Curriculum Lab**
- Claude API questions (claude-sonnet-4-6)
- 5 curricula: CBSE, ICSE, UK, US, IB
- 4 age groups: 5-7, 8-10, 11-13, 14-16
- 5 subjects: Maths, Science, English, History, Geography
- Felix tutor bubble, hints, streak tracker

**Exam Prep**
- Claude API exam-pattern questions
- 5 exams: CUET, Railways, Bank PO, SSC, UPSC
- 4 subjects: GK, Aptitude, Reasoning, English
- Difficulty: Easy, Medium, Hard
- Timer: 30s, 60s, 90s, 2 minutes
- Scoreboard: Correct, Wrong, Accuracy, Streak

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
- Lab and Quiz do not yet save progress to Firestore (wiring pending)
- Contact form has no email backend
- No password reset on login page
- Nav Sign In button only on index.html, not on individual pages
- Dashboard shows email as name if no display name set

---

## Local Development
- Live Server root: ai-classroom/ folder
- Home: http://127.0.0.1:5501/ai-classroom/
- Login: http://127.0.0.1:5501/ai-classroom/pages/login.html
- Dashboard: http://127.0.0.1:5501/ai-classroom/pages/dashboard.html
- Admin: http://127.0.0.1:5501/ai-classroom/pages/admin.html

---

*Made with love for curious learners everywhere. AI is a tool. You are the thinker. Felix agrees.*
