/**
 * Display localization for catalog metadata (tags, image credits).
 *
 * The catalog (catalog.ts) stores tags and credits as stable English slugs —
 * they feed AI prompts and matching logic and must stay English. This module
 * owns the presentation-side mapping so the ko UI never leaks raw metadata.
 *
 * Unknown values fall back to the raw string, so new catalog entries degrade
 * gracefully until a label is added here (tag-labels.test.ts enforces sync).
 */

export const TAG_LABELS_KO: Record<string, string> = {
  balancing: '균형 잡는',
  bangs: '앞머리',
  bold: '과감한',
  'cheekbone-framing': '광대 커버',
  chic: '시크한',
  classic: '클래식',
  clean: '깔끔한',
  'clean-lines': '깔끔한 라인',
  defined: '뚜렷한',
  defining: '윤곽 살리는',
  edge: '엣지 있는',
  edgy: '개성 있는',
  effortless: '자연스러운',
  elongating: '길어 보이는',
  'face-framing': '얼굴 감싸는',
  'face-widening': '얼굴 폭 보완',
  feminine: '여성스러운',
  flattering: '잘 어울리는',
  'forehead-covering': '이마 커버',
  geometric: '기하학적',
  glamorous: '화려한',
  lengthening: '길어 보이는',
  'low-maintenance': '관리 쉬운',
  masculine: '남성적인',
  minimal: '미니멀',
  minimalist: '미니멀',
  modern: '모던한',
  neutral: '중성적인',
  popular: '인기 있는',
  professional: '프로페셔널',
  refined: '정갈한',
  romantic: '로맨틱',
  sharp: '샤프한',
  soft: '부드러운',
  softening: '부드러운 인상',
  sophisticated: '세련된',
  structured: '구조적인',
  textured: '텍스처 살린',
  timeless: '유행 안 타는',
  trendy: '트렌디한',
  universal: '누구에게나',
  versatile: '활용도 높은',
  volume: '볼륨감',
  'volume-at-crown': '정수리 볼륨',
  'width-adding': '폭 보완',
  'width-creating': '폭 보완',
};

const CREDIT_LABELS_KO: Record<string, string> = {
  'Hairstyle reference': '헤어스타일 참고 이미지',
  'AI generated': 'AI 생성 이미지',
};

export function getTagLabel(tag: string, locale: 'ko' | 'en'): string {
  if (locale === 'ko') return TAG_LABELS_KO[tag] ?? tag;
  return tag;
}

export function getCreditLabel(credit: string, locale: 'ko' | 'en'): string {
  if (locale === 'ko') return CREDIT_LABELS_KO[credit] ?? credit;
  return credit;
}
