/**
 * T10d.5 — Subscription page with the T10a payment routing
 *
 * Two units:
 *   - `src/lib/payment-routing.ts`: `gatewayForRoute`, the checkout
 *     endpoint and currency a resolved route points to.
 *   - The subscription pages (`src/pages/suscripcion.astro` and
 *     `src/pages/en/subscription.astro`), which must wire the routing: the
 *     resolved route, the gateway of the route, the two warnings and both
 *     checkout endpoints.
 *
 * The page contract is checked on the source: the routing lives in the
 * frontmatter and in the inline script, and both are read by Astro at build
 * time.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gatewayForRoute, resolvePaymentRoute } from '../src/lib/payment-routing';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const PAGE_FILES = [
  'src/pages/suscripcion.astro',
  'src/pages/en/subscription.astro',
];

describe('T10d.5 — gatewayForRoute', () => {
  it('points a PayPal USD route to the PayPal checkout', () => {
    const route = resolvePaymentRoute({ geoCountry: 'US' });

    expect(gatewayForRoute(route)).toEqual({
      provider: 'paypal',
      currency: 'USD',
      endpoint: '/api/suscripcion/paypal',
      paypalCurrency: 'USD',
    });
  });

  it('points a PayPal EUR route to the PayPal checkout in euros', () => {
    const route = resolvePaymentRoute({ geoCountry: 'DE' });

    expect(gatewayForRoute(route)).toEqual({
      provider: 'paypal',
      currency: 'EUR',
      endpoint: '/api/suscripcion/paypal',
      paypalCurrency: 'EUR',
    });
  });

  it('points a MercadoPago route to the MercadoPago checkout', () => {
    const route = resolvePaymentRoute({ geoCountry: 'CO' });

    expect(gatewayForRoute(route)).toEqual({
      provider: 'mercadopago',
      currency: 'COP',
      endpoint: '/api/suscripcion/mercadopago',
      paypalCurrency: null,
    });
  });
});

describe('T10d.5 — subscription pages wire the payment routing', () => {
  it.each(PAGE_FILES)('%s uses the routing of T10a', (file) => {
    const source = readFileSync(path.join(REPO_ROOT, file), 'utf8');

    expect(source).toContain('resolvePaymentRoute');
    expect(source).toContain('gatewayForRoute');
    expect(source).toContain('warnColombia');
    expect(source).toContain('warnOutsideColombia');
    expect(source).toContain('/api/suscripcion/paypal');
    expect(source).toContain('/api/suscripcion/mercadopago');
  });
});
