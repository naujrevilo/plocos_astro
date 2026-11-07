/**
 * T10d.3 / T10d.4 — PayPal checkout and reconciliation endpoints
 *
 *   - `GET /api/suscripcion/paypal?plan=&currency=` creates the PayPal
 *     subscription for the signed-in user, stores the subscription id in an
 *     httpOnly cookie and answers 302 with the approval link.
 *   - `GET /api/suscripcion/paypal/verify` reads the subscription from
 *     PayPal and grants access only when the subscription belongs to the
 *     signed-in user and is `ACTIVE`.
 *
 * Offline: PayPal, Clerk and the database are mocked; only the endpoints
 * themselves run.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { updateUserMetadata, getUser, clerkClient } = vi.hoisted(() => {
  const updateUserMetadata = vi.fn<
    (userId: string, metadata: { publicMetadata: Record<string, unknown> }) => Promise<unknown>
  >(async () => ({}));
  const getUser = vi.fn<
    (userId: string) => Promise<{
      id: string;
      primaryEmailAddress: { emailAddress: string } | null;
    }>
  >(async () => ({
    id: 'user_123',
    primaryEmailAddress: { emailAddress: 'buyer@test.plocos' },
  }));
  const clerkClient = vi.fn<
    (context: unknown) => Promise<{
      users: { updateUserMetadata: typeof updateUserMetadata; getUser: typeof getUser };
    }>
  >(async () => ({ users: { updateUserMetadata, getUser } }));
  return { updateUserMetadata, getUser, clerkClient };
});

const { activateSubscriptionMock } = vi.hoisted(() => ({
  activateSubscriptionMock: vi.fn(async () => ({
    id: 1,
    role: 'lector',
    accessUntil: new Date('2026-12-01T00:00:00Z'),
  })),
}));

vi.mock('@clerk/astro/server', () => ({ clerkClient }));

vi.mock('../src/lib/db/subscriptions', () => ({ activateSubscription: activateSubscriptionMock }));

vi.mock('../src/lib/paypal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/paypal')>();
  return {
    ...actual,
    createSubscription: vi.fn(),
    getSubscription: vi.fn(),
  };
});

import {
  createSubscription,
  getSubscription,
  SubscriptionNotFoundError,
  type PayPalSubscription,
  type PayPalSubscriptionStatus,
} from '../src/lib/paypal';
import { activateSubscription } from '../src/lib/db/subscriptions';

const ORIGIN = 'http://localhost:4321';
const APPROVE_URL = 'https://www.paypal.com/webapps/billing/subscriptions?ba_token=BA-1';

type CookieOptions = Record<string, unknown>;

/** An Astro-like cookie jar: records the `set` calls and builds the headers. */
function createFakeCookies(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const setCookie = new Headers();

  const set = vi.fn((key: string, value: string, options: CookieOptions = {}) => {
    store.set(key, value);
    const parts = [`${key}=${value}`, `Path=${options.path ?? '/'}`];
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    if (options.secure) parts.push('Secure');
    setCookie.append('set-cookie', parts.join('; '));
  });

  // Astro exposes `delete` on the cookie jar too: the cookie leaves the jar.
  const remove = vi.fn((key: string, options: CookieOptions = {}) => {
    store.delete(key);
    setCookie.append('set-cookie', `${key}=; Path=${options.path ?? '/'}; Max-Age=0`);
  });

  const get = vi.fn((key: string) =>
    store.has(key) ? { value: store.get(key) as string } : undefined,
  );

  /**
   * Astro 7 hands the cookie headers over as a generator of `Set-Cookie`
   * values: one already serialised cookie per value, not a map of
   * name/value pairs (`node_modules/astro/dist/core/cookies/cookies.d.ts`).
   */
  const headers = vi.fn(function* (): Generator<string> {
    for (const value of setCookie.getSetCookie()) {
      yield value;
    }
  });

  return { set, get, headers, store, delete: remove };
}

type FakeCookies = ReturnType<typeof createFakeCookies>;

function createContext(args: {
  url: string;
  userId?: string | null;
  sessionClaims?: unknown;
  cookies?: ReturnType<typeof createFakeCookies>;
}) {
  const url = new URL(args.url);
  const cookies = args.cookies ?? createFakeCookies();
  return {
    request: new Request(url),
    url,
    cookies,
    locals: {
      auth: () => ({
        userId: args.userId ?? null,
        sessionClaims: args.sessionClaims ?? {},
      }),
    },
    redirect: (path: string) => new Response(null, { status: 302, headers: { location: path } }),
  };
}

async function callCheckout(context: unknown): Promise<Response> {
  const { GET } = await import('../src/pages/api/suscripcion/paypal');
  return (GET as (context: unknown) => Promise<Response>)(context);
}

async function callVerify(context: unknown): Promise<Response> {
  const { GET } = await import('../src/pages/api/suscripcion/paypal/verify');
  return (GET as (context: unknown) => Promise<Response>)(context);
}

function stubPlanIds(): void {
  vi.stubEnv('PAYPAL_PLAN_LECTOR_USD', 'P-LECTOR-USD');
  vi.stubEnv('PAYPAL_PLAN_LECTOR_EUR', 'P-LECTOR-EUR');
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_USD', 'P-COLABORADOR-USD');
  vi.stubEnv('PAYPAL_PLAN_COLABORADOR_EUR', 'P-COLABORADOR-EUR');
}

/**
 * Asserts the endpoint redirected inside this origin and landed on the
 * expected path. A protocol-relative location ("//evil.com/…") resolves to
 * another origin, so it fails this check.
 */
function expectSameOriginRedirect(res: Response, expectedPathname: string): URL {
  const location = res.headers.get('location');
  expect(location, 'the endpoint must answer with a redirect').toBeTruthy();
  const target = new URL(location as string, ORIGIN);
  expect(target.origin).toBe(ORIGIN);
  expect(target.pathname).toBe(expectedPathname);
  return target;
}

/**
 * Asserts the checkout cookie does not survive the reconciliation: it is
 * either deleted from the jar or overwritten with an empty value that
 * expires at once (`maxAge: 0`).
 */
function expectCheckoutCookieInvalidated(cookies: FakeCookies): void {
  const setCalls = cookies.set.mock.calls.filter((call) => call[0] === 'paypal_checkout');
  const deleted = !cookies.store.has('paypal_checkout');
  const expired = setCalls.some((call) => {
    const maxAge = call[2]?.maxAge;
    return typeof maxAge === 'number' && maxAge === 0;
  });

  expect(
    deleted || expired,
    'the paypal_checkout cookie must be deleted or expired (maxAge: 0)',
  ).toBe(true);
}

// ----------------------------------------------------------------------------
// T10d.3 — GET /api/suscripcion/paypal
// ----------------------------------------------------------------------------

describe('T10d.3 — GET /api/suscripcion/paypal', () => {
  beforeEach(() => {
    stubPlanIds();
    vi.mocked(createSubscription).mockResolvedValue({
      id: 'I-SUB1',
      status: 'APPROVAL_PENDING',
      approveUrl: APPROVE_URL,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('answers 401 without a session', async () => {
    const res = await callCheckout(
      createContext({ url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD` }),
    );

    expect(res.status).toBe(401);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('answers 400 for an unknown plan', async () => {
    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=premium&currency=USD`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(400);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('answers 400 for an unknown currency', async () => {
    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=COP`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(400);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('answers 500 when the plan is not configured for that currency', async () => {
    vi.stubEnv('PAYPAL_PLAN_LECTOR_USD', '');

    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(500);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('creates the subscription with the session user id, never with one from the query', async () => {
    await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD&custom_id=attacker&user_id=attacker`,
        userId: 'user_session',
      }),
    );

    expect(createSubscription).toHaveBeenCalledTimes(1);
    const input = vi.mocked(createSubscription).mock.calls[0]![0];
    expect(input.customId).toBe('user_session');
    expect(JSON.stringify(vi.mocked(createSubscription).mock.calls)).not.toContain('attacker');
  });

  it('sends the configured plan id and the return/cancel URLs of this origin', async () => {
    await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD`,
        userId: 'user_session',
      }),
    );

    const input = vi.mocked(createSubscription).mock.calls[0]![0];
    expect(input.planId).toBe('P-LECTOR-USD');
    expect(input.returnUrl).toBe(`${ORIGIN}/api/suscripcion/paypal/verify`);
    expect(input.cancelUrl).toBe(`${ORIGIN}/suscripcion?status=cancelled`);
  });

  it('stores the subscription id in the paypal_checkout cookie', async () => {
    const cookies = createFakeCookies();

    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD&locale=en`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(cookies.set).toHaveBeenCalledWith(
      'paypal_checkout',
      'I-SUB1|en',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
        secure: false,
      }),
    );
    // The cookie headers travel with the response.
    expect(res.headers.get('set-cookie')).toContain('paypal_checkout=I-SUB1|en');
  });

  it('carries the checkout cookie in a set-cookie header', async () => {
    const cookies = createFakeCookies();

    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD&locale=en`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    // Astro delivers the cookie headers as serialised values: they have to
    // travel as `set-cookie`, one header per cookie.
    const setCookie = res.headers.getSetCookie();
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.join('\n')).toContain('paypal_checkout=I-SUB1|en');
    expect(setCookie.join('\n')).toContain('HttpOnly');
  });

  it('marks the checkout cookie as secure on an https origin', async () => {
    const cookies = createFakeCookies();

    await callCheckout(
      createContext({
        url: 'https://plocos.netlify.app/api/suscripcion/paypal?plan=lector&currency=USD',
        userId: 'user_session',
        cookies,
      }),
    );

    expect(cookies.set).toHaveBeenCalledWith(
      'paypal_checkout',
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it.each(['es', 'en'])('stores the "%s" locale in the paypal_checkout cookie', async (locale) => {
    const cookies = createFakeCookies();

    await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD&locale=${locale}`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(cookies.set).toHaveBeenCalledWith(
      'paypal_checkout',
      `I-SUB1|${locale}`,
      expect.objectContaining({ path: '/' }),
    );
  });

  it.each(['xx', '//evil.com'])(
    'normalizes the unsupported locale "%s" to "es" in the paypal_checkout cookie',
    async (locale) => {
      const cookies = createFakeCookies();

      await callCheckout(
        createContext({
          url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD&locale=${encodeURIComponent(locale)}`,
          userId: 'user_session',
          cookies,
        }),
      );

      expect(cookies.set).toHaveBeenCalledWith(
        'paypal_checkout',
        'I-SUB1|es',
        expect.objectContaining({ path: '/' }),
      );
      // The cookie never carries a locale the site does not know.
      const cookieValue = cookies.set.mock.calls.find((call) => call[0] === 'paypal_checkout')?.[1];
      expect(String(cookieValue)).toMatch(/^[^|]+\|(?:es|en)$/);
      expect(String(cookieValue)).not.toContain(locale);
    },
  );

  it('answers 302 with the approval link', async () => {
    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(APPROVE_URL);
  });

  it('answers 502 and stores no checkout cookie when PayPal sends no approval link', async () => {
    vi.mocked(createSubscription).mockResolvedValue({
      id: 'I-SUB1',
      status: 'APPROVAL_PENDING',
      approveUrl: null,
    });
    const cookies = createFakeCookies();

    const res = await callCheckout(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal?plan=lector&currency=USD`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(502);
    expect(res.headers.get('location')).not.toBe(APPROVE_URL);
    expect(cookies.set.mock.calls.filter((call) => call[0] === 'paypal_checkout')).toHaveLength(0);
    expect(cookies.store.has('paypal_checkout')).toBe(false);
  });
});

// ----------------------------------------------------------------------------
// T10d.4 — GET /api/suscripcion/paypal/verify
// ----------------------------------------------------------------------------

const ACTIVE_SUBSCRIPTION: PayPalSubscription = {
  id: 'I-SUB1',
  status: 'ACTIVE',
  plan_id: 'P-LECTOR-USD',
  custom_id: 'user_session',
  billing_info: { next_billing_time: '2026-11-21T10:00:00Z', failed_payments_count: 0 },
};

/** Statuses that are not paid yet (or not paid at all) and their outcome. */
const NON_PAID_STATUS_CASES: Array<[PayPalSubscriptionStatus, 'pending' | 'error']> = [
  ['APPROVAL_PENDING', 'pending'],
  ['APPROVED', 'pending'],
  ['CANCELLED', 'error'],
  ['SUSPENDED', 'error'],
  ['EXPIRED', 'error'],
];

describe('T10d.4 — GET /api/suscripcion/paypal/verify', () => {
  beforeEach(() => {
    stubPlanIds();
    vi.mocked(getSubscription).mockResolvedValue(ACTIVE_SUBSCRIPTION);
    vi.mocked(activateSubscription).mockResolvedValue({
      id: 1,
      role: 'lector',
      accessUntil: new Date('2026-12-01T00:00:00Z'),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('answers 401 without a session', async () => {
    const res = await callVerify(
      createContext({ url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1` }),
    );

    expect(res.status).toBe(401);
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('reads the subscription id from the checkout cookie', async () => {
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|es' });

    await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(getSubscription).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getSubscription).mock.calls[0]![0]).toBe('I-SUB1');
  });

  it('falls back to the subscription_id query parameter when there is no cookie', async () => {
    await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-FROM-QUERY`,
        userId: 'user_session',
      }),
    );

    expect(getSubscription).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getSubscription).mock.calls[0]![0]).toBe('I-FROM-QUERY');
  });

  it('answers 400 when there is no subscription id at all', async () => {
    const res = await callVerify(
      createContext({ url: `${ORIGIN}/api/suscripcion/paypal/verify`, userId: 'user_session' }),
    );

    expect(res.status).toBe(400);
    expect(getSubscription).not.toHaveBeenCalled();
  });

  it('grants nothing when the subscription belongs to another user', async () => {
    vi.mocked(getSubscription).mockResolvedValue({
      ...ACTIVE_SUBSCRIPTION,
      custom_id: 'someone_else',
    });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/suscripcion?status=error');
    expect(activateSubscription).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it('grants nothing while the subscription is not ACTIVE', async () => {
    vi.mocked(getSubscription).mockResolvedValue({
      ...ACTIVE_SUBSCRIPTION,
      status: 'APPROVAL_PENDING',
    });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/suscripcion?status=pending');
    expect(activateSubscription).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it.each(NON_PAID_STATUS_CASES)(
    'grants nothing for a %s subscription and redirects with status=%s',
    async (status, expectedStatus) => {
      vi.mocked(getSubscription).mockResolvedValue({
        ...ACTIVE_SUBSCRIPTION,
        status,
      });

      const res = await callVerify(
        createContext({
          url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
          userId: 'user_session',
        }),
      );

      expect(res.status).toBe(302);
      const target = expectSameOriginRedirect(res, '/suscripcion');
      expect(target.searchParams.get('status')).toBe(expectedStatus);
      expect(activateSubscription).not.toHaveBeenCalled();
      expect(updateUserMetadata).not.toHaveBeenCalled();
    },
  );

  it('grants nothing when PayPal does not know the subscription', async () => {
    vi.mocked(getSubscription).mockRejectedValue(new SubscriptionNotFoundError('I-SUB1'));

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/suscripcion?status=error');
    expect(activateSubscription).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it('activates the subscription of the signed-in user and mirrors the access in Clerk', async () => {
    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/suscripcion?status=activated');

    expect(activateSubscription).toHaveBeenCalledTimes(1);
    const input = vi.mocked(activateSubscription).mock.calls[0]![0];
    expect(input).toEqual(
      expect.objectContaining({
        clerkUserId: 'user_session',
        provider: 'paypal',
        providerSubscriptionId: 'I-SUB1',
        plan: 'lector',
        currentPeriodEnd: new Date('2026-11-21T10:00:00Z'),
      }),
    );

    expect(clerkClient).toHaveBeenCalled();
    expect(updateUserMetadata).toHaveBeenCalledWith('user_session', {
      publicMetadata: { role: 'lector', accessUntil: '2026-12-01T00:00:00.000Z' },
    });
  });

  it('writes a null accessUntil (never undefined) when the subscription has no end', async () => {
    vi.mocked(activateSubscription).mockResolvedValue({
      id: 1,
      role: 'lector',
      accessUntil: null,
    });

    await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(updateUserMetadata).toHaveBeenCalledWith('user_session', {
      publicMetadata: { role: 'lector', accessUntil: null },
    });
    const metadata = vi.mocked(updateUserMetadata).mock.calls[0]![1];
    expect(metadata.publicMetadata.accessUntil).toBeNull();
  });

  it('answers 500 and grants nothing for an unknown plan id', async () => {
    vi.mocked(getSubscription).mockResolvedValue({
      ...ACTIVE_SUBSCRIPTION,
      plan_id: 'P-SOMEONE-ELSE',
    });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify?subscription_id=I-SUB1`,
        userId: 'user_session',
      }),
    );

    expect(res.status).toBe(500);
    expect(activateSubscription).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });

  it('redirects to the English subscription page when the checkout cookie carries the "en" locale', async () => {
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|en' });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    const target = expectSameOriginRedirect(res, '/en/subscription');
    expect(target.searchParams.get('status')).toBe('activated');
  });

  it.each(['xx', '//evil.com'])(
    'redirects to the Spanish subscription page when the checkout cookie carries the unsupported locale "%s"',
    async (locale) => {
      const cookies = createFakeCookies({ paypal_checkout: `I-SUB1|${locale}` });

      const res = await callVerify(
        createContext({
          url: `${ORIGIN}/api/suscripcion/paypal/verify`,
          userId: 'user_session',
          cookies,
        }),
      );

      expect(res.status).toBe(302);
      const target = expectSameOriginRedirect(res, '/suscripcion');
      expect(target.searchParams.get('status')).toBe('activated');
    },
  );

  it('never redirects outside the origin of the site', async () => {
    for (const locale of ['en', 'es', 'xx', '//evil.com']) {
      const cookies = createFakeCookies({ paypal_checkout: `I-SUB1|${locale}` });

      const res = await callVerify(
        createContext({
          url: `${ORIGIN}/api/suscripcion/paypal/verify`,
          userId: 'user_session',
          cookies,
        }),
      );

      const location = res.headers.get('location');
      expect(location, 'the endpoint must answer with a redirect').toBeTruthy();
      expect(new URL(location as string, ORIGIN).origin).toBe(ORIGIN);
    }

    // The guard above is meaningful: a protocol-relative location escapes.
    expect(new URL('//evil.com/suscripcion?status=activated', ORIGIN).origin).not.toBe(ORIGIN);
  });

  it('invalidates the paypal_checkout cookie after activating the subscription', async () => {
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|es' });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    const target = expectSameOriginRedirect(res, '/suscripcion');
    expect(target.searchParams.get('status')).toBe('activated');
    expectCheckoutCookieInvalidated(cookies);
  });

  it('carries the checkout cookie deletion in a set-cookie header', async () => {
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|es' });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    // The expired cookie travels as a `set-cookie` header, never as a header
    // named after an index.
    const setCookie = res.headers.getSetCookie();
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.join('\n')).toMatch(/paypal_checkout=;/);
    expect(setCookie.join('\n')).toMatch(/Max-Age=0/);
  });

  it('invalidates the paypal_checkout cookie when the subscription is not paid yet', async () => {
    vi.mocked(getSubscription).mockResolvedValue({
      ...ACTIVE_SUBSCRIPTION,
      status: 'APPROVAL_PENDING',
    });
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|es' });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    const target = expectSameOriginRedirect(res, '/suscripcion');
    expect(target.searchParams.get('status')).toBe('pending');
    expectCheckoutCookieInvalidated(cookies);
  });

  it('invalidates the paypal_checkout cookie when the subscription belongs to another user', async () => {
    vi.mocked(getSubscription).mockResolvedValue({
      ...ACTIVE_SUBSCRIPTION,
      custom_id: 'someone_else',
    });
    const cookies = createFakeCookies({ paypal_checkout: 'I-SUB1|es' });

    const res = await callVerify(
      createContext({
        url: `${ORIGIN}/api/suscripcion/paypal/verify`,
        userId: 'user_session',
        cookies,
      }),
    );

    expect(res.status).toBe(302);
    const target = expectSameOriginRedirect(res, '/suscripcion');
    expect(target.searchParams.get('status')).toBe('error');
    expectCheckoutCookieInvalidated(cookies);
  });
});
