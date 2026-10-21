/**
 * T10a — Payment routing (country -> provider + currency)
 *
 * Pure-logic tests for `src/lib/payment-routing.ts`. Colombia pays with
 * MercadoPago in COP; the euro area pays with PayPal in EUR; everyone else
 * pays with PayPal in USD. The country comes from Netlify geo first, then
 * from the Accept-Language region, and defaults to USD. A manual choice in
 * the selector wins, and choosing PayPal from Colombia raises a warning
 * (PayPal does not allow payments between Colombian accounts).
 */
import { describe, expect, it } from 'vitest';
import {
  EUROZONE_COUNTRIES,
  resolvePaymentRoute,
  type ManualChoice,
} from '../src/lib/payment-routing';

describe('T10a — resolvePaymentRoute by geo country', () => {
  it('routes Colombia to MercadoPago in COP', () => {
    expect(resolvePaymentRoute({ geoCountry: 'CO' })).toEqual({
      provider: 'mercadopago',
      currency: 'COP',
      country: 'CO',
      source: 'geo',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it('routes a euro-area country (DE) to PayPal in EUR', () => {
    expect(resolvePaymentRoute({ geoCountry: 'DE' })).toEqual({
      provider: 'paypal',
      currency: 'EUR',
      country: 'DE',
      source: 'geo',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it.each(['MX', 'US'])('routes %s to PayPal in USD', (country) => {
    expect(resolvePaymentRoute({ geoCountry: country })).toEqual({
      provider: 'paypal',
      currency: 'USD',
      country,
      source: 'geo',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it('prefers the geo country over Accept-Language', () => {
    const route = resolvePaymentRoute({ geoCountry: 'US', acceptLanguage: 'es-CO,es;q=0.9' });
    expect(route.provider).toBe('paypal');
    expect(route.currency).toBe('USD');
    expect(route.source).toBe('geo');
  });
});

describe('T10a — resolvePaymentRoute fallbacks', () => {
  it('falls back to the Accept-Language region when there is no geo', () => {
    expect(resolvePaymentRoute({ acceptLanguage: 'es-CO,es;q=0.9,en;q=0.8' })).toEqual({
      provider: 'mercadopago',
      currency: 'COP',
      country: 'CO',
      source: 'language',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it('falls back to a euro-area Accept-Language region when there is no geo', () => {
    expect(resolvePaymentRoute({ acceptLanguage: 'de-DE,de;q=0.9' })).toEqual({
      provider: 'paypal',
      currency: 'EUR',
      country: 'DE',
      source: 'language',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it('treats a language tag without region as no data', () => {
    const route = resolvePaymentRoute({ acceptLanguage: 'de' });
    expect(route).toEqual({
      provider: 'paypal',
      currency: 'USD',
      country: null,
      source: 'default',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });

  it('defaults to PayPal in USD when there is no data at all', () => {
    expect(resolvePaymentRoute({})).toEqual({
      provider: 'paypal',
      currency: 'USD',
      country: null,
      source: 'default',
      warnColombia: false,
      warnOutsideColombia: false,
    });
  });
});

describe('T10a — manual choice', () => {
  it('warns when someone in Colombia picks PayPal manually, without blocking', () => {
    expect(resolvePaymentRoute({ geoCountry: 'CO', manualChoice: 'paypal-usd' })).toEqual({
      provider: 'paypal',
      currency: 'USD',
      country: 'CO',
      source: 'manual',
      warnColombia: true,
      warnOutsideColombia: false,
    });
  });

  it.each(['toString', 'bitcoin'])(
    'ignores an unknown manual choice (%s) and keeps the detected route',
    (choice) => {
      // manualChoice comes from a form or the URL, so it is untrusted input.
      const manualChoice = choice as unknown as ManualChoice;
      expect(resolvePaymentRoute({ geoCountry: 'CO', manualChoice })).toEqual({
        provider: 'mercadopago',
        currency: 'COP',
        country: 'CO',
        source: 'geo',
        warnColombia: false,
        warnOutsideColombia: false,
      });
    },
  );

  it('warns when someone outside Colombia picks MercadoPago manually, without blocking', () => {
    expect(resolvePaymentRoute({ geoCountry: 'US', manualChoice: 'mercadopago' })).toEqual({
      provider: 'mercadopago',
      currency: 'COP',
      country: 'US',
      source: 'manual',
      warnColombia: false,
      warnOutsideColombia: true,
    });
  });
});

describe('T10a — EUROZONE_COUNTRIES', () => {
  it('lists the 21 euro-area members as of 2026-01-01', () => {
    expect([...EUROZONE_COUNTRIES].sort()).toEqual([
      'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
      'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
    ]);
  });
});
