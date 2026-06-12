/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "lib", "i18n.ts");
const source = fs.readFileSync(file, "utf8");
const langs = ["TR", "EN", "DE", "ES"];

function extractDict(name) {
  const startMarker = `const ${name}: Dict = {`;
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`${name} dictionary not found`);

  const nextStarts = langs
    .filter((lang) => lang !== name)
    .map((lang) => source.indexOf(`const ${lang}: Dict = {`, start + startMarker.length))
    .filter((idx) => idx >= 0);
  const translationsStart = source.indexOf("export const translations", start + startMarker.length);
  if (translationsStart >= 0) nextStarts.push(translationsStart);

  const end = Math.min(...nextStarts);
  const body = source.slice(start, end);
  const keys = [];
  const re = /"([^"]+)"\s*:/g;
  let match;
  while ((match = re.exec(body)) !== null) keys.push(match[1]);
  return keys;
}

let hasError = false;
const dicts = Object.fromEntries(langs.map((lang) => [lang, extractDict(lang)]));
const base = new Set(dicts.TR);

for (const [lang, keys] of Object.entries(dicts)) {
  const seen = new Set();
  const duplicates = [];
  for (const key of keys) {
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  if (duplicates.length > 0) {
    hasError = true;
    console.error(`${lang}: duplicate keys: ${duplicates.join(", ")}`);
  }
}

for (const [lang, keys] of Object.entries(dicts)) {
  const set = new Set(keys);
  const missing = [...base].filter((key) => !set.has(key));
  const extra = keys.filter((key) => !base.has(key));

  console.log(`${lang}: ${keys.length} keys`);
  if (missing.length > 0) {
    hasError = true;
    console.error(`${lang}: missing keys from TR: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    hasError = true;
    console.error(`${lang}: extra keys not in TR: ${extra.join(", ")}`);
  }
}

if (hasError) process.exit(1);
console.log("i18n dictionary check passed");
