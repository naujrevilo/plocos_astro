/**
 * T08 — Wire Clerk auth (sign-in, sign-up, account, webhook)
 *
 * Strict TDD invariant tests: assert the project surface (config, routes, page
 * existence, i18n fields, webhook route) for the Clerk auth integration.
 *
 * We DO NOT call out to Clerk. The integration is plain code + files. These
 * tests verify it has the right shape.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

function read(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!existsSync(abs)) {
    throw new Error(`file missing: ${relPath}`);
  }
  return readFileSync(abs, 'utf8');
}

function mustExist(relPath: string): void {
  const abs = path.join(ROOT, relPath);
  expect(existsSync(abs), `expected file: ${relPath}`).toBe(true);
}

describe('T08 — Wire Clerk auth', () => {
  describe('package.json — Clerk dependency', () => {
    it('declares @clerk/astro in dependencies', () => {
      const pkg = JSON.parse(read('package.json')) as {
        dependencies?: Record<string, string>;
      };
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.dependencies?.['@clerk/astro']).toBeTruthy();
    });

    it('does NOT pull in React/Vue SDKs (Astro-core only)', () => {
      const pkg = JSON.parse(read('package.json')) as {
        dependencies?: Record<string, string>;
      };
      // The Astro integration pulls React internally for its interactive
      // components, but we should not depend on the bare react/vue packages
      // explicitly — those would suggest we hand-roll Clerk components.
      expect(pkg.dependencies?.['react']).toBeUndefined();
      expect(pkg.dependencies?.['react-dom']).toBeUndefined();
      expect(pkg.dependencies?.['vue']).toBeUndefined();
    });
  });

  describe('astro.config.mjs — Clerk integration', () => {
    let config: string;

    it('imports the default export from @clerk/astro', () => {
      config = read('astro.config.mjs');
      expect(config).toMatch(
        /import\s+clerk\s+from\s+['"]@clerk\/astro['"]/,
      );
    });

    it('wires clerk(...) into the integrations array', () => {
      if (!config) config = read('astro.config.mjs');
      // The clerk(...) call must appear inside the integrations array, with
      // the minimum required options (signInUrl, signUpUrl, profileUrl).
      expect(config).toMatch(/integrations:\s*\[[\s\S]*?clerk\(/);
      expect(config).toMatch(/signInUrl/);
      expect(config).toMatch(/signUpUrl/);
      expect(config).toMatch(/profileUrl/);
    });
  });

  describe('src/middleware.ts — clerkMiddleware wiring', () => {
    it('exists', () => {
      mustExist('src/middleware.ts');
    });

    it('imports clerkMiddleware from @clerk/astro/server', () => {
      const middleware = read('src/middleware.ts');
      expect(middleware).toMatch(
        /import\s+\{[^}]*clerkMiddleware[^}]*\}\s+from\s+['"]@clerk\/astro\/server['"]/,
      );
    });

    it('uses the local routeMatcher helper (createRouteMatcher in src/lib/routeMatcher.ts)', () => {
      const middleware = read('src/middleware.ts');
      expect(middleware).toMatch(/createRouteMatcher/);
      expect(middleware).toMatch(/from\s+['"]\.\/lib\/routeMatcher['"]/);
      mustExist('src/lib/routeMatcher.ts');
    });

    it('exports onRequest = clerkMiddleware(...)', () => {
      const middleware = read('src/middleware.ts');
      expect(middleware).toMatch(/export\s+const\s+onRequest\s*=/);
      expect(middleware).toMatch(/onRequest\s*=\s*clerkMiddleware\(/);
    });

    it('declares public routes for /, /terminos*, /privacidad, /politica-de-cookies, /sign-in*, /sign-up*, /api/webhooks*', () => {
      const middleware = read('src/middleware.ts');
      // Each route must appear inside the createRouteMatcher array
      expect(middleware).toMatch(/['"]\/['"]/);
      expect(middleware).toMatch(/['"]\/terminos\(/);
      expect(middleware).toMatch(/['"]\/privacidad['"]/);
      expect(middleware).toMatch(/['"]\/politica-de-cookies['"]/);
      expect(middleware).toMatch(/['"]\/sign-in\(/);
      expect(middleware).toMatch(/['"]\/sign-up\(/);
      expect(middleware).toMatch(/['"]\/api\/webhooks\(/);
    });

    it('redirects unauthenticated requests to /sign-in', () => {
      const middleware = read('src/middleware.ts');
      // The handler must check !auth().userId and redirect to sign-in.
      expect(middleware).toMatch(/auth\(\)\.userId/);
      expect(middleware).toMatch(/redirect/);
      expect(middleware).toMatch(/['"]\/sign-in['"]|['"]\/sign-in/);
    });
  });

  describe('ES auth pages', () => {
    it('src/pages/sign-in.astro exists and imports <SignIn /> from @clerk/astro/components', () => {
      mustExist('src/pages/sign-in.astro');
      const page = read('src/pages/sign-in.astro');
      expect(page).toMatch(
        /import\s+\{[^}]*SignIn[^}]*\}\s+from\s+['"]@clerk\/astro\/components['"]/,
      );
    });

    it('src/pages/sign-up.astro exists and imports <SignUp /> from @clerk/astro/components', () => {
      mustExist('src/pages/sign-up.astro');
      const page = read('src/pages/sign-up.astro');
      expect(page).toMatch(
        /import\s+\{[^}]*SignUp[^}]*\}\s+from\s+['"]@clerk\/astro\/components['"]/,
      );
    });

    it('src/pages/cuenta.astro exists and imports <UserProfile /> from @clerk/astro/components', () => {
      mustExist('src/pages/cuenta.astro');
      const page = read('src/pages/cuenta.astro');
      expect(page).toMatch(
        /import\s+\{[^}]*UserProfile[^}]*\}\s+from\s+['"]@clerk\/astro\/components['"]/,
      );
    });
  });

  describe('EN auth pages', () => {
    it('src/pages/en/sign-in.astro exists', () => {
      mustExist('src/pages/en/sign-in.astro');
    });

    it('src/pages/en/sign-up.astro exists', () => {
      mustExist('src/pages/en/sign-up.astro');
    });

    it('src/pages/en/account.astro exists', () => {
      mustExist('src/pages/en/account.astro');
    });
  });

  describe('webhook — /api/webhooks/clerk', () => {
    it('src/pages/api/webhooks/clerk.ts exists and exports a POST handler', () => {
      mustExist('src/pages/api/webhooks/clerk.ts');
      const handler = read('src/pages/api/webhooks/clerk.ts');
      expect(handler).toMatch(/export\s+const\s+POST\s*:/);
    });

    it('verifies the Clerk webhook signature with svix', () => {
      const handler = read('src/pages/api/webhooks/clerk.ts');
      expect(handler).toMatch(/svix-id/);
      expect(handler).toMatch(/svix-timestamp/);
      expect(handler).toMatch(/svix-signature/);
      expect(handler).toMatch(/from\s+['"]svix['"]/);
      expect(handler).toMatch(/new\s+Webhook\(/);
      expect(handler).toMatch(/\.verify\(/);
    });

    it('handles user.created, user.updated, user.deleted', () => {
      const handler = read('src/pages/api/webhooks/clerk.ts');
      expect(handler).toMatch(/['"]user\.created['"]/);
      expect(handler).toMatch(/['"]user\.updated['"]/);
      expect(handler).toMatch(/['"]user\.deleted['"]/);
    });

    it('reads CLERK_WEBHOOK_SIGNING_SECRET from import.meta.env', () => {
      const handler = read('src/pages/api/webhooks/clerk.ts');
      expect(handler).toMatch(/CLERK_WEBHOOK_SIGNING_SECRET/);
      expect(handler).toMatch(/import\.meta\.env/);
    });
  });

  describe('i18n — top-level auth section (ES + EN)', () => {
    let i18nSrc: string;

    it('the Translation interface declares an auth section', () => {
      i18nSrc = read('src/lib/i18n.ts');
      // The interface must declare auth with the required fields. Look for the
      // shape:
      //   auth: {
      //     signInLabel: string;
      //     signUpLabel: string;
      //     accountLabel: string;
      //     signOutLabel: string;
      //     subscriptionRequiredCta: string;
      //   };
      const authBlock = i18nSrc.match(
        /auth:\s*\{[\s\S]*?\}/,
      );
      expect(
        authBlock,
        'expected Translation interface to declare an auth block',
      ).not.toBeNull();
      const block = authBlock![0];
      expect(block).toMatch(/signInLabel/);
      expect(block).toMatch(/signUpLabel/);
      expect(block).toMatch(/accountLabel/);
      expect(block).toMatch(/signOutLabel/);
      expect(block).toMatch(/subscriptionRequiredCta/);
    });

    it('Spanish translation has an auth block with the required labels', () => {
      if (!i18nSrc) i18nSrc = read('src/lib/i18n.ts');
      // ES labels per spec: Iniciar sesión, Crear cuenta, Mi cuenta, Cerrar sesión, Suscríbete para acceder
      expect(i18nSrc).toMatch(/Iniciar\s+sesi[oó]n/);
      expect(i18nSrc).toMatch(/Crear\s+cuenta/);
      expect(i18nSrc).toMatch(/Mi\s+cuenta/);
      expect(i18nSrc).toMatch(/Cerrar\s+sesi[oó]n/);
      expect(i18nSrc).toMatch(/Suscr[ií]bete\s+para\s+acceder/);
    });

    it('English translation has an auth block with the required labels', () => {
      const i18nSrc = read('src/lib/i18n.ts');
      // EN labels per spec: Sign in, Sign up, My account, Sign out, Subscribe to access
      expect(i18nSrc).toMatch(/['"]Sign\s+in['"]/);
      expect(i18nSrc).toMatch(/['"]Sign\s+up['"]/);
      expect(i18nSrc).toMatch(/['"]My\s+account['"]/);
      expect(i18nSrc).toMatch(/['"]Sign\s+out['"]/);
      expect(i18nSrc).toMatch(/Subscribe\s+to\s+access/);
    });
  });

  describe('env.example — Clerk env vars documented', () => {
    it('declares PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET', () => {
      const env = read('.env.example');
      expect(env).toMatch(/PUBLIC_CLERK_PUBLISHABLE_KEY/);
      expect(env).toMatch(/CLERK_SECRET_KEY/);
      expect(env).toMatch(/CLERK_WEBHOOK_SIGNING_SECRET/);
    });
  });

  describe('sanity — auth lives behind clerkMiddleware', () => {
    it('src/pages/cuenta.astro reads Astro.locals.auth() (middleware-provided)', () => {
      const page = read('src/pages/cuenta.astro');
      expect(page).toMatch(/Astro\.locals\.auth\(\)/);
    });

    it('does NOT import clerkClient or Clerk auth helpers directly in pages (must go through middleware)', () => {
      // The only place where Clerk SDK is imported in pages should be
      // @clerk/astro/components (the UI components). Sensitive pages must
      // not call getAuth() or clerkClient() themselves — clerkMiddleware
      // injects Astro.locals.auth().
      const sensitivePages = [
        'src/pages/sign-in.astro',
        'src/pages/sign-up.astro',
        'src/pages/cuenta.astro',
        'src/pages/en/sign-in.astro',
        'src/pages/en/sign-up.astro',
        'src/pages/en/account.astro',
      ];
      for (const rel of sensitivePages) {
        const abs = path.join(ROOT, rel);
        if (!existsSync(abs)) continue; // skip not-yet-created pages (early RED)
        const src = readFileSync(abs, 'utf8');
        // They must NOT import clerkClient or getAuth directly. Components
        // import is fine.
        expect(
          src,
          `${rel} should not import @clerk/astro/server`,
        ).not.toMatch(/from\s+['"]@clerk\/astro\/server['"]/);
      }
    });
  });
});