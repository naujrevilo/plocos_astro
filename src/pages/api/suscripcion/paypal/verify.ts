/**
 * PayPal reconciliation endpoint — `src/pages/api/suscripcion/paypal/verify.ts`
 * (T10d.4).
 *
 * The buyer returns from PayPal to `GET /api/suscripcion/paypal/verify`. The
 * subscription id comes from the `paypal_checkout` cookie (written by the
 * checkout before the redirect), with the `subscription_id` query parameter
 * as fallback. The subscription is read from PayPal and the access is
 * granted only when `custom_id` is the signed-in user and the subscription
 * is `ACTIVE`.
 *
 * Outcomes (Log L21):
 *   - 401 without session.
 *   - 400 without a subscription id.
 *   - 302 to the subscription page of the locale carried by the cookie:
 *     `status=activated` (ACTIVE), `status=pending` (APPROVAL_PENDING,
 *     APPROVED — not paid yet) and `status=error` (CANCELLED, SUSPENDED,
 *     EXPIRED, a subscription of another user, a subscription PayPal does
 *     not know).
 *   - 500 when the `plan_id` is not one of ours (a configuration error) or
 *     when the activation fails.
 *
 * The redirect is always a path of this site: it is built by hand (not with
 * `createLocaleHref`, which adds a trailing slash) and only with a locale the
 * site knows (`es` or `en`), so a locale like `//evil.com` is treated as
 * `es` and never becomes a host.
 */
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';
import {
  getSubscription,
  SubscriptionNotFoundError,
  type PayPalSubscription,
} from '../../../../lib/paypal';
import { activateSubscription } from '../../../../lib/db/subscriptions';
import { paypalPlanFromId } from '../../../../lib/paypal-plans';

/** Cookie that carries the subscription id back to this route. */
const CHECKOUT_COOKIE = 'paypal_checkout';

/** Only `es` and `en` are supported; any other value is treated as `es`. */
type Locale = 'es' | 'en';

/** What the buyer is told on the subscription page. */
type Outcome = 'activated' | 'pending' | 'error';

function normalizeLocale(value: string | null | undefined): Locale {
  return value === 'en' ? 'en' : 'es';
}

/**
 * The subscription page of the site for a locale: a path of this origin,
 * without a trailing slash (like the MercadoPago checkout).
 */
function subscriptionPath(locale: Locale, outcome: Outcome): string {
  const base = locale === 'en' ? '/en/subscription' : '/suscripcion';
  return `${base}?status=${outcome}`;
}

/** The subscription id and the locale carried by the checkout cookie. */
type Checkout = { subscriptionId: string; locale: Locale };

/**
 * Read the checkout cookie (`${id}|${locale}`): the id is everything before
 * the first `|`, the locale is normalized to one the site knows.
 */
function readCheckout(raw: string | undefined): Checkout | null {
  if (!raw) return null;
  const separator = raw.indexOf('|');
  const subscriptionId = separator === -1 ? raw : raw.slice(0, separator);
  if (!subscriptionId) return null;
  const locale = separator === -1 ? '' : raw.slice(separator + 1);
  return { subscriptionId, locale: normalizeLocale(locale) };
}

/** The cookie jar of the request. */
type CookieJar = Parameters<APIRoute>[0]['cookies'];

/**
 * Answer with a redirect to a path of this site, carrying the cookie
 * headers: the checkout cookie leaves with this response.
 */
function redirectTo(path: string, cookies: CookieJar): Response {
  const response = new Response(null, { status: 302, headers: { location: path } });
  // Astro hands the cookie headers over as a generator of serialised
  // `Set-Cookie` values (one per cookie), so they travel as `set-cookie`.
  // `Generator.prototype.forEach` exists in Node 22 and calls back with the
  // index as second argument: it would add a header named "0".
  for (const value of cookies.headers()) {
    response.headers.append('set-cookie', value);
  }
  return response;
}

/**
 * Consume the checkout cookie: it is a one-time token, so it never
 * survives a reconciliation that reached a decision.
 */
function clearCheckoutCookie(cookies: CookieJar): void {
  cookies.set(CHECKOUT_COOKIE, '', { path: '/', maxAge: 0 });
}

export const GET: APIRoute = async (context) => {
  const { url, locals, cookies } = context;

  const auth = locals.auth?.();
  if (!auth?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const checkout = readCheckout(cookies.get(CHECKOUT_COOKIE)?.value);
  const subscriptionId = checkout?.subscriptionId ?? url.searchParams.get('subscription_id');
  if (!subscriptionId) {
    return new Response('Missing subscription id', { status: 400 });
  }

  // Without a cookie there is no locale to honour: the site defaults to `es`.
  const locale = checkout?.locale ?? 'es';

  let subscription: PayPalSubscription;
  try {
    subscription = await getSubscription(subscriptionId);
  } catch (err) {
    if (err instanceof SubscriptionNotFoundError) {
      // PayPal does not know this subscription: nothing to grant.
      console.warn(`[suscripcion] ${err.message} — nothing granted`);
      clearCheckoutCookie(cookies);
      return redirectTo(subscriptionPath(locale, 'error'), cookies);
    }
    // Transient (network, PayPal 5xx): the buyer can retry, so the cookie
    // stays and the reconciliation is not consumed.
    console.error('[suscripcion] PayPal subscription read failed:', err);
    return new Response('PayPal verification failed', { status: 502 });
  }

  // The checkout cookie is a one-time token: it never survives a
  // reconciliation that read a subscription (Log L21).
  clearCheckoutCookie(cookies);

  // The subscription belongs to another user: nothing is granted, not even
  // a write in Clerk.
  if (!subscription.custom_id || subscription.custom_id !== auth.userId) {
    console.warn(
      `[suscripcion] subscription ${subscription.id} belongs to another user — nothing granted`,
    );
    return redirectTo(subscriptionPath(locale, 'error'), cookies);
  }

  if (subscription.status !== 'ACTIVE') {
    // APPROVAL_PENDING and APPROVED are not paid yet; CANCELLED, SUSPENDED
    // and EXPIRED are not paid (anymore). Neither grants anything.
    const outcome: Outcome =
      subscription.status === 'APPROVAL_PENDING' || subscription.status === 'APPROVED'
        ? 'pending'
        : 'error';
    console.info(
      `[suscripcion] subscription ${subscription.id} is ${subscription.status} — nothing granted`,
    );
    return redirectTo(subscriptionPath(locale, outcome), cookies);
  }

  const plan = paypalPlanFromId(subscription.plan_id);
  if (!plan) {
    // Configuration error: the plan id is not one of ours.
    console.error(
      `[suscripcion] PayPal plan_id ${subscription.plan_id} is not one of PAYPAL_PLAN_*`,
    );
    return new Response('Unknown PayPal plan', { status: 500 });
  }

  const nextBillingTime = subscription.billing_info?.next_billing_time;
  // null, not undefined: clears a previous (possibly expired) period end.
  const currentPeriodEnd = nextBillingTime ? new Date(nextBillingTime) : null;

  try {
    const access = await activateSubscription({
      clerkUserId: auth.userId,
      provider: 'paypal',
      providerSubscriptionId: subscription.id,
      plan,
      currentPeriodEnd,
    });

    // Mirror the access in Clerk. `null` (never `undefined`) removes a key:
    // Clerk deep-merges publicMetadata and JSON drops undefined values.
    const client = await clerkClient(context);
    await client.users.updateUserMetadata(auth.userId, {
      publicMetadata: {
        role: access.role,
        accessUntil: access.accessUntil ? access.accessUntil.toISOString() : null,
      },
    });
  } catch (err) {
    console.error('[suscripcion] PayPal activation failed:', err);
    return new Response('Subscription activation failed', { status: 500 });
  }

  return redirectTo(subscriptionPath(locale, 'activated'), cookies);
};
