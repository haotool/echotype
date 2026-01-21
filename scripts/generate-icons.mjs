#!/usr/bin/env node
/**
 * EchoType - Icon Generator Script
 * Generates PNG icons from SVG source at various sizes
 * 
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const ICONS_DIR = join(ROOT_DIR, 'icons');

// Icon sizes required by Chrome Extension
const SIZES = [16, 32, 48, 128];

// SVG source - keep original colors (gradient)
const svgSource = readFileSync(join(ICONS_DIR, 'icon.svg'), 'utf-8');

async function generateIcons() {
  console.log('🎨 Generating EchoType icons...\n');

  for (const size of SIZES) {
    const outputPath = join(ICONS_DIR, `icon-${size}.png`);
    
    try {
      await sharp(Buffer.from(svgSource))
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toFile(outputPath);
      
      console.log(`  ✓ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`  ✗ Failed to generate icon-${size}.png:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
