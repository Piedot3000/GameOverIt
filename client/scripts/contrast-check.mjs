// Recomputes every text-on-background pair the app renders.
// Run: node client/scripts/contrast-check.mjs   (also works from inside client/)
// Expect: 16 PASS lines, then "0 failures". Exits non-zero if anything fails.
//
// The hex VALUES are read out of client/src/styles/tokens.css — the single
// source of truth — so a mistyped or changed token fails this check instead of
// being ignored. Only the list of which colour sits on which (a UI usage list)
// is design knowledge kept here; the values never are.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(here, "../src/styles/tokens.css");

let css;
try {
  css = readFileSync(tokensPath, "utf8");
} catch (err) {
  console.error(`contrast-check: cannot read ${tokensPath} (${err.code}).`);
  process.exit(1);
}

// Parse `--token-name: #rrggbb` declarations. Comments are stripped first so a
// hex mentioned in prose is never mistaken for a token value.
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
const tokens = new Map();
for (const line of withoutComments.split(/\r?\n/)) {
  const m = line.match(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/);
  if (m) tokens.set(m[1], m[2]);
}

// Every token this check depends on. A renamed or deleted token is a hard error.
const REQUIRED = [
  "color-bg", "color-surface", "color-text", "color-primary", "color-playing",
  "color-accent", "color-muted", "color-success", "color-danger",
];
const missing = REQUIRED.filter((name) => !tokens.has(name));
if (missing.length > 0) {
  console.error(`contrast-check: ${tokensPath} is missing required token(s):`);
  for (const name of missing) console.error(`  --${name}`);
  console.error("A token was renamed or deleted — fix tokens.css, not this checker.");
  process.exit(1);
}

const T = Object.fromEntries(
  REQUIRED.map((name) => [name.replace(/^color-/, ""), tokens.get(name)]),
);

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// 16 real UI usages. Two of them share a value pair by design:
// "playing on surface" holds the same colour as "primary on surface", and
// "muted badge on surface" holds the same colour as "muted on surface".
const pairs = [
  ["text on bg", T.text, T.bg], ["text on surface", T.text, T.surface],
  ["muted on bg", T.muted, T.bg], ["muted on surface", T.muted, T.surface],
  ["primary on bg", T.primary, T.bg], ["primary on surface", T.primary, T.surface],
  ["accent on bg", T.accent, T.bg], ["accent on surface", T.accent, T.surface],
  ["bg on primary (button label)", T.bg, T.primary], ["bg on accent (button label)", T.bg, T.accent],
  ["success on surface", T.success, T.surface], ["success on bg", T.success, T.bg],
  ["danger on surface", T.danger, T.surface], ["danger on bg", T.danger, T.bg],
  ["playing on surface", T.playing, T.surface], ["muted badge on surface", T.muted, T.surface],
];

// Mark usages whose (fg, bg) values repeat an earlier usage, so the report does
// not imply 16 distinct value pairs.
const seen = new Map();
const labels = pairs.map(([name, fg, bg]) => {
  const key = `${fg}/${bg}`;
  const first = seen.get(key);
  if (!first) seen.set(key, name);
  return first ? `  (same values as "${first}")` : "";
});

let failures = 0;
pairs.forEach(([name, fg, bg], i) => {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(6)}:1  ${name}${labels[i]}`);
});

const focusRatio = ratio(T.primary, T.bg);
const focusOk = focusRatio >= 3.0;

console.log(`\n${failures} failures (requirement: 0, all pairs at or above 4.5:1)`);
console.log(`focus ring --color-primary on --color-bg: ${focusRatio.toFixed(2)}:1 (needs 3.0 for UI components) ${focusOk ? "PASS" : "FAIL"}`);
console.log(`\n${pairs.length} UI usages, ${seen.size} distinct value pairs, values read from ${tokensPath}`);

if (failures > 0 || !focusOk) process.exitCode = 1;
