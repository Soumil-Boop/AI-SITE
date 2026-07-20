/* ============================================================
   firebase-config.js
   Replace every value below with your own Firebase project
   credentials from: Firebase Console > Project Settings > General
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDX2tV-DbdeubspGyTqd4ARkRwDV9XQREQ",
  authDomain: "ai-classroom-ad779.firebaseapp.com",
  projectId: "ai-classroom-ad779",
  storageBucket: "ai-classroom-ad779.firebasestorage.app",
  messagingSenderId: "433385304033",
  appId: "1:433385304033:web:ab53d599b22b8bd4766ca0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
