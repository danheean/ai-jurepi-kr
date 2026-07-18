/**
 * Prompt Builders for Hairstyle Recommendation
 *
 * Pure string builders that create prompts for the AI model.
 * Each prompt forces structured JSON output with specific constraints.
 *
 * The provider (e.g., GeminiProvider) uses these prompts with responseSchema/responseMimeType
 * to guarantee structured output matching the expected shape.
 */

import type { HairstyleLibraryEntry, RecommendInput } from './types';
import { MIN_RECS, MAX_RECS } from './constants';

/**
 * Build a prompt for face-shape analysis.
 *
 * Instructs the model to analyze an image and return a JSON object with:
 * - faceShape: one of 7 options
 * - confidence: 0–1
 * - gender: perceived gender presentation (male/female/unknown)
 * - features: array of 0–5 strings
 * - notes: optional string ≤240 chars
 *
 * Rev 2: Includes gender field instruction (perceived gender from photo, 'unknown' allowed).
 *
 * @returns Prompt string in the target locale
 */
export function buildAnalyzePrompt(locale: 'ko' | 'en'): string {
  if (locale === 'ko') {
    return `당신은 얼굴 형태 분석 전문가입니다. 업로드된 사진을 분석하여 다음 JSON 형식으로 응답하세요:

{
  "faceShape": "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle",
  "confidence": 0.0 ~ 1.0 사이의 숫자 (모델의 확실성),
  "gender": "male" | "female" | "unknown" (사진에서 인지되는 성별 표현; 불확실할 때는 "unknown"),
  "features": ["특징1", "특징2", ...] (최대 5개, 예: "strong jawline", "high forehead"),
  "notes": "선택사항, 240자 이하의 중립적 설명"
}

얼굴이 명확하게 보이지 않으면 정직하게 confidence를 낮추세요. 의료 진단은 하지 마세요.`;
  }

  return `You are a face-shape analysis expert. Analyze the uploaded photo and respond in this JSON format:

{
  "faceShape": "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle",
  "confidence": number between 0.0 and 1.0 (your certainty),
  "gender": "male" | "female" | "unknown" (perceived gender presentation from photo; use "unknown" if unsure),
  "features": ["feature1", "feature2", ...] (max 5, e.g. "strong jawline", "high forehead"),
  "notes": "optional, max 240 chars, neutral description"
}

If a face is not clearly visible, lower the confidence accordingly. Do not make medical claims.`;
}

/**
 * Build a prompt for hairstyle recommendation.
 *
 * Instructs the model to recommend hairstyles from the provided candidate list,
 * selecting ${MIN_RECS}–${MAX_RECS} and providing reason + tips for each.
 * The model MUST choose ONLY from the candidate hairstyleIds provided.
 *
 * @returns Prompt string in the target locale
 */
export function buildRecommendPrompt(
  input: RecommendInput,
  candidates: HairstyleLibraryEntry[],
  locale: 'ko' | 'en'
): string {
  const candidateList = candidates
    .map((c) => `- ${c.id} (${locale === 'ko' ? c.name.ko : c.name.en})`)
    .join('\n');

  const preferenceName =
    locale === 'ko'
      ? {
          feminine: '여성스러운',
          masculine: '남성스러운',
          neutral: '중립적',
        }[input.preference]
      : {
          feminine: 'feminine',
          masculine: 'masculine',
          neutral: 'neutral',
        }[input.preference];

  const faceShapeName =
    locale === 'ko'
      ? {
          oval: '계란형',
          round: '동그란형',
          square: '사각형',
          heart: '하트형',
          oblong: '긴형',
          diamond: '다이아몬드형',
          triangle: '역삼각형',
        }[input.faceShape]
      : input.faceShape;

  if (locale === 'ko') {
    return `당신은 헤어스타일 추천 전문가입니다. 주어진 후보 목록에서만 선택하여 추천해주세요.

사용자 프로필:
- 얼굴형: ${faceShapeName}
- 스타일 선호도: ${preferenceName}
${input.length ? `- 희망 길이: ${input.length}` : ''}
${input.hairType ? `- 머리 타입: ${input.hairType}` : ''}
${input.occasion ? `- 용도: ${input.occasion}` : ''}

후보 헤어스타일:
${candidateList}

${MIN_RECS}~${MAX_RECS}개를 선택하여 다음 JSON 형식으로 응답하세요. 위 목록의 id만 사용하세요:

[
  {
    "hairstyleId": "id (위 목록에서만)",
    "reason": "이 사람의 얼굴형과 선호도에 어울리는 이유 (280자 이하)",
    "tips": ["스타일링/유지보수 팁1 (120자 이하)", "팁2", ...]
  },
  ...
]`;
  }

  return `You are a hairstyle recommendation expert. Choose ONLY from the provided candidate list.

User Profile:
- Face Shape: ${faceShapeName}
- Style Preference: ${preferenceName}
${input.length ? `- Desired Length: ${input.length}` : ''}
${input.hairType ? `- Hair Type: ${input.hairType}` : ''}
${input.occasion ? `- Occasion: ${input.occasion}` : ''}

Candidate Hairstyles:
${candidateList}

Select ${MIN_RECS}–${MAX_RECS} and respond in this JSON format. Use ONLY ids from the list above:

[
  {
    "hairstyleId": "id (from list only)",
    "reason": "Why this suits their face shape and preferences (max 280 chars)",
    "tips": ["Styling/maintenance tip 1 (max 120 chars)", "Tip 2", ...]
  },
  ...
]`;
}

/**
 * Build a prompt for hairstyle style-preview image generation (generic text→image path).
 *
 * Generates a photorealistic salon portrait prompt from catalog entry metadata.
 * Input: a hairstyle catalog entry, and optionally a gender for model selection.
 * Output: a factual, model-safe prompt for text-to-image generation.
 *
 * Constraints:
 * - Photorealistic salon portrait only
 * - No text, watermarks, or logos
 * - No user input or free-form text (prompt injection safe)
 * - Deterministic: same entry → same prompt
 * - Locale not used (English factual description for model consistency)
 *
 * Rev 2: Optional gender parameter to match generic model portrait to recommendation.
 * If not provided and entry is single-gender, defaults to that gender.
 *
 * @param gender Optional 'male' | 'female' — steers generic model selection
 */
export function buildStylePreviewPrompt(
  catalogEntry: HairstyleLibraryEntry,
  gender?: 'male' | 'female'
): string {
  const styleName = catalogEntry.name.en;
  const tags = catalogEntry.tags.join(', ');
  const hairTypes = catalogEntry.hairType.join(', ');

  // Determine gender-matched subject line when gender is provided or inferrable
  const genderStr =
    gender || (catalogEntry.genders.length === 1 ? catalogEntry.genders[0] : null);
  const subject =
    genderStr === 'male'
      ? 'young Korean male model'
      : genderStr === 'female'
        ? 'young Korean female model'
        : 'young person';

  return `Photorealistic salon portrait photograph. Subject: ${styleName} hairstyle on a ${subject}.
Description:
- Style: ${styleName}
- Length: ${catalogEntry.length}
- Hair types suited: ${hairTypes}
- Qualities: ${tags}

Requirements:
- Professional photography quality
- Clear, well-lit salon environment
- No text, watermarks, or logos
- Show hair detail and styling technique
- Neutral expression, facing camera`;
}

/**
 * Build a prompt for face-preserving hair-only edit (image-edit path).
 *
 * Instructs an image-editing model to modify ONLY the hair in the user's photo,
 * preserving all other details (facial identity, skin tone, expression, clothing, background).
 *
 * Input: a hairstyle catalog entry (provides hair description only).
 * Output: an editing instruction for an edit-capable image provider.
 *
 * Constraints:
 * - Catalog data only (no user free-text enters this prompt)
 * - Photorealistic
 * - Hair change ONLY (preserve identity completely)
 * - No watermarks or modification markers
 *
 * Rev 2: Used by the /preview route when user photo + edit-capable provider + "Preview on my face" ON.
 */
export function buildFaceEditPrompt(catalogEntry: HairstyleLibraryEntry): string {
  const styleName = catalogEntry.name.en;
  const tags = catalogEntry.tags.join(', ');
  const hairTypes = catalogEntry.hairType.join(', ');

  return `Edit the hair in the provided reference photo to match this hairstyle. Preserve everything else.

Hair style to apply: ${styleName}
Description:
- Style: ${styleName}
- Length: ${catalogEntry.length}
- Hair types suited: ${hairTypes}
- Qualities: ${tags}

Critical requirements:
- Change ONLY the hair
- Preserve the person's facial identity, features, and expression completely
- Preserve skin tone, freckles, and any facial marks
- Preserve clothing, accessories, and background
- Preserve lighting and framing
- No text, watermarks, logos, or modification markers
- Photorealistic result`;
}
