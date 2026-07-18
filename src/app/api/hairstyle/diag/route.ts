/**
 * TEMPORARY diagnostics route — presence/names only, NEVER values.
 * Added to debug prod env resolution; delete after use.
 */

import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import {
  getAiProvider,
  getImageProvider,
  getGeminiApiKey,
  getGeminiModel,
} from '@/lib/ai/env';
import { getStructuredModel } from '@/lib/ai/factory';

export async function GET() {
  let contextKeys: string[] | null = null;
  let contextError: string | null = null;
  try {
    contextKeys = Object.keys(getCloudflareContext().env ?? {});
  } catch (err) {
    contextError = err instanceof Error ? err.message : 'unknown';
  }

  // Live probe: one trivial structured call; error MESSAGE only (never values)
  let probe: string;
  try {
    const model = getStructuredModel();
    const out = await model.generateJson({
      prompt: 'Return exactly this JSON: {"ok": true}',
      schema: z.object({ ok: z.boolean() }),
      maxRetries: 0,
    });
    probe = `success: ${JSON.stringify(out)}`;
  } catch (err) {
    probe = `error: ${err instanceof Error ? `${err.name}/${err.message}` : 'unknown'}`;
  }

  return NextResponse.json({
    probe,
    contextKeys,
    contextError,
    processEnvAiKeys: Object.keys(process.env).filter((k) =>
      /GEMINI|GOOGLE|ANTHROPIC|AI_PROVIDER|IMAGE_PROVIDER|OLLAMA/.test(k)
    ),
    resolved: {
      aiProvider: getAiProvider(),
      imageProvider: getImageProvider() ?? null,
      geminiModel: getGeminiModel(),
      hasGeminiKey: Boolean(getGeminiApiKey()),
    },
  });
}
