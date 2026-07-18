/**
 * Hairstyle Recommendation Catalog
 *
 * Curated static hairstyle library with ≥24 entries spanning all 7 face shapes × 3 preferences.
 * Pure matching functions with no side effects.
 *
 * SPEC: All hairstyles must have:
 * - id (kebab-case, stable)
 * - bilingual names (ko/en)
 * - suitableFaceShapes (subset of 7 shapes)
 * - genders (rev 2: male/female or both for unisex)
 * - preference (feminine/masculine/neutral)
 * - length (short/medium/long)
 * - hairType[] (subset of 4 types)
 * - image (src, alt, credit, license)
 * - tags (semantic keywords)
 */

import type {
  HairstyleLibraryEntry,
  Recommendation,
  ProviderRecommendation,
} from './types';
import type { FaceShape, Preference, Length, HairType, Gender } from './constants';
import { MAX_RECS, MIN_RECS } from './constants';
import {
  buildBackfillReason,
  buildBackfillHairTypeTip,
  buildBackfillLengthTip,
} from './locale-templates';

/**
 * Curated hairstyle library: ≥24 entries covering all combinations
 *
 * Image paths follow the pattern: /hairstyles/<id>/<preference>.webp
 * Images are static assets — this catalog only defines metadata.
 */
export const HAIRSTYLE_LIBRARY: HairstyleLibraryEntry[] = [
  // ============================================================================
  // OVAL FACE (versatile, suits most styles)
  // ============================================================================

  // Oval + Feminine
  {
    id: 'soft-layered-bob',
    name: { ko: '소프트 레이어드 밥', en: 'Soft Layered Bob' },
    suitableFaceShapes: ['oval', 'round', 'heart'],
    genders: ['female'],
    preference: 'feminine',
    length: 'short',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/soft-layered-bob/feminine.webp',
      alt: 'Soft layered bob with face-framing layers',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'modern', 'low-maintenance', 'face-framing'],
  },

  {
    id: 'long-waves',
    name: { ko: '롱 웨이브', en: 'Long Waves' },
    suitableFaceShapes: ['oval', 'diamond', 'heart'],
    genders: ['female'],
    preference: 'feminine',
    length: 'long',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/long-waves/feminine.webp',
      alt: 'Long waves with soft texture',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'romantic', 'textured', 'volume'],
  },

  {
    id: 'wispy-bangs-medium',
    name: { ko: '위스피 뱅 미디움', en: 'Wispy Bangs Medium' },
    suitableFaceShapes: ['oval', 'square', 'oblong'],
    genders: ['female'],
    preference: 'feminine',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/wispy-bangs-medium/feminine.webp',
      alt: 'Medium length with wispy face-framing bangs',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'face-framing', 'bangs', 'soft'],
  },

  // Oval + Masculine
  {
    id: 'textured-crew-cut',
    name: { ko: '텍스처 크루컷', en: 'Textured Crew Cut' },
    suitableFaceShapes: ['oval', 'square', 'diamond'],
    genders: ['male'],
    preference: 'masculine',
    length: 'short',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/textured-crew-cut/masculine.webp',
      alt: 'Short textured crew cut',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['masculine', 'modern', 'clean', 'versatile'],
  },

  {
    id: 'taper-fade-medium',
    name: { ko: '테이퍼 페이드 미디움', en: 'Taper Fade Medium' },
    suitableFaceShapes: ['oval', 'round', 'heart'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/taper-fade-medium/masculine.webp',
      alt: 'Medium length with tapered fade sides',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['masculine', 'sharp', 'professional', 'clean-lines'],
  },

  {
    id: 'long-curtain-haircut',
    name: { ko: '롱 커튼 커트', en: 'Long Curtain Haircut' },
    suitableFaceShapes: ['oval', 'oblong', 'heart'],
    genders: ['male', 'female'],
    preference: 'masculine',
    length: 'long',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/long-curtain-haircut/masculine.webp',
      alt: 'Long length with center part curtain style',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['masculine', 'edgy', 'textured', 'trendy'],
  },

  // Oval + Neutral
  {
    id: 'shoulder-length-straight',
    name: { ko: '숄더 렝스 스트레이트', en: 'Shoulder Length Straight' },
    suitableFaceShapes: ['oval', 'oblong', 'diamond'],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/shoulder-length-straight/neutral.webp',
      alt: 'Shoulder length straight hair',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'versatile', 'timeless', 'professional'],
  },

  {
    id: 'modern-pixie',
    name: { ko: '모던 픽시', en: 'Modern Pixie' },
    suitableFaceShapes: ['oval', 'diamond', 'heart'],
    genders: ['female'],
    preference: 'neutral',
    length: 'short',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/modern-pixie/neutral.webp',
      alt: 'Modern short pixie cut',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'bold', 'low-maintenance', 'chic'],
  },

  {
    id: 'sleek-long-bob',
    name: { ko: '슬릭 롱밥', en: 'Sleek Long Bob' },
    suitableFaceShapes: ['oval', 'square', 'oblong'],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['straight'],
    image: {
      src: '/hairstyles/sleek-long-bob/neutral.webp',
      alt: 'Sleek long bob with blunt ends',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'sophisticated', 'minimalist', 'professional'],
  },

  // ============================================================================
  // ROUND FACE (narrow at jaw, soften with length/height)
  // ============================================================================

  {
    id: 'high-layers-height',
    name: { ko: '하이 레이어 높이', en: 'High Layers Height' },
    suitableFaceShapes: ['round', 'heart', 'triangle'],
    genders: ['female'],
    preference: 'feminine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/high-layers-height/feminine.webp',
      alt: 'Medium length with layers creating height at crown',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'volume', 'lengthening', 'flattering'],
  },

  {
    id: 'side-swept-volume',
    name: { ko: '사이드 스윕 볼륨', en: 'Side Swept Volume' },
    suitableFaceShapes: ['round', 'diamond'],
    genders: ['female'],
    preference: 'feminine',
    length: 'long',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/side-swept-volume/feminine.webp',
      alt: 'Long hair with side-swept volume',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'glamorous', 'volume', 'elongating'],
  },

  {
    id: 'sharp-undercut-masculine',
    name: { ko: '샤프 언더컷 마스큘린', en: 'Sharp Undercut' },
    suitableFaceShapes: ['round', 'square', 'triangle'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/sharp-undercut-masculine/masculine.webp',
      alt: 'Medium with sharp undercut and top volume',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['masculine', 'modern', 'structured', 'defining'],
  },

  // ============================================================================
  // SQUARE FACE (angular jaw, soften with waves/length)
  // ============================================================================

  {
    id: 'soft-waves-cheekbones',
    name: { ko: '소프트 웨이브 광대뼈', en: 'Soft Waves Cheekbones' },
    suitableFaceShapes: ['square', 'oblong', 'diamond'],
    genders: ['female'],
    preference: 'feminine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/soft-waves-cheekbones/feminine.webp',
      alt: 'Soft waves emphasizing cheekbones',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'softening', 'cheekbone-framing', 'romantic'],
  },

  {
    id: 'angled-lob-sharp',
    name: { ko: '앵글 롭 샤프', en: 'Angled Lob Sharp' },
    suitableFaceShapes: ['square', 'round'],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/angled-lob-sharp/neutral.webp',
      alt: 'Angled lob with sharp ends',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'defined', 'modern', 'edge'],
  },

  // ============================================================================
  // HEART FACE (wider forehead, narrow chin, flatter at temples)
  // ============================================================================

  {
    id: 'chin-length-volume',
    name: { ko: '턱 길이 볼륨', en: 'Chin Length Volume' },
    suitableFaceShapes: ['heart', 'diamond', 'triangle'],
    genders: ['female'],
    preference: 'feminine',
    length: 'short',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/chin-length-volume/feminine.webp',
      alt: 'Chin length with fullness at jawline',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'face-widening', 'volume', 'flattering'],
  },

  {
    id: 'temple-hugging-short',
    name: { ko: '템플 허깅 숏', en: 'Temple Hugging Short' },
    suitableFaceShapes: ['heart', 'oblong'],
    genders: ['female'],
    preference: 'neutral',
    length: 'short',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/temple-hugging-short/neutral.webp',
      alt: 'Short cut hugging temples',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'balancing', 'modern', 'geometric'],
  },

  // ============================================================================
  // OBLONG FACE (long and narrow, add width at sides)
  // ============================================================================

  {
    id: 'voluminous-bob-width',
    name: { ko: '볼륨 밥 너비', en: 'Voluminous Bob Width' },
    suitableFaceShapes: ['oblong', 'triangle', 'diamond'],
    genders: ['female'],
    preference: 'feminine',
    length: 'short',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/voluminous-bob-width/feminine.webp',
      alt: 'Voluminous bob adding width',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'width-creating', 'flattering', 'textured'],
  },

  {
    id: 'side-part-fluff',
    name: { ko: '사이드 파트 플러프', en: 'Side Part Fluff' },
    suitableFaceShapes: ['oblong', 'heart'],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/side-part-fluff/neutral.webp',
      alt: 'Side-parted style with side volume',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'width-adding', 'textured', 'effortless'],
  },

  // ============================================================================
  // DIAMOND FACE (narrow at forehead/jaw, wide at cheekbones)
  // ============================================================================

  {
    id: 'forehead-framing-waves',
    name: { ko: '이마 프레이밍 웨이브', en: 'Forehead Framing Waves' },
    suitableFaceShapes: ['diamond', 'heart', 'triangle'],
    genders: ['female'],
    preference: 'feminine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/forehead-framing-waves/feminine.webp',
      alt: 'Waves framing forehead and temples',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'forehead-covering', 'romantic', 'softening'],
  },

  {
    id: 'cheekbone-sharpener',
    name: { ko: '광대뼈 샤프너', en: 'Cheekbone Sharpener' },
    suitableFaceShapes: ['diamond', 'square', 'oblong'],
    genders: ['female'],
    preference: 'neutral',
    length: 'short',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/cheekbone-sharpener/neutral.webp',
      alt: 'Short cut emphasizing cheekbones',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'defining', 'sharp', 'modern'],
  },

  // ============================================================================
  // TRIANGLE FACE (wider jaw, narrow forehead, add volume at top)
  // ============================================================================

  {
    id: 'crown-volume-length',
    name: { ko: '크라운 볼륨 렝스', en: 'Crown Volume Length' },
    suitableFaceShapes: ['triangle', 'heart', 'oblong'],
    genders: ['female'],
    preference: 'feminine',
    length: 'long',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/crown-volume-length/feminine.webp',
      alt: 'Long hair with crown volume',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['feminine', 'volume-at-crown', 'elongating', 'romantic'],
  },

  {
    id: 'spiky-top-fade',
    name: { ko: '스파이키 탑 페이드', en: 'Spiky Top Fade' },
    suitableFaceShapes: ['triangle', 'round', 'diamond'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/spiky-top-fade/masculine.webp',
      alt: 'Spiky top with faded sides',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['masculine', 'defining', 'modern', 'edgy'],
  },

  // ============================================================================
  // ADDITIONAL VERSATILE STYLES
  // ============================================================================

  {
    id: 'effortless-waves-all',
    name: { ko: '노력없는 웨이브', en: 'Effortless Waves' },
    suitableFaceShapes: [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'triangle',
    ],
    genders: ['female'],
    preference: 'neutral',
    length: 'long',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/effortless-waves-all/neutral.webp',
      alt: 'Universal effortless waves',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'versatile', 'universal', 'flattering'],
  },

  {
    id: 'classic-lob-all',
    name: { ko: '클래식 롭', en: 'Classic Lob' },
    suitableFaceShapes: [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'triangle',
    ],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/classic-lob-all/neutral.webp',
      alt: 'Universal classic lob',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'versatile', 'timeless', 'professional'],
  },

  {
    id: 'tousled-texture-all',
    name: { ko: '투스글드 텍스처', en: 'Tousled Texture' },
    suitableFaceShapes: [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'triangle',
    ],
    genders: ['female'],
    preference: 'neutral',
    length: 'medium',
    hairType: ['wavy', 'curly', 'coily'],
    image: {
      src: '/hairstyles/tousled-texture-all/neutral.webp',
      alt: 'Universal textured tousled style',
      credit: 'Hairstyle reference',
      license: 'Creative Commons',
    },
    tags: ['neutral', 'textured', 'effortless', 'universal'],
  },

  // ============================================================================
  // MASCULINE STYLES (Phase 3 — Korean men's staples)
  // ============================================================================

  {
    id: 'two-block',
    name: { ko: '투블럭', en: 'Two Block' },
    suitableFaceShapes: ['oval', 'square', 'diamond'],
    genders: ['male'],
    preference: 'masculine',
    length: 'short',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/two-block/masculine.webp',
      alt: 'Two block cut with voluminous top and faded sides',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'modern', 'sharp', 'popular'],
  },

  {
    id: 'crop-cut',
    name: { ko: '크롭컷', en: 'Crop Cut' },
    suitableFaceShapes: ['oval', 'round', 'heart'],
    genders: ['male'],
    preference: 'masculine',
    length: 'short',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/crop-cut/masculine.webp',
      alt: 'Short textured crop cut with natural movement',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'low-maintenance', 'textured', 'modern'],
  },

  {
    id: 'dandy-cut',
    name: { ko: '댄디컷', en: 'Dandy Cut' },
    suitableFaceShapes: ['square', 'heart', 'oblong'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/dandy-cut/masculine.webp',
      alt: 'Clean dandy cut with structured styling',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'refined', 'structured', 'classic'],
  },

  {
    id: 'regent',
    name: { ko: '리젠트', en: 'Regent' },
    suitableFaceShapes: ['oval', 'diamond'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/regent/masculine.webp',
      alt: 'Regent style with slicked-back waves',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'classic', 'textured', 'sophisticated'],
  },

  {
    id: 'shadow-perm',
    name: { ko: '쉐도우펌', en: 'Shadow Perm' },
    suitableFaceShapes: ['round', 'triangle'],
    genders: ['male'],
    preference: 'masculine',
    length: 'short',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/shadow-perm/masculine.webp',
      alt: 'Subtle shadow perm with natural waves',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'textured', 'modern', 'volume'],
  },

  {
    id: 'as-perm',
    name: { ko: '애즈펌', en: 'As Perm' },
    suitableFaceShapes: ['square', 'heart'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/as-perm/masculine.webp',
      alt: 'Lighter as perm with textured waves',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'modern', 'textured', 'trendy'],
  },

  {
    id: 'side-part-perm',
    name: { ko: '가르마펌', en: 'Side Part Perm' },
    suitableFaceShapes: ['oblong', 'heart'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/side-part-perm/masculine.webp',
      alt: 'Side-parted style with permed waves',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'classic', 'textured', 'width-adding'],
  },

  {
    id: 'see-through-dandy',
    name: { ko: '시스루 댄디', en: 'See Through Dandy' },
    suitableFaceShapes: ['oval', 'round'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['straight', 'wavy'],
    image: {
      src: '/hairstyles/see-through-dandy/masculine.webp',
      alt: 'Modern see-through dandy with transparent layers',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'modern', 'trendy', 'clean-lines'],
  },

  {
    id: 'buzz-cut',
    name: { ko: '버즈컷', en: 'Buzz Cut' },
    suitableFaceShapes: ['oval', 'square', 'diamond', 'triangle'],
    genders: ['male'],
    preference: 'masculine',
    length: 'short',
    hairType: ['straight', 'wavy', 'curly'],
    image: {
      src: '/hairstyles/buzz-cut/masculine.webp',
      alt: 'Clean buzz cut with even length',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'minimal', 'low-maintenance', 'clean'],
  },

  {
    id: 'wolf-cut-men',
    name: { ko: '남성 울프컷', en: 'Wolf Cut Men' },
    suitableFaceShapes: ['round', 'oblong', 'triangle'],
    genders: ['male'],
    preference: 'masculine',
    length: 'medium',
    hairType: ['wavy', 'curly'],
    image: {
      src: '/hairstyles/wolf-cut-men/masculine.webp',
      alt: 'Textured wolf cut with layered definition',
      credit: 'AI generated',
      license: 'generated',
    },
    tags: ['masculine', 'edgy', 'textured', 'trendy'],
  },
];

/**
 * Get a hairstyle by ID
 */
export function getHairstyleById(id: string): HairstyleLibraryEntry | null {
  return HAIRSTYLE_LIBRARY.find((h) => h.id === id) ?? null;
}

/**
 * Filter hairstyles matching the given criteria.
 *
 * Pure function with no side effects. Returns candidates suitable for the input.
 * Applies hard filters (face shape, gender, preference) then soft filters (length, hairType).
 *
 * Gender hard filter first (rev 2): when input.gender is set, only returns entries
 * whose genders field includes that gender. If the gender-filtered pool would drop
 * below MIN_RECS and the pool itself has entries, preference filtering is relaxed
 * to a soft filter (prefer preference matches but don't exclude non-matches).
 *
 * @returns Array of at least MAX_RECS entries if available; otherwise all matches
 */
export function matchCandidates(input: {
  faceShape: FaceShape;
  gender?: Gender;
  preference?: Preference;
  length?: Length;
  hairType?: HairType;
}): HairstyleLibraryEntry[] {
  let candidates = [...HAIRSTYLE_LIBRARY];

  // Hard filter: face shape must match
  candidates = candidates.filter((h) =>
    h.suitableFaceShapes.includes(input.faceShape)
  );

  // Hard filter: gender must match (rev 2 — applied FIRST before preference)
  if (input.gender) {
    candidates = candidates.filter((h) => h.genders.includes(input.gender!));
  }

  // Hard filter: preference — but relax to soft if gender filter narrows below MIN_RECS
  if (input.preference) {
    const prefMatches = candidates.filter((h) => h.preference === input.preference);

    // If we have enough preference matches (or no gender filter was applied), use preference hard filter
    if (prefMatches.length >= MIN_RECS || !input.gender) {
      candidates = prefMatches;
    } else if (prefMatches.length > 0) {
      // If gender filter was applied and preference matches < MIN_RECS, prefer matches but include all
      candidates = prefMatches.concat(
        candidates.filter((h) => h.preference !== input.preference)
      );
    }
  }

  // Soft filter: prioritize matching length and hairType, but include all
  // if we don't have enough exact matches
  if (input.length) {
    const exactMatches = candidates.filter((h) => h.length === input.length);
    if (exactMatches.length >= MAX_RECS) {
      return exactMatches;
    }
    // If not enough exact matches, keep all and rely on provider to pick best
    if (exactMatches.length > 0) {
      candidates = exactMatches.concat(
        candidates.filter((h) => h.length !== input.length)
      );
    }
  }

  if (input.hairType) {
    const hairType = input.hairType;
    const exactMatches = candidates.filter((h) =>
      h.hairType.includes(hairType)
    );
    if (exactMatches.length > 0 && exactMatches.length >= MAX_RECS) {
      return exactMatches;
    }
    if (exactMatches.length > 0) {
      candidates = exactMatches.concat(
        candidates.filter((h) => !h.hairType.includes(hairType))
      );
    }
  }

  // Always return at least MAX_RECS if available
  return candidates.slice(0, Math.max(MAX_RECS, candidates.length));
}

/**
 * Attach catalog data to provider recommendations.
 *
 * Takes minimal provider output (id, reason, tips) and enriches with catalog data
 * (name, image, tags). Drops any hairstyleId not in the catalog.
 *
 * @returns Recommendation[] with full data from catalog
 */
export function attachCatalog(
  providerRecs: ProviderRecommendation[],
  locale: 'ko' | 'en'
): Recommendation[] {
  return providerRecs
    .map((rec) => {
      const entry = getHairstyleById(rec.hairstyleId);
      if (!entry) {
        return null; // Drop unknown IDs
      }

      return {
        hairstyleId: rec.hairstyleId,
        name: entry.name,
        reason: rec.reason,
        tips: rec.tips,
        referenceImage: entry.image,
        tags: entry.tags,
      };
    })
    .filter((rec) => rec !== null) as Recommendation[];
}

/**
 * Backfill recommendations if the provider returned fewer than MIN_RECS.
 *
 * Adds additional recommendations from the matched candidates that are not
 * already included, preserving order and maintaining catalog consistency.
 *
 * Uses locale-specific templates (rev 2) so Korean backfill text contains
 * no hardcoded English and all enums are translated to the target locale.
 *
 * @returns Recommendation[] with ≥ MIN_RECS entries
 */
export function backfill(
  recommendations: Recommendation[],
  candidates: HairstyleLibraryEntry[],
  locale: 'ko' | 'en'
): Recommendation[] {
  if (recommendations.length >= MIN_RECS) {
    return recommendations;
  }

  // Collect IDs already in recommendations
  const usedIds = new Set(recommendations.map((r) => r.hairstyleId));

  // Find candidates not yet used
  const unused = candidates.filter((c) => !usedIds.has(c.id));

  // Add unused candidates until we reach MIN_RECS
  const filled = [...recommendations];
  for (const candidate of unused) {
    if (filled.length >= MIN_RECS) break;

    const reason = buildBackfillReason(candidate.preference, locale);
    const hairTip = buildBackfillHairTypeTip(candidate.hairType, locale);
    const lengthTip = buildBackfillLengthTip(candidate.length, locale);

    filled.push({
      hairstyleId: candidate.id,
      name: candidate.name,
      reason,
      tips: [hairTip, lengthTip],
      referenceImage: candidate.image,
      tags: candidate.tags,
    });
  }

  return filled;
}
