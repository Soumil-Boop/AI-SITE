/* ============================================================
   hero.js — Home Page: Neural Canvas + Quote Scroller
   ============================================================ */

/* ── Neural Network Canvas Animation ── */
const canvas = document.getElementById('neural-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let nodes = [];

  function resizeCanvas() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    initNodes();
  }

  function initNodes() {
    nodes = [];
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - .5) * .4,
        vy: (Math.random() - .5) * .4,
        r:  Math.random() * 2.5 + 1.5,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() * .001;

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

      const glow = .5 + .5 * Math.sin(t * 1.5 + n.pulse);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (1 + .3 * glow), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96,165,250,${.5 + .5 * glow})`;
      ctx.fill();
    });

    nodes.forEach((a, i) => {
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(147,197,253,${(1 - dist / 150) * .4})`;
          ctx.lineWidth = .8;
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(drawCanvas);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  drawCanvas();
}

/* ── Quote Scroller ── */
const AI_QUOTES = [
  { text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.", author: "Alan Turing", role: "Father of computer science" },
  { text: "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.", author: "Edsger Dijkstra", role: "Computer scientist" },
  { text: "Artificial intelligence is the new electricity.", author: "Andrew Ng", role: "AI researcher, co-founder of Coursera" },
  { text: "Machine intelligence is the last invention that humanity will ever need to make.", author: "Nick Bostrom", role: "Philosopher, AI researcher" },
  { text: "By far the greatest danger of artificial intelligence is that people conclude too early that they understand it.", author: "Eliezer Yudkowsky", role: "AI researcher" },
  { text: "The development of full artificial intelligence could spell the end of the human race, or it could be the most beneficial event in our history.", author: "Stephen Hawking", role: "Physicist" },
  { text: "Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it.", author: "John McCarthy", role: "Coined the term Artificial Intelligence" },
  { text: "The key to artificial intelligence has always been the representation.", author: "Jeff Hawkins", role: "Neuroscientist, computer engineer" },
  { text: "Artificial intelligence would be the ultimate version of Google.", author: "Larry Page", role: "Co-founder of Google" },
];

function initQuoteScroller() {
  const scroller = document.getElementById('quoteScroller');
  if (!scroller) return;
  scroller.innerHTML = AI_QUOTES.map(q => `
    <div class="quote-card">
      <p class="quote-text">${q.text}</p>
      <p class="quote-author">${q.author} <span>, ${q.role}</span></p>
    </div>`).join('');
}

function scrollQuotes(direction) {
  const scroller = document.getElementById('quoteScroller');
  if (!scroller) return;
  scroller.scrollBy({ left: direction * 340, behavior: 'smooth' });
}

initQuoteScroller();
