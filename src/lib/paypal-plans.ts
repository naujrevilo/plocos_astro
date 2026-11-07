/**
 * @module paypal-plans
 * @description (plan, currency) -> PayPal plan id mapping (T10d.2).
 *
 * PayPal allows only one currency per subscription plan ("Only one
 * `currency_code` is allowed per subscription plan"), so every plan needs one
 * id per currency: `PAYPAL_PLAN_{LECTOR,COLABORADOR}_{USD,EUR}`.
 *
 * The mapping is shared by the checkout (`/api/suscripcion/paypal`, which
 * creates the subscription) and the webhook (`/api/webhooks/paypal`, which
 * resolves the granted plan from the `plan_id` of the subscription), so both
 * agree on what a plan id means.
 *
 * Env vars are read the Astro way (see `src/lib/paypal.ts`): every access is
 * spelled out on purpose, because Vite only replaces static
 * `import.meta.env.X` keys at build time.
 */

export type PayPalPlan = 'lector' | 'colaborador';
export type PayPalCurrency = 'USD' | 'EUR';

const PLAN_IDS: Record<
  PayPalPlan,
  Record<PayPalCurrency, () => string | undefined>
> = {
  lector: {
    USD: () =>
      import.meta.env.PAYPAL_PLAN_LECTOR_USD ?? process.env.PAYPAL_PLAN_LECTOR_USD,
    EUR: () =>
      import.meta.env.PAYPAL_PLAN_LECTOR_EUR ?? process.env.PAYPAL_PLAN_LECTOR_EUR,
  },
  colaborador: {
    USD: () =>
      import.meta.env.PAYPAL_PLAN_COLABORADOR_USD ?? process.env.PAYPAL_PLAN_COLABORADOR_USD,
    EUR: () =>
      import.meta.env.PAYPAL_PLAN_COLABORADOR_EUR ?? process.env.PAYPAL_PLAN_COLABORADOR_EUR,
  },
};

const PLANS: readonly PayPalPlan[] = ['lector', 'colaborador'];
const CURRENCIES: readonly PayPalCurrency[] = ['USD', 'EUR'];

/**
 * The configured plan id for a plan and a currency, or null when the env var
 * is missing or empty.
 */
export function paypalPlanId(plan: PayPalPlan, currency: PayPalCurrency): string | null {
  const planId = PLAN_IDS[plan][currency]();
  return planId ? planId : null;
}

/**
 * The plan a PayPal plan id belongs to, or null when the id is not one of
 * ours (a configuration error).
 */
export function paypalPlanFromId(planId: string): PayPalPlan | null {
  for (const plan of PLANS) {
    for (const currency of CURRENCIES) {
      if (paypalPlanId(plan, currency) === planId) return plan;
    }
  }
  return null;
}
