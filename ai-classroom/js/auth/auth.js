/* ============================================================
   auth.js — All authentication logic
   ============================================================ */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import { auth, db } from '../firebase-config.js';
import {
  doc, setDoc, getDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const googleProvider = new GoogleAuthProvider();

/* ── Internal: create profile directly here to avoid import issues ── */
async function _createProfile(uid, name, email, role = 'student') {
  try {
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) return;
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
    console.log('✅ Firestore profile created for', uid);
  } catch(e) {
    console.error('❌ Firestore profile creation failed:', e.code, e.message);
  }
}

/* ── SIGN UP with email + password ─────────────────────────── */
export async function signUpWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await _createProfile(cred.user.uid, name, email, 'student');
  return cred.user;
}

/* ── SIGN IN with email + password ─────────────────────────── */
export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/* ── SIGN IN with Google ────────────────────────────────────── */
export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await _createProfile(cred.user.uid, cred.user.displayName, cred.user.email, 'student');
  return cred.user;
}

/* ── SIGN IN as guest (anonymous) ───────────────────────────── */
export async function signInAsGuest() {
  const cred = await signInAnonymously(auth);
  await _createProfile(cred.user.uid, 'Guest', '', 'student');
  return cred.user;
}

/* ── SIGN OUT ───────────────────────────────────────────────── */
export async function signOutUser() {
  await signOut(auth);
}

/* ── DELETE account ─────────────────────────────────────────── */
export async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  if (password && user.email) {
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
  }
  await deleteUser(user);
}

/* ── AUTH STATE LISTENER ────────────────────────────────────── */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ── GET CURRENT USER ───────────────────────────────────────── */
export function getCurrentUser() {
  return auth.currentUser;
}