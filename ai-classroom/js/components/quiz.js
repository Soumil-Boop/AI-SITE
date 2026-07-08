/* ============================================================
   quiz.js — Quiz Component Logic
   ============================================================ */

const QUIZ_QUESTIONS = [
  { q: "Who coined the term 'Artificial Intelligence'?", opts: ["Alan Turing","John McCarthy","Elon Musk","Albert Einstein"], ans: 1, fb: "Correct! John McCarthy coined the term at the 1956 Dartmouth Conference." },
  { q: "What is Machine Learning?", opts: ["A robot that can walk","AI that learns from data without being explicitly programmed","A type of computer virus","Software that fixes bugs automatically"], ans: 1, fb: "Exactly! Machine learning systems improve by learning from examples and data." },
  { q: "What is it called when an AI confidently states something false?", opts: ["A glitch","A hallucination","A bug","An error 404"], ans: 1, fb: "Right! AI hallucinations are when a model generates convincing but incorrect information." },
  { q: "Which of these is an example of AI you probably use every day?", opts: ["A light switch","A bicycle","Music recommendations on Spotify","A printed book"], ans: 2, fb: "Spot on! Music recommendation engines use AI to predict what you'll enjoy." },
  { q: "What is the best way to use AI for your homework?", opts: ["Copy its answer word for word","Use it to help you understand the topic, then write in your own words","Ask it to do the entire assignment for you","Only use it during tests"], ans: 1, fb: "Perfect! AI is most valuable as a learning tool, not a shortcut." },
];

let currentQ = 0, score = 0, answered = false;

function loadQuestion() {
  const q = QUIZ_QUESTIONS[currentQ];
  document.getElementById('quizNum').textContent  = `Q${currentQ + 1}.`;
  document.getElementById('quizText').textContent = q.q;
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizNext').style.display = 'none';
  answered = false;

  const opts = document.getElementById('quizOptions');
  opts.innerHTML = '';
  q.opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = o;
    btn.onclick = () => selectAnswer(i);
    opts.appendChild(btn);
  });
  updateProgress();
}

function selectAnswer(idx) {
  if (answered) return;
  answered = true;
  const q = QUIZ_QUESTIONS[currentQ];
  document.querySelectorAll('.quiz-opt').forEach((b, i) => {
    if (i === q.ans) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
  });
  if (idx === q.ans) score++;
  document.getElementById('quizFeedback').textContent = idx === q.ans ? q.fb : `Not quite. The answer was: "${q.opts[q.ans]}"`;
  const nextBtn = document.getElementById('quizNext');
  nextBtn.style.display = 'inline-flex';
  if (currentQ === QUIZ_QUESTIONS.length - 1) nextBtn.textContent = 'See Results 🎉';
  updateProgress();
}

function nextQuestion() {
  currentQ++;
  if (currentQ >= QUIZ_QUESTIONS.length) { showResult(); return; }
  loadQuestion();
}

function updateProgress() {
  const pct = (currentQ / QUIZ_QUESTIONS.length) * 100;
  document.getElementById('quizBar').style.width  = pct + '%';
  document.getElementById('quizScore').textContent = `${score} / ${QUIZ_QUESTIONS.length}`;
}

function showResult() {
  ['quizQ','quizOptions','quizFeedback','quizNext'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('quizResult').style.display = 'block';
  document.getElementById('quizBar').style.width = '100%';
  document.getElementById('quizScore').textContent = `${score} / ${QUIZ_QUESTIONS.length}`;

  const pct = score / QUIZ_QUESTIONS.length;
  const [emoji, title, desc] =
    pct === 1     ? ['🏆','Perfect Score!', "You're an AI expert! Outstanding work."] :
    pct >= .8     ? ['🌟','Amazing Job!',   'You really know your AI. Keep it up!'] :
    pct >= .6     ? ['👍','Good Work!',     'Solid understanding. Go review the sections you missed.'] :
    pct >= .4     ? ['📚','Keep Learning!', 'Read through the chapters again and try once more.'] :
                    ['💪','Keep Going!',    "AI takes time to learn. You've got this!"];

  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultDesc').textContent  = desc;
}

function restartQuiz() {
  currentQ = 0; score = 0; answered = false;
  ['quizQ','quizOptions','quizFeedback'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  document.getElementById('quizResult').style.display = 'none';
  loadQuestion();
}

// Init
if (document.getElementById('quizOptions')) loadQuestion();
