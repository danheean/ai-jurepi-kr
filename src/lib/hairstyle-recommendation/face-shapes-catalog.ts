/**
 * Face-Shape Reference Image Catalog
 *
 * Static metadata for the 7 pre-generated face-shape reference images
 * (public/face-shapes/<shape>.webp), analogous to how catalog.ts references
 * hairstyle images. Generated offline via scripts/generate-face-shape-refs.ts —
 * no AI call happens at request time.
 *
 * Localized labels come from the existing `face.<shape>` i18n keys in the UI
 * layer; `alt` here is an English fallback only (used by the generation script's
 * logging, not shown to end users).
 */

import { FACE_SHAPES, type FaceShape } from './constants';

export interface FaceShapeReference {
  shape: FaceShape;
  image: {
    src: string; // e.g. /face-shapes/oval.webp
    alt: string; // English fallback description
  };
}

export const FACE_SHAPE_REFERENCES: readonly FaceShapeReference[] = FACE_SHAPES.map(
  (shape) => ({
    shape,
    image: {
      src: `/face-shapes/${shape}.webp`,
      alt: `Reference portrait illustrating a ${shape} face shape`,
    },
  })
);

/**
 * Look up the reference image for a face shape.
 * FaceShape is a closed enum, so every shape always has an entry.
 */
export function getFaceShapeReference(shape: FaceShape): FaceShapeReference {
  const entry = FACE_SHAPE_REFERENCES.find((r) => r.shape === shape);
  if (!entry) {
    throw new Error(`No face-shape reference registered for "${shape}"`);
  }
  return entry;
}
