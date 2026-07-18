/**
 * Factory Tests
 * Tests provider instantiation based on environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as envModule from './env';

vi.mock('./env');
vi.mock('./gemini');
vi.mock('./ollama');

import { getStructuredModel, getImageGenerator } from './factory';
import { AiError } from './types';
import { GeminiClient } from './gemini';
import { OllamaClient } from './ollama';

describe('factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStructuredModel', () => {
    it('returns GeminiClient for gemini provider', () => {
      vi.mocked(envModule).AI_PROVIDER = 'gemini';

      const result = getStructuredModel();
      expect(result).toBeInstanceOf(GeminiClient);
    });

    it('returns OllamaClient for ollama provider', () => {
      vi.mocked(envModule).AI_PROVIDER = 'ollama';

      const result = getStructuredModel();
      expect(result).toBeInstanceOf(OllamaClient);
    });

    it('throws AiError for unknown provider', () => {
      vi.mocked(envModule).AI_PROVIDER = 'unknown-provider';

      expect(() => getStructuredModel()).toThrow(AiError);
    });
  });

  describe('getImageGenerator', () => {
    it('returns OllamaClient for ollama provider', () => {
      vi.mocked(envModule).IMAGE_PROVIDER = 'ollama';

      const result = getImageGenerator();
      expect(result).toBeInstanceOf(OllamaClient);
    });

    it('returns null if IMAGE_PROVIDER is unset', () => {
      vi.mocked(envModule).IMAGE_PROVIDER = undefined;

      const result = getImageGenerator();
      expect(result).toBeNull();
    });

    it('returns null for unknown provider', () => {
      vi.mocked(envModule).IMAGE_PROVIDER = 'unknown';

      const result = getImageGenerator();
      expect(result).toBeNull();
    });
  });
});
