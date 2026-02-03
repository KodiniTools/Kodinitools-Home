/**
 * Post-Build Script: Synchronize asset hashes in English index.html
 *
 * This script extracts the generated asset hashes from dist/index.html
 * and updates dist/en/index.html with the correct paths.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = './dist';
const mainIndexPath = join(distDir, 'index.html');
const enIndexPath = join(distDir, 'en', 'index.html');

console.log('🔄 Syncing asset hashes for English version...');

// Check if files exist
if (!existsSync(mainIndexPath)) {
  console.error('❌ dist/index.html not found. Run build first.');
  process.exit(1);
}

if (!existsSync(enIndexPath)) {
  console.log('⚠️ dist/en/index.html not found. Skipping sync.');
  process.exit(0);
}

// Read main index.html
const mainHtml = readFileSync(mainIndexPath, 'utf-8');

// Extract JS asset hash
const jsMatch = mainHtml.match(/src="\/assets\/(app-[a-zA-Z0-9]+\.js)"/);
const jsFile = jsMatch ? jsMatch[1] : null;

// Extract CSS asset hash
const cssMatch = mainHtml.match(/href="\/assets\/(app-[a-zA-Z0-9]+\.css)"/);
const cssFile = cssMatch ? cssMatch[1] : null;

if (!jsFile || !cssFile) {
  console.error('❌ Could not extract asset hashes from dist/index.html');
  console.log('   JS found:', jsFile);
  console.log('   CSS found:', cssFile);
  process.exit(1);
}

console.log(`   📦 JS:  ${jsFile}`);
console.log(`   🎨 CSS: ${cssFile}`);

// Read English index.html
let enHtml = readFileSync(enIndexPath, 'utf-8');

// Replace JS asset path
enHtml = enHtml.replace(
  /src="\/assets\/app-[a-zA-Z0-9]+\.js"/,
  `src="/assets/${jsFile}"`
);

// Replace CSS asset path
enHtml = enHtml.replace(
  /href="\/assets\/app-[a-zA-Z0-9]+\.css"/,
  `href="/assets/${cssFile}"`
);

// Write updated English index.html
writeFileSync(enIndexPath, enHtml, 'utf-8');

console.log('✅ dist/en/index.html updated with correct asset hashes!');
