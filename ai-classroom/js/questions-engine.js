/* ============================================================
   questions-engine.js — Local question engine for the Lab + Exam Prep
   ------------------------------------------------------------
   Provides questions from EITHER:
     • a free, local source  (algorithmic maths + JSON question bank)
     • the Claude API        (via your Cloudflare Worker proxy)

   Flip ONE switch below to change modes. The JSON bank is also used
   as an automatic fallback if the API path ever fails.

   The functions here return the SAME object shape the Lab/Exam
   rendering already expects:
     Lab MCQ   : { question, options:[4], answer, hint, explanation }
     Lab maths : { question, answer:<number>, hint, explanation, showBlocks:true }
     Exam MCQ  : { question, options:[4], answer, explanation }
   ============================================================ */

/* ── THE SWITCH ─────────────────────────────────────────────
   'json' = free, local questions (development / no cost)
   'api'  = live Claude questions through your Cloudflare Worker
   ----------------------------------------------------------- */
const QUESTION_SOURCE = 'json';

/* Your deployed Cloudflare Worker proxy (used only when source = 'api'). */
const API_PROXY_URL = 'https://ai-classroom-proxy.aiteachingsite.workers.dev';
const API_MODEL     = 'claude-sonnet-4-6';

/* ── helpers ────────────────────────────────────────────────── */
function _rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
function _pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function _shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/* Build a 4-option MCQ from a correct answer + distractors, shuffled. */
function _mcq(question, correct, distractors, explanation, hint){
  const opts = _shuffle([String(correct), ...distractors.slice(0,3).map(String)]);
  return { question, options: opts, answer: String(correct), hint: hint || '', explanation };
}

/* ============================================================
   1) ALGORITHMIC MATHS  (infinite, always correct, free)
   ============================================================ */
function _mathByAge(age){
  // number ranges scaled to age band
  switch(age){
    case '5-7':   return { lo:1,  hi:10 };
    case '8-10':  return { lo:2,  hi:25 };
    case '11-13': return { lo:3,  hi:40 };
    default:      return { lo:5,  hi:60 }; // 14-16
  }
}

function generateMathQuestion({ age, topic }){
  const t = (topic || '').toLowerCase();
  const { lo, hi } = _mathByAge(age);
  const showBlocks = ['5-7','8-10'].includes(age);

  // ---- core arithmetic ----
  if (t.includes('count')){
    const n = _rand(lo, Math.min(hi, 20));
    return { question:`How many blocks are there if you count ${n}?`, answer:n,
      hint:'Count each block one at a time.', explanation:`Counting up gives ${n}.`, showBlocks:true };
  }
  if (t.includes('add')){
    const a=_rand(lo,hi), b=_rand(lo,hi);
    return { question:`${a} + ${b} = ?`, answer:a+b,
      hint:'Count the first group, then keep counting on for the second.',
      explanation:`${a} + ${b} = ${a+b}.`, showBlocks:true };
  }
  if (t.includes('subtract')){
    const a=_rand(lo+2,hi), b=_rand(lo,a);
    return { question:`${a} − ${b} = ?`, answer:a-b,
      hint:'Start at the bigger number and take the smaller away.',
      explanation:`${a} − ${b} = ${a-b}.`, showBlocks:true };
  }
  if (t.includes('multipl')){
    const cap = age==='8-10' ? 10 : age==='11-13' ? 12 : 15;
    const a=_rand(2,cap), b=_rand(2,cap);
    return { question:`${a} × ${b} = ?`, answer:a*b,
      hint:`${a} groups of ${b}.`, explanation:`${a} × ${b} = ${a*b}.`, showBlocks:false };
  }
  if (t.includes('divi')){
    const b=_rand(2,10), ans=_rand(2,10), a=b*ans;
    return { question:`${a} ÷ ${b} = ?`, answer:ans,
      hint:`How many ${b}s fit into ${a}?`, explanation:`${a} ÷ ${b} = ${ans}.`, showBlocks:false };
  }
  // ---- fractions / decimals / percentages ----
  if (t.includes('fraction')){
    const denom=_pick([2,3,4,5,10]), whole=denom*_rand(2,8);
    return { question:`What is 1/${denom} of ${whole}?`, answer:whole/denom,
      hint:`Divide ${whole} by ${denom}.`, explanation:`1/${denom} of ${whole} = ${whole} ÷ ${denom} = ${whole/denom}.`, showBlocks:false };
  }
  if (t.includes('decimal')){
    const a=_rand(1,9)/10, b=_rand(1,9)/10;
    const ans=Math.round((a+b)*10)/10;
    return { question:`${a} + ${b} = ?`, answer:ans,
      hint:'Line up the decimal points and add.', explanation:`${a} + ${b} = ${ans}.`, showBlocks:false };
  }
  if (t.includes('percent')){
    const pct=_pick([10,20,25,50]), base=_pick([20,40,60,80,100,200]);
    return { question:`What is ${pct}% of ${base}?`, answer:base*pct/100,
      hint:`${pct}% means ${pct} out of every 100.`, explanation:`${pct}% of ${base} = ${base} × ${pct}/100 = ${base*pct/100}.`, showBlocks:false };
  }
  if (t.includes('ratio') || t.includes('proportion')){
    const k=_rand(2,6), p=_rand(1,4), q=_rand(1,4), first=p*k;
    return { question:`Two quantities are in the ratio ${p}:${q}. If the first is ${first}, what is the second?`, answer:q*k,
      hint:`Find the multiplier: ${first} ÷ ${p}.`, explanation:`${first} ÷ ${p} = ${k}, so the second is ${q} × ${k} = ${q*k}.`, showBlocks:false };
  }
  // ---- geometry / measurement ----
  if (t.includes('perimeter') || t.includes('area')){
    const w=_rand(2,12), h=_rand(2,12);
    if (Math.random()<0.5)
      return { question:`A rectangle is ${w} cm by ${h} cm. What is its perimeter (cm)?`, answer:2*(w+h),
        hint:'Perimeter = 2 × (width + height).', explanation:`2 × (${w} + ${h}) = ${2*(w+h)} cm.`, showBlocks:false };
    return { question:`A rectangle is ${w} cm by ${h} cm. What is its area (cm²)?`, answer:w*h,
      hint:'Area = width × height.', explanation:`${w} × ${h} = ${w*h} cm².`, showBlocks:false };
  }
  if (t.includes('geometry')){
    const opt=_pick(['tri','square','angles']);
    if (opt==='tri') return { question:'How many degrees do the angles inside a triangle add up to?', answer:180,
      hint:'It is a fixed number for every triangle.', explanation:'The interior angles of any triangle sum to 180°.', showBlocks:false };
    if (opt==='square'){ const s=_rand(3,15); return { question:`A square has sides of ${s} cm. What is its perimeter (cm)?`, answer:4*s,
      hint:'A square has 4 equal sides.', explanation:`4 × ${s} = ${4*s} cm.`, showBlocks:false }; }
    return { question:'How many degrees are there on a straight line?', answer:180,
      hint:'Half of a full turn.', explanation:'Angles on a straight line add up to 180°.', showBlocks:false };
  }
  if (t.includes('shape') || t.includes('pattern')){
    if (Math.random()<0.5){ const step=_rand(2,5), start=_rand(1,5); const seq=[start,start+step,start+2*step];
      return { question:`What number comes next: ${seq.join(', ')}, ?`, answer:start+3*step,
        hint:`Each step adds ${step}.`, explanation:`The pattern adds ${step} each time, so next is ${start+3*step}.`, showBlocks:false }; }
    const shape=_pick([['triangle',3],['square',4],['pentagon',5],['hexagon',6]]);
    return { question:`How many sides does a ${shape[0]} have?`, answer:shape[1],
      hint:'Count the straight edges.', explanation:`A ${shape[0]} has ${shape[1]} sides.`, showBlocks:false };
  }
  if (t.includes('time')){
    const h=_rand(1,6);
    return { question:`How many minutes are there in ${h} hour${h>1?'s':''}?`, answer:h*60,
      hint:'1 hour = 60 minutes.', explanation:`${h} × 60 = ${h*60} minutes.`, showBlocks:false };
  }
  if (t.includes('money')){
    const coin=_pick([2,5,10]), n=_rand(2,6);
    return { question:`You have ${n} coins worth ${coin} each. How much money in total?`, answer:coin*n,
      hint:`Add ${coin} ${n} times, or multiply.`, explanation:`${n} × ${coin} = ${coin*n}.`, showBlocks:false };
  }
  // ---- algebra ----
  if (t.includes('linear') || t.includes('equation')){
    const x=_rand(1,12), a=_rand(2,6), b=_rand(1,20);
    return { question:`If ${a}x + ${b} = ${a*x+b}, what is x?`, answer:x,
      hint:`Subtract ${b}, then divide by ${a}.`, explanation:`${a}x = ${a*x+b} − ${b} = ${a*x}, so x = ${a*x} ÷ ${a} = ${x}.`, showBlocks:false };
  }
  if (t.includes('algebra')){
    const x=_rand(2,9), a=_rand(2,6), b=_rand(1,9);
    return { question:`Evaluate ${a}x + ${b} when x = ${x}.`, answer:a*x+b,
      hint:`Multiply ${a} by ${x}, then add ${b}.`, explanation:`${a}×${x} + ${b} = ${a*x} + ${b} = ${a*x+b}.`, showBlocks:false };
  }
  if (t.includes('polynomial')){
    const x=_rand(2,6), c=_rand(1,9);
    return { question:`Evaluate x² + ${c} when x = ${x}.`, answer:x*x+c,
      hint:`Square ${x}, then add ${c}.`, explanation:`${x}² + ${c} = ${x*x} + ${c} = ${x*x+c}.`, showBlocks:false };
  }
  if (t.includes('quadratic')){
    const r=_rand(2,9);
    return { question:`One solution of x² = ${r*r} is a positive whole number. What is it?`, answer:r,
      hint:'What number times itself gives that value?', explanation:`${r} × ${r} = ${r*r}, so x = ${r}.`, showBlocks:false };
  }
  if (t.includes('coordinate')){
    const x1=_rand(0,10), x2=_rand(0,10);
    const mid=(x1+x2)/2;
    return { question:`What is the x-coordinate of the midpoint of (${x1}, 0) and (${x2}, 0)?`, answer:mid,
      hint:'Average the two x-values.', explanation:`(${x1} + ${x2}) ÷ 2 = ${mid}.`, showBlocks:false };
  }
  if (t.includes('trigonometry')){
    const q=_pick([['sin 30°',0.5],['cos 0°',1],['sin 90°',1],['cos 60°',0.5],['tan 45°',1],['sin 0°',0]]);
    return { question:`What is ${q[0]}? (as a decimal)`, answer:q[1],
      hint:'Recall the standard trig values.', explanation:`${q[0]} = ${q[1]}.`, showBlocks:false };
  }
  if (t.includes('probability')){
    const q=_pick([['a fair coin landing on heads',0.5],['rolling an even number on a die',0.5],['drawing a red card from a deck',0.5]]);
    return { question:`What is the probability of ${q[0]}? (as a decimal)`, answer:q[1],
      hint:'Favourable outcomes ÷ total outcomes.', explanation:`The probability is ${q[1]}.`, showBlocks:false };
  }
  if (t.includes('statistic') || t.includes('data') || t.includes('chart')){
    const nums=[_rand(2,10),_rand(2,10),_rand(2,10)];
    const sum=nums.reduce((s,n)=>s+n,0);
    // keep the mean whole
    const adj = (3 - (sum % 3)) % 3; nums[0]+=adj;
    const sum2=nums.reduce((s,n)=>s+n,0);
    return { question:`What is the mean (average) of ${nums.join(', ')}?`, answer:sum2/3,
      hint:'Add them up, then divide by how many there are.', explanation:`(${nums.join(' + ')}) ÷ 3 = ${sum2} ÷ 3 = ${sum2/3}.`, showBlocks:false };
  }

  // ---- default: age-appropriate addition ----
  const a=_rand(lo,hi), b=_rand(lo,hi);
  return { question:`${a} + ${b} = ?`, answer:a+b,
    hint:'Add the two numbers together.', explanation:`${a} + ${b} = ${a+b}.`, showBlocks:showBlocks };
}

/* ============================================================
   2) JSON QUESTION BANK  (concept subjects + exam prep)
   ============================================================ */
let _BANK = null;
let _bankPromise = null;

async function ensureBank(){
  if (_BANK) return _BANK;
  if (!_bankPromise){
    _bankPromise = fetch('data/question-bank.json')
      .then(r => { if(!r.ok) throw new Error('bank '+r.status); return r.json(); })
      .then(j => { _BANK = j; return j; })
      .catch(err => { console.warn('Question bank failed to load:', err); _BANK = { lab:{}, exam:{} }; return _BANK; });
  }
  return _bankPromise;
}
// warm it up early so the first click is instant
if (typeof document !== 'undefined'){
  document.addEventListener('DOMContentLoaded', () => { ensureBank(); });
}

/* pull a non-repeating item from a pool */
function _pickFresh(pool, recent){
  if (!pool || !pool.length) return null;
  const recentSet = new Set((recent||[]).slice(-8));
  const fresh = pool.filter(q => !recentSet.has(q.question));
  return _pick(fresh.length ? fresh : pool);
}

async function bankLabQuestion({ subject, age, topic, recent }){
  const bank = await ensureBank();
  const bySubject = (bank.lab || {})[subject] || {};
  const pool = bySubject[age] || [];
  // prefer questions tagged with the current topic, else any in the age band
  const topical = pool.filter(q => (q.topic || '').toLowerCase() === (topic||'').toLowerCase());
  const chosen = _pickFresh(topical.length ? topical : pool, recent);
  if (!chosen){
    return { question:`Questions for this topic are coming soon! For now, here is a thinking question: which subject are you studying — ${subject}?`,
      options: _shuffle([subject, 'maths', 'science', 'history']).slice(0,4),
      answer: subject, hint:'You chose it above.', explanation:'The bank does not have this topic yet — add more in data/question-bank.json.' };
  }
  return chosen;
}

async function bankExamQuestion({ subject, difficulty, recent }){
  const bank = await ensureBank();
  const bySubject = (bank.exam || {})[subject] || {};
  let pool = bySubject[difficulty] || [];
  if (!pool.length){ // fall back across difficulties
    pool = [].concat(bySubject.easy||[], bySubject.medium||[], bySubject.hard||[]);
  }
  // quantitative aptitude can also draw infinite algorithmic maths
  if ((!pool.length || Math.random()<0.4) && subject==='aptitude'){
    const m = generateMathQuestion({ age:'14-16', topic:_pick(['percent','ratio','multipl','average statistics','time']) });
    const wrongs = _shuffle([m.answer+_rand(1,5), m.answer-_rand(1,4), m.answer+_rand(6,10)]);
    return _mcq(m.question, m.answer, wrongs, m.explanation, m.hint);
  }
  const chosen = _pickFresh(pool, recent);
  if (!chosen){
    return { question:'More exam questions are coming soon for this subject. Which of these is a competitive exam?',
      options:_shuffle(['UPSC','Lunch','Cricket','Movie']).slice(0,4), answer:'UPSC',
      explanation:'Add more questions in data/question-bank.json under exam → '+subject+'.' };
  }
  return chosen;
}

/* ============================================================
   3) CLAUDE API PATH  (via your Cloudflare Worker)
   ============================================================ */
async function _callProxy(prompt, maxTokens){
  const res = await fetch(API_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: API_MODEL, max_tokens: maxTokens, messages:[{ role:'user', content: prompt }] })
  });
  const data = await res.json();
  const raw = (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

async function apiLabQuestion({ subject, curriculum, age, topic, recent }){
  const currMap = { cbse:'CBSE (India)', icse:'ICSE (India)', uk:'UK National Curriculum', us:'US Common Core', ib:'IB (International Baccalaureate)' };
  const currName = currMap[curriculum] || curriculum;
  const recentCtx = (recent && recent.length) ? `\nDo NOT repeat these recent questions: ${recent.slice(-5).join(' | ')}` : '';
  const usesMCQ = ['science','english','history','geography'].includes(subject);
  const isMaths = subject === 'maths';
  const prompt = `You are an expert educational question generator for ${currName} students aged ${age}.
Generate ONE question on the topic: "${topic}" (Subject: ${subject}).${recentCtx}

Rules:
- Appropriate difficulty for age ${age} in ${currName}
- Clear, concise, engaging question
- ${usesMCQ ? 'Multiple choice with exactly 4 options (A, B, C, D)' : 'Short numeric answer question'}
- ${isMaths ? 'Include a numeric answer. For young ages use small numbers.' : ''}
- Include a helpful hint and a clear explanation of the answer

Respond ONLY with this exact JSON (no markdown, no extra text):
${usesMCQ ? `{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A",
  "hint": "A helpful hint",
  "explanation": "Why the answer is correct, with educational context"
}` : `{
  "question": "The equation or question here",
  "answer": 42,
  "hint": "A helpful hint",
  "explanation": "Step by step solution",
  "showBlocks": true
}`}`;
  return _callProxy(prompt, 600);
}

async function apiExamQuestion({ exam, subject, difficulty, recent }){
  const EXAM_CTX = {
    cuet:'CUET (Common University Entrance Test) for undergraduate admissions in India. Questions follow NTA CUET pattern.',
    railways:'Indian Railways RRB NTPC / Group D recruitment exam. Questions follow RRB pattern including GK, Maths and Reasoning.',
    bankpo:'Bank PO (IBPS PO / SBI PO) recruitment exam. Questions follow banking sector patterns including data interpretation.',
    ssc:'SSC CGL/CHSL/MTS exam by Staff Selection Commission India. Questions follow SSC pattern.',
    upsc:'UPSC Civil Services Preliminary Examination GS Paper I. Questions follow UPSC standard — analytical and conceptual.'
  };
  const SUBJ_CTX = {
    gk:'General Knowledge and Current Affairs — history, geography, polity, science, economy, sports, awards.',
    aptitude:'Quantitative Aptitude — number systems, percentages, ratio, time-speed-distance, profit-loss, interest, data interpretation.',
    reasoning:'Logical Reasoning — series, analogies, coding-decoding, blood relations, direction sense, puzzles, syllogisms.',
    english:'English Language — comprehension, vocabulary, grammar, fill in the blanks, error spotting, sentence rearrangement, idioms.'
  };
  const EXAM_NAMES = { cuet:'CUET', railways:'Railways RRB', bankpo:'Bank PO', ssc:'SSC', upsc:'UPSC Prelims' };
  const recentCtx = (recent && recent.length) ? '\nDo NOT repeat these recent questions: ' + recent.slice(-5).join(' | ') : '';
  const prompt = `You are an expert question setter for Indian competitive exams.
Generate ONE ${difficulty} difficulty multiple choice question for the ${EXAM_CTX[exam]}
Subject area: ${SUBJ_CTX[subject]}${recentCtx}

Requirements:
- Realistic exam-style question matching actual ${EXAM_NAMES[exam]} pattern
- Exactly 4 options (A, B, C, D)
- Only one correct answer
- Include a clear explanation of why the answer is correct

Respond ONLY with this exact JSON (no markdown, no extra text):
{
  "question": "The question text",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answer": "Option A text",
  "explanation": "Clear explanation of why the answer is correct, with relevant context."
}`;
  return _callProxy(prompt, 700);
}

/* ============================================================
   4) PUBLIC PROVIDERS  (what the Lab/Exam call)
   ============================================================ */
async function provideLabQuestion(params){
  // Maths is always generated locally (infinite + always correct), even in API mode.
  if (params.subject === 'maths'){
    return generateMathQuestion(params);
  }
  if (QUESTION_SOURCE === 'api'){
    try { return await apiLabQuestion(params); }
    catch(err){ console.warn('API lab failed, using bank:', err); return bankLabQuestion(params); }
  }
  return bankLabQuestion(params);
}

async function provideExamQuestion(params){
  if (QUESTION_SOURCE === 'api'){
    try { return await apiExamQuestion(params); }
    catch(err){ console.warn('API exam failed, using bank:', err); return bankExamQuestion(params); }
  }
  return bankExamQuestion(params);
}