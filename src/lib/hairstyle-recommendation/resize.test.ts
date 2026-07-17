import { describe, it, expect } from 'vitest';
import { computeResizedDimensions } from './resize';
import { MAX_EDGE_PX } from './constants';

describe('computeResizedDimensions', () => {
  it('returns unchanged dimensions if already within MAX_EDGE_PX', () => {
    const result = computeResizedDimensions(800, 600);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('downscales when width exceeds MAX_EDGE_PX', () => {
    const result = computeResizedDimensions(2000, 1500);
    expect(result.width).toBe(MAX_EDGE_PX);
    expect(result.height).toBe(Math.round((1500 / 2000) * MAX_EDGE_PX));
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(
      MAX_EDGE_PX
    );
  });

  it('downscales when height exceeds MAX_EDGE_PX', () => {
    const result = computeResizedDimensions(1200, 2400);
    expect(result.height).toBe(MAX_EDGE_PX);
    expect(result.width).toBe(Math.round((1200 / 2400) * MAX_EDGE_PX));
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(
      MAX_EDGE_PX
    );
  });

  it('maintains aspect ratio for portrait', () => {
    const result = computeResizedDimensions(800, 1200);
    const originalRatio = 1200 / 800;
    const newRatio = result.height / result.width;
    expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.01);
  });

  it('maintains aspect ratio for landscape', () => {
    const result = computeResizedDimensions(1600, 900);
    const originalRatio = 900 / 1600;
    const newRatio = result.height / result.width;
    expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.01);
  });

  it('scales square image correctly', () => {
    const result = computeResizedDimensions(2000, 2000);
    expect(result.width).toBe(MAX_EDGE_PX);
    expect(result.height).toBe(MAX_EDGE_PX);
  });

  it('handles very small images', () => {
    const result = computeResizedDimensions(100, 75);
    expect(result.width).toBe(100);
    expect(result.height).toBe(75);
  });

  it('rounds dimensions to integers', () => {
    const result = computeResizedDimensions(3333, 2222);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });
});
