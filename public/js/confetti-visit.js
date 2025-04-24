// /public/js/confetti-visit.js

import confetti from './lib/canvas-confetti.js';

/**
 * Fires confetti animation for the first N visits stored in localStorage.
 * @param {number} maxVisits Number of visits to celebrate
 */
export function maybeConfetti(maxVisits = 5) {
  try {
    const key = 'dashboardVisits';
    const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, count);
    if (count <= maxVisits) {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { x: 0.5, y: 0.3 }
      });
    }
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}
