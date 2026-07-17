/**
 * Hairstyle Recommendation Domain Types
 *
 * STUB: ai-integration-engineer will refine with real AI provider contracts
 */

export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'oblong'
  | 'diamond'
  | 'triangle';

export interface FaceAnalysis {
  faceShape: FaceShape;
  confidence: number; // 0–1
  features: string[]; // e.g., ["symmetric", "wide-forehead"]
  notes?: string;
}

export interface RecommendInput {
  faceShape: FaceShape;
  preference: 'neutral' | 'casual' | 'formal' | 'trendy';
  hairType?: 'straight' | 'wavy' | 'curly';
  maintenanceLevel?: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  hairstyleId: string;
  name: string;
  reason: string;
  confidence: number;
  imageUrl: string;
}

/**
 * Port Interface: domain abstraction for AI capability
 * Implementations (adapters) are provider-specific (GeminiProvider, etc.)
 * Route handlers ONLY call these methods; no SDK logic in routes.
 */
export interface HairstyleAI {
  analyzeFace(
    image: Buffer,
    locale: 'ko' | 'en',
    systemPrompt?: string
  ): Promise<FaceAnalysis>;

  recommend(
    input: RecommendInput,
    candidateIds: string[],
    locale: 'ko' | 'en',
    systemPrompt?: string
  ): Promise<Recommendation[]>;
}
