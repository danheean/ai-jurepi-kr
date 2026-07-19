import { describe, it, expect } from 'vitest';
import { FACE_SHAPE_REFERENCES, getFaceShapeReference } from './face-shapes-catalog';
import { FACE_SHAPES } from './constants';

describe('FACE_SHAPE_REFERENCES', () => {
  it('has exactly one entry per face shape', () => {
    expect(FACE_SHAPE_REFERENCES).toHaveLength(FACE_SHAPES.length);
    expect(FACE_SHAPE_REFERENCES.map((r) => r.shape).sort()).toEqual(
      [...FACE_SHAPES].sort()
    );
  });

  it('points every image src under /face-shapes/ with the shape name', () => {
    FACE_SHAPE_REFERENCES.forEach((r) => {
      expect(r.image.src).toBe(`/face-shapes/${r.shape}.webp`);
    });
  });

  it('has a non-empty alt for every entry', () => {
    FACE_SHAPE_REFERENCES.forEach((r) => {
      expect(r.image.alt.length).toBeGreaterThan(0);
    });
  });
});

describe('getFaceShapeReference', () => {
  it('returns the matching reference for a known shape', () => {
    const ref = getFaceShapeReference('diamond');
    expect(ref.shape).toBe('diamond');
    expect(ref.image.src).toBe('/face-shapes/diamond.webp');
  });

  it('returns a reference for every face shape without throwing', () => {
    FACE_SHAPES.forEach((shape) => {
      expect(() => getFaceShapeReference(shape)).not.toThrow();
    });
  });
});
