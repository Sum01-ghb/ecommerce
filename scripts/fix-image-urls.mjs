/**
 * fix-image-urls.mjs
 *
 * One-time migration: updates product_images.url in the DB from the old
 * broken `/static/uploads/shoes/<slug>/primary.<ext>` paths to the correct
 * `/shoes/shoe-N.<ext>` paths that are committed in public/shoes/ and served
 * by Next.js / Vercel as static assets.
 *
 * Run once:  node scripts/fix-image-urls.mjs
 *
 * Safe to re-run — paths that already start with /shoes/ are skipped.
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

// ─────────────────────────────────────────────────────────────────────────────
// Mapping: old slug-based path fragment → correct /shoes/shoe-N.ext URL
//
// Derived from src/db/seed.ts product order (index = shoe number).
// The old seed produced:  /static/uploads/shoes/<slugified-name>/primary.<ext>
// ─────────────────────────────────────────────────────────────────────────────
const SLUG_TO_CORRECT_URL = {
  'nike-air-force-1-mid-07':             '/shoes/shoe-1.jpg',
  'nike-court-vision-low-next-nature':   '/shoes/shoe-2.webp',
  'nike-dunk-low-premium':               '/shoes/shoe-3.webp',
  'nike-air-max-270':                    '/shoes/shoe-4.webp',
  'nike-pegasus-41':                     '/shoes/shoe-5.avif',
  'air-jordan-1-retro-high-og':          '/shoes/shoe-6.avif',
  'nike-zoomx-vaporfly-next-3':          '/shoes/shoe-7.avif',
  'nike-react-presto':                   '/shoes/shoe-8.avif',
  'nike-air-max-97':                     '/shoes/shoe-9.avif',
  'nike-invincible-3':                   '/shoes/shoe-10.avif',
  'nike-air-zoom-pegasus-trail-4':       '/shoes/shoe-11.avif',
  'nike-blazer-mid-77-vintage':          '/shoes/shoe-12.avif',
  'nike-free-run-5-0':                   '/shoes/shoe-13.avif',
  'nike-air-huarache':                   '/shoes/shoe-14.avif',
  'nike-revolution-7':                   '/shoes/shoe-15.avif',
};

// Extra image for Nike Air Max 270 (extra-1 → shoe-5.avif)
const EXTRA_SLUG_TO_CORRECT_URL = {
  'nike-air-max-270-extra-1': '/shoes/shoe-5.avif',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract slug from old path
//   /static/uploads/shoes/<slug>/primary.<ext>  → <slug>
//   /static/uploads/shoes/<slug>/extra-N.<ext>  → <slug>-extra-N
// ─────────────────────────────────────────────────────────────────────────────
function extractKey(url) {
  // Normalise slashes
  const parts = url.replace(/\\/g, '/').split('/');
  // Expected: ['', 'static', 'uploads', 'shoes', '<slug>', '<file>']
  const slugIndex = parts.indexOf('shoes') + 1;
  const slug = parts[slugIndex] ?? '';
  const file = parts[slugIndex + 1] ?? '';

  if (file.startsWith('extra-')) {
    const n = file.split('.')[0]; // e.g. "extra-1"
    return `${slug}-${n}`;
  }
  return slug;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to database.\n');

// Fetch all rows that still need fixing
const { rows } = await client.query(
  "SELECT id, url FROM product_images WHERE url LIKE '/static/uploads/%'"
);

if (rows.length === 0) {
  console.log('✅  No rows to update — all image URLs are already correct.');
  await client.end();
  process.exit(0);
}

console.log(`Found ${rows.length} row(s) to update:\n`);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const key = extractKey(row.url);
  const correctUrl =
    EXTRA_SLUG_TO_CORRECT_URL[key] ?? SLUG_TO_CORRECT_URL[key];

  if (!correctUrl) {
    console.warn(`  ⚠  No mapping found for: ${row.url}  (key="${key}")`);
    skipped++;
    continue;
  }

  await client.query(
    'UPDATE product_images SET url = $1 WHERE id = $2',
    [correctUrl, row.id]
  );

  console.log(`  ✓  ${row.url}`);
  console.log(`     → ${correctUrl}`);
  updated++;
}

await client.end();

console.log(`\nDone. ${updated} updated, ${skipped} skipped.\n`);
