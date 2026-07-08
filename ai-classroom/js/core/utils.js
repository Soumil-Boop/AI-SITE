/* ============================================================
   utils.js — Shared Utility Functions
   Available globally across all pages.
   ============================================================ */

/**
 * Pick a random item from an array
 * @param {Array} arr
 * @returns {*}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Debounce a function call
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Animate a number counting up to a target value
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} duration - ms
 */
function animateCount(el, target, duration = 600) {
  const start = parseInt(el.textContent) || 0;
  const range = target - start;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(start + range * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
