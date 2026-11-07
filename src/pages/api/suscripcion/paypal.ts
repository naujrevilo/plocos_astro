/**
 * PayPal checkout endpoint — `src/pages/api/suscripcion/paypal.ts` (T10d.3).
 *
 * `GET ?plan=&currency=` creates the PayPal subscription for the signed-in
 * user and answers 302 with the approval link. The session user id is the
 * only source of `custom_id`; the client chooses the plan and the currency,
 * never the role.
 *
 * The subscription id travels back to the reconciliation endpoint in an
 * httpOnly cookie (`paypal_checkout`, short lived, SameSite=Lax): PayPal's
 * documentation does not say which parameters it appends to the return URL.
 *
 * Guards:
 *   - 401 without session (defence in depth; the middleware already gates
 *     every API route except the webhooks).
 *   - 400 unknown plan or unknown currency.
 *   - 500 when the plan is not configured for that currency.
 *   - 502 when PayPal answers without an approval link: the buyer cannot
 *     pay, so no cookie is written.
 */
import type { APIRoute } from 'astro';
import { createSubscription, type CreatedSubscription } from '../../../lib/paypal';
import {
  paypalPlanId,
  type PayPalCurrency,
  type PayPalPlan,
} from '../../../lib/paypal-plans';

/** Cookie that carries the subscription id back to the reconciliation route. */
const CHECKOUT_COOKIE = 'paypal_checkout';

/** The cookie lives 10 minutes: enough for the PayPal round trip. */
const CHECKOUT_COOKIE_MAX_AGE = 600;

/** Where PayPal returns the buyer after the approval. */
const RETURN_PATH = '/api/suscripcion/paypal/verify';

/** Where PayPal returns the buyer when the buyer cancels. */
const CANCEL_PATH = '/suscripcion?status=cancelled';

/** The brand PayPal shows in the approval page. */
const BRAND_NAME = 'Plocos';

const PLANS: readonly string[] = ['lector', 'colaborador'];
const CURRENCIES: readonly string[] = ['USD', 'EUR'];

/** The only locales the site speaks. */
type Locale = 'es' | 'en';

function isPlan(value: string | null): value is PayPalPlan {
  return value !== null && PLANS.includes(value);
}

function isCurrency(value: string | null): value is PayPalCurrency {
  return value !== null && CURRENCIES.includes(value);
}

/** Only `es` and `en` are supported; any other value is treated as `es`. */
function normalizeLocale(value: string | null): Locale {
  return value === 'en' ? 'en' : 'es';
}

export const GET: APIRoute = async (context) => {
  const { url, locals, cookies } = context;

  const auth = locals.auth?.();
  if (!auth?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const plan = url.searchParams.get('plan');
  if (!isPlan(plan)) {
    return new Response('Unknown plan', { status: 400 });
  }

  const currency = url.searchParams.get('currency');
  if (!isCurrency(currency)) {
    return new Response('Unknown currency', { status: 400 });
  }

  const planId = paypalPlanId(plan, currency);
  if (!planId) {
    return new Response(`PayPal plan not configured for ${plan}/${currency}`, { status: 500 });
  }

  const locale = normalizeLocale(url.searchParams.get('locale'));

  let created: CreatedSubscription;
  try {
    created = await createSubscription({
      planId,
      // The server session is the only source of the buyer id: never the
      // query, never the body.
      customId: auth.userId,
      returnUrl: `${url.origin}${RETURN_PATH}`,
      cancelUrl: `${url.origin}${CANCEL_PATH}`,
      brandName: BRAND_NAME,
      locale,
    });
  } catch (err) {
    console.error('[suscripcion] PayPal subscription creation failed:', err);
    return new Response('PayPal checkout failed', { status: 502 });
  }

  if (!created.approveUrl) {
    // Without an approval link the buyer cannot pay: no cookie is written.
    return new Response('PayPal did not return an approval link', { status: 502 });
  }

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: CHECKOUT_COOKIE_MAX_AGE,
    secure: url.protocol === 'https:',
  };
  cookies.set(CHECKOUT_COOKIE, `${created.id}|${locale}`, cookieOptions);

  const response = new Response(null, {
    status: 302,
    headers: { location: created.approveUrl },
  });
  // Astro hands the cookie headers over as a generator of serialised
  // `Set-Cookie` values (one per cookie), so they travel as `set-cookie`.
  // `Generator.prototype.forEach` exists in Node 22 and calls back with the
  // index as second argument: it would add a header named "0".
  for (const value of cookies.headers()) {
    response.headers.append('set-cookie', value);
  }
  return response;
};
