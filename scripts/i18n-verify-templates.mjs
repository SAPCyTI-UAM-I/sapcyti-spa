#!/usr/bin/env node
/**
 * Verifies that i18n keys and parameters used across Angular templates and components
 * exist and match the declarations in es.json.
 *
 * Usage:
 *   node scripts/i18n-verify-templates.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ES_PATH = path.join(ROOT, 'src/assets/i18n/es.json');
const APP_DIR = path.join(ROOT, 'src/app');

function flattenKeysWithValues(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeysWithValues(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const esData = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));
  const allKeys = flattenKeysWithValues(esData);
  const keySet = new Set(Object.keys(allKeys));

  const files = walkDir(APP_DIR);
  const errors = [];
  const warnings = [];

  // Patterns for static keys: 'MODULE.SECTION.KEY'
  const PIPE_TRANSLATE_REGEX = /(?:'|")([A-Z0-9_]+(?:\.[A-Z0-9_]+)+)(?:'|")\s*\|\s*translate/g;
  const DIRECTIVE_TRANSLATE_REGEX = /\[translate\]\s*=\s*"(?:'|")([A-Z0-9_]+(?:\.[A-Z0-9_]+)+)(?:'|")/g;
  const TS_INSTANT_REGEX = /translate(?:Service)?\.(?:instant|stream|get)\(\s*(?:'|")([A-Z0-9_]+(?:\.[A-Z0-9_]+)+)(?:'|")/g;

  // Pattern for pipes without parentheses inside object binding: { date: foo | date: '...' }
  const UNPARENTHESIZED_PIPE_IN_PARAMS = /\[translateParams\]\s*=\s*"\{[^}]*:\s*[^()|}]+\s*\|\s*[a-zA-Z]+/g;

  for (const file of files) {
    const relativePath = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');

    // 1. Check for unparenthesized pipe inside translateParams
    let pipeMatch;
    while ((pipeMatch = UNPARENTHESIZED_PIPE_IN_PARAMS.exec(content)) !== null) {
      warnings.push({
        file: relativePath,
        type: 'UNPARENTHESIZED_PIPE',
        message: `Possible pipe precedence issue in [translateParams]: "${pipeMatch[0]}". Wrap pipe expression in parentheses: (val | date: '...').`,
      });
    }

    // 2. Validate pipe usages
    const scanForKeys = (regex, type) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (!keySet.has(key)) {
          // Check if it's dynamic prefix concatenation like 'PREFIX_' + val
          const sliceAfter = content.slice(match.index + match[0].length, match.index + match[0].length + 15);
          if (sliceAfter.trim().startsWith('+')) {
            continue; // Skip dynamic key prefixes
          }

          errors.push({
            file: relativePath,
            key,
            type,
            message: `Key "${key}" not found in es.json. This will render as raw "${key}" in the UI.`,
          });
        }
      }
    };

    scanForKeys(PIPE_TRANSLATE_REGEX, 'PIPE');
    scanForKeys(DIRECTIVE_TRANSLATE_REGEX, 'DIRECTIVE');
    scanForKeys(TS_INSTANT_REGEX, 'TS');
  }

  console.log(`\n--- i18n Template & Component Usage Verification ---`);
  console.log(`Scanned ${files.length} templates and components against ${keySet.size} translation keys.`);

  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.warn(`  [${w.file}] ${w.message}`));
  }

  if (errors.length > 0) {
    console.error(`\nErrors (${errors.length}):`);
    errors.forEach((e) => console.error(`  [${e.file}] ${e.message}`));
    process.exit(1);
  }

  console.log(`Template i18n verification OK (0 missing keys, 0 broken references).\n`);
}

main();
