/* ============================================================
   finder.js — AI Tool Finder Search Logic
   ============================================================ */

/**
 * Score all tools against the user's search query.
 * Priority acts as a tiebreaker for similarly-relevant tools.
 * @param {string} query
 * @returns {Array} sorted, filtered tool list
 */
function scoreTools(query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);

  return finderTools.map(tool => {
    let score = 0;
    tool.tags.forEach(tag => {
      if (q.includes(tag)) score += 5;
      words.forEach(w => { if (tag.includes(w) || w.includes(tag)) score += 1; });
    });
    if (q.includes('free') && tool.free) score += 4;
    const boost = (tool.priority || 0) * 0.3;
    return { ...tool, score: score + boost, rawScore: score };
  })
  .filter(t => t.rawScore > 0)
  .sort((a, b) => b.score - a.score);
}

/**
 * Render the list of matching tools into #finderResults
 * @param {Array} results
 * @param {string} query
 */
function renderFinderResults(results, query) {
  const container = document.getElementById('finderResults');
  if (!container) return;

  if (!query.trim()) {
    container.innerHTML = `
      <div class="finder-empty">
        <span class="fe-icon">🔎</span>
        <p>Start typing above to see AI tools matched to your needs.</p>
      </div>`;
    return;
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="finder-empty">
        <span class="fe-icon">🤔</span>
        <p><strong>No exact matches found.</strong> Try describing your goal differently, like "writing help," "coding," or "free image generator."</p>
      </div>`;
    return;
  }

  const top = results.slice(0, 12);
  container.innerHTML = `
    <p class="finder-count-note">Showing ${top.length} of ${results.length} matching tools, our top picks first.</p>
    ${top.map((t, i) => `
      <div class="finder-result-card ${i === 0 ? 'top-match' : ''}">
        <div class="fr-icon">${t.icon}</div>
        <div class="fr-info">
          ${i === 0 ? '<div class="fr-badge">⭐ Best Match</div>' : ''}
          <div class="fr-name">${t.name}</div>
          <div class="fr-desc">${t.desc}</div>
          <div class="fr-tags">
            ${t.tags.slice(0, 4).map(tag => `<span class="fr-tag">${tag}</span>`).join('')}
            ${t.free ? '<span class="fr-tag" style="background:var(--green-light);color:var(--green)">Free</span>' : ''}
          </div>
        </div>
        <a href="${t.link}" target="_blank" class="fr-link">Visit →</a>
      </div>`).join('')}`;
}

/** Run a pre-filled quick search from a chip button */
function quickFinderSearch(text) {
  document.getElementById('finderInput').value = text;
  runFinderSearch();
}

/** Run the search from whatever is in the input box */
function runFinderSearch() {
  const query = document.getElementById('finderInput').value;
  renderFinderResults(scoreTools(query), query);
}

// Debounced live search as the user types
const debouncedSearch = debounce(runFinderSearch, 350);
const finderInput = document.getElementById('finderInput');
if (finderInput) {
  finderInput.addEventListener('input', debouncedSearch);
  finderInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runFinderSearch(); } });
  renderFinderResults([], ''); // Show initial empty state
}
