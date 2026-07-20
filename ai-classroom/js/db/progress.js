/* ============================================================
   db/progress.js — Save and read student progress
   Collections:
     progress/{uid}/quiz/{sessionId}
     progress/{uid}/lab/{sessionId}
     progress/{uid}/examprep/{sessionId}
   ============================================================ */

import {
  collection, addDoc, getDocs,
  query, orderBy, limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { db } from '../firebase-config.js';
import { updateUserProfile } from './users.js';
import { checkAndAwardBadges } from './badges.js';

/* ── SAVE quiz session ──────────────────────────────────────── */
export async function saveQuizSession(uid, { score, total, answers }) {
  const accuracy = Math.round((score / total) * 100);
  await addDoc(collection(db, 'progress', uid, 'quiz'), {
    score, total, accuracy, answers,
    timestamp: serverTimestamp()
  });

  // Update user totals and check badges
  await updateUserProfile(uid, { totalQuestions: total });
  await checkAndAwardBadges(uid, { type: 'quiz', score, total });
}

/* ── SAVE lab session ───────────────────────────────────────── */
export async function saveLabSession(uid, { subject, curriculum, ageGroup, topic, correct, wrong, streak }) {
  const total    = correct + wrong;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  await addDoc(collection(db, 'progress', uid, 'lab'), {
    subject, curriculum, ageGroup, topic,
    correct, wrong, total, accuracy, streak,
    timestamp: serverTimestamp()
  });

  await updateUserProfile(uid, { totalQuestions: total });
  await checkAndAwardBadges(uid, { type: 'lab', subject, streak, correct });
}

/* ── SAVE exam prep session ─────────────────────────────────── */
export async function saveExamSession(uid, { exam, subject, difficulty, correct, wrong, streak }) {
  const total    = correct + wrong;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  await addDoc(collection(db, 'progress', uid, 'examprep'), {
    exam, subject, difficulty,
    correct, wrong, total, accuracy, streak,
    timestamp: serverTimestamp()
  });

  await updateUserProfile(uid, { totalQuestions: total });
  await checkAndAwardBadges(uid, { type: 'examprep', exam, streak, correct });
}

/* ── GET all quiz sessions for a user ───────────────────────── */
export async function getQuizHistory(uid, limitTo = 20) {
  const q = query(
    collection(db, 'progress', uid, 'quiz'),
    orderBy('timestamp', 'desc'),
    limit(limitTo)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ── GET all lab sessions for a user ────────────────────────── */
export async function getLabHistory(uid, limitTo = 50) {
  const q = query(
    collection(db, 'progress', uid, 'lab'),
    orderBy('timestamp', 'desc'),
    limit(limitTo)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ── GET all exam prep sessions for a user ──────────────────── */
export async function getExamHistory(uid, limitTo = 50) {
  const q = query(
    collection(db, 'progress', uid, 'examprep'),
    orderBy('timestamp', 'desc'),
    limit(limitTo)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ── GET accuracy per subject (for bar chart) ───────────────── */
export async function getAccuracyBySubject(uid) {
  const sessions = await getLabHistory(uid, 100);
  const map = {};
  sessions.forEach(s => {
    if (!map[s.subject]) map[s.subject] = { correct: 0, total: 0 };
    map[s.subject].correct += s.correct;
    map[s.subject].total   += s.total;
  });
  return Object.entries(map).map(([subject, data]) => ({
    subject,
    accuracy: data.total ? Math.round((data.correct / data.total) * 100) : 0
  }));
}

/* ── GET score over time (for line chart) ───────────────────── */
export async function getScoreOverTime(uid) {
  const sessions = await getQuizHistory(uid, 30);
  return sessions.reverse().map(s => ({
    date:     s.timestamp?.toDate?.()?.toLocaleDateString('en-GB') || '',
    accuracy: s.accuracy
  }));
}
