/**
 * TEMPORARY diagnostics route — presence/names only, NEVER values.
 * Added to debug prod env resolution; delete after use.
 */

import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  getAiProvider,
  getImageProvider,
  getGeminiApiKey,
  getGeminiModel,
} from '@/lib/ai/env';

export async function GET() {
  let contextKeys: string[] | null = null;
  let contextError: string | null = null;
  try {
    contextKeys = Object.keys(getCloudflareContext().env ?? {});
  } catch (err) {
    contextError = err instanceof Error ? err.message : 'unknown';
  }

  return NextResponse.json({
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
