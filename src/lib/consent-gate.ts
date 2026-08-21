/**
 * Helper to inject a third-party <script> only after the visitor has granted
 * consent for a given category on Plocos.
 *
 * Usage:
 *   gateScriptOnConsent('analytics', 'https://www.googletagmanager.com/gtag/js?id=...');
 *
 * Behaviour:
 *  - Polls `window.astroConsent.get()` until it returns a stored consent
 *    payload (or until a 5 second timeout elapses).
 *  - Injects the supplied `src` as an async <script> when the requested
 *    category is true.
 *  - Listens for cross-tab `storage` events so consent changes from other
 *    tabs are honoured.
 *  - Falls back gracefully when `window.astroConsent` is unavailable — the
 *    script is simply never injected.
 */

export type ConsentCategory = 'analytics' | 'marketing';

export function gateScriptOnConsent(
  category: ConsentCategory,
  src: string,
  attrs: Record<string, string> = {}
): void {
  if (typeof window === 'undefined') return;

  const tryInject = () => {
    const consent = (window as unknown as {
      astroConsent?: { get: () => { categories?: Record<string, boolean> } | null };
    }).astroConsent?.get();
    if (consent && consent.categories && consent.categories[category]) {
      if (document.querySelector(`script[data-consent-gate="${src}"]`)) return;
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.dataset.consentGate = src;
      for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
      document.head.appendChild(s);
    }
  };

  let tries = 0;
  const poll = window.setInterval(() => {
    tries += 1;
    if ((window as unknown as { astroConsent?: unknown }).astroConsent) {
      window.clearInterval(poll);
      tryInject();
      window.addEventListener('storage', (e) => {
        if (e.key === 'astro-consent') tryInject();
      });
    } else if (tries > 50) {
      window.clearInterval(poll);
    }
  }, 100);
}

export default gateScriptOnConsent;