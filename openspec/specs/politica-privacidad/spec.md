---
status: active
archived_from: consentimiento-y-marco-legal
date_archived: 2026-08-20
---

# Spec: politica-privacidad

## Purpose

Define the privacy policy published under `/privacy` and `/en/privacy`, compliant with Colombian Ley 1581/2012 (Habeas Data), Decreto 1377/2013, and SIC oversight. The policy MUST disclose controller, purpose, legal basis, ARCO rights, international transfers, retention, and contact channels.

## Requirements

### REQ-privacy-1: Bilingual canonical pages

The system SHALL publish `/privacy` (es) and `/en/privacy` (en), both using `BaseLayout` with meta tags from `getTranslations(locale).privacy.*`.

**Given** a visitor opens `/privacy`
**When** the page renders
**Then** the system SHALL return HTTP 200 with the Spanish policy and locale-correct meta tags.

### REQ-privacy-2: Controller identification

The policy SHALL identify the controller: legal or natural person name, contact email, and country of domicile (Colombia). The email MUST be `expresatura@plocos.com`.

**Given** any visitor reads the policy
**When** they reach the "Responsable" section
**Then** the system SHALL display the controller name, country "Colombia", and the email contact.

### REQ-privacy-3: Purposes of processing

The policy SHALL enumerate each purpose: (a) responder mensajes del formulario de contacto, (b) moderar y almacenar comentarios, (c) analítica anonimizada (GA4 solo con consentimiento), (d) envío de comunicaciones si el usuario se suscribe.

**Given** a visitor reads "Finalidades"
**When** they look for each data flow
**Then** the policy SHALL name every purpose and link to the lawful basis (REQ-privacy-4).

### REQ-privacy-4: Legal basis under Ley 1581

For each purpose, the policy SHALL state the basis per Ley 1581/2012 art. 6: consentimiento expreso (analytics), ejecución contractual (comments, contact), obligación legal (registros). Consent SHALL be required for analytics.

**Given** the visitor reads the basis for analytics
**When** they finish
**Then** the policy SHALL explicitly state that GA4 only loads after consent via the cookie banner.

### REQ-privacy-5: ARCO rights explanation

The policy SHALL explain ARCO rights (Acceso, Rectificación, Cancelación, Oposición) and the procedure to exercise them.

**Given** a visitor wants to exercise ARCO rights
**When** they read the procedure
**Then** the policy SHALL tell them what to include (nombre, identificación, derecho a ejercer, descripción), the email channel, and the timeline per REQ-privacy-6.

### REQ-privacy-6: Response timelines per art. 14

The policy SHALL state Ley 1581 art. 14 timelines: consultas — máximo 10 días hábiles; reclamos — máximo 15 días hábiles. Email alone SHALL be sufficient (no form required).

**Given** a visitor submits a consult
**When** 10 business days pass
**Then** the controller SHALL respond. The policy SHALL communicate this SLA.

### REQ-privacy-7: International transfers disclosure

The policy SHALL disclose that data may be transferred to the United States (Netlify hosting, GA4 analytics). Transfers SHALL occur only after consent (analytics) or under the contractual-relationship exception (hosting). Safeguards SHALL be in place (DPAs; EU-US DPF where applicable).

**Given** the visitor reads "Transferencias internacionales"
**When** they finish
**Then** they SHALL know which providers receive data and under what safeguard.

### REQ-privacy-8: Retention periods

The policy SHALL state retention per data category: contact-form messages — 24 months; comments — hasta solicitud de eliminación; analytics — 14 months (GA4 default); cookies — 30 days (`astroConsent`).

**Given** a visitor asks "for how long?"
**When** they look at the retention table
**Then** every data category SHALL have a concrete period.

### REQ-privacy-9: Contact channel

The policy SHALL provide `expresatura@plocos.com` as the primary ARCO channel. A link to `/contacto` MAY be present; email alone SHALL always be sufficient.

**Given** a visitor wants to act on a right
**When** they look for contact info
**Then** the policy SHALL show the email prominently.

### REQ-privacy-10: Bilingual parity + legal terminology

The `privacy` translation MUST have matching keys in `es` and `en`. Legal terms MUST be preserved accurately, not literally.

**Given** the Spanish version mentions "derechos ARCO"
**When** the English version is read
**Then** it SHALL use "ARCO rights (Access, Rectification, Cancellation, Opposition)" and SHALL NOT substitute GDPR rights.

### REQ-privacy-11: Static, no client JS

The privacy page SHALL be static.

**Given** JS is disabled
**When** the visitor opens `/privacy`
**Then** the entire policy SHALL remain readable.
