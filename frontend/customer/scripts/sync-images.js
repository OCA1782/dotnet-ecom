/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const DOCS_IMAGES = path.resolve(__dirname, "../../../../dotnet-ecom-docs/project_files/images");
const PUBLIC = path.resolve(__dirname, "../public");

const SOURCES = [
  path.join(DOCS_IMAGES, "shared"),
  path.join(DOCS_IMAGES, "customer"),
];

let copied = 0;

for (const src of SOURCES) {
  if (!fs.existsSync(src)) continue;
  for (const file of fs.readdirSync(src)) {
    const srcFile = path.join(src, file);
    const destFile = path.join(PUBLIC, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
      copied++;
    }
  }
}

if (copied > 0) console.log(`sync-images: ${copied} dosya kopyalandı → public/`);
