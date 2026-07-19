/**
 * Generate the 7 face-shape reference images via the platform ImageGenerator.
 *
 * Neutral portraits (no hairstyle emphasis) illustrating each face shape's
 * proportions, shown in the RAIL when a user picks a face shape manually
 * (no photo uploaded) — mirrors generate-hairstyle-refs.ts.
 *
 * Converts PNG→webp via sharp, saves to public/face-shapes/<shape>.webp.
 * Resume-safe: skips files that already exist. Sequential, 180s timeout per image.
 *
 * Usage (background, one-time run):
 *   IMAGE_PROVIDER=ollama pnpm exec tsx scripts/generate-face-shape-refs.ts
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { FACE_SHAPES, type FaceShape } from '../src/lib/hairstyle-recommendation/constants';
import { buildFaceShapeReferencePrompt } from '../src/lib/hairstyle-recommendation/prompt';
import { getImageGenerator } from '../src/lib/ai/factory';

interface GenerationResult {
  shape: FaceShape;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Ignore "already exists" errors
  }
}

async function generateImage(shape: FaceShape): Promise<GenerationResult> {
  const outDir = path.join(process.cwd(), 'public', 'face-shapes');
  const outPath = path.join(outDir, `${shape}.webp`);

  try {
    // Resume-safety: skip if file already exists
    try {
      await fs.access(outPath);
      return { shape, status: 'skipped', reason: 'exists' };
    } catch {
      // File does not exist, proceed with generation
    }

    const generator = getImageGenerator();
    if (!generator) {
      return { shape, status: 'failed', reason: 'no provider' };
    }

    console.log(`[${shape}] generating...`);

    const prompt = buildFaceShapeReferencePrompt(shape);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    try {
      const imageResult = await Promise.race([
        generator.generateImage({ prompt, width: 768, height: 960 }),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener('abort', () => {
            reject(new Error('timeout'));
          })
        ),
      ]);

      clearTimeout(timeoutId);

      const imageBuffer = Buffer.from(imageResult.data, 'base64');

      await ensureDir(outDir);
      await sharp(imageBuffer)
        .resize(768, 960, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outPath);

      const stats = await fs.stat(outPath);
      console.log(`  ✓ ${Math.round(stats.size / 1024)}KB`);

      return { shape, status: 'success' };
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ✗ ${message}`);
    return { shape, status: 'failed', reason: message.substring(0, 50) };
  }
}

async function main(): Promise<void> {
  console.log('Face-Shape Reference Image Generator');
  console.log('=====================================\n');

  const imageProvider = process.env.IMAGE_PROVIDER || 'unset';
  console.log(`IMAGE_PROVIDER: ${imageProvider}`);
  console.log(`Scanning for missing face-shape images (${FACE_SHAPES.length} total)...\n`);

  const results: GenerationResult[] = [];

  for (const shape of FACE_SHAPES) {
    const result = await generateImage(shape);
    results.push(result);
    if (result.status !== 'skipped') {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

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
    byStatus.success.forEach((r) => console.log(`  - ${r.shape}`));
  }

  if (byStatus.skipped) {
    console.log(`\n⊘ Skipped (${byStatus.skipped.length}):`);
    byStatus.skipped.forEach((r) => console.log(`  - ${r.shape}: ${r.reason}`));
  }

  if (byStatus.failed) {
    console.log(`\n✗ Failed (${byStatus.failed.length}):`);
    byStatus.failed.forEach((r) => console.log(`  - ${r.shape}: ${r.reason}`));
  }

  const successCount = byStatus.success?.length || 0;
  const failCount = byStatus.failed?.length || 0;
  const skipCount = byStatus.skipped?.length || 0;

  console.log(
    `\nTotal: ${successCount} generated, ${failCount} failed, ${skipCount} skipped (${FACE_SHAPES.length} shapes).`
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
