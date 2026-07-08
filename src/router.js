// Routeur minimal par hash (#/ et #/p/<id>).
// Le hash évite toute config serveur : refresh et deep-links marchent sur
// n'importe quel hébergement statique gratuit.

export function initRouter({ onLanding, onProject }) {
  let current = null; // { dispose } de la vue projet active
  let token = 0;      // garde-fou contre les navigations rapides (import async)

  function leave() {
    if (current) { current.dispose(); current = null; }
  }

  async function resolve() {
    const hash = window.location.hash || '#/';
    const m = hash.match(/^#\/p\/([\w-]+)$/);
    if (m) {
      leave();
      document.body.classList.add('view-project');
      const mine = ++token;
      const handle = await onProject(m[1]);
      // l'utilisateur a re-navigué pendant le chargement → on jette
      if (mine !== token) { handle?.dispose?.(); return; }
      if (!handle) {
        document.body.classList.remove('view-project');
        window.location.hash = '#/';
        return;
      }
      current = handle;
      window.scrollTo(0, 0);
    } else {
      token++;
      leave();
      document.body.classList.remove('view-project');
      onLanding?.();
    }
  }

  window.addEventListener('hashchange', resolve);
  resolve();
}
