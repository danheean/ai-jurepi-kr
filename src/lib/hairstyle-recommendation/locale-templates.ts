/**
 * Locale-Specific Backfill Templates for Hairstyle Recommendation
 *
 * Provides localized reason and tips text when the provider returns fewer
 * than MIN_RECS recommendations and we need to backfill from the catalog.
 *
 * Pure functions mapping preference/length/hairType enums to localized labels.
 * No hardcoded-English fallbacks in Korean responses.
 *
 * Rev 2 (2026-07-18): Centralized locale-aware template generators.
 */

import type { Preference, Length, HairType } from './constants';

/**
 * Ko/En preference labels
 */
const PREFERENCE_LABELS = {
  ko: {
    feminine: '여성스러운',
    masculine: '남성스러운',
    neutral: '중립적',
  },
  en: {
    feminine: 'feminine',
    masculine: 'masculine',
    neutral: 'neutral',
  },
} as const;

/**
 * Ko/En length labels
 */
const LENGTH_LABELS = {
  ko: {
    short: '짧은',
    medium: '중간',
    long: '긴',
  },
  en: {
    short: 'short',
    medium: 'medium',
    long: 'long',
  },
} as const;

/**
 * Ko/En hair type labels
 */
const HAIR_TYPE_LABELS = {
  ko: {
    straight: '스트레이트',
    wavy: '웨이브',
    curly: '곱슬곱슬한',
    coily: '코일',
  },
  en: {
    straight: 'straight',
    wavy: 'wavy',
    curly: 'curly',
    coily: 'coily',
  },
} as const;

/**
 * Build a localized backfill reason: "Suited to your <preference> style preferences."
 * or equivalent in Korean.
 */
export function buildBackfillReason(
  preference: Preference,
  locale: 'ko' | 'en'
): string {
  const prefLabel = PREFERENCE_LABELS[locale][preference];

  if (locale === 'ko') {
    return `${prefLabel} 스타일 선호도에 잘 어울리는 헤어스타일입니다.`;
  }

  return `Suited to your ${prefLabel} style preferences.`;
}

/**
 * Build a localized backfill tip for hair type.
 * Format: "Works well with <hairTypes> hair." or Korean equivalent.
 */
export function buildBackfillHairTypeTip(
  hairTypes: HairType[],
  locale: 'ko' | 'en'
): string {
  const labels = hairTypes.map((t) => HAIR_TYPE_LABELS[locale][t]);
  const typeList = labels.join(locale === 'ko' ? ' 또는 ' : ' or ');

  if (locale === 'ko') {
    return `${typeList} 머리에 잘 어울립니다.`;
  }

  return `Works well with ${typeList} hair.`;
}

/**
 * Build a localized backfill tip for length.
 * Format: "Length: <length>." or Korean equivalent.
 */
export function buildBackfillLengthTip(
  length: Length,
  locale: 'ko' | 'en'
): string {
  const lengthLabel = LENGTH_LABELS[locale][length];

  if (locale === 'ko') {
    return `길이: ${lengthLabel}`;
  }

  return `Length: ${lengthLabel}.`;
}
