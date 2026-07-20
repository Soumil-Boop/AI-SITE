/* ============================================================
   db/badges.js — Badge definitions and award logic
   Collection: users/{uid} (badgesEarned array)
   ============================================================ */

import {
  doc, getDoc, updateDoc, arrayUnion, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { db } from '../firebase-config.js';
import { getLabHistory, getExamHistory, getQuizHistory } from './progress.js';

/* ── BADGE DEFINITIONS ──────────────────────────────────────── */
export const BADGES = {
  first_quiz: {
    id:    'first_quiz',
    name:  'First Step',
    desc:  'Completed your first quiz',
    icon:  '🎯',
    color: '#1D4ED8'
  },
  streak_10: {
    id:    'streak_10',
    name:  'On Fire',
    desc:  '10 correct answers in a row',
    icon:  '🔥',
    color: '#F97316'
  },
  streak_25: {
    id:    'streak_25',
    name:  'Unstoppable',
    desc:  '25 correct answers in a row',
    icon:  '⚡',
    color: '#7C3AED'
  },
  streak_50: {
    id:    'streak_50',
    name:  'Legendary',
    desc:  '50 correct answers in a row',
    icon:  '👑',
    color: '#F59E0B'
  },
  all_subjects: {
    id:    'all_subjects',
    name:  'Polymath',
    desc:  'Tried all 5 subjects in the Lab',
    icon:  '📚',
    color: '#059669'
  },
  all_exams: {
    id:    'all_exams',
    name:  'Exam Ready',
    desc:  'Tried all 5 competitive exams',
    icon:  '🏛️',
    color: '#1E3A8A'
  },
  questions_100: {
    id:    'questions_100',
    name:  'Century',
    desc:  'Answered 100 questions in total',
    icon:  '💯',
    color: '#DC2626'
  },
  questions_500: {
    id:    'questions_500',
    name:  'Scholar',
    desc:  'Answered 500 questions in total',
    icon:  '🎓',
    color: '#7C3AED'
  },
  perfect_quiz: {
    id:    'perfect_quiz',
    name:  'Perfect Score',
    desc:  'Got 5/5 on the AI quiz',
    icon:  '⭐',
    color: '#F59E0B'
  }
};

/* ── AWARD a badge if not already earned ────────────────────── */
async function awardBadge(uid, badgeId) {
  const userRef  = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const earned = userSnap.data().badgesEarned || [];
  if (earned.includes(badgeId)) return; // already have it

  await updateDoc(userRef, {
    badgesEarned: arrayUnion(badgeId),
    [`badgeDates.${badgeId}`]: serverTimestamp()
  });

  return BADGES[badgeId]; // return so UI can show a notification
}

/* ── CHECK and AWARD badges after each session ──────────────── */
export async function checkAndAwardBadges(uid, sessionData) {
  const awarded = [];

  const { type, score, total, streak, subject, exam, correct } = sessionData;

  // First quiz
  if (type === 'quiz') {
    const history = await getQuizHistory(uid, 2);
    if (history.length <= 1) {
      const b = await awardBadge(uid, 'first_quiz');
      if (b) awarded.push(b);
    }
    // Perfect quiz
    if (score === total && total > 0) {
      const b = await awardBadge(uid, 'perfect_quiz');
      if (b) awarded.push(b);
    }
  }

  // Streak badges
  if (streak >= 10) { const b = await awardBadge(uid, 'streak_10'); if (b) awarded.push(b); }
  if (streak >= 25) { const b = await awardBadge(uid, 'streak_25'); if (b) awarded.push(b); }
  if (streak >= 50) { const b = await awardBadge(uid, 'streak_50'); if (b) awarded.push(b); }

  // All subjects tried
  if (type === 'lab') {
    const labHistory = await getLabHistory(uid, 100);
    const subjectsTried = new Set(labHistory.map(s => s.subject));
    if (subjectsTried.size >= 5) {
      const b = await awardBadge(uid, 'all_subjects');
      if (b) awarded.push(b);
    }
  }

  // All exams tried
  if (type === 'examprep') {
    const examHistory = await getExamHistory(uid, 100);
    const examsTried = new Set(examHistory.map(s => s.exam));
    if (examsTried.size >= 5) {
      const b = await awardBadge(uid, 'all_exams');
      if (b) awarded.push(b);
    }
  }

  // Total questions milestones
  const userSnap = await getDoc(doc(db, 'users', uid));
  const totalQ   = (userSnap.data()?.totalQuestions || 0) + (correct || 0);
  if (totalQ >= 100) { const b = await awardBadge(uid, 'questions_100'); if (b) awarded.push(b); }
  if (totalQ >= 500) { const b = await awardBadge(uid, 'questions_500'); if (b) awarded.push(b); }

  return awarded; // UI can loop over these and show pop-ups
}

/* ── GET all earned badges for a user ───────────────────────── */
export async function getEarnedBadges(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  const earned = snap.data().badgesEarned || [];
  return earned.map(id => BADGES[id]).filter(Boolean);
}
