# The AI Classroom — Backend Setup Guide

## Current Status (July 2026)

Firebase is fully set up and working:
- Firebase project: ai-classroom-ad779
- Authentication: Email/Password, Google, Anonymous — all enabled
- Firestore: Created, region asia-south2, Standard edition
- Firestore rules: Published and working
- login.html, dashboard.html, admin.html: All using Firebase compat SDK
- Admin account: sharmasoumil88@gmail.com (role set to admin in Firestore)
- Student dashboard: Working, auto-creates Firestore profile on load
- Admin panel: Working, shows all users and analytics

Lab & Exam Prep question source (NEW — July 2026):
- The Curriculum Lab and Exam Prep on index.html now run on a **local question engine** (`js/questions-engine.js`) instead of calling the Claude API directly from the browser.
- Default mode is free and offline: algorithmic maths + a curated JSON bank (`data/question-bank.json`).
- An optional API mode routes through a **Cloudflare Worker** proxy for live Claude questions (see below). One switch flips between them.

---

## Why the Lab stopped calling the API directly

Browsers cannot call `https://api.anthropic.com` from a web page: Anthropic does not return CORS headers, so the browser blocks the request (works from neither localhost nor GitHub Pages). The Claude API also costs money per question. So the Lab/Exam were moved to a local engine, with the API kept as an optional, proxied mode.

---

## Lab & Exam Question Engine

File: `js/questions-engine.js` (loaded by index.html as a plain script before the main inline script).

### The switch
```js
const QUESTION_SOURCE = 'json';   // 'json' = free local questions · 'api' = live Claude via Worker
```

### 'json' mode (default, free)
- **Maths**: generated in the browser, infinite and always correct, scaled by age band and topic.
- **Concept subjects + Exam Prep**: pulled from `data/question-bank.json`. Falls back to another question in the same age band if a topic is missing.
- Works with no network and no API key. No per-question cost, no rate limits.

### 'api' mode (optional, paid)
- Builds the same prompts the site used before and POSTs them to the Cloudflare Worker (NOT directly to Anthropic).
- Returns the same JSON shape the renderer expects.
- If the API errors or runs out of credit, it automatically falls back to the JSON bank. Maths always stays local.

### Question object shapes (contract)
```js
// Lab MCQ (science / english / history / geography)
{ question, options:[4 strings], answer:"<matches one option>", hint, explanation }

// Lab maths (numeric)
{ question, answer:<number>, hint, explanation, showBlocks:true }

// Exam Prep MCQ
{ question, options:[4 strings], answer:"<matches one option>", explanation }
```

### Editing / growing the bank
`data/question-bank.json`:
```
lab.<subject>.<age>[]            subjects: science, english, history, geography · ages: 5-7, 8-10, 11-13, 14-16
exam.<subject>.<difficulty>[]    subjects: gk, aptitude, reasoning, english · difficulty: easy, medium, hard
```
Rules: exactly 4 options per item, and `answer` must be one of them verbatim. Maths is NOT in the JSON — it lives in `questions-engine.js`. The bank loads via `fetch('data/question-bank.json')`, so serve the site over http (Live Server), not `file://`.

---

## Cloudflare Worker Proxy (for 'api' mode)

- Worker name: `ai-classroom-proxy`
- URL: `https://ai-classroom-proxy.aiteachingsite.workers.dev`
- Cloudflare account: aiteachingsite@gmail.com
- What it does: accepts a POST from the site, forwards it to `https://api.anthropic.com/v1/messages` with the API key attached, and returns the response with CORS headers. Passes Anthropic's real status codes through.
- API key: stored as a Worker **secret** named `ANTHROPIC_API_KEY` (Settings -> Variables and Secrets). Never placed in site code.
- Cost: Worker free tier is 100,000 requests/day. Anthropic API usage is the only charge (~half a cent to one cent per question on Claude Sonnet 4.6, which needs prepaid credits at console.anthropic.com).

Worker code (reference):
```js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') return json({ error: 'Only POST is allowed' }, 405);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    try {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });
      const text = await upstream.text();
      return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    } catch (err) {
      return json({ error: 'Proxy could not reach Anthropic', detail: String(err) }, 502);
    }
  }
};
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type' }; }
function json(o,s=200){ return new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json',...corsHeaders()}}); }
```

To go live with AI questions: load API credits at console.anthropic.com, confirm the `ANTHROPIC_API_KEY` secret is set on the Worker, then set `QUESTION_SOURCE = 'api'` in `js/questions-engine.js`.

---

## IMPORTANT: How Firebase is Implemented

login.html, dashboard.html, and admin.html use the Firebase COMPAT SDK loaded via CDN script tags:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
```

Then initialized with:
```js
firebase.initializeApp({ ...config... });
var auth = firebase.auth();
var db = firebase.firestore();
```

DO NOT switch these to ES module imports. The modular SDK caused silent failures. The compat SDK works reliably.

Note: `index.html` uses a small ES-module `<script type="module">` only for the nav auth state (onAuthStateChanged) via `js/firebase-config.js`. The `js/db/*.js` and `js/auth/auth.js` files are still written in the modular SDK and are not yet wired into the working compat pages.

---

## Firebase Credentials

These are hardcoded in login.html, dashboard.html, and admin.html:

```js
firebase.initializeApp({
  apiKey: "AIzaSyDX2tV-DbdeubspGyTqd4ARkRwDV9XQREQ",
  authDomain: "ai-classroom-ad779.firebaseapp.com",
  projectId: "ai-classroom-ad779",
  storageBucket: "ai-classroom-ad779.firebasestorage.app",
  messagingSenderId: "433385304033",
  appId: "1:433385304033:web:ab53d599b22b8bd4766ca0"
});
```

---

## Firestore Security Rules (current)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, update, delete: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null;
    }
    match /progress/{uid}/{type}/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /analytics/{document} {
      allow read, write: if false;
    }
  }
}
```

---

## Login Flow

1. User goes to pages/login.html
2. Signs in with email/password or Google
3. After auth, code reads their Firestore document
4. If role == 'admin' -> redirected to admin.html
5. If role == 'student' -> redirected to dashboard.html
6. Guest (anonymous) -> redirected to index.html
7. Sign out from any page -> lands on index.html (uses window.location.replace so back button works correctly)

---

## Firestore Data Structure

### users/{uid}
```js
{
  name: "Student Name",
  email: "student@email.com",
  role: "student",           // or "admin"
  curriculum: "cbse",        // default curriculum
  ageGroup: "11-13",         // default age group
  createdAt: timestamp,
  lastActive: timestamp,
  totalQuestions: 0,
  bestStreak: 0,
  badgesEarned: []           // array of badge IDs
}
```

### progress/{uid}/lab/{sessionId}
```js
{
  subject: "maths",
  curriculum: "cbse",
  ageGroup: "11-13",
  topic: "Algebra Basics",
  correct: 7,
  wrong: 3,
  accuracy: 70,
  streak: 5,
  timestamp: timestamp
}
```

### progress/{uid}/quiz/{sessionId}
```js
{
  score: 4,
  total: 5,
  accuracy: 80,
  answers: [...],
  timestamp: timestamp
}
```

### progress/{uid}/examprep/{sessionId}
```js
{
  exam: "cuet",
  subject: "gk",
  difficulty: "medium",
  correct: 8,
  wrong: 2,
  accuracy: 80,
  streak: 8,
  timestamp: timestamp
}
```

---

## Dashboard Features (pages/dashboard.html)

- Reads user profile from Firestore on load
- Auto-creates profile if document missing (safety net)
- Shows: name, email, role badge (Admin or Student)
- Stats cards: Questions Answered, Overall Accuracy, Best Streak, Badges Earned
- Score Over Time: line chart using Chart.js
- Accuracy by Subject: bar chart using Chart.js
- Badges section: shows earned badges from badgesEarned array
- Preferences: update name, curriculum, age group
- Recent activity: last 5 lab sessions
- Sign Out: goes to home page
- Delete Account: must type email to confirm, deletes Firestore doc then Firebase Auth account

---

## Admin Panel Features (pages/admin.html)

- Protected: checks role on load, redirects non-admins to home
- Top bar: Back to Site link + Sign Out button
- Analytics: Total Students, Total Questions, Guest Users, Active Today
- All Users table with columns: Name, Email, Role, Questions, Joined, Last Active, Actions
- Search bar to filter users by name or email
- Actions per user:
  - Promote/Demote (toggles between student and admin)
  - Reset Progress (clears totalQuestions, bestStreak, badgesEarned)
  - Delete Account (removes Firestore document)

---

## Role Management

Roles are managed MANUALLY in Firebase console only. No UI for role changes on the site yet.

To make someone an admin:
1. Go to Firebase console -> Firestore -> users collection
2. Find their document (document ID = their uid)
3. Edit the role field: change "student" to "admin"
4. They need to sign out and sign back in for the change to take effect

---

## Badge System (js/db/badges.js)

Badges are stored in the badgesEarned array on the user document.

| Badge ID | Name | Trigger |
|---|---|---|
| first_quiz | First Step 🎯 | First quiz completed |
| streak_10 | On Fire 🔥 | 10 correct in a row |
| streak_25 | Unstoppable ⚡ | 25 correct in a row |
| streak_50 | Legendary 👑 | 50 correct in a row |
| all_subjects | Polymath 📚 | All 5 Lab subjects tried |
| all_exams | Exam Ready 🏛️ | All 5 Exam Prep exams tried |
| questions_100 | Century 💯 | 100 total questions |
| questions_500 | Scholar 🎓 | 500 total questions |
| perfect_quiz | Perfect Score ⭐ | 5/5 on AI Quiz |

---

## What Still Needs To Be Done

1. Connect Lab to save progress after each session
   - Add a compat-SDK save call at end of a Lab session (subject, curriculum, ageGroup, topic, correct, wrong, streak)
   - Note: the old `js/db/progress.js` is written in the modular SDK and is not compatible with the working compat pages; a compat save path is needed instead.

2. Connect Quiz to save progress after completion (score, total, answers)

3. Connect Exam Prep to save progress (exam, subject, difficulty, correct, wrong, streak)

4. Fix the totals/streak update logic when saving
   - `updateUserProfile` must INCREMENT totalQuestions (Firestore increment), not overwrite it, and bestStreak must be updated to max(current, new)

5. Add Sign In button to all individual pages (currently only on index.html nav)

6. Add password reset link on login page

7. Contact form email backend

8. Optional: switch Lab/Exam to 'api' mode once Anthropic credits are loaded (set QUESTION_SOURCE = 'api')

9. Unify the tutor/mascot name across pages (Felix / Byte / Axon are currently mixed)

---

## Done This Cycle (July 2026)

- Lab + Exam Prep switched from broken direct-API calls to a free, offline local engine (`js/questions-engine.js` + `data/question-bank.json`), with an optional Cloudflare-Worker-proxied API mode behind a single switch.
- Standalone maths lab (`pages/lab.html` / `js/components/lab.js`) fixed — removed ES-module imports that were loaded as a plain script and crashed the whole file, plus a dead top-level save block.
- History timeline (`css/layout/grid.css`) — vertical line re-centred on the milestone dots at both desktop and mobile widths.

---

## How to Start a New Chat About This Project

Share this file and README.md at the start of the new chat. Then say:

"I'm continuing work on The AI Classroom. Firebase project is ai-classroom-ad779.
My admin email is sharmasoumil88@gmail.com.
Live Server runs at http://127.0.0.1:5501/ai-classroom/
Lab & Exam questions run on a local engine (js/questions-engine.js, data/question-bank.json); QUESTION_SOURCE switches to 'api' via the Cloudflare Worker ai-classroom-proxy.
I work on the dev branch and merge to main to deploy.
[describe what you need help with]"
