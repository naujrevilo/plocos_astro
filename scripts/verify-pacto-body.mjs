#!/usr/bin/env node
/**
 * Byte-level pacto body verifier (PR1 WU0 — merge gate).
 *
 * Compares the SHA-256 of pacto.es.json's terms.sections[*].body joined
 * (no delimiter) against the canonical fixture's expected.sha256.
 *
 * Normalises CRLF -> LF on both sides so the gate is robust to
 * `core.autocrlf=true` despite .gitattributes eol=lf guards.
 *
 * Modes:
 *   default         reads src/content/_data/pacto.es.json + fixture
 *   --self-check    reads fixture only; verifies the fixture is
 *                   internally consistent (used at WU0 acceptance,
 *                   before pacto.es.json exists).
 *
 * Exit codes:
 *   0  match (or self-check passes)
 *   1  drift / mismatch / missing file / shape violation
 *
 * Output: human-readable block per design §4, then a JSON block
 *         with { expected, actual, drift_bytes, first_diff_offset }.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, "..");
const PACTO_PATH = resolve(ROOT, "src/content/_data/pacto.es.json");
const FIXTURE_PATH = resolve(__dirname, "__fixtures__/pacto-canonical.json");

const SELF_CHECK = process.argv.includes("--self-check");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function lf(s) {
  return s.replace(/\r\n/g, "\n");
}

function sha256(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function readJson(path) {
  if (!existsSync(path)) {
    fatal(`File not found: ${path}`, { expected: null, actual: null, drift_bytes: -1, first_diff_offset: -1 });
  }
  const raw = readFileSync(path, "utf8");
  return { path, raw, json: JSON.parse(raw) };
}

function firstDiffOffset(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) return i;
  }
  return len; // identical up to min length; first length-difference offset
}

function fatal(message, jsonBlock) {
  console.error("Pacto body verification");
  console.error("  sections: 0 (verifier aborted)");
  console.error("  encoding: UTF-8");
  if (jsonBlock) {
    console.error(JSON.stringify(jsonBlock, null, 2));
  }
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load fixture (always required).
// ---------------------------------------------------------------------------
const fixture = readJson(FIXTURE_PATH);
const fixtureBodies = Array.isArray(fixture.json?.bodies) ? fixture.json.bodies : null;
const fixtureExpected = fixture.json?.expected?.sha256 ?? null;

if (!fixtureBodies || !fixtureExpected) {
  fatal("Canonical fixture is malformed (missing bodies or expected.sha256).", {
    expected: null,
    actual: null,
    drift_bytes: -1,
    first_diff_offset: -1,
  });
}

// ---------------------------------------------------------------------------
// Self-check: verify the fixture is internally consistent.
// ---------------------------------------------------------------------------
if (SELF_CHECK) {
  const fixtureJoined = fixtureBodies.map(lf).join("");
  const fixtureHash = sha256(fixtureJoined);
  const selfDiff = fixtureHash !== fixtureExpected;
  const jsonBlock = {
    expected: fixtureExpected,
    actual: fixtureHash,
    drift_bytes: selfDiff ? Buffer.byteLength(fixtureJoined, "utf8") : 0,
    first_diff_offset: selfDiff ? firstDiffOffset(fixtureJoined, fixtureBodies.map(lf).join("")) : 0,
  };
  console.log("Pacto body verification (self-check)");
  console.log(`  sections: ${fixtureBodies.length} (I–VIII)`);
  console.log(`  encoding: UTF-8`);
  console.log(`  source:   canonical fixture`);
  console.log(JSON.stringify(jsonBlock, null, 2));
  if (selfDiff) {
    console.error("FAIL: canonical fixture is internally inconsistent.");
    process.exit(1);
  }
  console.log("PASS: canonical fixture is internally consistent.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Default mode: read pacto.es.json + compare against fixture.
// ---------------------------------------------------------------------------
const pacto = readJson(PACTO_PATH);
const sections = pacto.json?.terms?.sections ?? pacto.json?.sections;
if (!Array.isArray(sections)) {
  fatal(`pacto.es.json has no terms.sections array (got ${typeof sections}).`, {
    expected: fixtureExpected,
    actual: null,
    drift_bytes: -1,
    first_diff_offset: -1,
  });
}
if (sections.length !== 8) {
  fatal(`Expected 8 sections, got ${sections.length}.`, {
    expected: fixtureExpected,
    actual: null,
    drift_bytes: -1,
    first_diff_offset: -1,
  });
}

// Heading markers I–VIII must be present in order.
for (let i = 0; i < 8; i++) {
  const h = sections[i]?.heading ?? "";
  if (!h.startsWith(`${ROMAN[i]}.`)) {
    fatal(`Section ${i + 1} heading missing marker ${ROMAN[i]}. (got: ${JSON.stringify(h.slice(0, 40))})`, {
      expected: fixtureExpected,
      actual: null,
      drift_bytes: -1,
      first_diff_offset: -1,
    });
  }
}

// Update header / date assertion.
const updatedValue = pacto.json?.terms?.updatedValue ?? pacto.json?.updatedValue ?? "";
if (updatedValue !== "2 de septiembre de 2026") {
  fatal(`updatedValue mismatch (expected "2 de septiembre de 2026", got ${JSON.stringify(updatedValue)}).`, {
    expected: fixtureExpected,
    actual: null,
    drift_bytes: -1,
    first_diff_offset: -1,
  });
}

// Joined body hash.
const pactoJoined = sections.map((s) => lf(s.body ?? "")).join("");
const pactoHash = sha256(pactoJoined);
const fixtureJoined = fixtureBodies.map(lf).join("");

let driftBytes = 0;
let firstOffset = 0;
if (pactoHash !== fixtureExpected) {
  const pactoBytes = Buffer.byteLength(pactoJoined, "utf8");
  const fixtureBytes = Buffer.byteLength(fixtureJoined, "utf8");
  driftBytes = Math.abs(pactoBytes - fixtureBytes);
  firstOffset = firstDiffOffset(pactoJoined, fixtureJoined);
}

const jsonBlock = {
  expected: fixtureExpected,
  actual: pactoHash,
  drift_bytes: driftBytes,
  first_diff_offset: firstOffset,
};

console.log("Pacto body verification");
console.log(`  sections: ${sections.length} (I–VIII)`);
console.log(`  encoding: UTF-8`);
console.log(JSON.stringify(jsonBlock, null, 2));

if (pactoHash === fixtureExpected) {
  console.log("PASS: Spanish pacto body matches canonical bytes.");
  process.exit(0);
}

console.error(`FAIL: Spanish pacto body drift detected (${driftBytes} bytes; first diff at offset ${firstOffset}).`);
process.exit(1);