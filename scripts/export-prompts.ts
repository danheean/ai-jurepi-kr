/**
 * Export production hairstyle recommendation prompts to JSON
 * for use in the evaluation harness (evals/).
 *
 * Reads:
 * - Prompt builders from src/lib/hairstyle-recommendation/prompt.ts
 * - Catalog and matching from src/lib/hairstyle-recommendation/catalog.ts
 *
 * Outputs:
 * - evals/hairstyle/prompts.generated.json with:
 *   - Analyze prompts (ko + en)
 *   - Recommend prompts for representative inputs (ko + en)
 *   - Candidate lists for each recommend input
 *   - FaceAnalysis and ProviderRecommendation JSON schemas
 *   - Generation metadata (timestamp, source files)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Import the prompt builders.
 * Must match the actual exports from the production code.
 */
import {
  buildAnalyzePrompt,
  buildRecommendPrompt,
} from '../src/lib/hairstyle-recommendation/prompt';

import {
  HAIRSTYLE_LIBRARY,
  matchCandidates,
} from '../src/lib/hairstyle-recommendation/catalog';

import type { HairstyleLibraryEntry } from '../src/lib/hairstyle-recommendation/types';
import type { RecommendInput } from '../src/lib/hairstyle-recommendation/schema';

/**
 * Representative inputs for recommendation evaluation.
 * Include both gender variants (even if not yet in schema, passed loosely).
 */
const representativeInputs = [
  {
    faceShape: 'round' as const,
    preference: 'neutral' as const,
    length: undefined,
    hairType: undefined,
    occasion: 'daily' as const,
    locale: 'ko' as const,
    gender: 'male', // Loose pass-through; may not be in schema yet
  },
  {
    faceShape: 'round' as const,
    preference: 'neutral' as const,
    length: undefined,
    hairType: undefined,
    occasion: 'daily' as const,
    locale: 'en' as const,
    gender: 'female', // Loose pass-through
  },
  {
    faceShape: 'oval' as const,
    preference: 'feminine' as const,
    length: 'long' as const,
    hairType: 'wavy' as const,
    occasion: 'event' as const,
    locale: 'ko' as const,
    gender: 'female', // Loose pass-through
  },
];

interface ExportedPrompt {
  locale: 'ko' | 'en';
  prompt: string;
}

interface RecommendationPromptData extends ExportedPrompt {
  input: Record<string, unknown>;
  candidates: HairstyleLibraryEntry[];
}

interface ExportedData {
  generatedAt: string;
  sourceFiles: string[];
  analyzePrompts: ExportedPrompt[];
  recommendPrompts: RecommendationPromptData[];
  schemas: {
    faceAnalysis: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
    providerRecommendation: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

const exportData: ExportedData = {
  generatedAt: new Date().toISOString(),
  sourceFiles: [
    'src/lib/hairstyle-recommendation/prompt.ts',
    'src/lib/hairstyle-recommendation/catalog.ts',
  ],
  analyzePrompts: [
    { locale: 'ko', prompt: buildAnalyzePrompt('ko') },
    { locale: 'en', prompt: buildAnalyzePrompt('en') },
  ],
  recommendPrompts: [],
  schemas: {
    faceAnalysis: {
      type: 'object',
      properties: {
        faceShape: {
          type: 'string',
          enum: [
            'oval',
            'round',
            'square',
            'heart',
            'oblong',
            'diamond',
            'triangle',
          ],
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        features: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 5,
        },
        gender: {
          type: 'string',
          enum: ['male', 'female', 'unknown'],
          description: 'Detected or inferred gender',
        },
        notes: { type: 'string', maxLength: 240 },
      },
      required: ['faceShape', 'confidence', 'features', 'gender'],
    },
    providerRecommendation: {
      type: 'object',
      properties: {
        hairstyleId: { type: 'string' },
        reason: { type: 'string', maxLength: 280 },
        tips: {
          type: 'array',
          items: { type: 'string', maxLength: 120 },
          minItems: 1,
          maxItems: 3,
        },
      },
      required: ['hairstyleId', 'reason', 'tips'],
    },
  },
};

/**
 * Generate recommendation prompts for each representative input.
 * Loosely pass gender through even if not in schema (for future compatibility).
 */
for (const inputRaw of representativeInputs) {
  const { gender, ...inputFields } = inputRaw;
  const input = inputFields as RecommendInput;

  // Match candidates using production logic
  const candidates = matchCandidates({
    faceShape: input.faceShape,
    preference: input.preference,
    length: input.length,
    hairType: input.hairType,
  });

  const prompt = buildRecommendPrompt(input, candidates, input.locale);

  exportData.recommendPrompts.push({
    locale: input.locale,
    prompt,
    input: { ...inputFields, gender }, // Include gender in export even if not validated
    candidates,
  });
}

// Write to evals/hairstyle/prompts.generated.json
const outputDir = path.join(
  process.cwd(),
  'evals',
  'hairstyle'
);
const outputFile = path.join(outputDir, 'prompts.generated.json');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2), 'utf8');

console.log(`✓ Exported prompts to ${outputFile}`);
console.log(
  `  - ${exportData.analyzePrompts.length} analyze prompts (ko + en)`
);
console.log(
  `  - ${exportData.recommendPrompts.length} recommendation prompts with candidates`
);
console.log(
  `  - Generated at ${exportData.generatedAt}`
);
