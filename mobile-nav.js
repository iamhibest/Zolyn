// ============================================================
// Zolyn — Mobile nav menu
// Wires up the hamburger button, overlay, and close behavior
// shared across every dashboard page.
// ============================================================

export function wireMobileNav() {
  const openBtn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('mobileNavOverlay');
  const closeBtn = document.getElementById('mobileNavClose');

  if (!openBtn || !overlay || !closeBtn) return;

  openBtn.addEventListener('click', () => {
    overlay.classList.add('show');
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('show');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('show');
    }
  });
}
