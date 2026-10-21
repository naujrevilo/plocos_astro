/**
 * @module payment-routing
 * @description Country -> payment provider and currency (T10a).
 *
 * - Colombia pays with MercadoPago in COP.
 * - The euro area pays with PayPal in EUR.
 * - Everyone else pays with PayPal in USD.
 *
 * The country comes from Netlify geo (`context.geo.country.code`) first,
 * then from the region of the highest-weighted Accept-Language tag that has
 * one; without either, the visitor gets PayPal in USD. A manual choice in the
 * selector always wins, but never blocks: it only raises a warning when it
 * goes against the detected country (PayPal does not allow payments between
 * Colombian accounts; the Colombian MercadoPago account charges in COP).
 *
 * Framework-free: the Astro layer reads geo and headers and passes them in.
 */

export type RoutedProvider = 'mercadopago' | 'paypal';
export type RoutedCurrency = 'COP' | 'USD' | 'EUR';
export type ManualChoice = 'mercadopago' | 'paypal-usd' | 'paypal-eur';

export interface PaymentRoute {
  provider: RoutedProvider;
  currency: RoutedCurrency;
  /** ISO 3166-1 alpha-2 country detected for the visitor, or null. */
  country: string | null;
  source: 'geo' | 'language' | 'default' | 'manual';
  /** True when a visitor from Colombia chooses PayPal manually. */
  warnColombia: boolean;
  /** True when a visitor outside Colombia chooses MercadoPago manually. */
  warnOutsideColombia: boolean;
}

export interface PaymentRouteInput {
  geoCountry?: string | null;
  acceptLanguage?: string | null;
  manualChoice?: ManualChoice | null;
}

/** Euro-area members as of 2026-01-01 (Bulgaria joined that day). */
export const EUROZONE_COUNTRIES: readonly string[] = [
  'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
];

const MANUAL_ROUTES: Record<ManualChoice, Pick<PaymentRoute, 'provider' | 'currency'>> = {
  mercadopago: { provider: 'mercadopago', currency: 'COP' },
  'paypal-usd': { provider: 'paypal', currency: 'USD' },
  'paypal-eur': { provider: 'paypal', currency: 'EUR' },
};

const COUNTRY_CODE = /^[A-Z]{2}$/;

function normalizeCountry(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return COUNTRY_CODE.test(code) ? code : null;
}

/**
 * Region of the highest-weighted Accept-Language tag that carries one
 * (`es-CO` -> CO, `zh-Hant-TW` -> TW). Numeric regions (`es-419`) and tags
 * without a region (`de`) are skipped.
 */
function regionFromAcceptLanguage(header: string | null | undefined): string | null {
  if (typeof header !== 'string' || header.length === 0) return null;
  const tags = header
    .split(',')
    .map((entry, index) => {
      const [tag = '', ...params] = entry.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((t) => t.tag.length > 0 && t.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of tags) {
    const region = tag.split('-').slice(1).find((sub) => /^[A-Za-z]{2}$/.test(sub));
    if (region) return region.toUpperCase();
  }
  return null;
}

function routeForCountry(country: string | null): Pick<PaymentRoute, 'provider' | 'currency'> {
  if (country === 'CO') return { provider: 'mercadopago', currency: 'COP' };
  if (country !== null && EUROZONE_COUNTRIES.includes(country)) {
    return { provider: 'paypal', currency: 'EUR' };
  }
  return { provider: 'paypal', currency: 'USD' };
}

export function resolvePaymentRoute(input: PaymentRouteInput): PaymentRoute {
  const geo = normalizeCountry(input.geoCountry);
  const language = geo === null ? regionFromAcceptLanguage(input.acceptLanguage) : null;
  const country = geo ?? language;
  const detectedSource: PaymentRoute['source'] =
    geo !== null ? 'geo' : language !== null ? 'language' : 'default';

  // manualChoice arrives from a form or the URL: only own keys count, so
  // inherited names such as 'toString' fall back to the detected route.
  const choice = input.manualChoice;
  const manual =
    typeof choice === 'string' && Object.hasOwn(MANUAL_ROUTES, choice)
      ? MANUAL_ROUTES[choice]
      : undefined;
  const { provider, currency } = manual ?? routeForCountry(country);

  return {
    provider,
    currency,
    country,
    source: manual ? 'manual' : detectedSource,
    warnColombia: manual !== undefined && country === 'CO' && provider === 'paypal',
    warnOutsideColombia:
      manual !== undefined && country !== null && country !== 'CO' && provider === 'mercadopago',
  };
}
