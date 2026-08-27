/* ============================================================
   questions-api.js — where questions come from

   This replaces the old local question engine. There is no bank of
   written questions on the site any more, and no algorithmic maths
   generator: every question is expected to come from the API.

   Nothing here invents a question. That is deliberate. The engine it
   replaced answered "Questions for this topic are coming soon!" for
   every subject it had no content for, which looked like a working
   test right up until a student read it — a placeholder that reaches a
   student is worse than an empty screen, because only one of the two
   tells you something is missing.

   ── Wiring the API ──────────────────────────────────────────
   Implement provideLabQuestion below. It is the single seam: Test Mode
   (index.html) and the exam builder (pages/admin.html) both go through
   it and nothing else makes questions.

   It is called with:
     { subject, curriculum, age, topic, recent }
   where `recent` is the questions already in this paper, so the API can
   avoid repeating itself, and must resolve to:
     { question, options: [..], answer, hint, explanation }
   `options` may be empty for a free-typed answer. Return null when
   there is nothing to give, and the caller will say so honestly.
   ============================================================ */

var QUESTIONS_API_URL = '';   // set this to your endpoint

async function provideLabQuestion(params) {
  if (!QUESTIONS_API_URL) return null;   // not wired yet — say nothing rather than invent

  const res = await fetch(QUESTIONS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: params.subject,
      curriculum: params.curriculum,
      grade: params.age,
      topic: params.topic || '',
      exclude: params.recent || []
    })
  });
  if (!res.ok) throw new Error('questions API ' + res.status);

  const q = await res.json();
  if (!q || !q.question) return null;
  return {
    question: q.question,
    options: q.options || [],
    answer: String(q.answer),
    hint: q.hint || '',
    explanation: q.explanation || ''
  };
}
