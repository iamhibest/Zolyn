// ============================================================
// Zolyn — Navigation helper
// Provides consistent "back" behavior across every page: uses
// real browser history when it's safe to (came from within the
// app), otherwise falls back to a sensible default destination
// so users are never stranded on a dead end.
// ============================================================

/**
 * Go back intelligently. If there's app history to go back to,
 * use it (preserves scroll position, feels native). Otherwise,
 * navigate to the provided fallback page.
 * @param {string} fallbackHref - where to go if there's no history to use
 */
export function goBack(fallbackHref) {
  // If the browser has more than one entry in history AND the previous
  // page was on our own site, real back navigation is safe.
  if (window.history.length > 1 && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin === window.location.origin) {
        window.history.back();
        return;
      }
    } catch (e) {
      // fall through to fallback
    }
  }
  window.location.href = fallbackHref;
}

/**
 * Wire up a back button element by id to call goBack with a fallback.
 * @param {string} buttonId
 * @param {string} fallbackHref
 */
export function wireBackButton(buttonId, fallbackHref) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    goBack(fallbackHref);
  });
}
