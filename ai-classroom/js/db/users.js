/* ============================================================
   db/users.js — User profile CRUD in Firestore
   ============================================================ */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { db } from '../firebase-config.js';

/* ── CREATE user profile on first sign-up ───────────────────── */
export async function createUserProfile(uid, { name, email, role = 'student' }) {
  try {
    const userRef = doc(db, 'users', uid);
    // Check if profile already exists
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      console.log('Profile already exists for', uid);
      return;
    }
    await setDoc(userRef, {
      name:           name || 'Student',
      email:          email || '',
      role:           role,
      curriculum:     'cbse',
      ageGroup:       '11-13',
      createdAt:      serverTimestamp(),
      lastActive:     serverTimestamp(),
      totalQuestions: 0,
      bestStreak:     0,
      badgesEarned:   []
    });
    console.log('Profile created successfully for', uid);
  } catch(e) {
    console.error('createUserProfile failed:', e);
    throw e;
  }
}

/* ── GET user profile ───────────────────────────────────────── */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
  } catch(e) {
    console.error('getUserProfile failed:', e);
    return null;
  }
}

/* ── UPDATE user profile fields ─────────────────────────────── */
export async function updateUserProfile(uid, fields) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...fields,
      lastActive: serverTimestamp()
    });
  } catch(e) {
    console.error('updateUserProfile failed:', e);
  }
}

/* ── UPDATE curriculum + age group preference ───────────────── */
export async function updatePreferences(uid, { curriculum, ageGroup }) {
  try {
    await updateDoc(doc(db, 'users', uid), { curriculum, ageGroup });
  } catch(e) {
    console.error('updatePreferences failed:', e);
  }
}

/* ── GET all users (admin only) ─────────────────────────────── */
export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch(e) {
    console.error('getAllUsers failed:', e);
    return [];
  }
}

/* ── DELETE user profile ────────────────────────────────────── */
export async function deleteUserProfile(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch(e) {
    console.error('deleteUserProfile failed:', e);
  }
}

/* ── CHECK if user is admin ─────────────────────────────────── */
export async function isAdmin(uid) {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
}