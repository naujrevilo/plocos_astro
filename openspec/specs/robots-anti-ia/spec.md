---
status: active
archived_from: consentimiento-y-marco-legal
date_archived: 2026-08-20
---

# Spec: robots-anti-ia

## Purpose

Define the anti-AI scraping hardening for Plocos. Two coordinated layers: (1) a static `public/robots.txt` blocking known AI crawlers, (2) a per-page `<meta name="robots" content="noai, noimageai">` hint in `BaseLayout.astro`. Enforcement relies on robots.txt compliance plus the meta tag; HTTP response headers (`X-Robots-Tag`) are explicitly OUT OF SCOPE for this change.

## Requirements

### REQ-robots-1: Static robots.txt

The system SHALL publish a `public/robots.txt` file. Astro SHALL serve it at `/robots.txt` with `Content-Type: text/plain`.

**Given** a crawler requests `https://plocos.netlify.app/robots.txt`
**When** the server responds
**Then** the body SHALL match the file at `public/robots.txt` and `Content-Type` SHALL be `text/plain`.

### REQ-robots-2: Block known AI scrapers

The robots.txt SHALL `Disallow: /` for each of the following User-agents (in this exact list, case-sensitive):

- `GPTBot` (OpenAI)
- `ClaudeBot` (Anthropic)
- `Claude-Web` (Anthropic web indexer)
- `CCBot` (Common Crawl — feeds many LLMs)
- `Google-Extended` (Google AI training opt-out)
- `anthropic-ai` (Anthropic legacy)
- `PerplexityBot` (Perplexity)
- `Bytespider` (ByteDance)

The list SHALL be in a single `User-agent: <bot>` + `Disallow: /` block per bot, with a comment naming the operator.

**Given** `GPTBot` requests the sitemap
**When** robots.txt is parsed
**Then** the file SHALL contain a block `User-agent: GPTBot` followed by `Disallow: /`.

### REQ-robots-3: Allow legitimate search engines

The robots.txt SHALL allow major search engines via a top-level `User-agent: *` block that does NOT disallow indexing, OR via explicit per-bot allow rules. Sitemap directive SHALL point to `/sitemap-index.xml` (Astro's `@astrojs/sitemap` output).

**Given** `Googlebot` (not `Google-Extended`) requests `/`
**When** robots.txt is parsed
**Then** the directive SHALL NOT forbid crawling of public pages.

### REQ-robots-4: Meta noai in BaseLayout

`BaseLayout.astro` SHALL inject `<meta name="robots" content="noai, noimageai">` in the `<head>`, after the existing meta tags but before any script tags.

**Given** any page renders under BaseLayout
**When** the HTML is inspected
**Then** the `<head>` SHALL contain exactly one `<meta name="robots" content="noai, noimageai">` element.

### REQ-robots-5: Meta tag on every page

Per REQ-robots-4, the meta tag MUST be emitted on every page that uses BaseLayout (the entire site). The system SHALL NOT exclude pages from this tag.

**Given** any route (legal, blog, contact, etc.) renders
**When** the HTML is inspected
**Then** the `noai, noimageai` meta SHALL be present.

### REQ-robots-6: Sitemap directive

The robots.txt SHALL include a `Sitemap: https://plocos.netlify.app/sitemap-index.xml` directive (absolute URL matching `astro.config.mjs` `site`).

**Given** a crawler reads robots.txt
**When** it parses the file
**Then** the `Sitemap` directive SHALL be present with the production hostname.

### REQ-robots-7: Out of scope — HTTP response headers

This change SHALL NOT add `X-Robots-Tag` or other HTTP response headers. Enforcement relies entirely on robots.txt + meta tag.

**Given** the change is applied
**When** a response is inspected for headers
**Then** no `X-Robots-Tag` SHALL be required to satisfy this spec. (Adding such headers later is a separate change.)

### REQ-robots-8: Reversibility

Deleting `public/robots.txt` SHALL restore Astro's default behaviour (no robots file served). Removing the `<meta>` line from `BaseLayout.astro` SHALL remove the meta tag from every page.

**Given** both `public/robots.txt` is deleted and the meta line is removed
**When** the site is built
**Then** no anti-IA directive SHALL be emitted and the site SHALL be reachable by all compliant crawlers.

### REQ-robots-9: Build verification

`astro build` SHALL complete without warnings related to the robots.txt location or meta tag syntax.

**Given** the new robots.txt and meta tag are in place
**When** `npm run build` runs
**Then** the build SHALL succeed with no new warnings.
