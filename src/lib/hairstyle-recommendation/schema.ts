/**
 * Zod Schemas for Hairstyle Recommendation API
 *
 * STUB: ai-integration-engineer will refine with real validation rules
 */

import { z } from 'zod';
import type { FaceAnalysis, Recommendation, RecommendInput } from './types';

export const FaceShapeSchema = z.enum([
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
  'triangle',
]);

export const FaceAnalysisSchema: z.ZodType<FaceAnalysis> = z.object({
  faceShape: FaceShapeSchema,
  confidence: z.number().min(0).max(1),
  features: z.array(z.string()),
  notes: z.string().optional(),
});

export const RecommendInputSchema: z.ZodType<RecommendInput> = z.object({
  faceShape: FaceShapeSchema,
  preference: z.enum(['neutral', 'casual', 'formal', 'trendy']),
  hairType: z.enum(['straight', 'wavy', 'curly']).optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
});

export const RecommendationSchema: z.ZodType<Recommendation> = z.object({
  hairstyleId: z.string(),
  name: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  imageUrl: z.string().url(),
});

/**
 * Request Schemas
 */
export const AnalyzeRequestSchema = z.object({
  image: z.string().describe('Base64-encoded image data'),
  locale: z.enum(['ko', 'en']),
});

export const RecommendRequestSchema = z.object({
  faceShape: FaceShapeSchema,
  preference: z.enum(['neutral', 'casual', 'formal', 'trendy']),
  locale: z.enum(['ko', 'en']),
  hairType: z.enum(['straight', 'wavy', 'curly']).optional(),
  maintenanceLevel: z.enum(['low', 'medium', 'high']).optional(),
});
