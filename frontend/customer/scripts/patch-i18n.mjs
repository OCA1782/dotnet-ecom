// i18n.ts'ye Faz 1 key'lerini ekler
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nFile = join(__dirname, '../src/lib/i18n.ts');

const langs = ['tr', 'en', 'de', 'es'];

// Anchors — each lang block ends with this auth.error line
const CRLF = '\r\n';
const anchors = {
  tr: `    'auth.error': 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.',${CRLF}  },`,
  en: `    'auth.error': 'An error occurred during login. Please try again.',${CRLF}  },`,
  de: `    'auth.error': 'Beim Anmelden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',${CRLF}  },`,
  es: `    'auth.error': 'Se produjo un error al iniciar sesión. Por favor, inténtalo de nuevo.',${CRLF}  },`,
};

let content = readFileSync(i18nFile, 'utf-8');

for (const lang of langs) {
  const anchor = anchors[lang];
  const newKeys = readFileSync(join(__dirname, `i18n-merge-${lang}.txt`), 'utf-8');
  const replacement = anchor.replace(
    `'auth.error': '`,
    `'auth.error': '`
  );
  // Insert new keys before the closing },
  // anchor: "    'auth.error': '...',\n  },"
  // replacement: "    'auth.error': '...',\n" + newKeys + "\n  },"
  const closingBrace = `${CRLF}  },`;
  const anchorWithoutBrace = anchor.slice(0, anchor.length - closingBrace.length);
  // newKeys file uses LF — convert to CRLF to match the file
  const newKeysCRLF = newKeys.replace(/\n/g, CRLF);
  const newContent = anchorWithoutBrace + `,${CRLF}` + newKeysCRLF + closingBrace;

  if (!content.includes(anchor)) {
    console.error(`ANCHOR NOT FOUND for ${lang}!`);
    console.error('Looking for:', JSON.stringify(anchor.slice(0, 60)));
    process.exit(1);
  }

  const idx = content.indexOf(anchor);
  // Make sure we only replace the FIRST occurrence of each anchor
  // (each auth.error line is unique per language)
  content = content.slice(0, idx) + newContent + content.slice(idx + anchor.length);
  console.log(`✓ ${lang.toUpperCase()} block patched`);
}

writeFileSync(i18nFile, content, 'utf-8');
console.log('i18n.ts patched successfully!');
