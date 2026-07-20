# The AI Classroom — Backend Setup Guide

## Step 1: Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and name it `ai-classroom`
3. Disable Google Analytics (not needed)
4. Click **Create project**

---

## Step 2: Enable Authentication

1. In the Firebase console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Enable these sign-in methods:
   - **Email/Password** — toggle on
   - **Google** — toggle on, add your project support email
   - **Anonymous** — toggle on (this is the guest mode)

---

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a region close to your users (e.g. `asia-south1` for India, `europe-west2` for UK)
5. Click **Enable**

---

## Step 4: Add Firestore Security Rules

1. In Firestore, click the **Rules** tab
2. Delete all existing rules
3. Copy and paste the contents of `firestore.rules` from this folder
4. Click **Publish**

---

## Step 5: Get your Firebase config

1. In Firebase console, click the ⚙️ gear icon > **Project Settings**
2. Scroll down to **Your apps** and click the `</>` Web icon
3. Register your app with the name `ai-classroom-web`
4. Copy the `firebaseConfig` object shown
5. Open `js/firebase-config.js` and replace all the placeholder values with yours

---

## Step 6: Add the files to your project

Copy these files into your existing `ai-classroom/` folder:

```
js/firebase-config.js      → ai-classroom/js/firebase-config.js
js/auth/auth.js            → ai-classroom/js/auth/auth.js
js/db/users.js             → ai-classroom/js/db/users.js
js/db/progress.js          → ai-classroom/js/db/progress.js
js/db/badges.js            → ai-classroom/js/db/badges.js
pages/login.html           → ai-classroom/pages/login.html
pages/dashboard.html       → ai-classroom/pages/dashboard.html
pages/admin.html           → ai-classroom/pages/admin.html
css/dashboard.css          → ai-classroom/css/dashboard.css
```

---

## Step 7: Add Sign In button to the nav

In your `js/core/nav.js`, add a sign in link to the nav HTML:

```html
<a href="pages/login.html" id="navSignIn">Sign In</a>
<a href="pages/dashboard.html" id="navDashboard" style="display:none;">My Dashboard</a>
```

Then add this logic to show/hide based on auth state:

```js
import { onAuthChange } from '../auth/auth.js';

onAuthChange(user => {
  document.getElementById('navSignIn').style.display    = user ? 'none'  : 'inline';
  document.getElementById('navDashboard').style.display = user ? 'inline': 'none';
});
```

---

## Step 8: Connect Lab and Quiz to save progress

In your `js/components/lab.js`, after a session ends call:

```js
import { saveLabSession } from '../db/progress.js';
import { getCurrentUser } from '../auth/auth.js';

const user = getCurrentUser();
if (user) {
  const newBadges = await saveLabSession(user.uid, {
    subject, curriculum, ageGroup, topic,
    correct: LAB.score,
    wrong:   LAB.answered - LAB.score,
    streak:  LAB.streak
  });
  // Show badge notifications if any were earned
  newBadges?.forEach(badge => showBadgeToast(badge));
}
```

In your `js/components/quiz.js`, after quiz completion call:

```js
import { saveQuizSession } from '../db/progress.js';
import { getCurrentUser } from '../auth/auth.js';

const user = getCurrentUser();
if (user) {
  await saveQuizSession(user.uid, { score, total: 5, answers });
}
```

---

## Step 9: Make yourself an admin

1. Sign up on the site with your email
2. Go to Firebase console > Firestore > `users` collection
3. Find your document (it will have your uid as the document ID)
4. Click the document, find the `role` field and change it from `student` to `admin`
5. Now visit `pages/admin.html` — you'll have full admin access

---

## Step 10: Deploy

Your Firebase files are purely client-side JS — no server needed. Just push to GitHub:

```bash
git add .
git commit -m "Add Firebase backend"
git push
```

GitHub Pages will serve everything automatically.

---

## File structure after setup

```
ai-classroom/
├── js/
│   ├── auth/
│   │   └── auth.js           ← Sign up, sign in, sign out
│   ├── db/
│   │   ├── users.js          ← User profiles
│   │   ├── progress.js       ← Quiz, Lab, Exam progress
│   │   └── badges.js         ← Badge logic
│   ├── firebase-config.js    ← YOUR credentials go here
│   └── components/
│       ├── lab.js            ← Update to call saveLabSession
│       └── quiz.js           ← Update to call saveQuizSession
├── pages/
│   ├── login.html            ← Sign in / sign up page
│   ├── dashboard.html        ← Student dashboard
│   └── admin.html            ← Admin panel
├── css/
│   └── dashboard.css         ← Dashboard styles
└── firestore.rules           ← Copy into Firebase console
```

---

## What each page does

| Page | Who sees it | What it does |
|---|---|---|
| `login.html` | Everyone | Email, Google, or guest sign-in |
| `dashboard.html` | Signed-in students | Progress charts, badges, preferences, account settings |
| `admin.html` | Admin only | User management, analytics, progress reset |
