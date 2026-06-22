/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "lib", "i18n.ts");
let source = fs.readFileSync(file, "utf8");
const langs = ["TR", "EN", "DE", "ES"];

function sectionBounds(name, input = source) {
  const startMarker = `const ${name}: Dict = {`;
  const start = input.indexOf(startMarker);
  if (start < 0) throw new Error(`${name} dictionary not found`);

  const nextStarts = langs
    .filter((lang) => lang !== name)
    .map((lang) => input.indexOf(`const ${lang}: Dict = {`, start + startMarker.length))
    .filter((idx) => idx >= 0);
  const translationsStart = input.indexOf("export const translations", start + startMarker.length);
  if (translationsStart >= 0) nextStarts.push(translationsStart);

  const end = Math.min(...nextStarts);
  const body = input.slice(start, end);

  // EN-style: block closes with its own \n}; line
  // DE/ES compact style: block closes with ,}; inline on the last key line
  let closeInBody = body.lastIndexOf("\n};");
  if (closeInBody < 0) {
    // Compact format — find last }; within the block
    closeInBody = body.lastIndexOf("};");
  }
  if (closeInBody < 0) throw new Error(`${name} dictionary close not found`);
  const close = start + closeInBody;

  return { start, end, close, body };
}

function extractDict(name, input = source) {
  const { body } = sectionBounds(name, input);
  const entries = new Map();
  const re = /"([^"]+)"\s*:\s*"((?:\\"|[^"])*)"/g;
  let match;
  while ((match = re.exec(body)) !== null) entries.set(match[1], match[2]);
  return entries;
}

function escapeValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function syncTarget(targetLang) {
  const tr = extractDict("TR");
  const en = extractDict("EN");
  const target = extractDict(targetLang);
  const missing = [...tr.keys()].filter((key) => !target.has(key));
  if (missing.length === 0) return 0;

  const lines = [
    "",
    `  // -- English fallbacks synced ${new Date().toISOString().slice(0, 10)} --`,
    ...missing.map((key) => `  "${key}": "${escapeValue(en.get(key) ?? tr.get(key) ?? key)}",`),
  ];

  const bounds = sectionBounds(targetLang);
  source = source.slice(0, bounds.close) + lines.join("\n") + source.slice(bounds.close);
  return missing.length;
}

const addedEn = syncTarget("EN");
const addedDe = syncTarget("DE");
const addedEs = syncTarget("ES");
if (addedEn > 0 || addedDe > 0 || addedEs > 0) fs.writeFileSync(file, source, "utf8");
console.log(`EN fallbacks added: ${addedEn}`);
console.log(`DE fallbacks added: ${addedDe}`);
console.log(`ES fallbacks added: ${addedEs}`);
