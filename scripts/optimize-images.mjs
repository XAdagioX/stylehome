// Additive image optimization: generate WebP for all raster images, AVIF for key
// large images. Originals are never modified or deleted — only siblings are added.
// Usage: node scripts/optimize-images.mjs
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, dirname, basename } from 'node:path';
import sharp from 'sharp';

const ROOTS = ['img', 'public/img'];
const RASTER = new Set(['.jpg', '.jpeg', '.png']);
// Key images that also get an AVIF (backgrounds, hero, service/subpage hero shots)
const AVIF_HINTS = ['background', 'hero', 'kitchen', 'bathroom', 'panel', 'home', 'photo', 'renovation', 'wood'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (RASTER.has(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

// Skip target if it exists and is newer than the source
function fresh(src, target) {
  return existsSync(target) && statSync(target).mtimeMs >= statSync(src).mtimeMs;
}

const files = ROOTS.filter(existsSync).flatMap((r) => walk(r));
let webpMade = 0, avifMade = 0, srcBytes = 0, webpBytes = 0, avifBytes = 0, skipped = 0;

for (const src of files) {
  const stem = join(dirname(src), basename(src, extname(src)));
  const webp = `${stem}.webp`;
  const avif = `${stem}.avif`;
  srcBytes += statSync(src).size;
  const wantAvif = AVIF_HINTS.some((h) => src.toLowerCase().includes(h));

  try {
    if (!fresh(src, webp)) {
      await sharp(src).webp({ quality: 80 }).toFile(webp);
      webpMade++;
    } else skipped++;
    webpBytes += existsSync(webp) ? statSync(webp).size : 0;

    if (wantAvif) {
      if (!fresh(src, avif)) {
        await sharp(src).avif({ quality: 55, effort: 4 }).toFile(avif);
        avifMade++;
      }
      avifBytes += existsSync(avif) ? statSync(avif).size : 0;
    }
  } catch (e) {
    console.error('FAIL', src, e.message);
  }
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
console.log(`Sources scanned: ${files.length}`);
console.log(`WebP created: ${webpMade} (skipped up-to-date: ${skipped})`);
console.log(`AVIF created: ${avifMade}`);
console.log(`Original raster total: ${mb(srcBytes)}`);
console.log(`WebP total:            ${mb(webpBytes)}`);
console.log(`AVIF total (key only): ${mb(avifBytes)}`);
