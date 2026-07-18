/**
 * Generate missing hairstyle reference images via the platform ImageGenerator.
 *
 * Scans HAIRSTYLE_LIBRARY for ALL entries with missing images.
 * Uses gender-aware model selection: male → male model, female → female, neutral → generic.
 * Converts PNG→webp via sharp, saves to public/hairstyles/<id>/<preference>.webp.
 *
 * Resume-safe: skips files that already exist.
 * Sequential generation (Ollama ~1–3 min per image), 180s timeout per image.
 * Logs one line per image; summarizes at end.
 *
 * Usage (background):
 *   IMAGE_PROVIDER=ollama pnpm exec tsx scripts/generate-hairstyle-refs.ts
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { HAIRSTYLE_LIBRARY } from '../src/lib/hairstyle-recommendation/catalog';
import { buildStylePreviewPrompt } from '../src/lib/hairstyle-recommendation/prompt';
import { getImageGenerator } from '../src/lib/ai/factory';

interface GenerationResult {
  id: string;
  name: string;
  preference: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // Ignore "already exists" errors
  }
}

async function generateImage(
  entry: typeof HAIRSTYLE_LIBRARY[0]
): Promise<GenerationResult> {
  const outDir = path.join(process.cwd(), 'public', 'hairstyles', entry.id);
  const outPath = path.join(outDir, `${entry.preference}.webp`);

  try {
    // Resume-safety: skip if file already exists
    try {
      await fs.access(outPath);
      return {
        id: entry.id,
        name: entry.name.en,
        preference: entry.preference,
        status: 'skipped',
        reason: 'exists',
      };
    } catch {
      // File does not exist, proceed with generation
    }

    const generator = getImageGenerator();
    if (!generator) {
      return {
        id: entry.id,
        name: entry.name.en,
        preference: entry.preference,
        status: 'failed',
        reason: 'no provider',
      };
    }

    // Gender-aware model selection: derive from entry.genders
    let genderForPrompt: 'male' | 'female' | undefined = undefined;
    if (entry.genders.length === 1) {
      genderForPrompt = entry.genders[0] as 'male' | 'female';
    } else if (entry.genders.includes('male') && entry.genders.includes('female')) {
      // Unisex: use preference to pick male/female model, or leave undefined for generic
      if (entry.preference === 'masculine') {
        genderForPrompt = 'male';
      } else if (entry.preference === 'feminine') {
        genderForPrompt = 'female';
      }
      // else: neutral → undefined → generic model
    }

    // One progress line per image
    const genderLabel = genderForPrompt || 'generic';
    console.log(`[${entry.id}] ${entry.name.en} (${entry.preference}, ${genderLabel})...`);

    const prompt = buildStylePreviewPrompt(entry, genderForPrompt);

    // Generate with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    try {
      const imageResult = await Promise.race([
        generator.generateImage({
          prompt,
          width: 768,
          height: 960,
        }),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener('abort', () => {
            reject(new Error('timeout'));
          })
        ),
      ]);

      clearTimeout(timeoutId);

      // Decode base64 to buffer
      const imageBuffer = Buffer.from(imageResult.data, 'base64');

      // Convert to webp via sharp
      await ensureDir(outDir);
      await sharp(imageBuffer)
        .resize(768, 960, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outPath);

      const stats = await fs.stat(outPath);
      console.log(`  ✓ ${Math.round(stats.size / 1024)}KB`);

      return {
        id: entry.id,
        name: entry.name.en,
        preference: entry.preference,
        status: 'success',
      };
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ✗ ${message}`);
    return {
      id: entry.id,
      name: entry.name.en,
      preference: entry.preference,
      status: 'failed',
      reason: message.substring(0, 50),
    };
  }
}

async function main(): Promise<void> {
  console.log('Hairstyle Reference Image Generator');
  console.log('=====================================\n');

  const imageProvider = process.env.IMAGE_PROVIDER || 'unset';
  console.log(`IMAGE_PROVIDER: ${imageProvider}`);
  console.log(`Scanning for ALL missing hairstyle images...\n`);

  const results: GenerationResult[] = [];

  // Sequential generation: process ALL catalog entries
  for (const entry of HAIRSTYLE_LIBRARY) {
    const result = await generateImage(entry);
    results.push(result);
    if (result.status !== 'skipped') {
      // Small delay between requests to avoid overwhelming local Ollama
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n=====================================');
  console.log('Summary');
  console.log('=====================================');

  const byStatus = results.reduce(
    (acc, r) => {
      acc[r.status] ??= [];
      acc[r.status].push(r);
      return acc;
    },
    {} as Record<string, GenerationResult[]>
  );

  if (byStatus.success) {
    console.log(`\n✓ Success (${byStatus.success.length}):`);
    byStatus.success.forEach((r) =>
      console.log(`  - ${r.id} (${r.preference})`)
    );
  }

  if (byStatus.skipped) {
    console.log(`\n⊘ Skipped (${byStatus.skipped.length}):`);
    byStatus.skipped.forEach((r) =>
      console.log(`  - ${r.id}: ${r.reason}`)
    );
  }

  if (byStatus.failed) {
    console.log(`\n✗ Failed (${byStatus.failed.length}):`);
    byStatus.failed.forEach((r) =>
      console.log(`  - ${r.id}: ${r.reason}`)
    );
  }

  const successCount = byStatus.success?.length || 0;
  const failCount = byStatus.failed?.length || 0;
  const skipCount = byStatus.skipped?.length || 0;

  console.log(
    `\nTotal: ${successCount} generated, ${failCount} failed, ${skipCount} skipped (${HAIRSTYLE_LIBRARY.length} entries).`
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
