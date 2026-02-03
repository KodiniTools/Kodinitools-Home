/**
 * Post-Build Script: Synchronize asset hashes in English index.html
 *
 * This script:
 * 1. Copies public/en/index.html to dist/en/index.html
 * 2. Extracts the generated asset hashes from dist/index.html
 * 3. Updates dist/en/index.html with the correct paths
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

const publicEnIndexPath = './public/en/index.html';
const distDir = './dist';
const mainIndexPath = join(distDir, 'index.html');
const enIndexPath = join(distDir, 'en', 'index.html');

console.log('🔄 Syncing asset hashes for English version...');

// Check if main dist/index.html exists
if (!existsSync(mainIndexPath)) {
  console.error('❌ dist/index.html not found. Run build first.');
  process.exit(1);
}

// Check if public/en/index.html exists
if (!existsSync(publicEnIndexPath)) {
  console.log('⚠️ public/en/index.html not found. Skipping sync.');
  process.exit(0);
}

// Create dist/en/ directory if it doesn't exist
const enDistDir = dirname(enIndexPath);
if (!existsSync(enDistDir)) {
  mkdirSync(enDistDir, { recursive: true });
  console.log('   📁 Created dist/en/ directory');
}

// Copy public/en/index.html to dist/en/index.html
copyFileSync(publicEnIndexPath, enIndexPath);
console.log('   📋 Copied public/en/index.html to dist/en/');

// Read main index.html
const mainHtml = readFileSync(mainIndexPath, 'utf-8');

// Extract JS asset hash (flexible pattern for different attribute orders)
const jsMatch = mainHtml.match(/\/assets\/(app-[a-zA-Z0-9_-]+\.js)/);
const jsFile = jsMatch ? jsMatch[1] : null;

// Extract CSS asset hash
const cssMatch = mainHtml.match(/\/assets\/(app-[a-zA-Z0-9_-]+\.css)/);
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

// Replace JS asset path (handle various attribute formats)
enHtml = enHtml.replace(
  /\/assets\/app-[a-zA-Z0-9_-]+\.js/g,
  `/assets/${jsFile}`
);

// Replace CSS asset path
enHtml = enHtml.replace(
  /\/assets\/app-[a-zA-Z0-9_-]+\.css/g,
  `/assets/${cssFile}`
);

// Write updated English index.html
writeFileSync(enIndexPath, enHtml, 'utf-8');

console.log('✅ dist/en/index.html updated with correct asset hashes!');
