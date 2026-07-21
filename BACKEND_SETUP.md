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
   - In lab.js, after session ends call saveLabSession() from js/db/progress.js
   - Pass: subject, curriculum, ageGroup, topic, correct, wrong, streak

2. Connect Quiz to save progress after completion
   - In quiz.js, after quiz ends call saveQuizSession() from js/db/progress.js
   - Pass: score, total, answers

3. Connect Exam Prep to save progress
   - After session ends call saveExamSession() from js/db/progress.js
   - Pass: exam, subject, difficulty, correct, wrong, streak

4. Add Sign In button to all individual pages (currently only on index.html nav)

5. Add password reset link on login page

6. Contact form email backend

---

## How to Start a New Chat About This Project

Share this file and README.md at the start of the new chat. Then say:

"I'm continuing work on The AI Classroom. Firebase project is ai-classroom-ad779.
My admin email is sharmasoumil88@gmail.com.
Live Server runs at http://127.0.0.1:5501/ai-classroom/
I work on the dev branch and merge to main to deploy.
[describe what you need help with]"
