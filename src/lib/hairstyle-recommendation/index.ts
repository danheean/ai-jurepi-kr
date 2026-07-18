/**
 * Hairstyle Recommendation Domain Layer
 *
 * Public API barrel for the domain layer. Exports all types, constants,
 * and pure functions. No AI provider SDK imports here.
 */

// Constants
export {
  FACE_SHAPES,
  PREFERENCES,
  LENGTHS,
  HAIR_TYPES,
  OCCASIONS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_EDGE_PX,
  JPEG_QUALITY,
  MIN_RECS,
  MAX_RECS,
  RATE_LIMIT_ANALYZE_PER_MIN,
  RATE_LIMIT_RECOMMEND_PER_MIN,
  PREVIEW_RATE_LIMIT_PER_MIN,
  PREVIEW_IMAGE_WIDTH,
  PREVIEW_IMAGE_HEIGHT,
  PREVIEW_CONCURRENCY,
  PREVIEW_TIMEOUT_MS,
  type FaceShape,
  type Preference,
  type Length,
  type HairType,
  type Occasion,
  type AllowedImageType,
} from './constants';

// Types
export {
  type FaceAnalysis,
  type RecommendInput,
  type Recommendation,
  type HairstyleLibraryEntry,
  type ProviderRecommendation,
  type HairstyleAI,
} from './types';

// Schemas
export {
  FaceShapeSchema,
  PreferenceSchema,
  LengthSchema,
  HairTypeSchema,
  OccasionSchema,
  AllowedImageTypeSchema,
  FaceAnalysisSchema,
  RecommendInputSchema,
  RecommendationSchema,
  HairstyleLibraryEntrySchema,
  ProviderRecommendationSchema,
  AnalyzeRequestSchema,
  RecommendRequestSchema,
  PreviewRequestSchema,
  PreviewResponseSchema,
  parseAnalyzeRequest,
  parseRecommendRequest,
  validateProviderRecommendations,
  type FaceAnalysis as FaceAnalysisFromSchema,
  type RecommendInput as RecommendInputFromSchema,
  type Recommendation as RecommendationFromSchema,
  type HairstyleLibraryEntry as HairstyleLibraryEntryFromSchema,
  type ProviderRecommendation as ProviderRecommendationFromSchema,
  type AnalyzeRequest,
  type RecommendRequest,
  type PreviewRequest,
  type PreviewResponse,
} from './schema';

// Catalog
export {
  HAIRSTYLE_LIBRARY,
  getHairstyleById,
  matchCandidates,
  attachCatalog,
  backfill,
} from './catalog';

// Prompts
export { buildAnalyzePrompt, buildRecommendPrompt, buildStylePreviewPrompt } from './prompt';

// Flow State Machine (domain pure reducer)
export {
  flowReducer,
  initialFlowState,
  selectNextPreviewTarget,
  type FlowState,
  type FlowAction,
  type FlowStage,
  type Photo,
  type PreviewState,
} from './flow';
