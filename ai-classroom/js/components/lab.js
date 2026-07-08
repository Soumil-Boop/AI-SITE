/* ============================================================
   lab.js — Visual Learning Lab Logic
   ============================================================ */

const LAB = {
  subject: 'addition',
  difficulty: 'easy',
  score: 0,
  streak: 0,
  answered: 0,
  currentQ: null,

  DIFFICULTY_RANGES: {
    easy:   { min: 1, max: 9 },
    medium: { min: 5, max: 20 },
    hard:   { min: 10, max: 50 },
  },

  TUTOR_MSGS: {
    start:   ["Let's do this! I believe in you! 💪", "Ready? Here we go! 🚀", "Great choice! Let's learn together! 🌟"],
    correct: ["Fantastic! You're a superstar! ⭐", "Yes! That's exactly right! 🎉", "Amazing! You're on fire! 🔥", "Brilliant! Keep it up! 🏆"],
    wrong:   ["Not quite — look at the blocks and count again! 🔍", "Almost! Try counting each block one more time. 🧮", "Good try! Count the first group, then the second. 💡"],
    hint:    ["Try counting the blue blocks first, then the orange ones!", "Point to each block one by one as you count.", "Think of it as groups — how many in each group?"],
    streak3: "3 in a row! You're unstoppable! 🔥🔥🔥",
    streak5: "FIVE in a row! You're a genius! 🧠✨",
    streak10:"TEN IN A ROW! You're a legend! 👑🏆",
  },

  CELEBRATION_EMOJIS: ['🎉','⭐','🏆','🌟','💫','🎊','✨'],
  CELEBRATION_TEXTS:  ['Correct!','Brilliant!','Amazing!','Well Done!','Superstar!'],
};

function setSubject(s, btn) {
  LAB.subject = s;
  document.querySelectorAll('#subjectPicker .lab-pick').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (LAB.currentQ) generateQuestion();
}

function setDifficulty(d, btn) {
  LAB.difficulty = d;
  document.querySelectorAll('#diffPicker .lab-pick').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (LAB.currentQ) generateQuestion();
}

function generateQuestion() {
  const { min, max } = LAB.DIFFICULTY_RANGES[LAB.difficulty];
  let a, b, answer, questionText, equation;

  if (LAB.subject === 'counting') {
    a = rnd(min, Math.min(max, 20));
    answer = a; questionText = 'How many blocks do you count? 🔢'; equation = 'Count = ';
  } else if (LAB.subject === 'addition') {
    a = rnd(min, max); b = rnd(min, max);
    answer = a + b; questionText = 'Can you add these two groups together? ➕'; equation = `${a} + ${b} = `;
  } else if (LAB.subject === 'subtraction') {
    a = rnd(min + 2, max); b = rnd(min, a);
    answer = a - b; questionText = 'Take away the orange blocks from the blue ones! ➖'; equation = `${a} - ${b} = `;
  } else if (LAB.subject === 'multiplication') {
    const mMax = LAB.difficulty === 'easy' ? 5 : LAB.difficulty === 'medium' ? 8 : 12;
    a = rnd(1, mMax); b = rnd(1, mMax);
    answer = a * b; questionText = `${a} groups of ${b} — how many altogether? ✖️`; equation = `${a} × ${b} = `;
  }

  LAB.currentQ = { a, b, answer };

  document.getElementById('labQuestionCard').style.display = 'block';
  document.getElementById('labQuestionText').textContent = questionText;
  document.getElementById('labEquation').textContent = equation;
  document.getElementById('labFeedback').textContent = '';
  document.getElementById('labFeedback').style.color = '';

  const input = document.getElementById('labAnswerInput');
  input.value = '';
  input.className = 'lab-answer-input';
  input.disabled = false;

  renderBlocks(a, b);

  const nlWrap = document.getElementById('labNumberLineWrap');
  if (LAB.difficulty === 'easy' && LAB.subject !== 'multiplication') {
    renderNumberLine(a, b);
    nlWrap.style.display = 'block';
  } else {
    nlWrap.style.display = 'none';
  }

  setTutor(pick(LAB.TUTOR_MSGS.start));
  input.focus();
}

function makeBlock(cls, delay) {
  const bl = document.createElement('div');
  bl.className = `lab-block ${cls}`;
  bl.style.animationDelay = `${delay}ms`;
  bl.onclick = () => { bl.style.transform = 'scale(1.3)'; setTimeout(() => bl.style.transform = '', 200); };
  return bl;
}

function renderBlocks(a, b) {
  const area = document.getElementById('labBlocksArea');
  area.innerHTML = '';
  area.style.flexDirection = '';
  area.style.alignItems = '';

  if (LAB.subject === 'counting') {
    const row = document.createElement('div'); row.className = 'lab-block-row';
    for (let i = 0; i < a; i++) row.appendChild(makeBlock('lab-block-a', i * 40));
    area.appendChild(row);
  } else if (LAB.subject === 'addition' || LAB.subject === 'subtraction') {
    const g1 = document.createElement('div'); g1.className = 'lab-block-group';
    const r1 = document.createElement('div'); r1.className = 'lab-block-row';
    for (let i = 0; i < a; i++) r1.appendChild(makeBlock('lab-block-a', i * 35));
    const l1 = document.createElement('div'); l1.className = 'lab-block-label';
    l1.textContent = `${a}`;
    g1.appendChild(r1); g1.appendChild(l1);

    const op = document.createElement('div');
    op.style.cssText = 'font-size:2rem;font-weight:900;color:var(--muted);align-self:center;';
    op.textContent = LAB.subject === 'addition' ? '+' : '−';

    const g2 = document.createElement('div'); g2.className = 'lab-block-group';
    const r2 = document.createElement('div'); r2.className = 'lab-block-row';
    for (let i = 0; i < b; i++) r2.appendChild(makeBlock('lab-block-b', i * 35));
    const l2 = document.createElement('div'); l2.className = 'lab-block-label';
    l2.textContent = `${b}`;
    g2.appendChild(r2); g2.appendChild(l2);

    area.style.alignItems = 'center';
    area.appendChild(g1); area.appendChild(op); area.appendChild(g2);
  } else if (LAB.subject === 'multiplication') {
    for (let i = 0; i < a; i++) {
      const row = document.createElement('div'); row.className = 'lab-block-row';
      for (let j = 0; j < b; j++) row.appendChild(makeBlock('lab-block-c', (i * b + j) * 30));
      area.appendChild(row);
    }
  }
}

function renderNumberLine(a, b) {
  const line = document.getElementById('labNumberLine');
  line.innerHTML = '';
  const total = LAB.subject === 'addition' ? a + b : a;
  const max = Math.max(total + 1, 10);
  for (let i = 0; i <= max; i++) {
    const step = document.createElement('div'); step.className = 'lab-nl-step';
    const tick = document.createElement('div'); tick.className = 'lab-nl-tick';
    const num  = document.createElement('div'); num.className  = 'lab-nl-num';
    num.textContent = i;
    if (LAB.subject === 'addition'    && i > 0 && i <= a + b) tick.classList.add('highlighted');
    if (LAB.subject === 'subtraction' && i >= a - b && i <= a) tick.classList.add('highlighted');
    if (tick.classList.contains('highlighted')) num.classList.add('highlighted');
    step.appendChild(tick); step.appendChild(num);
    line.appendChild(step);
  }
}

function checkAnswer() {
  if (!LAB.currentQ) return;
  const input = document.getElementById('labAnswerInput');
  const val = parseInt(input.value);
  if (isNaN(val)) { setTutor("Type a number in the box first! 📝"); return; }

  const fb = document.getElementById('labFeedback');
  LAB.answered++;
  updateProgress();

  if (val === LAB.currentQ.answer) {
    LAB.score++; LAB.streak++;
    input.classList.add('correct');
    fb.style.color = 'var(--green)';
    fb.textContent = '✅ Correct! Well done!';
    input.disabled = true;

    let msg = pick(LAB.TUTOR_MSGS.correct);
    if (LAB.streak === 3)  msg = LAB.TUTOR_MSGS.streak3;
    if (LAB.streak === 5)  msg = LAB.TUTOR_MSGS.streak5;
    if (LAB.streak === 10) msg = LAB.TUTOR_MSGS.streak10;
    setTutor(msg);
    updateScore();
    showCelebration();
    setTimeout(generateQuestion, 2200);
  } else {
    LAB.streak = 0;
    input.classList.add('wrong');
    fb.style.color = 'var(--accent-dark)';
    fb.textContent = `Not quite — the answer was ${LAB.currentQ.answer}. Try the next one!`;
    setTutor(pick(LAB.TUTOR_MSGS.wrong));
    updateScore();
    setTimeout(() => {
      input.classList.remove('wrong');
      input.value = '';
      input.disabled = false;
      input.focus();
      fb.textContent = '';
    }, 2000);
  }
}

function showHint() {
  if (!LAB.currentQ) { setTutor("Press New Question first, then I'll give you a hint! 😊"); return; }
  setTutor(pick(LAB.TUTOR_MSGS.hint));
}

function setTutor(msg) {
  const bubble = document.getElementById('tutorBubble');
  bubble.style.animation = 'none';
  bubble.offsetHeight;
  bubble.style.animation = 'fadeUp .4s ease';
  bubble.innerHTML = msg;
}

function updateScore() {
  document.getElementById('labScore').textContent  = LAB.score;
  document.getElementById('labStreak').textContent = `${LAB.streak} 🔥`;
}

function updateProgress() {
  const pct = Math.min((LAB.answered / 10) * 100, 100);
  document.getElementById('labProgressFill').style.width = pct + '%';
  document.getElementById('labProgressText').textContent = `${LAB.answered} answered this session`;
}

function showCelebration() {
  document.getElementById('celebEmoji').textContent = pick(LAB.CELEBRATION_EMOJIS);
  document.getElementById('celebText').textContent  = pick(LAB.CELEBRATION_TEXTS);
  const cel = document.getElementById('labCelebration');
  cel.classList.add('show');
  setTimeout(() => cel.classList.remove('show'), 1800);
}
